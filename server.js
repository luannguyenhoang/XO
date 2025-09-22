const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let games = new Map();
let waitingPlayers = [];
let rooms = new Map(); // roomId -> { id, host, players, gameId, status }

// Game logic
class Game {
    constructor(id, player1, player2) {
        this.id = id;
        this.players = [player1, player2];
        this.currentPlayer = 0; // 0 = X, 1 = O
        this.board = Array(9).fill(null);
        this.gameStatus = 'waiting'; // waiting, playing, finished
        this.winner = null;
    }

    makeMove(position, playerId) {
        if (this.gameStatus !== 'playing') return false;
        if (this.board[position] !== null) return false;
        if (this.players[this.currentPlayer] !== playerId) return false;

        this.board[position] = this.currentPlayer === 0 ? 'X' : 'O';
        
        if (this.checkWinner()) {
            this.gameStatus = 'finished';
            this.winner = this.currentPlayer;
        } else if (this.board.every(cell => cell !== null)) {
            this.gameStatus = 'finished';
            this.winner = -1; // Draw
        } else {
            this.currentPlayer = 1 - this.currentPlayer;
        }

        return true;
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return true;
            }
        }
        return false;
    }

    getGameState() {
        return {
            id: this.id,
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameStatus: this.gameStatus,
            winner: this.winner,
            players: this.players
        };
    }
}

// Room management functions
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(hostId) {
    const roomCode = generateRoomCode();
    const room = {
        id: roomCode,
        host: hostId,
        players: [hostId],
        gameId: null,
        status: 'waiting' // waiting, playing, finished
    };
    rooms.set(roomCode, room);
    return room;
}

function joinRoom(roomCode, playerId) {
    const room = rooms.get(roomCode);
    if (!room) return null;
    if (room.players.length >= 2) return null;
    if (room.players.includes(playerId)) return room;
    
    room.players.push(playerId);
    return room;
}

function startGameInRoom(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || room.players.length !== 2) return null;
    
    const gameId = `game_${Date.now()}`;
    const game = new Game(gameId, room.players[0], room.players[1]);
    game.gameStatus = 'playing';
    games.set(gameId, game);
    
    room.gameId = gameId;
    room.status = 'playing';
    
    return game;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create room
    socket.on('create-room', () => {
        const room = createRoom(socket.id);
        socket.join(room.id);
        socket.emit('room-created', {
            roomCode: room.id,
            players: room.players,
            status: room.status
        });
        console.log('Room created:', room.id, 'Host:', socket.id);
    });

    // Join room
    socket.on('join-room', (data) => {
        const { roomCode } = data;
        console.log('Join room request:', roomCode, 'from player:', socket.id);
        console.log('Available rooms:', Array.from(rooms.keys()));
        
        const room = joinRoom(roomCode, socket.id);
        
        if (!room) {
            console.log('Join room failed - room not found or full:', roomCode);
            socket.emit('room-join-failed', { message: 'Phòng không tồn tại hoặc đã đầy' });
            return;
        }
        
        socket.join(room.id);
        io.to(room.id).emit('room-updated', {
            roomCode: room.id,
            players: room.players,
            status: room.status
        });
        
        console.log('Player joined room successfully:', room.id, 'Player:', socket.id);
    });

    // Start game in room
    socket.on('start-room-game', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);
        
        if (!room || room.host !== socket.id) {
            socket.emit('start-game-failed', { message: 'Chỉ host mới có thể bắt đầu game' });
            return;
        }
        
        if (room.players.length !== 2) {
            socket.emit('start-game-failed', { message: 'Cần 2 người chơi để bắt đầu' });
            return;
        }
        
        const game = startGameInRoom(roomCode);
        if (game) {
            // Join all players to game room
            room.players.forEach(playerId => {
                io.sockets.sockets.get(playerId)?.join(game.id);
            });
            
            io.to(room.id).emit('game-started', game.getGameState());
            console.log('Room game started:', roomCode, 'Game:', game.id);
        }
    });

    // Join waiting room (old method - keep for backward compatibility)
    socket.on('join-game', () => {
        if (waitingPlayers.length === 0) {
            // First player - add to waiting list
            waitingPlayers.push(socket.id);
            socket.emit('waiting-for-player');
            console.log('Player waiting:', socket.id);
        } else {
            // Second player - create game
            const player1 = waitingPlayers.shift();
            const player2 = socket.id;
            const gameId = `game_${Date.now()}`;
            
            const game = new Game(gameId, player1, player2);
            game.gameStatus = 'playing';
            games.set(gameId, game);
            
            // Join both players to game room
            socket.join(gameId);
            io.sockets.sockets.get(player1).join(gameId);
            
            // Notify both players
            io.to(gameId).emit('game-started', game.getGameState());
            console.log('Game started:', gameId, 'Players:', player1, player2);
        }
    });

    // Make move
    socket.on('make-move', (data) => {
        const { gameId, position } = data;
        const game = games.get(gameId);
        
        if (!game) return;
        
        if (game.makeMove(position, socket.id)) {
            io.to(gameId).emit('game-updated', game.getGameState());
            
            if (game.gameStatus === 'finished') {
                // Clean up finished game after 10 seconds
                setTimeout(() => {
                    games.delete(gameId);
                }, 10000);
            }
        }
    });

    // Restart game
    socket.on('restart-game', (gameId) => {
        const game = games.get(gameId);
        if (!game) return;
        
        // Reset game state
        game.board = Array(9).fill(null);
        game.currentPlayer = 0;
        game.gameStatus = 'playing';
        game.winner = null;
        
        io.to(gameId).emit('game-restarted', game.getGameState());
    });

    // Leave game
    socket.on('leave-game', (gameId) => {
        socket.leave(gameId);
        const game = games.get(gameId);
        if (game) {
            games.delete(gameId);
            io.to(gameId).emit('player-left');
        }
    });

    // Leave room
    socket.on('leave-room', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);
        
        if (room) {
            socket.leave(room.id);
            room.players = room.players.filter(id => id !== socket.id);
            
            if (room.players.length === 0) {
                // Delete empty room
                rooms.delete(roomCode);
            } else {
                // Update room status
                io.to(room.id).emit('room-updated', {
                    roomCode: room.id,
                    players: room.players,
                    status: room.status
                });
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Remove from waiting list if present
        const waitingIndex = waitingPlayers.indexOf(socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }
        
        // Handle room cleanup
        for (let [roomCode, room] of rooms) {
            if (room.players.includes(socket.id)) {
                room.players = room.players.filter(id => id !== socket.id);
                
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    io.to(room.id).emit('room-updated', {
                        roomCode: room.id,
                        players: room.players,
                        status: room.status
                    });
                }
            }
        }
        
        // Handle game cleanup
        for (let [gameId, game] of games) {
            if (game.players.includes(socket.id)) {
                games.delete(gameId);
                io.to(gameId).emit('player-left');
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play the game`);
});

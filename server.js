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

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Join waiting room
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

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Remove from waiting list if present
        const waitingIndex = waitingPlayers.indexOf(socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
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

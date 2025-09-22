class XOGame {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerSymbol = null;
        this.isMyTurn = false;
        this.currentRoomCode = null;
        this.isHost = false;
        this.gameMode = 'menu'; // menu, quickplay, room
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSocket();
    }

    initializeSocket() {
        try {
            this.socket = io();
            this.setupSocketListeners();
        } catch (error) {
            console.error('Lỗi khởi tạo Socket.IO:', error);
            this.updateGameStatus('Lỗi kết nối server. Vui lòng refresh trang.');
        }
    }

    initializeElements() {
        // Room selection elements
        this.roomSelection = document.getElementById('room-selection');
        this.createRoomBtn = document.getElementById('create-room-btn');
        this.joinRoomBtn = document.getElementById('join-room-btn');
        this.quickPlayBtn = document.getElementById('quick-play-btn');
        
        // Create room elements
        this.createRoomDiv = document.getElementById('create-room');
        this.roomCode = document.getElementById('room-code');
        this.copyCodeBtn = document.getElementById('copy-code-btn');
        this.roomPlayersList = document.getElementById('room-players-list');
        this.startRoomGameBtn = document.getElementById('start-room-game-btn');
        this.cancelCreateRoomBtn = document.getElementById('cancel-create-room-btn');
        
        // Join room elements
        this.joinRoom = document.getElementById('join-room');
        this.roomCodeInput = document.getElementById('room-code-input');
        this.confirmJoinBtn = document.getElementById('confirm-join-btn');
        this.cancelJoinBtn = document.getElementById('cancel-join-btn');
        
        // Game area elements
        this.gameArea = document.getElementById('game-area');
        this.roomInfoDisplay = document.getElementById('room-info-display');
        this.currentRoomCodeDisplay = document.getElementById('current-room-code');
        this.gameBoard = document.getElementById('game-board');
        this.joinBtn = document.getElementById('join-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.leaveBtn = document.getElementById('leave-btn');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.gameStatus = document.getElementById('game-status');
        this.currentTurn = document.getElementById('current-turn');
        this.connectionStatus = document.getElementById('connection-status');
        this.playerX = document.getElementById('player-x');
        this.playerO = document.getElementById('player-o');
        
        // Kiểm tra các element quan trọng
        if (!this.gameBoard || !this.joinBtn || !this.gameStatus) {
            console.error('Không tìm thấy các element cần thiết trong DOM');
            return;
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        console.log('createRoomBtn:', this.createRoomBtn);
        console.log('createRoom method:', typeof this.createRoom);
        
        // Room selection buttons
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => {
                console.log('Create room button clicked');
                if (typeof this.createRoom === 'function') {
                    this.createRoom();
                } else {
                    console.error('createRoom is not a function!');
                }
            });
        }

        if (this.joinRoomBtn) {
            this.joinRoomBtn.addEventListener('click', () => {
                this.showJoinRoom();
            });
        }

        if (this.quickPlayBtn) {
            this.quickPlayBtn.addEventListener('click', () => {
                this.quickPlay();
            });
        }

        // Create room buttons
        if (this.copyCodeBtn) {
            this.copyCodeBtn.addEventListener('click', () => {
                this.copyRoomCode();
            });
        }

        if (this.startRoomGameBtn) {
            this.startRoomGameBtn.addEventListener('click', () => {
                this.startRoomGame();
            });
        }

        if (this.cancelCreateRoomBtn) {
            this.cancelCreateRoomBtn.addEventListener('click', () => {
                this.cancelCreateRoom();
            });
        }

        // Join room buttons
        if (this.confirmJoinBtn) {
            this.confirmJoinBtn.addEventListener('click', () => {
                this.confirmJoinRoom();
            });
        }

        if (this.cancelJoinBtn) {
            this.cancelJoinBtn.addEventListener('click', () => {
                this.cancelJoinRoom();
            });
        }

        // Room code input
        if (this.roomCodeInput) {
            this.roomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });

            this.roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.confirmJoinRoom();
                }
            });
        }

        // Game buttons
        if (this.joinBtn) {
            this.joinBtn.addEventListener('click', () => {
                this.joinGame();
            });
        }

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        if (this.leaveBtn) {
            this.leaveBtn.addEventListener('click', () => {
                this.leaveGame();
            });
        }

        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.addEventListener('click', () => {
                this.leaveRoom();
            });
        }

        // Cell clicks
        if (this.gameBoard) {
            this.gameBoard.addEventListener('click', (e) => {
                if (e.target.classList.contains('cell')) {
                    this.makeMove(parseInt(e.target.dataset.index));
                }
            });
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;
        
        // Connection status
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            console.log('Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateGameStatus('Lỗi kết nối server: ' + error.message);
        });

        // Game events
        this.socket.on('waiting-for-player', () => {
            this.updateGameStatus('Đang chờ người chơi khác...');
            this.joinBtn.disabled = true;
            this.joinBtn.textContent = 'Đang chờ...';
        });

        this.socket.on('game-started', (gameState) => {
            this.gameId = gameState.id;
            this.playerSymbol = gameState.players[0] === this.socket.id ? 'X' : 'O';
            this.updateGameStatus('Game đã bắt đầu! Bạn là ' + this.playerSymbol);
            this.updateUI(gameState);
            this.showGameControls();
            
            // Show room info if in room mode
            if (this.gameMode === 'room' && this.currentRoomCode) {
                this.roomInfoDisplay.style.display = 'block';
                this.currentRoomCodeDisplay.textContent = this.currentRoomCode;
                this.leaveRoomBtn.style.display = 'inline-block';
            }
            
            // Hide room screens and show game
            this.hideAllScreens();
            this.gameArea.style.display = 'block';
        });

        this.socket.on('game-updated', (gameState) => {
            this.updateUI(gameState);
        });

        this.socket.on('game-restarted', (gameState) => {
            // Clear any existing state first
            this.clearWinningCells();
            
            // Reset all UI elements to default state
            this.playerX.classList.remove('active');
            this.playerO.classList.remove('active');
            this.currentTurn.textContent = 'Đang chờ người chơi khác...';
            
            // Reset UI state
            this.isMyTurn = gameState.players[gameState.currentPlayer] === this.socket.id;
            
            // Update UI with fresh state
            this.updateUI(gameState);
            this.updateGameStatus('Game đã được khởi động lại!');
        });

        this.socket.on('player-left', () => {
            this.updateGameStatus('Đối thủ đã rời game!');
            this.resetGame();
        });

        // Room events
        this.socket.on('room-created', (data) => {
            console.log('Room created event received:', data);
            this.currentRoomCode = data.roomCode;
            this.isHost = true;
            this.gameMode = 'room';
            
            if (this.roomCode) {
                this.roomCode.textContent = data.roomCode;
                console.log('Room code displayed:', data.roomCode);
            } else {
                console.error('roomCode element not found!');
            }
            
            this.hideAllScreens();
            if (this.createRoomDiv) {
                this.createRoomDiv.style.display = 'block';
            }
            this.updateRoomPlayers(data.players);
        });

        this.socket.on('room-updated', (data) => {
            console.log('Room updated event received:', data);
            this.currentRoomCode = data.roomCode;
            this.gameMode = 'room';
            
            // If this is the first time joining a room, show create room screen
            if (!this.isHost) {
                this.hideAllScreens();
                this.createRoomDiv.style.display = 'block';
                this.roomCode.textContent = data.roomCode;
            }
            
            this.updateRoomPlayers(data.players);
            if (data.players.length === 2) {
                this.startRoomGameBtn.disabled = false;
            } else {
                this.startRoomGameBtn.disabled = true;
            }
        });

        this.socket.on('room-join-failed', (data) => {
            alert(data.message);
        });

        this.socket.on('start-game-failed', (data) => {
            alert(data.message);
        });
    }

    // Room management methods
    createRoom() {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }
        console.log('Creating room...');
        this.socket.emit('create-room');
    }

    showJoinRoom() {
        if (!this.joinRoom || !this.roomCodeInput) {
            console.error('Join room elements not found');
            return;
        }
        this.hideAllScreens();
        this.joinRoom.style.display = 'block';
        this.roomCodeInput.focus();
    }

    quickPlay() {
        this.gameMode = 'quickplay';
        this.hideAllScreens();
        if (this.gameArea) {
            this.gameArea.style.display = 'block';
        }
        this.joinGame();
    }

    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode.textContent).then(() => {
            this.copyCodeBtn.textContent = '✅';
            setTimeout(() => {
                this.copyCodeBtn.textContent = '📋';
            }, 2000);
        });
    }

    startRoomGame() {
        if (!this.socket || !this.currentRoomCode) return;
        this.socket.emit('start-room-game', { roomCode: this.currentRoomCode });
    }

    cancelCreateRoom() {
        if (this.currentRoomCode) {
            this.socket.emit('leave-room', { roomCode: this.currentRoomCode });
        }
        this.hideAllScreens();
        this.roomSelection.style.display = 'block';
        this.resetRoomState();
    }

    confirmJoinRoom() {
        const roomCode = this.roomCodeInput.value.trim().toUpperCase();
        if (roomCode.length !== 6) {
            alert('Mã phòng phải có 6 ký tự!');
            return;
        }
        this.joinRoomByCode(roomCode);
    }

    joinRoomByCode(roomCode) {
        if (!this.socket) {
            this.updateGameStatus('Chưa kết nối được server. Vui lòng refresh trang.');
            return;
        }
        console.log('Attempting to join room:', roomCode);
        this.socket.emit('join-room', { roomCode });
    }

    cancelJoinRoom() {
        this.hideAllScreens();
        this.roomSelection.style.display = 'block';
        this.roomCodeInput.value = '';
    }

    leaveRoom() {
        if (this.currentRoomCode && this.socket) {
            this.socket.emit('leave-room', { roomCode: this.currentRoomCode });
        }
        this.hideAllScreens();
        this.roomSelection.style.display = 'block';
        this.resetRoomState();
    }

    hideAllScreens() {
        this.roomSelection.style.display = 'none';
        this.createRoomDiv.style.display = 'none';
        this.joinRoom.style.display = 'none';
        this.gameArea.style.display = 'none';
    }

    resetRoomState() {
        this.currentRoomCode = null;
        this.isHost = false;
        this.gameMode = 'menu';
        this.roomCode.textContent = '------';
        this.roomPlayersList.innerHTML = '<li>Đang chờ người chơi khác...</li>';
        this.startRoomGameBtn.disabled = true;
        this.roomCodeInput.value = '';
    }

    updateRoomPlayers(players) {
        this.roomPlayersList.innerHTML = '';
        if (players.length === 0) {
            this.roomPlayersList.innerHTML = '<li>Đang chờ người chơi khác...</li>';
        } else {
            players.forEach((playerId, index) => {
                const li = document.createElement('li');
                li.textContent = `Người chơi ${index + 1}${playerId === this.socket.id ? ' (Bạn)' : ''}`;
                this.roomPlayersList.appendChild(li);
            });
        }
    }

    joinGame() {
        if (!this.socket) {
            this.updateGameStatus('Chưa kết nối được server. Vui lòng refresh trang.');
            return;
        }
        this.socket.emit('join-game');
    }

    makeMove(position) {
        if (!this.gameId || !this.isMyTurn || !this.socket) return;
        
        this.socket.emit('make-move', {
            gameId: this.gameId,
            position: position
        });
    }

    restartGame() {
        if (!this.gameId || !this.socket) return;
        
        // Clear any existing winning cells and animations
        this.clearWinningCells();
        
        // Small delay to ensure UI is cleared before restart
        setTimeout(() => {
            this.socket.emit('restart-game', this.gameId);
        }, 100);
    }

    leaveGame() {
        if (this.gameId && this.socket) {
            this.socket.emit('leave-game', this.gameId);
        }
        this.resetGame();
    }

    updateUI(gameState) {
        // Update board - Reset all cells first
        this.gameBoard.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = '';
            cell.className = 'cell'; // Reset all classes including 'winning'
            
            if (gameState.board[index] === 'X') {
                cell.textContent = 'X';
                cell.classList.add('x');
            } else if (gameState.board[index] === 'O') {
                cell.textContent = 'O';
                cell.classList.add('o');
            }
        });

        // Update current player
        this.isMyTurn = gameState.players[gameState.currentPlayer] === this.socket.id;
        
        // Update player indicators
        this.playerX.classList.toggle('active', gameState.currentPlayer === 0);
        this.playerO.classList.toggle('active', gameState.currentPlayer === 1);

        // Update turn indicator
        if (gameState.gameStatus === 'playing') {
            const currentSymbol = gameState.currentPlayer === 0 ? 'X' : 'O';
            this.currentTurn.textContent = `Lượt của ${currentSymbol}`;
        }

        // Handle game end
        if (gameState.gameStatus === 'finished') {
            this.isMyTurn = false;
            
            if (gameState.winner === -1) {
                this.updateGameStatus('Hòa! Không có người thắng cuộc.', 'draw');
                this.currentTurn.textContent = 'Game kết thúc - Hòa!';
            } else {
                const winnerSymbol = gameState.winner === 0 ? 'X' : 'O';
                const isWinner = gameState.players[gameState.winner] === this.socket.id;
                
                if (isWinner) {
                    this.updateGameStatus(`🎉 Bạn thắng! (${winnerSymbol})`, 'winner');
                } else {
                    this.updateGameStatus(`😔 Bạn thua! ${winnerSymbol} thắng`, 'loser');
                }
                
                this.currentTurn.textContent = `Game kết thúc - ${winnerSymbol} thắng!`;
                
                // Highlight winning cells
                this.highlightWinningCells(gameState.board);
            }
        }
    }

    highlightWinningCells(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                document.querySelector(`[data-index="${a}"]`).classList.add('winning');
                document.querySelector(`[data-index="${b}"]`).classList.add('winning');
                document.querySelector(`[data-index="${c}"]`).classList.add('winning');
                break;
            }
        }
    }

    clearWinningCells() {
        // Clear all winning animations and classes
        this.gameBoard.querySelectorAll('.cell').forEach(cell => {
            // Add clearing class to stop animations immediately
            cell.classList.add('clearing');
            
            // Remove all game-related classes
            cell.classList.remove('winning', 'x', 'o', 'clearing');
            cell.textContent = '';
        });
    }

    updateGameStatus(message, type = '') {
        this.gameStatus.textContent = message;
        this.gameStatus.className = `game-status ${type}`;
    }

    updateConnectionStatus(connected) {
        const statusDot = this.connectionStatus.querySelector('.status-dot');
        const statusText = this.connectionStatus.querySelector('span:last-child');
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Đã kết nối';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Mất kết nối';
        }
    }

    showGameControls() {
        this.joinBtn.style.display = 'none';
        this.restartBtn.style.display = 'inline-block';
        this.leaveBtn.style.display = 'inline-block';
    }

    resetGame() {
        this.gameId = null;
        this.playerSymbol = null;
        this.isMyTurn = false;
        
        // Reset board
        this.gameBoard.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        
        // Reset UI
        this.playerX.classList.remove('active');
        this.playerO.classList.remove('active');
        this.currentTurn.textContent = 'Đang chờ người chơi khác...';
        this.updateGameStatus('Nhấn "Tham gia game" để bắt đầu chơi!');
        
        // Reset buttons
        this.joinBtn.style.display = 'inline-block';
        this.joinBtn.disabled = false;
        this.joinBtn.textContent = 'Tham gia game';
        this.restartBtn.style.display = 'none';
        this.leaveBtn.style.display = 'none';
        this.leaveRoomBtn.style.display = 'none';
        this.roomInfoDisplay.style.display = 'none';
        
        // Return to appropriate screen based on game mode
        if (this.gameMode === 'room' && this.currentRoomCode) {
            this.hideAllScreens();
            this.createRoomDiv.style.display = 'block';
        } else if (this.gameMode === 'quickplay') {
            this.hideAllScreens();
            this.gameArea.style.display = 'block';
        } else {
            this.hideAllScreens();
            this.roomSelection.style.display = 'block';
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new XOGame();
});

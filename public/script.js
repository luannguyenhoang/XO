class XOGame {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerSymbol = null;
        this.isMyTurn = false;
        
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
        this.gameBoard = document.getElementById('game-board');
        this.joinBtn = document.getElementById('join-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.leaveBtn = document.getElementById('leave-btn');
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
        // Join game button
        this.joinBtn.addEventListener('click', () => {
            this.joinGame();
        });

        // Restart game button
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });

        // Leave game button
        this.leaveBtn.addEventListener('click', () => {
            this.leaveGame();
        });

        // Cell clicks
        this.gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.makeMove(parseInt(e.target.dataset.index));
            }
        });
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
        });

        this.socket.on('game-updated', (gameState) => {
            this.updateUI(gameState);
        });

        this.socket.on('game-restarted', (gameState) => {
            this.updateUI(gameState);
            this.updateGameStatus('Game đã được khởi động lại!');
        });

        this.socket.on('player-left', () => {
            this.updateGameStatus('Đối thủ đã rời game!');
            this.resetGame();
        });
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
        
        this.socket.emit('restart-game', this.gameId);
    }

    leaveGame() {
        if (this.gameId && this.socket) {
            this.socket.emit('leave-game', this.gameId);
        }
        this.resetGame();
    }

    updateUI(gameState) {
        // Update board
        this.gameBoard.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = '';
            cell.className = 'cell';
            
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
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new XOGame();
});

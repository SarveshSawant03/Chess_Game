// Initialize the game
let game = new Chess();
let board = null;
let ai = new ChessAI(1200);
let playerColor = 'w';
let gameMode = 'ai';
let userMoving = false;

// Initialize the chessboard
function initializeBoard() {
    const config = {
        draggable: true,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png', 
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    
    board = Chessboard('board', config);
    
    // If playing as black against AI, make AI move first
    if (gameMode === 'ai' && playerColor === 'b') {
        setTimeout(makeAiMove, 250);
    }
    
    updateStatus();
}

// Check if it's a player's turn
function isPlayerTurn() {
    if (gameMode === 'human') {
        return true;
    }
    return game.turn() === playerColor;
}

// Validate piece drag start
function onDragStart(source, piece, position, orientation) {
    // Don't allow piece movement during AI's turn
    if (userMoving) return false;
    
    // Only pick up pieces for the correct player
    if (gameMode === 'ai' && game.turn() !== playerColor) {
        return false;
    }
    
    // Only pick up pieces for the current turn
    if (piece.search(/^[wb]/) === -1) {
        return false;
    }
    
    // Don't allow picking up pieces if the game is over
    if (game.game_over()) {
        return false;
    }
    
    // Only pick up pieces for the player whose turn it is
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
    
    return true;
}

// Handle piece drop on board
function onDrop(source, target) {
    // Check if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Auto-promote to queen for simplicity
    });
    
    // If illegal move, snap back
    if (move === null) return 'snapback';
    
    updateStatus();
    
    // If playing against AI, make AI move after player moves
    if (gameMode === 'ai' && game.turn() !== playerColor && !game.game_over()) {
        setTimeout(makeAiMove, 250);
    }
}

// Handle board position update after drop
function onSnapEnd() {
    board.position(game.fen());
}

// Make AI move
function makeAiMove() {
    if (game.game_over()) return;
    
    $('#thinking').removeClass('hidden');
    userMoving = true;
    
    // Use setTimeout to allow UI to update before AI calculation
    setTimeout(() => {
        // Make AI move
        const move = ai.makeMove(game);
        
        // Update board
        board.position(game.fen());
        updateStatus();
        
        $('#thinking').addClass('hidden');
        userMoving = false;
    }, 500);
}

// Update game status display
function updateStatus() {
    let status = '';
    
    // Check for checkmate
    if (game.in_checkmate()) {
        status = 'Game over, ' + (game.turn() === 'w' ? 'black' : 'white') + ' wins by checkmate!';
    }
    // Check for draw
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
    }
    // Game still in progress
    else {
        status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
        
        // Check if in check
        if (game.in_check()) {
            status += ', ' + (game.turn() === 'w' ? 'white' : 'black') + ' is in check';
        }
    }
    
    $('#status').text(status);
    
    // Update evaluation bar
    updateEvaluationBar();
}

// Update evaluation bar based on AI assessment
function updateEvaluationBar() {
    const evaluation = ai.evaluateBoard(game) / 100;
    let percentage = 50 + (evaluation / 20) * 50;
    
    // Clamp percentage between 5 and 95 to always show some bar
    percentage = Math.max(5, Math.min(95, percentage));
    
    $('#evaluation-fill').css('height', percentage + '%');
}

// Start a new game
function newGame() {
    game = new Chess();
    board.position('start');
    
    // If playing as black against AI, make AI move first
    if (gameMode === 'ai' && playerColor === 'b') {
        setTimeout(makeAiMove, 250);
    }
    
    updateStatus();
}

// Undo last move (both player and AI in AI mode)
function undoMove() {
    if (gameMode === 'ai') {
        // Undo both AI and player moves
        game.undo();
        if (game.turn() !== playerColor) {
            game.undo();
        }
    } else {
        // Just undo the last move in human vs human mode
        game.undo();
    }
    
    board.position(game.fen());
    updateStatus();
}

// Event listeners
$(document).ready(function() {
    // Initialize the board
    initializeBoard();
    
    // New game button
    $('#new-game').on('click', newGame);
    
    // Undo move button
    $('#undo-move').on('click', undoMove);
    
    // Game mode selection
    $('input[name="gameMode"]').on('change', function() {
        gameMode = $(this).val();
        
        // Show/hide AI settings based on game mode
        if (gameMode === 'ai') {
            $('#ai-settings').show();
        } else {
            $('#ai-settings').hide();
        }
        
        newGame();
    });
    
    // Player color selection
    $('input[name="playerColor"]').on('change', function() {
        playerColor = $(this).val() === 'white' ? 'w' : 'b';
        
        // Update board orientation
        board.orientation(playerColor === 'w' ? 'white' : 'black');
        
        newGame();
    });
    
    // ELO rating slider
    $('#elo-rating').on('input', function() {
        const eloValue = $(this).val();
        $('#elo-value').text(eloValue);
        ai.updateStrength(parseInt(eloValue));
    });
});

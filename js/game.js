// Initialize the game
let game = new Chess();
let board = null;
let ai = new ChessAI(1200);
let playerColor = 'w';
let gameMode = 'ai';
let userMoving = false;
let selectedPiece = null;
let highlightedSquares = [];
let aiThinkingDots = 0;
let aiThinkingAnimation = null;

// This function adds a highlight class to show possible moves
function highlightPossibleMoves(square) {
    // Clear any existing highlights
    clearHighlights();
    
    // If no square is selected, just return
    if (!square) return;
    
    // Get all legal moves from the current position
    const moves = game.moves({
        square: square,
        verbose: true // This gives us detailed move information including target squares
    });
    
    // Highlight the selected square
    $(`[data-square="${square}"]`).addClass('highlight-selected');
    
    // Highlight all possible destination squares
    for (let move of moves) {
        const targetSquare = move.to;
        
        // Add different highlight classes based on whether it's a capture move
        if (move.flags.includes('c') || move.flags.includes('e')) {
            // Capture move (including en passant)
            $(`[data-square="${targetSquare}"]`).addClass('highlight-capture');
        } else if (move.flags.includes('k') || move.flags.includes('q')) {
            // Castle move
            $(`[data-square="${targetSquare}"]`).addClass('highlight-castle');
        } else {
            // Regular move
            $(`[data-square="${targetSquare}"]`).addClass('highlight-move');
        }
        
        // Keep track of highlighted squares
        highlightedSquares.push(targetSquare);
    }
    
    // Remember the selected piece
    selectedPiece = square;
}

// Function to clear all highlights
function clearHighlights() {
    // Remove highlight from previously selected square
    if (selectedPiece) {
        $(`[data-square="${selectedPiece}"]`).removeClass('highlight-selected');
    }
    
    // Remove highlights from all possible move squares
    $('.highlight-move, .highlight-capture, .highlight-castle').removeClass('highlight-move highlight-capture highlight-castle');
    
    // Reset variables
    selectedPiece = null;
    highlightedSquares = [];
}

// Initialize the chessboard
function initializeBoard() {
    const config = {
        draggable: true,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png', // Use this CDN link
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    
    board = Chessboard('board', config);
    
    // Set up click handlers for squares
    setupClickHandlers();
    
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
    
    // Highlight possible moves for this piece
    highlightPossibleMoves(source);
    
    return true;
}
// Handle piece drop on board
function onDrop(source, target) {
    // Clear all highlights
    clearHighlights();
    
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
function setupClickHandlers() {
    $('#board .square-55d63').on('click', function() {
        // If the game is over or it's not the player's turn, do nothing
        if (game.game_over() || userMoving || (gameMode === 'ai' && game.turn() !== playerColor)) {
            return;
        }
        
        const square = $(this).data('square');
        
        // If no piece is currently selected
        if (!selectedPiece) {
            // Check if the clicked square has a piece of the current player's color
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                // Select this piece and show possible moves
                highlightPossibleMoves(square);
            }
        } 
        // If a piece is already selected
        else {
            // If clicking the same square, deselect it
            if (square === selectedPiece) {
                clearHighlights();
            } 
            // If clicking a different square
            else {
                // Check if it's a valid target square for the selected piece
                if (highlightedSquares.includes(square)) {
                    // Make the move
                    const move = game.move({
                        from: selectedPiece,
                        to: square,
                        promotion: 'q' // Auto-promote to queen for simplicity
                    });
                    
                    // Update the board
                    board.position(game.fen());
                    updateStatus();
                    
                    // Clear highlights
                    clearHighlights();
                    
                    // If playing against AI, make AI move after player moves
                    if (gameMode === 'ai' && game.turn() !== playerColor && !game.game_over()) {
                        setTimeout(makeAiMove, 250);
                    }
                } 
                // If clicking another piece of the same color, select that piece instead
                else {
                    const piece = game.get(square);
                    if (piece && piece.color === game.turn()) {
                        highlightPossibleMoves(square);
                    } else {
                        clearHighlights();
                    }
                }
            }
        }
    });
}

// Handle board position update after drop
function onSnapEnd() {
    board.position(game.fen());
}

// Make AI move
function animateThinking() {
    aiThinkingDots = (aiThinkingDots % 3) + 1;
    const dots = '.'.repeat(aiThinkingDots);
    $('#thinking').text(`AI is thinking${dots}`);
}

// Update the makeAiMove function
function makeAiMove() {
    if (game.game_over()) return;
    
    // Clear any highlights
    clearHighlights();
    
    $('#thinking').removeClass('hidden');
    userMoving = true;
    
    // Start thinking animation
    aiThinkingDots = 0;
    aiThinkingAnimation = setInterval(animateThinking, 300);
    
    // Set a timeout for AI thinking
    const aiTimeout = setTimeout(() => {
        console.log("AI thinking timeout - making fallback move");
        clearInterval(aiThinkingAnimation);
        userMoving = false;
        $('#thinking').addClass('hidden');
        
        // Make a simple fallback move
        const moves = game.moves();
        if (moves.length > 0) {
            const randomIndex = Math.floor(Math.random() * moves.length);
            const move = moves[randomIndex];
            game.move(move);
            board.position(game.fen());
            updateStatus();
        }
    }, 5000); // 5 seconds timeout
    
    // Use setTimeout to allow UI to update before AI calculation
    setTimeout(() => {
        try {
            // Make AI move
            const move = ai.makeMove(game);
            
            // Update board
            board.position(game.fen());
            updateStatus();
            
            // Clear the animations and timeouts
            clearInterval(aiThinkingAnimation);
            clearTimeout(aiTimeout);
            
            $('#thinking').addClass('hidden');
            userMoving = false;
        } catch (error) {
            console.error("Error in AI move calculation:", error);
            
            // Clear the animations and timeouts
            clearInterval(aiThinkingAnimation);
            clearTimeout(aiTimeout);
            
            // Make a fallback move
            const moves = game.moves();
            if (moves.length > 0) {
                const randomIndex = Math.floor(Math.random() * moves.length);
                const move = moves[randomIndex];
                game.move(move);
                board.position(game.fen());
                updateStatus();
            }
            
            $('#thinking').addClass('hidden');
            userMoving = false;
        }
    }, 100);
}

// Add a new function to handle window resize events to reapply square handlers
$(window).resize(function() {
    // Chessboard might rebuild the DOM on resize, so we need to reattach handlers
    setTimeout(setupClickHandlers, 300);
});

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

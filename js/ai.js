class ChessAI {
    constructor(elo = 1200) {
        this.elo = elo;
        this.updateStrength(elo);
        
        // Piece values for evaluation
        this.pieceValues = {
            'p': 100,   // pawn
            'n': 280,   // knight
            'b': 320,   // bishop
            'r': 479,   // rook
            'q': 929,   // queen
            'k': 60000  // king
        };
        
        // Piece square tables for positional evaluation
        this.pstScores = {
            'p': [  // Pawns
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [ 5,  5, 10, 25, 25, 10,  5,  5],
                [ 0,  0,  0, 20, 20,  0,  0,  0],
                [ 5, -5,-10,  0,  0,-10, -5,  5],
                [ 5, 10, 10,-20,-20, 10, 10,  5],
                [ 0,  0,  0,  0,  0,  0,  0,  0]
            ],
            'n': [  // Knights
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            'b': [  // Bishops
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5,  5,  5,  5,  5,-10],
                [-10,  0,  5,  0,  0,  5,  0,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            'r': [  // Rooks
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [ 0,  0,  0,  5,  5,  0,  0,  0]
            ],
            'q': [  // Queen
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [ -5,  0,  5,  5,  5,  5,  0, -5],
                [  0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            'k': [  // King
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [ 20, 20,  0,  0,  0,  0, 20, 20],
                [ 20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
    }
    
    // Update AI strength based on ELO
    updateStrength(elo) {
        this.elo = elo;
        this.searchDepth = Elo.getSearchDepthFromElo(elo);
    }
    
    // Make the best move for a given position
    makeMove(game) {
        // Try to use opening book first
        if (game.history().length < this.getOpeningBookDepth()) {
            const bookMove = this.getOpeningBookMove(game);
            if (bookMove) {
                game.move(bookMove);
                return bookMove;
            }
        }
        
        // Fall back to search if no book move
        const depth = this.searchDepth;
        const bestMove = this.findBestMove(game, depth);
        
        if (bestMove) {
            game.move(bestMove);
            return bestMove;
        }
        
        return null;
    }
    
    // Higher ELO = deeper opening book knowledge
    getOpeningBookDepth() {
        if (this.elo < 1200) return 3;  // Beginners know only the first 3 moves
        if (this.elo < 1600 && this.elo >= 1200) return 4;  // Intermediate players know 6 moves deep
        if (this.elo < 2000 && this.elo >=1600) return 5; // Advanced players know 10 moves deep
        return 6;                      // Experts know 15 moves deep
    }
    
    // Find the best move using minimax with alpha-beta pruning
    // Update the findBestMove method in AI class
findBestMove(game, depth) {
    let bestMove = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    
    // Get all possible moves
    const possibleMoves = game.moves();
    
    // Early exit if no moves
    if (possibleMoves.length === 0) return null;
    
    // If only one move is available, return it immediately
    if (possibleMoves.length === 1) return possibleMoves[0];
    
    // Sort moves to improve alpha-beta pruning (captures first)
    possibleMoves.sort((a, b) => {
        // Prioritize captures
        const aCapture = a.includes('x');
        const bCapture = b.includes('x');
        
        if (aCapture && !bCapture) return -1;
        if (!aCapture && bCapture) return 1;
        
        // Prioritize checks
        const aCheck = a.includes('+');
        const bCheck = b.includes('+');
        
        if (aCheck && !bCheck) return -1;
        if (!aCheck && bCheck) return 1;
        
        // Prioritize promotions
        const aPromotion = a.includes('=');
        const bPromotion = b.includes('=');
        
        if (aPromotion && !bPromotion) return -1;
        if (!aPromotion && bPromotion) return 1;
        
        return 0;
    });
    
    // Try each move and find the best one
    for (let i = 0; i < possibleMoves.length; i++) {
        const move = possibleMoves[i];
        
        // Make the move
        game.move(move);
        
        // Calculate value using minimax
        const value = this.minimax(game, depth - 1, alpha, beta, false);
        
        // Undo the move
        game.undo();
        
        // Update best move if better value found
        if (value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
        
        // Update alpha
        alpha = Math.max(alpha, bestValue);
    }
    
    return bestMove;
}

// Optimize the minimax method with faster pruning
minimax(game, depth, alpha, beta, isMaximizingPlayer) {
    // Immediate returns for performance
    if (depth === 0) return this.evaluateBoard(game);
    if (game.game_over()) {
        if (game.in_draw()) return 0;
        // If checkmate, return big negative/positive score based on who's winning
        return game.turn() === 'w' ? -10000 : 10000;
    }
    
    // Get all possible moves
    const possibleMoves = game.moves();
    
    // Early termination for performance
    if (possibleMoves.length === 0) return this.evaluateBoard(game);
    
    // Sorting moves improves alpha-beta pruning effectiveness
    if (depth >= 2) {
        // Only sort for deeper searches (sorting has overhead)
        possibleMoves.sort((a, b) => {
            if (a.includes('x') && !b.includes('x')) return -1;
            if (!a.includes('x') && b.includes('x')) return 1;
            return 0;
        });
    }
    
    if (isMaximizingPlayer) {
        let bestValue = -Infinity;
        
        // Try each move
        for (let i = 0; i < possibleMoves.length; i++) {
            game.move(possibleMoves[i]);
            bestValue = Math.max(bestValue, this.minimax(game, depth - 1, alpha, beta, false));
            game.undo();
            
            // Alpha-beta pruning
            alpha = Math.max(alpha, bestValue);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        
        return bestValue;
    } else {
        let bestValue = Infinity;
        
        // Try each move
        for (let i = 0; i < possibleMoves.length; i++) {
            game.move(possibleMoves[i]);
            bestValue = Math.min(bestValue, this.minimax(game, depth - 1, alpha, beta, true));
            game.undo();
            
            // Alpha-beta pruning
            beta = Math.min(beta, bestValue);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        
        return bestValue;
    }
}

    
    // Evaluate the board position
    evaluateBoard(game) {
        let totalEvaluation = 0;
        
        // Handle checkmate and draw
        if (game.in_checkmate()) {
            return game.turn() === 'w' ? -10000 : 10000;
        }
        
        if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
            return 0;
        }
        
        // Evaluate each piece on the board
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = game.get(this.indexToPosition(i, j));
                if (piece !== null) {
                    totalEvaluation += this.getPieceValue(piece, i, j);
                }
            }
        }
        
        // Add randomness based on ELO (lower ELO = more randomness)
        if (this.elo < 2000) {
            // Calculate randomness factor (more at lower ELO)
            const randomFactor = Math.max(0, (2000 - this.elo) / 1000); // 0.0 to 1.2
            
            // Add random noise to evaluation
            const maxNoise = 50 * randomFactor; // Maximum noise (higher for lower ELO)
            const noise = (Math.random() * 2 - 1) * maxNoise; // Random value between -maxNoise and +maxNoise
            
            totalEvaluation += noise;
        }
        
        return totalEvaluation;
    }
    
    // Get the value of a piece at a given position
    getPieceValue(piece, row, col) {
        const pieceType = piece.type;
        const pieceColor = piece.color;
        
        // Base value from piece values
        let value = this.pieceValues[pieceType];
        
        // Add position value from piece-square tables
        if (pieceColor === 'w') {
            value += this.pstScores[pieceType][row][col];
        } else {
            // Flip table for black pieces
            value += this.pstScores[pieceType][7 - row][col];
            value = -value; // Negate value for black pieces
        }
        
        return value;
    }
    
    // Convert board indices to chess position (e.g., 0,0 -> "a8")
    indexToPosition(row, col) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[col] + ranks[row];
    }
}

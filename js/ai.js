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
        const depth = this.searchDepth;
        const bestMove = this.findBestMove(game, depth);
        
        if (bestMove) {
            game.move(bestMove);
            return bestMove;
        }
        
        return null;
    }
    
    // Find the best move using minimax with alpha-beta pruning
    findBestMove(game, depth) {
        let bestMove = null;
        let bestValue = -Infinity;
        let alpha = -Infinity;
        const beta = Infinity;
        
        // Get all possible moves
        const possibleMoves = game.moves();
        
        // Sort moves to improve alpha-beta pruning (captures first)
        possibleMoves.sort((a, b) => {
            if (a.includes('x') && !b.includes('x')) return -1;
            if (!a.includes('x') && b.includes('x')) return 1;
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
    
    // Minimax algorithm with alpha-beta pruning
    minimax(game, depth, alpha, beta, isMaximizingPlayer) {
        // Base case: evaluation at leaf node or game over
        if (depth === 0 || game.game_over()) {
            return this.evaluateBoard(game);
        }
        
        // Get all possible moves
        const possibleMoves = game.moves();
        
        // Sort moves to improve alpha-beta pruning (captures first)
        possibleMoves.sort((a, b) => {
            if (a.includes('x') && !b.includes('x')) return -1;
            if (!a.includes('x') && b.includes('x')) return 1;
            return 0;
        });
        
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
                    break;
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
                    break;
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

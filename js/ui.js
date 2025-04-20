// UI.js - Handles user interface interactions and animations

// Theme options for the chessboard
const boardThemes = {
    default: {
        lightSquare: '#f0d9b5',
        darkSquare: '#b58863',
        activeSquare: 'rgba(20, 85, 30, 0.5)'
    },
    blue: {
        lightSquare: '#dae9f2',
        darkSquare: '#4682b4',
        activeSquare: 'rgba(255, 210, 0, 0.5)'
    },
    green: {
        lightSquare: '#eff7ee',
        darkSquare: '#769656',
        activeSquare: 'rgba(20, 85, 200, 0.5)'
    },
    gray: {
        lightSquare: '#e8e8e8',
        darkSquare: '#7d8796',
        activeSquare: 'rgba(180, 70, 70, 0.5)'
    }
};

// Current theme
let currentTheme = 'default';

// Initialize the UI components
function initUI() {
    // Apply default theme
    applyBoardTheme(currentTheme);
    
    // Set up theme selector if present
    if ($('#theme-selector').length) {
        $('#theme-selector').on('change', function() {
            currentTheme = $(this).val();
            applyBoardTheme(currentTheme);
            board.position(game.fen(), false); // Redraw the board
        });
    }
    
    // Set up fullscreen button if present
    if ($('#fullscreen-btn').length) {
        $('#fullscreen-btn').on('click', toggleFullscreen);
    }
    
    // Initialize tooltips
    setupTooltips();
    
    // Initialize modals
    setupModals();
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
}

// Apply a theme to the chessboard
function applyBoardTheme(themeName) {
    const theme = boardThemes[themeName] || boardThemes.default;
    
    // Apply CSS variables for the theme
    document.documentElement.style.setProperty('--light-square', theme.lightSquare);
    document.documentElement.style.setProperty('--dark-square', theme.darkSquare);
    document.documentElement.style.setProperty('--active-square', theme.activeSquare);
}

// Toggle fullscreen mode
function toggleFullscreen() {
    const gameContainer = document.querySelector('.game-container');
    
    if (!document.fullscreenElement) {
        if (gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        } else if (gameContainer.mozRequestFullScreen) { // Firefox
            gameContainer.mozRequestFullScreen();
        } else if (gameContainer.webkitRequestFullscreen) { // Chrome, Safari, Opera
            gameContainer.webkitRequestFullscreen();
        } else if (gameContainer.msRequestFullscreen) { // IE/Edge
            gameContainer.msRequestFullscreen();
        }
        $('#fullscreen-btn').html('<i class="fas fa-compress"></i>');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        $('#fullscreen-btn').html('<i class="fas fa-expand"></i>');
    }
}

// Show move highlights on the board
function highlightSquares(move) {
    // Remove any existing highlights
    $('.square-highlight').removeClass('square-highlight');
    
    if (!move) return;
    
    // Highlight the from and to squares
    $(`[data-square="${move.from}"]`).addClass('square-highlight');
    $(`[data-square="${move.to}"]`).addClass('square-highlight');
}

// Setup tooltips for buttons and controls
function setupTooltips() {
    // Example tooltip setup if using a tooltip library
    // $('.tooltip-element').tooltip();
    
    // For simple CSS tooltips, make sure CSS classes are applied
    $('.btn-tooltip').each(function() {
        const tooltipText = $(this).data('tooltip');
        $(this).append(`<span class="tooltip-text">${tooltipText}</span>`);
    });
}

// Setup modal dialogs (game over, settings, etc.)
function setupModals() {
    // Close modal when clicking the close button
    $('.modal-close').on('click', function() {
        $(this).closest('.modal').removeClass('show');
    });
    
    // Close modal when clicking outside of it
    $(window).on('click', function(event) {
        if ($(event.target).hasClass('modal')) {
            $('.modal').removeClass('show');
        }
    });
    
    // Open settings modal
    $('#settings-btn').on('click', function() {
        $('#settings-modal').addClass('show');
    });
    
    // Open help modal
    $('#help-btn').on('click', function() {
        $('#help-modal').addClass('show');
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    $(document).on('keydown', function(e) {
        // Undo move - Ctrl+Z
        if (e.ctrlKey && e.key === 'z') {
            undoMove();
            e.preventDefault();
        }
        
        // New game - Ctrl+N
        if (e.ctrlKey && e.key === 'n') {
            newGame();
            e.preventDefault();
        }
        
        // Toggle settings - Ctrl+,
        if (e.ctrlKey && e.key === ',') {
            $('#settings-modal').toggleClass('show');
            e.preventDefault();
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            $('.modal').removeClass('show');
        }
    });
}

// Animate piece movement
function animatePieceMove(move) {
    // If move animation is disabled, return
    if ($('#animation-toggle').is(':checked') === false) {
        return;
    }
    
    const speed = 200; // Animation speed in milliseconds
    
    // Get the source and target squares
    const $sourceSquare = $(`[data-square="${move.from}"]`);
    const $targetSquare = $(`[data-square="${move.to}"]`);
    
    // Get the piece that's moving
    const $piece = $sourceSquare.find('.piece');
    
    // If no piece found (shouldn't happen), return
    if (!$piece.length) return;
    
    // Clone the piece for animation
    const $clone = $piece.clone().appendTo('body');
    
    // Position the clone over the source square
    const sourceOffset = $sourceSquare.offset();
    $clone.css({
        position: 'absolute',
        zIndex: 1000,
        top: sourceOffset.top,
        left: sourceOffset.left,
        width: $sourceSquare.width(),
        height: $sourceSquare.height()
    });
    
    // Get the target position
    const targetOffset = $targetSquare.offset();
    
    // Animate the clone to the target position
    $clone.animate({
        top: targetOffset.top,
        left: targetOffset.left
    }, speed, function() {
        // Remove the clone after animation
        $clone.remove();
    });
}

// Show notification message
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    if (!$('#notification').length) {
        $('body').append('<div id="notification"></div>');
    }
    
    // Set the message and type
    $('#notification')
        .text(message)
        .removeClass()
        .addClass(`notification ${type}`)
        .addClass('show');
    
    // Hide notification after 3 seconds
    setTimeout(function() {
        $('#notification').removeClass('show');
    }, 3000);
}

// Update move history display
function updateMoveHistory() {
    const history = game.history({ verbose: true });
    const $historyList = $('#move-history-list');
    
    if (!$historyList.length) return;
    
    // Clear existing history
    $historyList.empty();
    
    // Format and display moves
    let moveNum = 1;
    for (let i = 0; i < history.length; i += 2) {
        const whiteMove = history[i] ? formatMove(history[i]) : '';
        const blackMove = history[i + 1] ? formatMove(history[i + 1]) : '';
        
        $historyList.append(`
            <div class="history-row">
                <span class="move-number">${moveNum}.</span>
                <span class="white-move">${whiteMove}</span>
                <span class="black-move">${blackMove}</span>
            </div>
        `);
        
        moveNum++;
    }
    
    // Scroll to the bottom
    $historyList.scrollTop($historyList[0].scrollHeight);
}

// Format a move for display
function formatMove(move) {
    if (!move) return '';
    
    let text = '';
    
    // Check for castling
    if (move.san === 'O-O') {
        return 'O-O';
    } else if (move.san === 'O-O-O') {
        return 'O-O-O';
    }
    
    // Handle normal moves
    if (move.piece !== 'p') {
        text += move.piece.toUpperCase();
    }
    
    if (move.flags.includes('c')) {
        if (move.piece === 'p') {
            text += move.from[0];
        }
        text += 'x';
    }
    
    text += move.to;
    
    // Handle promotion
    if (move.flags.includes('p')) {
        text += '=' + move.promotion.toUpperCase();
    }
    
    // Check and checkmate
    if (move.san.includes('+')) {
        text += '+';
    } else if (move.san.includes('#')) {
        text += '#';
    }
    
    return text;
}

// Initialize the UI when document is ready
$(document).ready(function() {
    initUI();
});

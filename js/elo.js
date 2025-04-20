const Elo = {
    // K-factor determines how much ratings change after each game
    K: 32,
    
    // Calculate expected score based on ratings
    getExpectedScore: function(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    },
    
    // Calculate new rating after a game
    getNewRating: function(myRating, opponentRating, myGameResult) {
        const expectedScore = this.getExpectedScore(myRating, opponentRating);
        return Math.round(myRating + this.K * (myGameResult - expectedScore));
    },
    
    // Calculate rating delta (change)
    getRatingDelta: function(myRating, opponentRating, myGameResult) {
        const expectedScore = this.getExpectedScore(myRating, opponentRating);
        return Math.round(this.K * (myGameResult - expectedScore));
    },
    
    // Map ELO rating to search depth for AI
    getSearchDepthFromElo: function(elo) {
        if (elo < 1000) return 1;
        if (elo < 1200) return 2;
        if (elo < 1400) return 2;
        if (elo < 1600) return 3;
        if (elo < 1800) return 3;
        return 4;
    }
};

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
    // More granular search depth mapping
getSearchDepthFromElo: function(elo) {
    // Base depth starts at 1
    let depth = 1;
    
    // Every 400 ELO points add one depth level
    depth += Math.floor((elo - 800) / 400);
    
    // Cap at reasonable maximum
    return Math.min(depth, 5);
}

};

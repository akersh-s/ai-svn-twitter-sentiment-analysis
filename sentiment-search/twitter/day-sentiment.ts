export class DaySentiment {
    public totalSentiment: number = 0;
    public numTweets: number = 0;
    
    addTweetSentiment(sentiment: number) {
        this.numTweets++;
        this.totalSentiment += sentiment;
    }
}
export class Variables {
    static priceThreshold: number = 3;
    static numDays: number = 2;
    static numPreviousDaySentiments: number = 4;
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = true;
    static includePriceChange: boolean = true;
    static includeNumTweetsChange: boolean = false;
    static includeSentiment: boolean = false;
    static includePrice: boolean = false;
    static includeNumTweets: boolean = true;

    //Time
    static includeTime: boolean = false;
    static includeTimeChange: boolean = true;

    //Fundamentals
    static includeHigh: boolean = true;
    static includeLow: boolean = true;
    static includeVolume: boolean = true;

    static includeFundamentals():boolean {
        return Variables.includeHigh || Variables.includeLow || Variables.includeVolume;
    }
}
export class Variables {
    static numDays: number = 1;
    static numPreviousDaySentiments: number = 4;
    static rbfsigma: number = 5e-2;
    static C: number = 1.0;

    static includeSentimentChange: boolean = true;
    static includePriceChange: boolean = true;
    static includeNumTweetsChange: boolean = true;
    static includeSentiment: boolean = true;
    static includePrice: boolean = true;
    static includeNumTweets: boolean = true;

    //Time
    static includeTime: boolean = false;
    static includeTimeChange: boolean = false;

    //Fundamentals
    static includeHigh: boolean = false;
    static includeLow: boolean = false;
    static includeVolume: boolean = false;

    static includeFundamentals():boolean {
        return Variables.includeHigh || Variables.includeLow || Variables.includeVolume;
    }
}
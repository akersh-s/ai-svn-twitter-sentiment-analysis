export class Variables {
    static priceThreshold: number = 3;
    static numDays: number = 2;
    static numPreviousDaySentiments: number = Variables.numDays * 10;
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = false;
    static includePriceChange: boolean = true;
    static includeNumTweetsChange: boolean = false;
    static includeSentiment: boolean = true;
    static includePrice: boolean = false;
    static includePriceBracket: boolean = false;
    static includeNumTweets: boolean = false;

    //Time
    static includeTime: boolean = false;
    static includeTimeChange: boolean = false;

    //Fundamentals
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeVolumeChange: boolean = false;
    static includeDayOfWeek: boolean = false;

    static kernelType: string = 'RBF';
    static svmType: string = 'C_SVC';

    static maxSvmData: number = 7000;

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}

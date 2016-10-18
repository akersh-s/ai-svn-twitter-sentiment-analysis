export class Variables {
    static priceThreshold: number = 2;
    static numDays: number = 1;
    static numPreviousDaySentiments: number = 3;
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = true;
    static includePriceChange: boolean = true;
    static includeNumTweetsChange: boolean = true;
    static includeSentiment: boolean = true;
    static includePrice: boolean = false;
    static includePriceBracket: boolean = true;
    static includeNumTweets: boolean = false;

    //Time
    static includeTime: boolean = false;
    static includeTimeChange: boolean = false;

    //Fundamentals
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeVolumeChange: boolean = true;

    static kernelType: string = 'RBF';
    static svmType: string = 'C_SVC';

    static maxSvmData: number = 10000;

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}

export class Variables {
    static priceThreshold: number = 4;
    static numDays: number = 2;
    static numPreviousDaySentiments: number = 4;
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = true;
    static includePriceChange: boolean = true;
    static includeNumTweetsChange: boolean = true;
    static includeSentiment: boolean = false;
    static includePrice: boolean = false;
    static includeNumTweets: boolean = true;

    //Time
    static includeTime: boolean = false;
    static includeTimeChange: boolean = true;

    //Fundamentals
    static includeHighChange: boolean = true;
    static includeLowChange: boolean = true;
    static includeVolumeChange: boolean = true;

    static kernelType: string = 'RBF';
    static svmType: string = 'C_SVC';

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}
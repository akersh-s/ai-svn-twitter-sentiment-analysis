export class Variables {
    static priceThreshold: number = 4;
    static numDays: number = 3 ;
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
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeVolumeChange: boolean = false;

    static kernelType: string = 'RBF';
    static svmType: string = 'C_SVC';

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}
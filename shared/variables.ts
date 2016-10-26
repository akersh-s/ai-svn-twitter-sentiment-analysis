import {argv} from 'yargs';
//Best = sentiment, volume Run:  - Total: 17.6232 Average: 2.9372 Options: 
//Best = sentiment, numtweets, volume Run:  - Total: 9.49575 Average: 1.58263 Options: 

export class Variables {
    static priceThreshold: number = argInt('price-thresold', 2);
    static numDays: number = argInt('num-days', 2);
    static numPreviousDaySentiments: number = argInt('previous-day-sentiments', 5);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', true);
    static includePriceChange: boolean = argBoolean('include-price-change', false);
    static includeNumTweetsChange: boolean = argBoolean('include-num-tweets-change', false);
    static includeSentiment: boolean = argBoolean('include-sentiment', false);
    static includePrice: boolean = argBoolean('include-price', false);
    static includePriceBracket: boolean = argBoolean('include-price-bracket', false);
    static includeNumTweets: boolean = argBoolean('include-num-tweets', false);

    // Least Squares
    static leastSquaresSentiment: boolean = false;
	static leastSquaresPrice: boolean = false;
	static leastSquaresTime: boolean = false;
	static leastSquaresVolume: boolean = false;

    //Time
    static includeTime: boolean = argBoolean('include-time', false);
    static includeTimeChange: boolean = argBoolean('include-time-change', false);

    //Fundamentals
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeVolumeChange: boolean = argBoolean('include-volume-change', true);
    static includeDayOfWeek: boolean = argBoolean('include-day-of-week', false);

    static kernelType: string = argString('kernel-type', 'RBF');
    static svmType: string = argString('svm-type', 'NU_SVC');

    static maxSvmData: number = argInt('max-svm-data', 25000);

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}

function argString(val: string, defValue: string): string {
    const result = argv[val] ? argv[val] : defValue;
    return result;
}

function argInt(val: string, defValue: number): number {
    const result = argv[val] ? parseInt(argv[val]) : defValue;
    return result;
}

function argBoolean(val: string, defValue: boolean): boolean {
    let result: boolean;
    if (argv[val] !== undefined && argv[val] !== null) {
        result = argv[val] === 'true' || argv[val] === true;
    }
    else {
        result = defValue;
    }
    return result;
}

import {argv} from 'yargs';
//Best Run: 13962 - Total: 683.481 Average: 85.4351 Options: --price-threshold=0 --num-days=2 --previous-day-sentiments=10 --skip-day-sentiments=1 --include-sentiment-change=true --include-price-change=false --include-num-tweets-change=false --include-sentiment=false --include-price=true --include-price-bracket=true --include-num-tweets=false --include-time-change=true --include-volume-change=false --include-day-of-week=false --max-svm-data=7000
//This was shit. Second Run: 20408 - Total: 332.275 Average: 41.5343 Options: --price-threshold=1 --num-days=2 --previous-day-sentiments=15 --skip-day-sentiments=1 --include-sentiment-change=false --include-price-change=true --include-num-tweets-change=false --include-sentiment=true --include-price=true --include-price-bracket=true --include-num-tweets=true  --include-time-change=false --include-volume-change=false --include-day-of-week=false --max-svm-data=7000

export class Variables {
    static priceThreshold: number = argInt('price-thresold', 5);
    static numDays: number = argInt('num-days', 2);
    static numPreviousDaySentiments: number = argInt('previous-day-sentiments', 10);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', false);
    static includePriceChange: boolean = argBoolean('include-price-change', false);
    static includeNumTweetsChange: boolean = argBoolean('include-num-tweets-change', false);
    static includeSentiment: boolean = argBoolean('include-sentiment', true);
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
    static includeVolumeChange: boolean = argBoolean('include-volume-change', false);
    static includeDayOfWeek: boolean = argBoolean('include-day-of-week', false);

    static kernelType: string = argString('kernel-type', 'RBF');
    static svmType: string = argString('svm-type', 'C_SVC');

    static maxSvmData: number = argInt('max-svm-data', 7000);

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}

function argString(val: string, defValue: string): string {
    const result = argv[val] ? argv[val] : defValue;
    console.log(val, result);
    return result;
}

function argInt(val: string, defValue: number): number {
    const result = argv[val] ? parseInt(argv[val]) : defValue;
    console.log(val, result);
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
    console.log(val, result);
    return result;
}

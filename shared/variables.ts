import { argv } from 'yargs';
//Run: 30315 - Total: 1103.16 Average: 42.4293, Above: 72, Below: 57, Success Rate: %55, Options: --include-stock-volatility=true --include-stock-momentum=true --include-volume-volatility=false --include-volume-momentum=true --include-sentiment-volatility=false --include-sentiment-momentum=true --num-days=2 --previous-day-sentiments=7 --include-price-change=false --include-volume-change=false --price-threshold=0 --include-day-of-week=false

export class Variables {
    static topNumToBuy: number = 10;
    static priceThreshold: number = argInt('price-thresold', 0);
    static numDays: number = argInt('num-days', 2);
    static numPreviousDaySentiments: number = argInt('previous-day-sentiments', 7);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);

    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', false);
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

    // Volatility and Momentum
    static includeStockVolatility: boolean = argBoolean('include-stock-volatility', true);
    static includeStockMomentum: boolean = argBoolean('include-stock-momentum', true);

    static includeVolumeVolatility: boolean = argBoolean('include-volume-volatility', false);
    static includeVolumeMomentum: boolean = argBoolean('include-volume-momentum', true);

    static includeSentimentVolatility: boolean = argBoolean('include-sentiment-volatility', false);
    static includeSentimentMomentum: boolean = argBoolean('include-sentiment-momentum', true);

    //Fundamentals
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeVolumeChange: boolean = argBoolean('include-volume-change', false);
    static includeDayOfWeek: boolean = argBoolean('include-day-of-week', false);

    static kernelType: string = argString('kernel-type', 'SIGMOID');
    static svmType: string = argString('svm-type', 'C_SVC');
    static normalize: boolean = argBoolean('normalize', true);
    static reduce: boolean = argBoolean('reduce', true);
    static kFold: number = argInt('k-fold', 4);
    static retainedVariance: number = argFloat('retained-variance', 0.85);
    static shrinking: boolean = argBoolean('shrinking', true);

    static maxSvmData: number = argInt('max-svm-data', 13000);

    static includeFundamentals(): boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
}

function argString(val: string, defValue: string): string {
    const result = argv[val] ? argv[val] : defValue;
    return result;
}

function argInt(val: string, defValue: number): number {
    const result = argv[val] ? parseInt(argv[val], 10) : defValue;
    if (argv[val]) {
        console.log(val, result);
    }
    return result;
}

function argFloat(val: string, defValue: number): number {
    const result = argv[val] ? parseFloat(argv[val]) : defValue;
    if (argv[val]) {
        console.log(val, result);
    }
    return result;
}

function argBoolean(val: string, defValue: boolean): boolean {
    let result: boolean;
    if (argv[val] !== undefined && argv[val] !== null) {
        result = argv[val] === 'true' || argv[val] === true;
        console.log(val, result);
    }
    else {
        result = defValue;
    }
    return result;
}

import { argv } from 'yargs';
//Run: 14691 - Total: 974.758 Average: 34.8128, Above: 67, Below: 20, Success Rate: %77, Options: --include-stock-volatility=false --include-stock-momentum=false --include-volume-volatility=false --include-volume-momentum=true --include-sentiment-volatility=false --include-sentiment-momentum=false --include-volume-change=false --include-sentiment-change=false --include-price-change=true --include-sub=true --price-thresold=1 --kernel-type=RBF --svm-type=C_SVC --normalize=true --k-fold=1 --retained-variance=0.9 --num-days=7 --eps=0.001

export class Variables {
    static topNumToBuy: number = 1000;
    static priceThreshold: number = argInt('price-thresold', 1);
    static numDays: number = argInt('num-days', 7);
    static numPreviousDaySentiments: number = 6; //Variables.numDays * 2; //argInt('previous-day-sentiments', 6);

    static includeSub: boolean = argBoolean('include-sub', true);
    static numPreviousDaySentimentsSub: number = Variables.numDays; //argInt('previous-day-sentiments-sub', 3);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);

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
    static includeStockVolatility: boolean = argBoolean('include-stock-volatility', false);
    static includeStockMomentum: boolean = argBoolean('include-stock-momentum', false);

    static includeVolumeVolatility: boolean = argBoolean('include-volume-volatility', false);
    static includeVolumeMomentum: boolean = argBoolean('include-volume-momentum', true);

    static includeSentimentVolatility: boolean = argBoolean('include-sentiment-volatility', false);
    static includeSentimentMomentum: boolean = argBoolean('include-sentiment-momentum', false);

    static includeVolumeChange: boolean = argBoolean('include-volume-change', false);
    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', false);
    static includePriceChange: boolean = argBoolean('include-price-change', true);

    //Fundamentals
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeDayOfWeek: boolean = argBoolean('include-day-of-week', false);

    static kernelType: string = argString('kernel-type', 'RBF');
    static svmType: string = argString('svm-type', 'C_SVC');
    static eps: number = argFloat('eps', 1e-3);
    static normalize: boolean = argBoolean('normalize', true);
    static reduce: boolean = argBoolean('reduce', true);
    static kFold: number = argInt('k-fold', 1);
    static retainedVariance: number = argFloat('retained-variance', 0.9);
    static shrinking: boolean = argBoolean('shrinking', true);

    static maxSvmData: number = argInt('max-svm-data', 15000);

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
        //console.log(val, result);
    }
    return result;
}

function argFloat(val: string, defValue: number): number {
    const result = argv[val] ? parseFloat(argv[val]) : defValue;
    if (argv[val]) {
        //console.log(val, result);
    }
    return result;
}

function argBoolean(val: string, defValue: boolean): boolean {
    let result: boolean;
    if (argv[val] !== undefined && argv[val] !== null) {
        result = argv[val] === 'true' || argv[val] === true;
        //console.log(val, result);
    }
    else {
        result = defValue;
    }
    return result;
}

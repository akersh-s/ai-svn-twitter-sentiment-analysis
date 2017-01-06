import { argv } from 'yargs';
//Total: 34.122 Average: 8.53049, Median: 7.73685430399285, Above: 27, Below: 5, Success Rate: %84, Options: --num-to-buy=20 --price-threshold=0 --previous-day-sentiments=42 --include-sub=false --num-days=18 --include-stock-volatility=true --include-stock-momentum=false --include-price-change=false --include-volume-volatility=true --include-volume-momentum=false --include-volume-change=false --include-sentiment-volatility=false --include-sentiment-momentum=false --include-sentiment-change=true --include-r-indicator=false --include-obv=true --include-pe-ratio-volatility=false --include-pe-ratio-momentum=true --include-pe-ratio-change=true --include-num-tweets-volatility=false --include-num-tweets-momentum=true --include-num-tweets-change=false

export class Variables {
    static topNumToBuy: number = argInt('num-to-buy', 20);
    static priceThreshold: number = argInt('price-thresold', 0);
    static numDays: number = argInt('num-days', 5);
    static sellOnIncrease: boolean = argBoolean('sell-on-increase', true);
    static sellOnIncreaseAmount: number = argInt('sell-on-increase-amount', 1);
    static numPreviousDaySentiments: number = argInt('previous-day-sentiments', 35);

    static includeSub: boolean = argBoolean('include-sub', true);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);

    static includeStockHash: boolean = argBoolean('include-stock-hash', false);

    static includeStockVolatility: boolean = argBoolean('include-stock-volatility', true);
    static includeStockMomentum: boolean = argBoolean('include-stock-momentum', false);
    static includePriceChange: boolean = argBoolean('include-price-change', false);

    static includeVolumeVolatility: boolean = argBoolean('include-volume-volatility', true);
    static includeVolumeMomentum: boolean = argBoolean('include-volume-momentum', false);
    static includeVolumeChange: boolean = argBoolean('include-volume-change', false);

    static includeSentimentVolatility: boolean = argBoolean('include-sentiment-volatility', false);
    static includeSentimentMomentum: boolean = argBoolean('include-sentiment-momentum', false);
    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', true);

    static includePeRatioVolatility: boolean = argBoolean('include-pe-ratio-volatility', false);
    static includePeRatioMomentum: boolean = argBoolean('include-pe-ratio-momentum', true);
    static includePeRatioChange: boolean = argBoolean('include-pe-ratio-change', true);

    static includeNumTweetsVolatility: boolean = argBoolean('include-num-tweets-volatility', false);
    static includeNumTweetsMomentum: boolean = argBoolean('include-num-tweets-momentum', true);
    static includeNumTweetsChange: boolean = argBoolean('include-num-tweets-change', false);

    static includeRIndicator: boolean = argBoolean('include-r-indicator', false);
    static includeOnBalanceVolume: boolean = argBoolean('include-obv', true);

    static kernelType: string = argString('kernel-type', 'RBF');
    static svmType: string = argString('svm-type', 'C_SVC');
    static eps: number = argFloat('eps', 1e-3);
    static normalize: boolean = argBoolean('normalize', true);
    static reduce: boolean = argBoolean('reduce', true);
    static kFold: number = argInt('k-fold', 4);
    static retainedVariance: number = argFloat('retained-variance', 0.9);
    static shrinking: boolean = argBoolean('shrinking', true);

    static maxSvmData: number = argInt('max-svm-data', 40000);
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

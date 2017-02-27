import { argv } from 'yargs';

export class Variables {
    static topNumToBuy: number = argInt('num-to-buy', 20);
    static priceThreshold: number = argInt('price-thresold', 0.75);
    static numDays: number = argInt('num-days', 6);
    static sellOnIncrease: boolean = argBoolean('sell-on-increase', true);
    static sellOnIncreaseAmount: number = argInt('sell-on-increase-amount', 3);
    static sellWall: number = argInt('sell-wall', -10);
    static numPreviousDaySentiments: number = argInt('previous-day-sentiments', 15);

    static includeSub: boolean = argBoolean('include-sub', false);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);

    static includeStockHash: boolean = argBoolean('include-stock-hash', true);

    static includeStockVolatility: boolean = argBoolean('include-stock-volatility', true);
    static includeStockMomentum: boolean = argBoolean('include-stock-momentum', true);
    static includePriceChange: boolean = argBoolean('include-price-change', false);

    static includeVolumeVolatility: boolean = argBoolean('include-volume-volatility', true);
    static includeVolumeMomentum: boolean = argBoolean('include-volume-momentum', true);
    static includeVolumeChange: boolean = argBoolean('include-volume-change', false);

    static includeSentimentVolatility: boolean = argBoolean('include-sentiment-volatility', false);
    static includeSentimentMomentum: boolean = argBoolean('include-sentiment-momentum', false);
    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', false);

    static includePeRatioVolatility: boolean = argBoolean('include-pe-ratio-volatility', false);
    static includePeRatioMomentum: boolean = argBoolean('include-pe-ratio-momentum', false);
    static includePeRatioChange: boolean = argBoolean('include-pe-ratio-change', false);

    static includeNumTweetsVolatility: boolean = argBoolean('include-num-tweets-volatility', false);
    static includeNumTweetsMomentum: boolean = argBoolean('include-num-tweets-momentum', false);
    static includeNumTweetsChange: boolean = argBoolean('include-num-tweets-change', false);

    static includeRIndicator: boolean = argBoolean('include-r-indicator', false);
    static includeOnBalanceVolume: boolean = argBoolean('include-obv', false);

    static kernelType: string = argString('kernel-type', 'RBF');
    static svmType: string = argString('svm-type', 'C_SVC');
    static eps: number = argFloat('eps', 1e-3);
    static normalize: boolean = argBoolean('normalize', true);
    static reduce: boolean = argBoolean('reduce', true);
    static kFold: number = argInt('k-fold', 4);
    static retainedVariance: number = argFloat('retained-variance', 0.9);
    static shrinking: boolean = argBoolean('shrinking', true);

    static maxSvmData: number = argInt('max-svm-data', 200000);

    static calculateSellAmountForDayIndex(i: number): number {
        const x = i - 1;
        const m = (Variables.priceThreshold - Variables.sellOnIncreaseAmount) / Variables.numDays;
        const b = Variables.sellOnIncreaseAmount;
        return (m * x) + b;
    }

    static calculateSellWallForDayIndex(i: number): number {
        const x = i - 1;
        const m = (Variables.priceThreshold - Variables.sellWall) / Variables.numDays;
        const b = Variables.sellWall;
        return (m * x) + b;
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

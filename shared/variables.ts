import {argv} from 'yargs';

export class Variables {
    static priceThreshold: number = argInt('price-thresold', 3);
    static numDays: number = argInt('num-days', 2);
    static numPreviousDaySentiments: number = argInt('previous-day-sentiments', Variables.numDays * 10);
    static skipDaySentiments: number = argInt('skip-day-sentiments', 1);
    static rbfsigma: number = 0.5;
    static C: number = 1.0;

    static includeSentimentChange: boolean = argBoolean('include-sentiment-change', false);
    static includePriceChange: boolean = argBoolean('include-price-change', true);
    static includeNumTweetsChange: boolean = argBoolean('include-num-tweets-change', false);
    static includeSentiment: boolean = argBoolean('include-sentiment', true);
    static includePrice: boolean = argBoolean('include-price', false);
    static includePriceBracket: boolean = argBoolean('include-price-bracket', false);
    static includeNumTweets: boolean = argBoolean('include-num-tweets', false);

    //Time
    static includeTime: boolean = argBoolean('include-time', false);
    static includeTimeChange: boolean = argBoolean('include-time-change', false);

    //Fundamentals
    static includeHighChange: boolean = false;
    static includeLowChange: boolean = false;
    static includeVolumeChange: boolean = argBoolean('include-volume-change', false);
    static includeDayOfWeek: boolean = argBoolean('include-day-of-week', false);

    static kernelType: string = 'RBF';
    static svmType: string = 'C_SVC';

    static maxSvmData: number = argInt('max-svm-data', 10000);

    static includeFundamentals():boolean {
        return Variables.includeHighChange || Variables.includeLowChange || Variables.includeVolumeChange;
    }
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

//--price-threshold=3 --num-days=2 --previous-day-sentiments=10 --skip-day-sentiments=1 --include-sentiment-change=true --include-price-change=true --include-num-tweets-change=true --include-sentiment=true --include-price=true --include-price-bracket=true --include-num-tweets=true --include-time=false --include-time-change=true --include-volume-chage=true --include-day-of-week=true --max-svm-data=7000
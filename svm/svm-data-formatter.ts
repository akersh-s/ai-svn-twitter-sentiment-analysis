import * as fs from 'fs';
import * as _ from 'lodash';

import { isWeekend, getPreviousWorkDay, getNextWorkDay, getDaysAgo, formatDate } from '../shared/util/date-util';
import { FileUtil } from '../shared/util/file-util';
import { calculateMeanVarianceAndDeviation } from '../shared/util/math-util';
import { SvmData } from './svm-data.model';
import { Prediction } from './prediction.model';
import { debug } from '../shared/util/log-util';
import { Variables } from '../shared/variables';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';


const lastDayCache: any = {};

export async function getSvmData(): Promise<SvmData> {
    return undefined;
}

export async function getPredictions(todaysDaySentiments: DaySentiment[]): Promise<Prediction[]> {
    FileUtil.collectLastResultFiles(5);

    todaysDaySentiments = todaysDaySentiments
        .filter(t => !!t.price && !!t.fundamentals && !!t.quoteDataResult && !!t.fundamentals.market_cap)
        .filter(t => t.totalSentiment && t.numTweets && (t.totalSentiment / t.numTweets) > 3)
        .filter(t => {
            const bidPrice = parseFloat(t.quoteDataResult.bid_price);
            const askPrice = parseFloat(t.quoteDataResult.ask_price);

            return (bidPrice / askPrice) > 0.70
        })
        .filter(t => {
            const high52weeks = parseFloat(t.fundamentals.high_52_weeks);
            const lastTradePrice = parseFloat(t.quoteDataResult.last_trade_price);
            return ((high52weeks - lastTradePrice) / lastTradePrice) < 0.01;
        })
        .filter(t => {
            //market cap == small OR nano (small: $300 million - $2 billion ... nano: <$50million)
            const marketCap = parseFloat(t.fundamentals.market_cap);
            const isSmall = marketCap >= 300000000 && marketCap < 2000000000;
            const isNano = marketCap < 50000000;
            return isSmall || isNano;
        });
    if (todaysDaySentiments.length === 0) {
        return [];
    }
    const previousDaySentiments = await gatherPreviousDaySentiments(todaysDaySentiments.map(t => t.stock.symbol));
    if (previousDaySentiments.length === 0) {
        return [];
    }

    const predictions: Prediction[] = todaysDaySentiments
        .filter(t => getPreviousClose(t, previousDaySentiments))
        .filter(t => getPreviousClose(t, previousDaySentiments) < parseFloat(t.quoteDataResult.last_trade_price))
        //previous_close<last_trade_price
        .map(t => {
            return new Prediction(t.stock.symbol, []);
        });

    return predictions;
}

function getPreviousClose(daySentiment: DaySentiment, previousDaySentiments: DaySentiment[]): number {
    const cacheKey = daySentiment.stock.symbol + formatDate(daySentiment.day);
    if (lastDayCache[cacheKey]) {
        return lastDayCache[cacheKey];
    }
    const stockDaySentiments = previousDaySentiments.filter(p => p.stock.symbol === daySentiment.stock.symbol).sort((a, b) => +b.day - +a.day);
    if (stockDaySentiments.length > 0) {

        lastDayCache[cacheKey] = stockDaySentiments[0].price;
        console.log('Today:', formatDate(daySentiment.day), 'Yesterday:', formatDate(stockDaySentiments[0].day));
    }
    return lastDayCache[cacheKey];
}

function gatherPreviousDaySentiments(stocks?: string[]): Promise<DaySentiment[]> {
    let daySentiments: DaySentiment[] = [];
    let promiseFuncs = [];
    FileUtil.lastResultsFiles.forEach(f => {
        promiseFuncs.push(readDaySentiments(f));
    });
    return new Promise<DaySentiment[]>((resolve, reject) => {
        Promise.all(promiseFuncs).then((daySentimentsArray: DaySentiment[][]) => {
            daySentimentsArray.forEach(moreDaySentiments => {
                daySentiments = daySentiments.concat(moreDaySentiments.filter(daySentiment => {
                    return !stocks || stocks.indexOf(daySentiment.stock.symbol) !== -1;
                }));
            });
            resolve(daySentiments);
        });
    });
}

function readDaySentiments(f: string): Promise<DaySentiment[]> {
    return new Promise<DaySentiment[]>((resolve, reject) => {
        fs.readFile(f, 'utf-8', (err, data) => {
            if (err) {
                return resolve([]);
            }
            try {
                resolve(DaySentiment.parseArray(JSON.parse(data)));
            }
            catch (e) {
                resolve([]);
            }
        });
    });
}

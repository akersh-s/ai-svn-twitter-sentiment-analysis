import * as fs from 'fs';
import * as _ from 'lodash';

import { isWeekend, getPreviousWorkDay, getNextWorkDay, getDaysAgo } from '../shared/util/date-util';
import { FileUtil } from '../shared/util/file-util';
import { calculateMeanVarianceAndDeviation } from '../shared/util/math-util';
import { SvmData } from './svm-data.model';
import { Prediction } from './prediction.model';
import { debug } from '../shared/util/log-util';
import { Variables } from '../shared/variables';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';

const stockHashCache: any = {};

export async function getSvmData(): Promise<SvmData> {
    let formattedSvmData = await formatSvmData();
    debug('formattedSvmData: ' + formattedSvmData.x.length);
    return formattedSvmData;
}

export async function getPredictions(todaysDaySentiments: DaySentiment[]): Promise<Prediction[]> {
    let stocks = FileUtil.getStocks();
    todaysDaySentiments = todaysDaySentiments.filter(t => stocks.indexOf(t.stock.symbol) !== -1);
    debug(`Collecting Predictions from ${todaysDaySentiments.length} sentiments`);
    let predictions = [];

    let groupedTodaysDaySentiments: DaySentiment[][] = _.chunk(todaysDaySentiments, 1500);
    let i = 0;
    while (i < groupedTodaysDaySentiments.length) {
        let groupedTDS: DaySentiment[] = groupedTodaysDaySentiments[i++];
        let allPreviousDaySentiments: DaySentiment[] = await gatherPreviousDaySentiments(groupedTDS.map(t => t.stock.symbol));
        const previousSentimentDictionary: Dictionary<DaySentiment[]> = _.groupBy(allPreviousDaySentiments, (d) => d.stock.symbol);
        groupedTDS = groupedTDS.filter(d => !!d.price).sort((a, b) => {
            return +b.day - +a.day;
        });
        groupedTDS.forEach(todaysDaySentiment => {
            const symbol = todaysDaySentiment.stock.symbol;
            let collectedDaySentiments: DaySentiment[] = [todaysDaySentiment];
            let thisPreviousDaySentiments = previousSentimentDictionary[todaysDaySentiment.stock.symbol];
            for (let j = 1; j < Variables.numPreviousDaySentiments; j++) {
                const date: Date = getDaysAgo(j, todaysDaySentiment.day);
                const prevDaySentiment = getPreviousDaySentiment(symbol, date, thisPreviousDaySentiments);
                prevDaySentiment && collectedDaySentiments.push(prevDaySentiment);
            }
            if (collectedDaySentiments.length < (Variables.numPreviousDaySentiments / 2)) {
                return;
            }
            let x = createX(collectedDaySentiments);
            predictions.push(new Prediction(todaysDaySentiment.stock.symbol, x));
        });
    }

    debug(`Completed collecting ${predictions.length} predictions.`);
    return predictions;
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

async function formatSvmData(): Promise<SvmData> {
    let svmData = new SvmData();
    let increases = [];
    let stocks = FileUtil.getStocks();
    let groupedStocks: string[][] = _.chunk(stocks, 1500);
    let i = 0;

    while (i < groupedStocks.length) {
        let groupedStock: string[] = groupedStocks[i++];
        let allPreviousDaySentiments: DaySentiment[] = await gatherPreviousDaySentiments(groupedStock);
        groupedStock.forEach(stock => {
            let stockPreviousDaySentiments = allPreviousDaySentiments.filter(d => d.stock.symbol === stock);
            //console.log(`SVM Data size: ${stockPreviousDaySentiments.length} for ${stock} (${allPreviousDaySentiments.length} in group)`);
            stockPreviousDaySentiments = stockPreviousDaySentiments.filter(d => !!d.price && !isWeekend(d.day));
            stockPreviousDaySentiments.forEach(daySentiment => {
                const symbol = daySentiment.stock.symbol;
                let collectedDaySentiments: DaySentiment[] = [daySentiment];
                for (let j = 1; j < Variables.numPreviousDaySentiments; j++) {
                    const date: Date = getDaysAgo(j, daySentiment.day);
                    const prevDaySentiment = getPreviousDaySentiment(symbol, date, stockPreviousDaySentiments);
                    prevDaySentiment && collectedDaySentiments.push(prevDaySentiment);
                }
            if (collectedDaySentiments.length < (Variables.numPreviousDaySentiments / 2)) {
                    return;
                }
                let nextDaySentiment: DaySentiment = getDaySentimentInNDays(Variables.numDays, daySentiment, stockPreviousDaySentiments);

                if (!nextDaySentiment || !nextDaySentiment.price) { return; }
                const increasePercent = change(nextDaySentiment.price, daySentiment.price) * 100;
                increases.push(increasePercent);
                //const increasePercentEoD = change(nextDaySentiment.price, nextEoDaySentiment.price) * 100;
                //console.log(`Today (${formatDate(daySentiment.day)}): ${daySentiment.price}, End (${formatDate(nextDaySentiment.day)}): ${nextDaySentiment.price}, Increase Percent: ${increasePercent}`,
                //`Tomorrow (${formatDate(nextEoDaySentiment.day)}): ${nextEoDaySentiment.price}`, `Increase Percent: ${increasePercentEoD}`);
                //const y = increasePercent > Variables.priceThreshold && (increasePercentEoD > Variables.priceThreshold || increasePercentEoD === 0) ? 1 : 0;
                let y = 0;
                let force0 = false;
                if (Variables.sellOnIncrease) {
                    for (let k = 1; k <= Variables.numDays; k++) {
                        const nextEoDaySentiment: DaySentiment = getDaySentimentInNDays(k, daySentiment, stockPreviousDaySentiments);
                        if (nextEoDaySentiment && nextEoDaySentiment.price) {
                            // Overall increase
                            let increasePercent = change(nextEoDaySentiment.price, daySentiment.price) * 100;
                            if (increasePercent >= Variables.calculateSellAmountForDayIndex(k)) {
                                y = 1;
                                k = Variables.numDays + 1;
                            }
                            if (increasePercent <= Variables.calculateSellWallForDayIndex(k)) {
                                y = 0;
                                k = Variables.numDays + 1;
                                force0 = true;
                            }
                        }
                    }
                }
                if (increasePercent > Variables.priceThreshold && !force0) {
                    y = 1;
                }
                const xy = createX(collectedDaySentiments);
                xy.push(y);

                svmData.xy.push(xy);
            });
        });
    }
    increases.sort((a, b) => b - a);
    let t5i = Math.floor(increases.length * 0.05);
    let t10i = Math.floor(increases.length * 0.1);
    let t20i = Math.floor(increases.length * 0.2);
    let t30i = Math.floor(increases.length * 0.3);
    const mediani = Math.floor(increases.length * 0.5);

    debug(`Finished formatting SVM Data... Top 5 Price: ${increases[t5i]}, Top 10 Price: ${increases[t10i]}, Top 20 Price: ${increases[t20i]}, Top 30 Price: ${increases[t30i]}, Median Price: ${increases[mediani]}`);
    svmData.xy = _.sampleSize(svmData.xy, Variables.maxSvmData);
    svmData.createXsYs();
    console.log(`Number of 1's: ${svmData.y.filter(y => y === 1).length}`, `Number of 0's: ${svmData.y.filter(y => y === 0).length}`);
    return svmData;
}

function getPreviousDaySentiment(symbol: string, day: Date, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
    return getNearbyDaySentiment(symbol, day, allPreviousDaySentiments, false);
}

function getNearbyDaySentiment(symbol: string, date: Date, allPreviousDaySentiments: DaySentiment[], isForward: boolean): DaySentiment {
    const nextDate = isForward ? getNextWorkDay(date) : getPreviousWorkDay(date);
    const candidate = DaySentiment.findDaySentimentForSymbolAndDate(symbol, nextDate, allPreviousDaySentiments);
    return candidate;
}

function getDaySentimentInNDays(n: number, daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
    if (!daySentiment || !daySentiment.price || !daySentiment.day) {
        return null;
    }

    let i = 0;
    let candidateDate: Date = daySentiment.day;
    while (i < n) {
        i++;
        candidateDate = getNextWorkDay(candidateDate);
    }
    const candidate = DaySentiment.findDaySentimentForSymbolAndDate(daySentiment.stock.symbol, candidateDate, allPreviousDaySentiments);
    return candidate;
}

function createX(allDaySentiments: DaySentiment[]): number[] {
    let x: number[] = [];

    const dsGroups = [allDaySentiments];
    if (Variables.includeSub) {
        const half = allDaySentiments.length / 2;
        const subDaySentiments: DaySentiment[] = allDaySentiments.filter((v, i) => i < half);
        dsGroups.push(subDaySentiments);
    }
    Variables.includeStockHash && x.push(createStockHash(allDaySentiments[0].stock.symbol));
    dsGroups.forEach(daySentiments => {
        // Volatility, Momentum, and Change
        Variables.includeStockVolatility && x.push(calculateVolatility(daySentiments.map(d => d.price)));
        Variables.includeStockMomentum && x.push(calculateMomentum(daySentiments.map(d => d.price)));
        Variables.includePriceChange && x.push(calculateStartEndDifference(daySentiments.map(d => d.price)));

        Variables.includeVolumeVolatility && x.push(calculateVolatility(daySentiments.map(d => d.volume)));
        Variables.includeVolumeMomentum && x.push(calculateMomentum(daySentiments.map(d => d.volume)));
        Variables.includeVolumeChange && x.push(calculateStartEndDifference(daySentiments.map(d => d.volume)));

        Variables.includeSentimentVolatility && x.push(calculateVolatility(daySentiments.map(d => d.totalSentiment)));
        Variables.includeSentimentMomentum && x.push(calculateMomentum(daySentiments.map(d => d.totalSentiment)));
        Variables.includeSentimentChange && x.push(calculateSentimentChange(daySentiments.map(d => d.totalSentiment)));

        Variables.includePeRatioVolatility && x.push(calculateVolatility(daySentiments.map(d => d.calcPeRatio)));
        Variables.includePeRatioMomentum && x.push(calculateMomentum(daySentiments.map(d => d.calcPeRatio)));
        Variables.includePeRatioChange && x.push(calculateStartEndDifference(daySentiments.map(d => d.calcPeRatio)));

        Variables.includeNumTweetsVolatility && x.push(calculateVolatility(daySentiments.map(d => d.numTweets)));
        Variables.includeNumTweetsMomentum && x.push(calculateMomentum(daySentiments.map(d => d.numTweets)));
        Variables.includeNumTweetsChange && x.push(calculateStartEndDifference(daySentiments.map(d => d.numTweets)));

        Variables.includeRIndicator && x.push(calculateRIndicator(daySentiments));
        Variables.includeOnBalanceVolume && x.push(calculateOnBalanceVolume(daySentiments));

    });

    if (x.length === 0) {
        throw new Error('x needs to be at least of length 1');
    }
    return x;
}

function change(one: number, two: number) {
    return two === 0 ? 0 : (one - two) / two;
}

function calculateVolatility(numbers: number[]): number {
    let total: number = 0;
    for (let i = 1; i < numbers.length; i++) {
        const c1 = numbers[i];
        const c2 = numbers[i - 1];
        total += change(c1, c2);
    }
    return total / numbers.length;
}

function calculateMomentum(numbers: number[]): number {
    let total: number = 0;
    for (let i = 1; i < numbers.length; i++) {
        const c1 = numbers[i];
        const c2 = numbers[i - 1];
        const m = c1 === c2 ? 0 : c1 > c2 ? 1 : -1;
        total += m;
    }
    return total / numbers.length;
}

function calculateStartEndDifference(numbers: number[]): number {
    return change(numbers[0], numbers[numbers.length - 1]);
}

function calculateSentimentChange(sentiments: number[]): number {
    const first = sentiments.shift();
    const d = calculateMeanVarianceAndDeviation(sentiments);
    let val: number;
    if (first > d.mean + d.deviation) {
        val = 1;
    }
    else if (first < d.mean + d.deviation) {
        val = -1;
    }
    else {
        val = 0;
    }
    return val;
}

function calculateRIndicator(daySentiments: DaySentiment[]): number {
    const filtered = daySentiments.filter(d => !!d && !!d.fundamentals && !!d.fundamentals.high && !!d.fundamentals.low);
    if (filtered.length < 2) {
        return 0;
    }
    const highs = filtered.map(d => parseFloat(d.fundamentals.high));
    const lows = filtered.map(d => parseFloat(d.fundamentals.low));
    highs.sort((a, b) => b - a);
    lows.sort((a, b) => a - b);
    const highestHigh = highs[0];
    const lowestLow = lows[0];
    const close = daySentiments[0].price;
    const denom = highestHigh - lowestLow;
    return denom === 0 ? 0 : -100 * ((highestHigh - close) / denom);
}

function calculateOnBalanceVolume(daySentiments: DaySentiment[]): number {
    const filtered = daySentiments.filter(d => !!d && !!d.fundamentals && !!d.fundamentals.volume);
    let totalUp: number = 0;
    let totalDown: number = 0;
    for (let i = 0; i < filtered.length - 1; i++) {
        const cur = daySentiments[i];
        const last = daySentiments[i + 1];
        if (!cur || !last) {
            continue;
        }
        const curVolume = parseFloat(cur.fundamentals.volume);
        const lastVolume = parseFloat(last.fundamentals.volume);
        const change = curVolume - lastVolume;
        if (change > 0) {
            totalUp += change;
        } else {
            totalDown += change;
        }
    }
    return totalUp - totalDown;
}

function createStockHash(symbol: string): number {
    if (stockHashCache[symbol]) {
        return stockHashCache[symbol];
    }
    let value = 0;

    for (let i = 0; i < symbol.length; i++) {
        const charCode = symbol.charCodeAt(i);
        const multiplier = Math.pow(i + 1, 10) + 13;
        value += (charCode * multiplier);
    }

    stockHashCache[symbol] = value;
    return value;
}

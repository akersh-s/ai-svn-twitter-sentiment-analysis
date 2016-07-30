import * as fs from 'fs';
import * as path from 'path';
import * as async from 'async';

import {Stock} from './model/stock.model';
import {TwitterSearch} from './twitter';
import {StockTwits} from './stocktwits';
import {FileUtil} from '../shared/util/file-util';
import {DaySentiment} from './model/day-sentiment.model';
import {today} from '../shared/util/date-util';
import {debug} from '../shared/util/log-util';

const twitter = new TwitterSearch();
let results: DaySentiment[] = [];
process.on('uncaughtException', function(err) {
    console.log('Error', err);
});

run();
function run(): Promise<any> {
    console.log('Starting');
    let stocks = FileUtil.getStocks();
    const keywords = '';
    const daySentiments: DaySentiment[] = stocks.map(s => {
        const stock = new Stock(s, keywords);
        return new DaySentiment(stock, today);
    });

    return new Promise<any>((resolve, reject) => {
        Promise.all([addTweets(daySentiments), addTwits(daySentiments), addPrices(daySentiments)]).then(() => {
            processComplete(null, 0);
            resolve(1);
        }, (err) => {
            console.log(err);
            resolve(0);
        });
    });
}

async function addTweets(daySentiments: DaySentiment[]): Promise<any> {
    for (let i = 0; i < daySentiments.length; i++) {
        const daySentiment = daySentiments[i];
        debug(`Running Twitter ${daySentiment.stock.symbol} (${i} / ${daySentiments.length})`);
        try { await twitter.getTweetSentiment(daySentiment); } catch (e) { };
        processComplete(daySentiment, i);
    }
}

async function addTwits(daySentiments: DaySentiment[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        var q = async.queue((daySentiment: DaySentiment, cb) => {
            const stocktwits = new StockTwits(daySentiment.stock);
            const i = findIndex(daySentiment, daySentiments);
            debug(`Running Stocktwits ${daySentiment.stock.symbol} (${i} / ${daySentiments.length})`);
            stocktwits.processStocktwitsSentiment(daySentiment).then(() => {
                processComplete(daySentiment, i);
                cb();
            }, () => {
                processComplete(daySentiment, i);
                cb();
            });
        }, 4);

        q.push(daySentiments, () => {
            resolve();
        });
    });
}

async function addPrices(daySentiments: DaySentiment[]): Promise<any> {
    for (let i = 0; i < daySentiments.length; i++) {
        const daySentiment = daySentiments[i];
        debug(`Running Price ${daySentiment.stock.symbol} (${i} / ${daySentiments.length})`);
        try { await daySentiment.addPrice(); } catch (e) { };
        processComplete(daySentiment, i);
    }
}

function processComplete(daySentiment: DaySentiment, index: number): void {
    if (daySentiment && daySentiment.isComplete()) {
        results.push(daySentiment.deleteUnusedFields());
    }

    if (index % 10 === 0) {
        let daySentimentStingified = JSON.stringify(results, null, 4)
        fs.writeFileSync(FileUtil.resultsFileDate, daySentimentStingified, 'utf-8');
    }
}

function findIndex(daySentiment: DaySentiment, daySentiments: DaySentiment[]): number {
    for (let i = 0; i < daySentiments.length; i++) {
        if (daySentiments[i].stock.symbol === daySentiment.stock.symbol) {
            return i;
        }
    }
    return -1;
}

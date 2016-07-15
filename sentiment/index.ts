import * as fs from 'fs';
import * as path from 'path';

import {Stock} from './model/stock.model';
import {TwitterSearch} from './twitter';
import {StockTwits} from './stocktwits';
import {FileUtil} from '../shared/util/file-util';
import {DaySentiment} from './model/day-sentiment.model';
import {today} from '../shared/util/date-util';

let stocks = fs.readFileSync(path.join(__dirname, '/stocks'), 'utf-8').trim().split(/[\n\r]+/g);
let i = 0;
const twitter = new TwitterSearch();

process.on('uncaughtException', function (err) {
    console.log('Error', err);
    run();
});

run();
async function run(): Promise<any> {
    console.log('Starting');
    let keywords = '';
    while (i < stocks.length) {
        let symbol = stocks[i++];
        console.log(`Running ${symbol} (${i} / ${stocks.length})`);
        let stock = new Stock(symbol, keywords);
        try {
            await getDaySentiment(stock);
        }
        catch (e) {
            console.log(`Failed to get Day Sentiment for ${stock}.`);
        }
    }
    return;
}

function getDaySentiment(stock: Stock): Promise<any> {
    
    let stocktwits = new StockTwits(stock);
    let daySentiment = new DaySentiment(stock, today);
    return new Promise<any>((resolve, reject) => {
        try {
            Promise.all([twitter.getTweetSentiment(daySentiment), stocktwits.processStocktwitsSentiment(daySentiment), daySentiment.addPrice()]).then(() => {
                let results: DaySentiment[] = [];
                if (fs.existsSync(FileUtil.resultsFile)) {
                    results = JSON.parse(fs.readFileSync(FileUtil.resultsFile, 'utf-8'));
                }
                results.push(daySentiment);
                let daySentimentStingified = JSON.stringify(results, null, 4)
                fs.writeFileSync(FileUtil.resultsFile, daySentimentStingified, 'utf-8');
                fs.writeFileSync(FileUtil.resultsFileDate, daySentimentStingified, 'utf-8');
                resolve(1);
            }, (err) => {
                console.log(err);
                resolve(0);
            });
        }
        catch (e) {
            console.log(e);
            reject();
        }

    });
}


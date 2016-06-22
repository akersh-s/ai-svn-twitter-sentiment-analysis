import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';

import {Stock} from './model/stock.model';
import {TwitterSearch} from './twitter';
import {StockTwits} from './stocktwits';
import {FileUtil} from '../shared/util/file-util';
import {DaySentiment} from './model/day-sentiment.model';
import {today} from '../shared/util/date-util';


let argv = yargs.argv;
let symbol = argv.symbol;
let keywords = argv.keywords || ''

if (!symbol) {
    throw 'Please specify a stock tag.';
}

let stock = new Stock(symbol, keywords);
getDaySentiment(stock);

function getDaySentiment(stock: Stock) {
    let twitter = new TwitterSearch(stock);
    let stocktwits = new StockTwits(stock);
    let daySentiment = new DaySentiment(stock, today);

    Promise.all([twitter.getTweets(daySentiment), stocktwits.processStocktwitsSentiment(daySentiment), daySentiment.addPrice()]).then(() => {
        let results:DaySentiment[] = [];
        if (fs.existsSync(FileUtil.resultsFile)) {
            results = JSON.parse(fs.readFileSync(FileUtil.resultsFile, 'utf-8'));
        }
        results.push(daySentiment);
        let daySentimentStingified = JSON.stringify(results, null, 4)
        fs.writeFileSync(FileUtil.resultsFile, daySentimentStingified, 'utf-8');
        fs.writeFileSync(FileUtil.resultsFileDate, daySentimentStingified, 'utf-8');
    });
}


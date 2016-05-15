import {Stock, IResult} from './stock.model';
import {TwitterSearch} from './twitter';
import {getLast3Days} from './util/date-util';
import {debug} from './util/log-util';
import {Status} from './twitter/search.model';
import {DaySentiment, determineBuyOrSell, StockAction} from './twitter/day-sentiment';
import {formatDate, getUntilDate, today} from './util/date-util';
import {StockTwits} from './stocktwits';
import * as async from 'async';
import * as path from 'path';
import * as fs from 'fs';
let projectRoot = path.join(__dirname, '..');
let data = path.join(projectRoot, 'cache');
if (!fs.existsSync(data)) {
    fs.mkdirSync(data);
}

export function determineActionForStock(stock: Stock, cb: Function) {
    let twitter = new TwitterSearch(stock);
    let stocktwits = new StockTwits(stock);

    let days = getLast3Days();
    let asyncFuncs = [];
    days.forEach((day) => {
        asyncFuncs.push((done) => {

            let formattedDate = formatDate(day);
            let isToday = formattedDate === formatDate(today);
            let stockCacheName = getStockCacheName(stock);
            let daySentiment = new DaySentiment(day);
            var data: any;
            if (fs.existsSync(stockCacheName)) {
                debug(`Reading ${stockCacheName}`);
                data = JSON.parse(fs.readFileSync(stockCacheName, 'utf-8'));
            }
            else {
                data = {};
            }
            async.parallel([scrapeDone => {
                stocktwits.processStocktwitsSentimentForDay(day, daySentiment, scrapeDone);
            }, scrapeDone => {
                //Twitter scraping

                //See if it is cached.
                if (!isToday && data[formattedDate]) {

                    let dayData = data[formattedDate];
                    daySentiment.totalSentiment += dayData.totalSentiment;
                    daySentiment.numTweets += dayData.numTweets;
                    return scrapeDone(null, daySentiment);
                }
                twitter.getTweets(day, daySentiment, (err, daySentiment: DaySentiment) => {
                    if (err) {
                        return scrapeDone(err);
                    }
                    data[formattedDate] = daySentiment;
                    debug(`Writing ${stockCacheName}`);
                    fs.writeFileSync(stockCacheName, JSON.stringify(data, null, 4), 'utf-8');
                    return scrapeDone(null, daySentiment);
                });
            }], () => {
                done(null, daySentiment);
            })

        });

    });

    async.series(asyncFuncs, (err, daySentiments: DaySentiment[]) => {
        if (err) throw err;
        let stockAction: StockAction = determineBuyOrSell(stock, daySentiments);
        cb(err, stockAction);
    });
}

function getStockCacheName(stock: Stock): string {
    let symbol = stock.symbol.replace(/\$/, '').toUpperCase();
    let stockCacheName = path.join(data, `${symbol}.json`);
    return stockCacheName;
}
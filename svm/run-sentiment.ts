import * as fs from 'fs';
import * as async from 'async';
import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';
import {Stock} from '../sentiment-search/stock.model';
import {runSentiment, SvmResult} from './index';
import {tomorrow} from '../sentiment-search/util/date-util'
import {getLastNPrices, YahooQueryResult} from '../shared/yahoo-price';

let stockActions: StockAction[] = JSON.parse(fs.readFileSync(__dirname + '/../shared/results.json', 'utf-8')).map(s => {
    let stock = new Stock(s.stock.symbol, s.stock.keywords);
    let stockAction = new StockAction(stock, s.action, s.percentChange, s.numTweets, s.daySentiments);
    return stockAction;
});

runSentiment(stockActions, true).then((svmResults: SvmResult[]) => {
    calculateIncreasePercent(svmResults);
});

function calculateIncreasePercent(svmResults: SvmResult[]) {
    let asyncFuncs = [];

    svmResults.forEach(svmResult => {
        if (svmResult.value === 1) {
            console.log('Buy ' + svmResult.prediction.symbol);
            asyncFuncs.push(done => {
                let symbol = svmResult.prediction.symbol.replace(/\$/, '');

                getLastNPrices(symbol, tomorrow, 1, true).then((results: YahooQueryResult[]) => {
                    let tomorrowsPrice = parseFloat(results[0].Close);
                    let todaysPrice = parseFloat(svmResult.prediction.results[0].Close);
                    let increase = tomorrowsPrice - todaysPrice;
                    let increasePercent = (increase / todaysPrice) * 100;
                    done(null, increasePercent)
                });
            });
        }

    });

    async.series(asyncFuncs, (err, increasePercents: number[]) => {
        let total = 0;
        increasePercents.forEach(i => total += i);
        let average = total / increasePercents.length;

        console.log('Average: ' + average);
    });
}

import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';
import {getLastNPrices, YahooQueryResult} from '../shared/yahoo-price';
import {today} from '../sentiment-search/util/date-util';
import * as async from 'async';
let ml = require('machine_learning');
export function runSentiment(stockActions: StockAction[]) {
    let x = [];
    let y = [];
    let predictions: Prediction[] = [];
    let asyncFuncs = [];
    stockActions.forEach(stockAction => {
        asyncFuncs.push(done => {
            processStockAction(stockAction, x, y, predictions).then(() => {
                done();
            });
        });
    });
    async.series(asyncFuncs, () => {
        var svm = new ml.SVM({
            x: x,
            y: y
        });

        svm.train({
            C: 1.1, // default : 1.0. C in SVM.
            tol: 1e-5, // default : 1e-4. Higher tolerance --> Higher precision
            max_passes: 20, // default : 20. Higher max_passes --> Higher precision
            alpha_tol: 1e-5, // default : 1e-5. Higher alpha_tolerance --> Higher precision

            kernel: { type: "polynomial", c: 1, d: 5 }
        });

        predictions.forEach(prediction => {
            console.log(`Prediction for ${prediction.symbol}: ${svm.predict(prediction.data)}`);
        });
    });
}

async function processStockAction(stockAction: StockAction, x: any, y: number[], predictions: Prediction[]) {
    let symbol = stockAction.stock.getSymbolNoDollar();
    let results: YahooQueryResult[] = await getLastNPrices(symbol, today, 4);
    let closePrices = results.map(result => {
        return parseFloat(result.Close);
    });
    if (closePrices.length < 4) {
        return;
    }
    let todaysClose = closePrices[0];
    let previousClose = closePrices[1];
    let sentiments = stockAction.daySentiments.map(daySentiment => {
        return daySentiment.totalSentiment;
    });
    let isBuy = stockAction.action === Action.Buy;
    let isMinimumTweets = stockAction.numTweets > 40;
    if (isBuy && isMinimumTweets) {
        predictions.push(new Prediction(stockAction.stock.symbol, [todaysClose, previousClose, closePrices[2], sentiments[3], sentiments[2], sentiments[1]]));
    }
    x.push([previousClose, closePrices[2], closePrices[3], sentiments[2], sentiments[1], sentiments[0]]);
    const increasePercent = ((todaysClose - previousClose) / previousClose) * 100;
    const action = increasePercent > 3 ? 1 : -1;
    y.push(action);
}

class Prediction {
    constructor(public symbol: string, public data: any) { }
}
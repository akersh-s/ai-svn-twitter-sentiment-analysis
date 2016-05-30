import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';
import {getLastNPrices, YahooQueryResult} from '../shared/yahoo-price';
import {today} from '../sentiment-search/util/date-util';
import {normalize} from './normalize';
import * as async from 'async';
let ml = require('machine_learning');
export function runSentiment(stockActions: StockAction[], allowCache?: boolean): Promise<SvmResult[]> {
    let x = [];
    let y = [];
    let predictions: Prediction[] = [];
    let asyncFuncs = [];
    stockActions.forEach(stockAction => {
        asyncFuncs.push(done => {
            processStockAction(stockAction, x, y, predictions, allowCache).then(() => {
                done();
            });
        });
    });
    return new Promise<SvmResult[]>((resolve, reject) => {
        async.series(asyncFuncs, () => {
            
            var normalized = normalize(x, predictions);
            x = normalized.x;
            predictions = normalized.predictions;
            console.log(x);
            var svm = new ml.SVM({
                x: x,
                y: y
            });

            svm.train({
                C: 1.0, // default : 1.0. C in SVM.
                tol: 1e-2, // default : 1e-4. Higher tolerance --> Higher precision
                max_passes: 200, // default : 20. Higher max_passes --> Higher precision
                alpha_tol: 1e-3, // default : 1e-5. Higher alpha_tolerance --> Higher precision

                //kernel: { type: "polynomial", c: 1, d: 5 }
                kernel: { type: "gaussian", sigma: 1 }
                //kernel: {type : "linear"}
            });
            let svmResults: SvmResult[] = [];
            predictions.forEach(prediction => {
                let p = svm.predict(prediction.data);
                console.log(`Prediction for ${prediction.symbol}: ${p}`);
                svmResults.push(new SvmResult(prediction, p));
            });
            resolve(svmResults);
        });
    });
}

async function processStockAction(stockAction: StockAction, x: any, y: number[], predictions: Prediction[], allowCache?: boolean) {
    let symbol = stockAction.stock.getSymbolNoDollar();
    let results: YahooQueryResult[] = await getLastNPrices(symbol, today, 4, allowCache);
    if (results.length < 4) {
        return;
    }
    let todaysHigh:number = parseFloat(results[0].High);
    let previousHigh:number = parseFloat(results[1].High);
    
    let todaysLow:number = parseFloat(results[0].Low);
    let previousLow:number = parseFloat(results[1].Low);
    
    let todaysClose:number = parseFloat(results[0].Close);
    let previousClose:number = parseFloat(results[1].Close);
    let p2Close:number = parseFloat(results[2].Close);
    let p3Close:number = parseFloat(results[3].Close);
    let sentiments = stockAction.daySentiments.map(daySentiment => {
        return daySentiment.totalSentiment;
    });
    let counts = stockAction.daySentiments.map(daySentiment => {
        return daySentiment.numTweets;
    });
    

    const increasePercent = ((todaysClose - previousClose) / previousClose) * 100;
    const action = increasePercent > 0 ? 1 : -1;
    if (increasePercent > 1 ) {
        console.log (`${symbol} increased ${increasePercent}`);
    }
    var xLine = []; var pLine = [];
    
    xLine.push(previousClose);  pLine.push(todaysClose);
    //xLine.push(p2Close); pLine.push(previousClose);
    //xLine.push(p3Close); pLine.push(p2Close);
    xLine.push(sentiments[2]);  pLine.push(sentiments[3]);
    //xLine.push(sentiments[1]);  pLine.push(sentiments[2]);
    //xLine.push(sentiments[0]);  pLine.push(sentiments[1]);
    xLine.push(previousHigh); pLine.push(todaysHigh);
    xLine.push(previousLow); pLine.push(todaysLow);

    
    x.push(xLine);
    y.push(action);
   //if (stockAction.action === Action.Buy) {
        predictions.push(new Prediction(stockAction.stock.symbol, results, pLine));    
    //}
}

export class Prediction {
    constructor(public symbol: string, public results: YahooQueryResult[], public data: number[]) { }
}

export class SvmResult {
    constructor(public prediction: Prediction, public value: number) {

    }
}

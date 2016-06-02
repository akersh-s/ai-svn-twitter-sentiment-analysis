import * as fs from 'fs';
import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';
import {getLastNPrices, YahooQueryResult} from '../shared/yahoo-price';
import {today} from '../sentiment-search/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';

import * as async from 'async';
let ml = require('machine_learning');
export function runSentiment(stockActions: StockAction[], allowCache?: boolean): SvmResult[] {
    let svmData = getSvmData();
    let predictions: Prediction[] = getPredictions(stockActions);
    let normalized = normalize(svmData.x, predictions);
    predictions = normalized.predictions;
    let svm = new ml.SVM({
        x: normalized.x,
        y: svmData.y
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
        let action = p === 1 ? 'Buy' : 'Do Nothing';
        console.log(`Prediction for ${prediction.symbol}: ${action} (${p})`);
        svmResults.push(new SvmResult(prediction, p));
    });
    
    return svmResults;
}

export class SvmResult {
    constructor(public prediction: Prediction, public value: number) {

    }
}

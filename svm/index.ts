import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {today} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';

import * as async from 'async';
let ml = require('machine_learning');
export function runSentiment(daySentiments: DaySentiment[], priceThreshold: number, C: number, tol: number, alpha_tol: number, c: number, d: number): SvmResult[] {
    let svmData = getSvmData(priceThreshold);
    let predictions: Prediction[] = getPredictions(daySentiments);
    let normalized = normalize(svmData.x, predictions);
    predictions = normalized.predictions;
    let svm = new ml.SVM({
        x: normalized.x,
        y: svmData.y
    });
    svm.train({
        C: C, // default : 1.0. C in SVM.
        tol: tol, // default : 1e-4. Higher tolerance --> Higher precision
        max_passes: 20, // default : 20. Higher max_passes --> Higher precision
        alpha_tol: alpha_tol, // default : 1e-5. Higher alpha_tolerance --> Higher precision

        kernel: { type: "polynomial", c: c, d: d }
        //kernel: { type: "gaussian", sigma: 1e5 }
        //kernel: {type : "linear"}
    });

    let svmResults: SvmResult[] = [];
    predictions.forEach(prediction => {
        let p = svm.predict(prediction.data);
        if (p === 1) {
            console.log(`SVM - Buy ${prediction.symbol}`);
            svmResults.push(new SvmResult(prediction, p));    
        }
    });
    
    return svmResults;
}

export class SvmResult {
    constructor(public prediction: Prediction, public value: number) {

    }
}

import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {today} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';

import * as async from 'async';
let ml = require('machine_learning');
let svm = require('svm');

export function runSentiment(daySentiments: DaySentiment[], priceThreshold: number): SvmResult[] {
    let svmData = getSvmData(priceThreshold);
    let predictions: Prediction[] = getPredictions(daySentiments);
    console.log('Predictions: ' + predictions.length);
    let normalized = normalize(svmData.x, predictions);
    predictions = normalized.predictions;
    let svmResults: SvmResult[] = [];

    /*
    let svm = new ml.SVM({
        x: normalized.x,
        y: svmData.y
    });
    let trainMetadata = {
        C: 1.0, // default : 1.0. C in SVM.
        tol: 1e-6, // default : 1e-4. Higher tolerance --> Higher precision
        max_passes: 20, // default : 20. Higher max_passes --> Higher precision
        alpha_tol: 1e-7, // default : 1e-5. Higher alpha_tolerance --> Higher precision

        kernel: { type: "polynomial", c: 1, d: 5 }
        //kernel: { type: "gaussian", sigma: 1e5 }
        //kernel: {type : "linear"}
    };
    svm.train(trainMetadata);

    
    predictions.forEach(prediction => {
        let p = svm.f(prediction.data);
        console.log('Result - ' + prediction.symbol, p);
        p = svm.predict(prediction.data);
        if (p === 1) {
            console.log(`SVM - Buy ${prediction.symbol}`);
            svmResults.push(new SvmResult(prediction, p));    
        }
    });
    console.log(JSON.stringify(trainMetadata, null, 4))*/

    console.log('Running SVM...');
    let SVM = new svm.SVM();
    SVM.train(normalized.x, svmData.y)
    predictions.forEach(prediction => {
        let p = SVM.predictOne(prediction.data);
        console.log('Result - ' + prediction.symbol, p);
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

function formatData(svmData, normalized): number[][] {
    var i;
    let formatted = [];
    for (i = 0; i < svmData.y; i++) {
        formatted.push(svmData.y[i], normalized.x[i]);
    }
    return formatted;
}
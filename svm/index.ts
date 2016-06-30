import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {today, yesterday, formatDate} from '../shared/util/date-util';
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

    console.log('Running SVM...');
    let SVM = new svm.SVM();
    SVM.train(normalized.x, svmData.y, { kernel: 'rbf', rbfsigma: 5e-2, C: 1.0 })
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
    constructor(public prediction: Prediction, public value: number) {}
}

function formatData(svmData, normalized): number[][] {
    var i;
    let formatted = [];
    for (i = 0; i < svmData.y; i++) {
        formatted.push(svmData.y[i], normalized.x[i]);
    }
    return formatted;
}
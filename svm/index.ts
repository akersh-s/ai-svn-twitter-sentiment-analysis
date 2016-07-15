import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {Variables} from '../shared/variables';
import {today, yesterday, formatDate} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';

import * as async from 'async';
let ml = require('machine_learning');
let svm = require('svm');

export function runSentiment(daySentiments: DaySentiment[]): SvmResult[] {
    let svmResults: SvmResult[] = [];
    let predictions: Prediction[] = getPredictions(daySentiments);
    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    const svm = new ml.SVM(collectSvmParams(daySentiments, predictions));

    console.log('Running SVM...');
    svm.train({
        C: Variables.C,
        max_passes: 50,
        kernel: { type: 'gaussian', sigma: Variables.rbfsigma }
    });

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
    constructor(public prediction: Prediction, public value: number) { }
}

function formatData(svmData, normalized): number[][] {
    var i;
    let formatted = [];
    for (i = 0; i < svmData.y; i++) {
        formatted.push(svmData.y[i], normalized.x[i]);
    }
    return formatted;
}

function collectSvmParams(daySentiments: DaySentiment[], predictions: Prediction[]): { x: number[], y: number[] } {
    let svmData = getSvmData();

    let normalized = normalize(svmData.x, predictions);
    predictions = normalized.predictions;

    if (normalized.x.length === 0 || svmData.y.length === 0 || predictions.length === 0) {
        console.log('No data to run SVM...');
        throw new Error('No data to run SVM...');
    }

    return {
        x: normalized.x,
        y: svmData.y
    };
}

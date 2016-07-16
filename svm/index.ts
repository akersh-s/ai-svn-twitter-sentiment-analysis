import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {Variables} from '../shared/variables';
import {today, formatDate} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';

import * as async from 'async';
//let ml = require('machine_learning');
//let svm = require('svm');
var svm = require('node-svm');

export async function runSentiment(daySentiments: DaySentiment[]): Promise<SvmResult[]> {
    let svmResults: SvmResult[] = [];
    let predictions: Prediction[] = await getPredictions(daySentiments);
    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    const clf = new svm.SVM({
        svmType: Variables.svmType,
        c: [0.03125, 0.125, 0.5, 2, 8],

        // kernels parameters 
        kernelType: Variables.kernelType,
        gamma: [0.03125, 0.125, 0.5, 2, 8],

        // training options 
        kFold: 4,
        normalize: true,
        reduce: true,
        retainedVariance: 0.99,
        eps: 1e-3,
        cacheSize: 200,
        shrinking: true,
        probability: false
    });
    let svmParams = await collectSvmParams(daySentiments, predictions);
    return new Promise<SvmResult[]>((resolve, reject) => {
        console.log('Running SVM...');
        clf
            .train(svmParams)
            .progress(function (rate) {
                console.log(rate);
            }).done(function () {
                // predict things 
                predictions.forEach(function (prediction) {
                    let p = clf.predictSync(prediction.data);
                    if (p === 1) {
                        console.log(`SVM - Buy ${prediction.symbol}`);
                        svmResults.push(new SvmResult(prediction, p));
                    }
                });
                resolve(svmResults);
            });;
    });



    //const svm = new ml.SVM(await collectSvmParams(daySentiments, predictions));
    /*svm.train({
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
    return svmResults;*/
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

async function collectSvmParams(daySentiments: DaySentiment[], predictions: Prediction[]): Promise<any[]> {
    let svmData = await getSvmData();

    let normalized = normalize(svmData.x, predictions);
    predictions = normalized.predictions;

    if (normalized.x.length === 0 || svmData.y.length === 0 || predictions.length === 0) {
        console.log('No data to run SVM...');
        throw new Error('No data to run SVM...');
    }

    const formatted = [];
    for (let i = 0; i < normalized.x.length; i++) {
        formatted.push([normalized.x[i], svmData.y[i]]);
    }
    return formatted;
}

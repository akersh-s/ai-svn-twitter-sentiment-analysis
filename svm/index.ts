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

export async function runSentiment(daySentiments: DaySentiment[], minIncrease: number): Promise<SvmResult[]> {
    let svmResults: SvmResult[] = [];
    let predictions: Prediction[] = await getPredictions(daySentiments);
    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    const clf = new svm.SVM({
        svmType: Variables.svmType,
        c: [0.03125, 0.125, 0.5, 1, 2, 8],

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
        probability: true
    });
    let svmParams = await collectSvmParams(daySentiments, minIncrease);
    return new Promise<SvmResult[]>((resolve, reject) => {
        console.log('Running SVM...');
        clf
            .train(svmParams)
            .progress(function (rate) {
                console.log(rate);
            }).done(function () {
                // predict things 
                predictions.forEach(function (prediction) {
                    let probRes = clf.predictProbabilitiesSync(prediction.data);
                    let p = clf.predictSync(prediction.data);
                    if (p === 1 && probRes[1] > probRes[0]) {
                        console.log(`SVM - Buy ${prediction.symbol} ${JSON.stringify(probRes)}`);
                        svmResults.push(new SvmResult(prediction, p, probRes[1]));
                    }
                });

                svmResults = svmResults.sort((b, a) => {
                    return b.probability - a.probability;
                }).filter((value, index) => {
                    return index < 20;
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
    constructor(public prediction: Prediction, public value: number, public probability: number) { }
}

function formatData(svmData, normalized): number[][] {
    var i;
    let formatted = [];
    for (i = 0; i < svmData.y; i++) {
        formatted.push(svmData.y[i], normalized.x[i]);
    }
    return formatted;
}

async function collectSvmParams(daySentiments: DaySentiment[], minIncrease: number): Promise<any[]> {
    let svmData = await getSvmData(minIncrease);

    //let normalized = normalize(svmData.x, predictions);
    //predictions = normalized.predictions;

    if (svmData.x.length === 0 || svmData.y.length === 0) {
        console.log('No data to run SVM...');
        throw new Error('No data to run SVM...');
    }

    const formatted = [];
    for (let i = 0; i < svmData.x.length; i++) {
        formatted.push([svmData.x[i], svmData.y[i]]);
    }
    return formatted;
}

import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {Variables} from '../shared/variables';
import {today, formatDate} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';

import * as async from 'async';

const svm = require('node-svm');
const isWin = process.platform === 'win32';

export async function formatSentiment(): Promise<any> {
    let daySentiments: DaySentiment[] = DaySentiment.parseArrayFromFile(FileUtil.resultsFileDate);
    let startTime = Date.now();
    let predictions: Prediction[] = await getPredictions(daySentiments);
    console.log(`Prediction run time: ${Math.ceil((Date.now() - startTime) / 1000)}s`);
    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    fs.writeFileSync(FileUtil.predictionData, JSON.stringify(predictions), 'utf-8');

    const svmParams = await collectSvmParams(daySentiments);
    fs.writeFileSync(FileUtil.svmData, JSON.stringify(svmParams), 'utf-8');
}

export async function runSentiment(): Promise<SvmResult[]> {
    let svmResults: SvmResult[] = [];
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

    return new Promise<SvmResult[]>((resolve, reject) => {
        const startDate = new Date();
        console.log('Running SVM...', startDate);
        /*let ProgressBar = require('progress');
        let lastTick: number = 0;
        let bar = new ProgressBar('  SVM [:bar] :percent, ETA :etas, Elapsed :elapsed', {
            complete: '=',
            incomplete: ' ',
            width: 30,
            total: 1
        });*/
        clf
            .train(getSvmDataFromFile())
            .progress((rate: number) => {
                let secondsGoneBy = Math.floor((Date.now() - +startDate) / 1000);
                console.log(`Progress: ${rate} after ${secondsGoneBy}s`);
                //bar.tick(rate - lastTick);
                //lastTick = rate;
            }).done(() => {
                const predictions = getPredictionsFromFile();
                // predict things 
                predictions.forEach((prediction) => {
                    let probRes = clf.predictProbabilitiesSync(prediction.data);
                    let p = clf.predictSync(prediction.data);
                    console.log(probRes, p, typeof p);
                    svmResults.push(new SvmResult(prediction, p, calculatePredictedIncrease(probRes)));
                });

                svmResults = svmResults.sort((a, b) => {
                    return b.probability - a.probability;
                }).filter((value, index) => {
                    return index < 5 && value.probability > 2;
                });

                resolve(svmResults);
            });;
    });
}
function getSvmDataFromFile(): any[] {
    return JSON.parse(fs.readFileSync(FileUtil.svmData, 'utf-8'));
}

function getPredictionsFromFile(): Prediction[] {
    return JSON.parse(fs.readFileSync(FileUtil.predictionData, 'utf-8'));
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

async function collectSvmParams(daySentiments: DaySentiment[]): Promise<any[]> {
    let startTime = Date.now();
    let svmData = await getSvmData();
    console.log(`SVM Data collection run time: ${Math.ceil((Date.now() - startTime) / 1000)}s`);

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

function calculatePredictedIncrease(probRes: any): number {
    let predictedIncrease = 0;
    for (let key in probRes) {
        let possibleIncreasePercent = parseFloat(key);
        let probabilityOf = probRes[key];
        predictedIncrease += (possibleIncreasePercent * probabilityOf);
    }
    return predictedIncrease;
}
import * as fs from 'fs';
import * as async from 'async';

import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {Variables} from '../shared/variables';
import {today, formatDate} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';
import {SvmResult} from './svm-result';

const svm = require('node-svm');
const isWin = process.platform === 'win32';

export async function formatSentiment(): Promise<any> {
    const svmParams = await collectSvmParams();
    fs.writeFileSync(FileUtil.svmData, JSON.stringify(svmParams), 'utf-8');
}

export function runSvm(): Promise<any> {
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
        cacheSize: 10 * 1000, // 10 GB (WTF!!!)
        shrinking: true,
        probability: true
    });

    return new Promise<any>((resolve, reject) => {
        const startDate = new Date();
        console.log('Running SVM...', startDate);
        clf
            .train(getSvmDataFromFile())
            .progress((rate: number) => {
                const hoursGoneBy = (Date.now() - +startDate) / (1000 * 60 * 60);
                const totalTimeInHours = (1 / rate) * hoursGoneBy;
                const hoursRemaining = totalTimeInHours - hoursGoneBy;
                console.log(`Progress: ${rate} after ${hoursGoneBy}h, Time remaining: ${hoursRemaining}h, Total time: ${totalTimeInHours}h`);
            }).spread((trainedModel, trainingReport) => {
                
                fs.writeFileSync(FileUtil.svmModelFile, JSON.stringify(trainedModel), 'utf-8');
                console.log('Completed!');
                process.exit(0);
                resolve({});
            });
    });
}
function getSvmDataFromFile(): any[] {
    return JSON.parse(fs.readFileSync(FileUtil.svmData, 'utf-8'));
}

function getPredictionsFromFile(): Prediction[] {
    return JSON.parse(fs.readFileSync(FileUtil.predictionData, 'utf-8'));
}

function formatData(svmData, normalized): number[][] {
    var i;
    let formatted = [];
    for (i = 0; i < svmData.y; i++) {
        formatted.push(svmData.y[i], normalized.x[i]);
    }
    return formatted;
}

async function collectSvmParams(): Promise<any[]> {
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

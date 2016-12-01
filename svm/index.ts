import * as fs from 'fs';

import {Variables} from '../shared/variables';
import {FileUtil} from '../shared/util/file-util';
import {getSvmData} from './svm-data-formatter';

const svm = require('node-svm');

export async function formatSentiment(): Promise<any> {
    //Add more data
    FileUtil.lastResultsFiles = FileUtil.collectLastResultFiles(70);
    const svmParams = await collectSvmParams();
    fs.writeFileSync(FileUtil.svmData, JSON.stringify(svmParams), 'utf-8');
}

export function runSvm(): Promise<any> {
    const clf = new svm.SVM({
        svmType: Variables.svmType,

        // kernels parameters 
        kernelType: Variables.kernelType,

        // training options
        eps: Variables.eps, 
        kFold: Variables.kFold,
        normalize: Variables.normalize,
        reduce: Variables.reduce,
        retainedVariance: Variables.retainedVariance,
        cacheSize: 10 * 1000, // 10 GB (WTF!!!)
        shrinking: Variables.shrinking,
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
    console.log(FileUtil.svmData, fs.existsSync(FileUtil.svmData));
    return JSON.parse(fs.readFileSync(FileUtil.svmData, 'utf-8'));
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

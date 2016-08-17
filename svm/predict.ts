import * as fs from 'fs';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {Variables} from '../shared/variables';
import {today, formatDate} from '../shared/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {normalize} from './normalize';
import {getSvmData, getPredictions} from './svm-data-formatter';
import {Prediction} from './prediction.model';
import {SvmResult} from './';

import * as async from 'async';

const svm = require('node-svm');

export async function predict(): Promise<SvmResult[]> {
    let svmResults: SvmResult[] = [];
    let svmData = JSON.parse(fs.readFileSync(FileUtil.svmModelFile, 'utf-8'));
    let clf = svm.restore(svmData);
    let daySentiments: DaySentiment[] = DaySentiment.parseArrayFromFile(FileUtil.resultsFileDate);
    let startTime = Date.now();
    let predictions: Prediction[] = await getPredictions(daySentiments);
    console.log(`Prediction run time: ${Math.ceil((Date.now() - startTime) / 1000)}s`);
    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    //const predictions = getPredictionsFromFile();
    // predict things 
    predictions.forEach((prediction) => {
        let probRes = clf.predictProbabilitiesSync(prediction.data);
        let p = clf.predictSync(prediction.data);
        svmResults.push(new SvmResult(prediction, p, calculatePredictedIncrease(probRes)));
    });

    svmResults = svmResults.sort((a, b) => {
        return b.probability - a.probability;
    }).filter((value, index) => {
        return index < 5 && value.probability > 2;
    });

    return svmResults;
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
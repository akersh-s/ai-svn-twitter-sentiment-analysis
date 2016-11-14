import * as fs from 'fs';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';
import { FileUtil } from '../shared/util/file-util';
import { getPredictions } from './svm-data-formatter';
import { Prediction } from './prediction.model';
import { SvmResult } from './svm-result';
import { Variables } from '../shared/variables';

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

    // Make predictions
    try {
        predictions.forEach((prediction) => {
            let probRes = clf.predictProbabilitiesSync(prediction.data);
            let p = clf.predictSync(prediction.data);
            svmResults.push(new SvmResult(prediction, p, probRes['1']));
        });

        svmResults = svmResults.sort((a: SvmResult, b: SvmResult) => {
            return b.probability - a.probability;
        }).filter((value: SvmResult, index: number) => {
            return index < Variables.topNumToBuy && value.probability > 0;
        });
    }
    catch (e) {
        console.log(e);
        throw e;
    }

    return svmResults;
}

import * as fs from 'fs';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';
import { FileUtil } from '../shared/util/file-util';
import { getPredictions } from './svm-data-formatter';
import { Prediction } from './prediction.model';
import { SvmResult } from './svm-result';
import { Variables } from '../shared/variables';

import { AppMachineLearning } from '../aws/app-machine-learning';
//const svm = require('node-svm');

export async function predict(): Promise<SvmResult[]> {
    //const ml = new AppMachineLearning();
    //let svmData = JSON.parse(fs.readFileSync(FileUtil.svmModelFile, 'utf-8'));
    //let clf = svm.restore(svmData);
    let daySentiments: DaySentiment[] = DaySentiment.parseArrayFromFile(FileUtil.resultsFileDate);

    let predictions: Prediction[] = await getPredictions(daySentiments);

    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    const svmResults: SvmResult[] = predictions.map(p => new SvmResult(p, 1, 1))

    console.log(`Matches (${svmResults.length}): ` + svmResults.map(s => s.prediction.symbol).join(','));

    return svmResults;
}

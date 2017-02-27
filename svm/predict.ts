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
    const ml = new AppMachineLearning();
    let svmResults: SvmResult[] = [];
    //let svmData = JSON.parse(fs.readFileSync(FileUtil.svmModelFile, 'utf-8'));
    //let clf = svm.restore(svmData);
    let daySentiments: DaySentiment[] = DaySentiment.parseArrayFromFile(FileUtil.resultsFileDate);
    let startTime = Date.now();
    let predictions: Prediction[] = await getPredictions(daySentiments);
    console.log(`Prediction run time: ${Math.ceil((Date.now() - startTime) / 1000)}s`);
    if (predictions.length === 0) {
        throw new Error('There is nothing to predict.');
    }
    await ml.waitForRealtimeEndpoint();
    // Make predictions
    try {
        for (let i = 0; i < predictions.length; i++) {
            const prediction = predictions[i];
            const record: any = {};
            //$VIOO,-0.003772101564279084,-0.3333333333333333,0.16418214496387837,-0.06666666666666667,0
            prediction.data.forEach((d, j) => {
                record[`Var${j + 1}`] = d + '';
            });
            try {
                const res = await ml.predict(record);
                console.log(res);
                const probability = res.Prediction.predictedScores[1] ? res.Prediction.predictedScores['1'] : 1 - res.Prediction.predictedScores['0'];
                svmResults.push(new SvmResult(prediction, parseFloat(res.Prediction.predictedLabel), probability));
            }
            catch (e) {
                console.error(e);
            }
        }

        /*predictions.forEach((prediction) => {
            let probRes = clf.predictProbabilitiesSync(prediction.data);
            let p = clf.predictSync(prediction.data);
            svmResults.push(new SvmResult(prediction, p, probRes['1']));
        });*/
        console.log(`Svm Results Length: ${svmResults.length}`, `Svm Results with value 1: ${svmResults.filter(v => v.value === 1).length}`, `Svm Results with value 0: ${svmResults.filter(v => v.value === 0).length}`);
        svmResults = svmResults.sort((a: SvmResult, b: SvmResult) => {
            return b.probability - a.probability;
        }).filter(v => v.value === 1).filter((value: SvmResult, index: number) => {
            return index < Variables.topNumToBuy && value.probability > 0;
        });
    }
    catch (e) {
        console.log(e);
        await ml.deleteRealtimeEndpoint();
        throw e;
    }
    await ml.deleteRealtimeEndpoint();

    return svmResults;
}

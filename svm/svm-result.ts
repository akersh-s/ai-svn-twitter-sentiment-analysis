import * as fs from 'fs';

import {Prediction} from './prediction.model';

export class SvmResult {
    constructor(public prediction: Prediction, public value: number, public probability: number) { }

    static readArrayFromFile(f: string): SvmResult[] {
        const arr: any[] = JSON.parse(fs.readFileSync(f, 'utf-8'));
        const svmResults: SvmResult[] = [];
        arr.forEach(item => {
            const prediction = new Prediction(item.prediction.symbol, item.prediction.data);
            svmResults.push(new SvmResult(prediction, item.value, item.probability));
        });
        return svmResults;
    }
}
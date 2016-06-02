'use strict';
import {Prediction} from './prediction.model';
export function normalize(x: number[][], predictions: Prediction[]) {
    const highest = JSON.parse(JSON.stringify(x[0]));
    const lowest = JSON.parse(JSON.stringify(x[0]));
    const predictionData = predictions.map(p => {
        return p.data;
    })
    const together = x.concat(predictionData);
    together.forEach(grouping => {
        grouping.forEach((num: number, index: number) => {
            highest[index] = Math.max(num, highest[index]);
            lowest[index] = Math.min(num, lowest[index]);
        });
    });

    
    let normalizedX = normalizeWithMinMax(x, lowest, highest);
    
    let normalizedPredictions = normalizePredictionsWithMinMax(predictions, lowest, highest);

    return {
        x: normalizedX,
        predictions: normalizedPredictions
    };
}

function normalizeWithMinMax(arr: number[][], minArr: number[], maxArr: number[]) {
    const normalized = [];
    let i, j, item, row:number[];
    for (i = 0; i < arr.length; i++) {
        item = arr[i];
        row = [];
        for (j = 0; j < item.length; j++) {
            var num = item[j];
            var max = maxArr[j];
            var min = minArr[j];
            var normalizedNum = max === min ? 1 : (num - min) / (max - min); 
            row.push(normalizedNum);
        }
        normalized.push(row);
    }
    return normalized;
}
function normalizePredictionsWithMinMax(arr: Prediction[], minArr: number[], maxArr: number[]): Prediction[] {
    const normalized = [];
    let j, item, row:number[];
    
    arr.forEach((p, i) => {
        row = [];
        for (j = 0; j < p.data.length; j++) {
            var num = p.data[j];
            var max = maxArr[j];
            var min = minArr[j];
            var normalizedNum = max === min ? 1 : (num - min) / (max - min); 
            row.push(normalizedNum);
        }
        p.data = row;
    });
    return arr;
}
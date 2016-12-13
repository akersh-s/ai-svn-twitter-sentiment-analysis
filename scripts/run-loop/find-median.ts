import { argv } from 'yargs';
import * as fs from 'fs';

const file = argv.file;
const contents = fs.readFileSync(file, 'utf-8');
const lines = contents.trim().split(/[\n\r]+/g);
const changeLines = lines.filter(l => l.indexOf('Current:') !== -1 && l.indexOf('Future:') !== -1);
const changeAmounts = changeLines.map(l => {
    try {
        let parts = l.split(',');
        parts = parts[0].split('%');
        return parseFloat(parts[1]);
    }
    catch (e) {
        return 0;
    }
});

console.log(findMedian(changeAmounts));

function findMedian(data: number[]): number {
    if (!data || !data.length) {
        return 0;
    }
    if (data.length < 10) {
        return -1.11 * data.length;
    }
    data.sort((a, b) => a - b);

    const middle = Math.floor((data.length - 1) / 2);
    if (data.length % 2) {
        return data[middle];
    } else {
        return (data[middle] + data[middle + 1]) / 2.0;
    }
}

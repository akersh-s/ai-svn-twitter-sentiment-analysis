import { findMedian } from './median';
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

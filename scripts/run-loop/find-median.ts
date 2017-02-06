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
        const percent = parseFloat(parts[1]);
        const numDays = findNumDays(l);
        const percentPerDay = percent / numDays;
        return percentPerDay;
    }
    catch (e) {
        return 0;
    }
});

console.log(findMedian(changeAmounts));

function findNumDays(l: string): number {
    const currentDay = new Date(between(l, 'Current Day:', ',').trim().replace(/-/g, '/'));
    const futureDay = new Date(between(l, 'Future Day:').trim().replace(/-/g, '/'));
    const numDays = ((+futureDay - +currentDay) / 8.64e7) + 1;
    return numDays;
}

function between(string: string, start: string, finish?: string) {
    var sub = string.substring(string.indexOf(start) + start.length);
    if (finish) {
        sub = sub.substring(0, sub.indexOf(finish));
    }
    return sub;
}
import * as path from 'path';
import * as yargs from 'yargs';
import * as fs from 'fs';

import {formatDate, today, getDaysAgo, oneDay} from '../../sentiment-search/util/date-util';

let argv = yargs.argv;
let username = argv.username;
let userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
let formattedDate = formatDate(today);
export class FileUtil {
    static resultsFile: string = path.join(userHome, 'results.json');
    static resultsFileDate: string = path.join(userHome, `results-${formattedDate}.json`)
    static buyFile: string = path.join(userHome, 'buy.json');
    static sellStatsFile: string = path.join(userHome, `sell-stats-${hashCode(username)}.json`);
    static svmFile: string = path.join(userHome, 'svm.json');
    static lastResultsFiles: string[] = collectLast45ResultFiles();
}

function hashCode(s) {
    if (!s) {
        return 0;
    }
    var hash = 0, i, chr, len;
    if (s.length === 0) return hash;
    for (i = 0, len = s.length; i < len; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash);
}

function collectLast45ResultFiles(): string[] {
    var resultsFileRegex = /^results-\d+-\d+-\d+\.json$/;

    var allResultFiles = [];
    fs.readdirSync(userHome).forEach(f => {
        if (resultsFileRegex.test(f) && fileIsLast45Days(f)) {
            allResultFiles.push(path.join(userHome, f));
        }
    });
    
    console.log(allResultFiles);
    return allResultFiles;
}

function fileIsLast45Days(f: string) { //And not same day
    const d45DaysAgo = oneDay * 45;
     
    let fileStart = 'results-';
    let dateParsed = f.substring(f.indexOf(fileStart) + fileStart.length);
    dateParsed = dateParsed.substring(0, dateParsed.indexOf('.')).replace(/-/g, '/');
    let date = new Date(dateParsed);
    let msGoneBy = +today - +date;
    return msGoneBy < d45DaysAgo && msGoneBy > oneDay;
}
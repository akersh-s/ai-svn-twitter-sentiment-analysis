import * as path from 'path';
import * as yargs from 'yargs';
import * as fs from 'fs';

import {formatDate, today, yesterday, getDaysAgo, oneDay} from './date-util';

let argv = yargs.argv;
let username = argv.username;
let userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
let formattedDate = formatDate(today);
export class FileUtil {
    static userHome: string = userHome;
    static tradeArtifacts: string = path.join(userHome, 'trade-artifacts');
    static resultsFile: string = path.join(userHome, 'results.json');
    static resultsFileDate: string = path.join(userHome, `results-${formattedDate}.json`);
    static buyFile: string = path.join(userHome, 'buy.json');
    static sellStatsFile: string = path.join(userHome, `sell-stats-${hashCode(username)}.json`);
    static svmFile: string = path.join(userHome, 'svm.json');
    static svmModelFile: string = path.join(userHome, 'svm-model.json');
    static svmData: string = path.join(userHome, 'svm-data.json');
    static predictionData: string = path.join(userHome, 'prediction-data.json');
    static bestSearchFile: string = path.join(userHome, 'best-search.json');
    static earningsFileDate: string = path.join(userHome, `earnings-${formattedDate}.json`);
    static lastResultsFiles: string[] = FileUtil.collectLast45ResultFiles();
    static collectLast45ResultFiles(): string[] {
        var resultsFileRegex = /^results-\d+-\d+-\d+\.json$/;

        var allResultFiles = [];
        fs.readdirSync(userHome).forEach(f => {
            if (resultsFileRegex.test(f) && fileIsLast45Days(f)) {
                allResultFiles.push(path.join(userHome, f));
            }
        });

        return allResultFiles;
    }
    static getStocks(): string[] {
        return fs.readFileSync(path.join(__dirname, '/../stocks'), 'utf-8').trim().split(/[\n\r]+/g);
    }
    static refreshFileNames() {
        formattedDate = formatDate(today);
        FileUtil.resultsFileDate = path.join(userHome, `results-${formattedDate}.json`);
        FileUtil.earningsFileDate = path.join(userHome, `earnings-${formattedDate}.json`);
    }
    static getResultsFileForDate(date: Date) {
        const formattedDate = formatDate(date);
        return path.join(userHome, `results-${formattedDate}.json`);
    }
    static getArtifactBuyFileForDate(date: Date) {
        const formattedDate = formatDate(date);
        const artifactBuyFolder = path.join(userHome, 'trade-artifacts');
        if (!fs.existsSync(artifactBuyFolder)) {
            fs.mkdirSync(artifactBuyFolder);
        }
        return path.join(artifactBuyFolder, `buy-${formattedDate}.json`);
    }
}

function hashCode(s: string): number {
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


function fileIsLast45Days(f: string) {
    const d45DaysAgo = oneDay * 45;

    let fileStart = 'results-';
    let dateParsed = f.substring(f.indexOf(fileStart) + fileStart.length);
    dateParsed = dateParsed.substring(0, dateParsed.indexOf('.')).replace(/-/g, '/');
    let date = new Date(dateParsed);
    let msGoneBy = +today - +date;
    return msGoneBy < d45DaysAgo && formatDate(date) !== formattedDate;
}
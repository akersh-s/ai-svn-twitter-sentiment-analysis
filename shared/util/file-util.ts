import * as path from 'path';
import * as yargs from 'yargs';
import * as fs from 'fs';

import {formatDate, today, yesterday, getDaysAgo, oneDay} from './date-util'; 
let argv = yargs.argv;
let runId = argv['run-id'] ? '-' + argv['run-id'] : '';
let username = argv.username;
let userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
let formattedDate = formatDate(today);
export class FileUtil {
    static userHome: string = userHome;
    static tradeArtifacts: string = path.join(userHome, 'trade-artifacts');
    static resultsFile: string = path.join(userHome, 'results.json');
    static resultsFileDate: string = path.join(userHome, `results-${formattedDate}.json`);
    static buyFile: string = path.join(userHome, 'buy' + runId + '.json');
    static sellStatsFile: string = path.join(userHome, `sell-stats-${hashCode(username)}.json`);
    static svmFile: string = path.join(userHome, 'svm.json');
    static svmModelFile: string = path.join(userHome, 'svm-model' + runId + '.json');
    static svmData: string = path.join(userHome, 'svm-data' + runId + '.json');
    static predictionData: string = path.join(userHome, 'prediction-data.json');
    static bestSearchFile: string = path.join(userHome, 'best-search.json');
    static earningsFileDate: string = path.join(userHome, `earnings-${formattedDate}.json`);
    static lastResultsFiles: string[] = FileUtil.collectLastResultFiles(30);
    static collectLastResultFiles(daysAgo: number): string[] {
        var resultsFileRegex = /^results-\d+-\d+-\d+\.json$/;

        var allResultFiles = [];
        fs.readdirSync(userHome).forEach(f => {
            if (resultsFileRegex.test(f) && fileIsLastDays(f, daysAgo)) {
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


function fileIsLastDays(f: string, daysAgo?: number) {
    const dDaysAgo = oneDay * daysAgo;

    let fileStart = 'results-';
    let dateParsed = f.substring(f.indexOf(fileStart) + fileStart.length);
    dateParsed = dateParsed.substring(0, dateParsed.indexOf('.')).replace(/-/g, '/');
    let date = new Date(dateParsed);
    let msGoneBy = +today - +date;
    return msGoneBy < dDaysAgo && msGoneBy > 0 && formatDate(date) !== formattedDate;
}
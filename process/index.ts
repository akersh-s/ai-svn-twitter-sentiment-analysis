import * as path from 'path';
import * as fs from 'fs';
import * as yargs from 'yargs';

import {FileUtil} from '../shared/util/file-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {StockAction} from '../sentiment/model/stock-action.model';
import {Stock} from '../sentiment/model/stock.model';
import {runSentiment, SvmResult} from '../svm';
import {debug} from '../shared/util/log-util';
import {determineHighestEarners, StockClosePercent} from '../earnings';

let argv = yargs.argv;
export function processResults(): Promise<number> {
    if (!fs.existsSync(FileUtil.resultsFileYesterday)) {
        console.log('results.json does not exist for yesterday! please run ts-node sentiment first.');
        process.exit(-1);
    }

    let results: DaySentiment[] = DaySentiment.parseArray(JSON.parse(fs.readFileSync(FileUtil.resultsFileYesterday, 'utf-8')));

    let svmResults: SvmResult[] = [];

    svmResults = runSentiment(results);
    debug(`Results Length: ${svmResults.length}`);
    let buys = svmResults.map(s => {
        return s.prediction.symbol.replace(/\$/, '');
    });
    return new Promise<number>((resolve, reject) => {
        if (buys.length > 0) {
            fs.writeFileSync(FileUtil.buyFile, JSON.stringify(buys, null, 4), 'utf-8');
            if (1 + 2 === 3) {
                determineHighestEarners(buys).then((earnings: StockClosePercent[]) => {
                    let totalPercent = 0;
                    buys.forEach(buy => {
                        totalPercent += StockClosePercent.findEarning(earnings, buy);
                    });
                    let earningPercent = totalPercent / buys.length;
                    console.log(`Average Earning Percent: ${earningPercent}`);
                    resolve(earningPercent);
                });
            }
            else {
                resolve(0);
            }
        } else {
            resolve(0);
        }
    });


}
processResults();


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
export async function processResults(): Promise<number> {
    if (!fs.existsSync(FileUtil.resultsFileDate)) {
        console.log(`${FileUtil.resultsFileDate} does not exist! please run ts-node sentiment first.`);
        process.exit(-1);
    }

    let results: DaySentiment[] = DaySentiment.parseArray(JSON.parse(fs.readFileSync(FileUtil.resultsFileDate, 'utf-8')));

    let svmResults: SvmResult[] = [];
    for (var i = 5; i > 0 && svmResults.length < 3; i--) {
        console.log('Running SVM for Min Increase: ' + i);
        svmResults = await runSentiment(results, i);
    }
    
    debug(`Results Length: ${svmResults.length}`);
    let buys = svmResults.map(s => {
        return s.prediction.symbol.replace(/\$/, '');
    });
    return new Promise<number>((resolve, reject) => {
        if (buys.length > 0) {
            fs.writeFileSync(FileUtil.buyFile, JSON.stringify(buys, null, 4), 'utf-8');
            if (argv.past) {
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
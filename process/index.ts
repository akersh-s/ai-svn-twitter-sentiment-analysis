import * as path from 'path';
import * as fs from 'fs';
import * as yargs from 'yargs';

import {FileUtil} from '../shared/util/file-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {StockAction} from '../sentiment/model/stock-action.model';
import {} from '../sentiment/model/action.enum';
import {Stock} from '../sentiment/model/stock.model';
import {runSentiment, SvmResult} from '../svm';
import {debug} from '../shared/util/log-util';
import {determineHighestEarners, StockClosePercent} from '../earnings';

let argv = yargs.argv;
function processResults() {
    if (!fs.existsSync(FileUtil.resultsFile)) {
        console.log('results.json does not exist! please run ts-node sentiment-search first.');
        process.exit(-1);
    }

    let results: DaySentiment[] = DaySentiment.parseArray(JSON.parse(fs.readFileSync(FileUtil.resultsFile, 'utf-8')));

    let resultsPriceThreshold;
    let svmResults: SvmResult[] = [];
    /*[1, 0.25, 2].forEach(priceThreshold => {
        [1, 1e-2, 2, 1e3, 4].forEach(C => {
            [1e-4, 1e-3, 1e-2, 1e-1].forEach(tol => {
                [1e-5, 1e-4, 1e-3, 1e-2].forEach(alpha_tol => {
                    [1e-3, -5, 3, 1, 0, 1, 3, 5, 1e3].forEach(c => {
                        [1e-3, -5, 3, 1, 0, 1, 3, 5, 1e3].forEach(d => {
                            if (svmResults.length < 3) {
                                resultsPriceThreshold = priceThreshold;
                                svmResults = runSentiment(results, priceThreshold, C, tol, alpha_tol, c, d);
                                debug(`Price Threshold: ${resultsPriceThreshold}, Results Length: ${svmResults.length}`);
                            }
                        });
                    });
                });
            });
        });

    });*/
    [10, 5, 3, 2, 1, 0.25].forEach(priceThreshold => {
        if (svmResults.length < 3) {
            resultsPriceThreshold = priceThreshold;
            svmResults = runSentiment(results, priceThreshold);
            debug(`Price Threshold: ${resultsPriceThreshold}, Results Length: ${svmResults.length}`);
        }
    });
    let buys = svmResults.map(s => {
        return s.prediction.symbol.replace(/\$/, '');
    });

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
            });
        }
    }

}
processResults();


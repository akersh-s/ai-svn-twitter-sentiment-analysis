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
    [].forEach(priceThreshold => {
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


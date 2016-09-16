import * as path from 'path';
import * as fs from 'fs';
import * as yargs from 'yargs';

import {FileUtil} from '../shared/util/file-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {StockAction} from '../sentiment/model/stock-action.model';
import {Stock} from '../sentiment/model/stock.model';
import {SvmResult} from '../svm/svm-result';
import {debug} from '../shared/util/log-util';
import {today} from '../shared/util/date-util';
import {Variables} from '../shared/variables';
import {determineHighestEarners, StockClosePercent} from '../earnings';
import {predict} from '../svm/predict';

let argv = yargs.argv;
export async function processResults(): Promise<number> {
    if (!fs.existsSync(FileUtil.resultsFileDate)) {
        console.log(`${FileUtil.resultsFileDate} does not exist! please run ts-node sentiment first.`);
        process.exit(-1);
    }

    let results: DaySentiment[] = DaySentiment.parseArrayFromFile(FileUtil.resultsFileDate);

    let svmResults: SvmResult[] = await predict();
    console.log(`Results: ${svmResults.length}`);
    let buys = svmResults.map(s => {
        console.log(`Buy ${s.prediction.symbol} with Probability ${s.probability}`);
        return s.prediction.symbol.replace(/\$/, '');
    });
    return new Promise<number>((resolve, reject) => {
        if (buys.length > 0) {
            fs.writeFileSync(FileUtil.buyFile, JSON.stringify(svmResults, null, 4), 'utf-8');

            if (argv.past) {
                const earnings: StockClosePercent[] = determineHighestEarners(buys)
                const earningPercent = StockClosePercent.findAverage(earnings);
                console.log(`Average Earning Percent: ${earningPercent}`);

                //Record the results in a results file.
                const artifactBuyFile = FileUtil.getArtifactBuyFileForDate(today);
                fs.writeFileSync(artifactBuyFile, JSON.stringify({
                    svmResults,
                    earnings,
                    earningPercent
                }, null, 4), 'utf-8');

                resolve(earningPercent);
            }
            else {
                //Record the results in a results file.
                const artifactBuyFile = FileUtil.getArtifactBuyFileForDate(today);
                fs.writeFileSync(artifactBuyFile, JSON.stringify(svmResults, null, 4), 'utf-8');

                resolve(0);
            }
        } else {
            resolve(0);
        }
    });


}

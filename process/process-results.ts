import * as fs from 'fs';
import * as yargs from 'yargs';

import { FileUtil } from '../shared/util/file-util';
import { Variables } from '../shared/variables';
import { SvmResult } from '../svm/svm-result';
import { today } from '../shared/util/date-util';
import { determineHighestEarners } from '../earnings';
import { findMedian } from '../scripts/run-loop/median';
import { StockClosePercent } from '../earnings/stock-close-percent.model';
import { sellOnIncrease } from '../earnings/sell-on-increase';
import { predict } from '../svm/predict';

let argv = yargs.argv;
export async function processResults(): Promise<number> {
    if (!fs.existsSync(FileUtil.resultsFileDate)) {
        console.log(`${FileUtil.resultsFileDate} does not exist! please run ts-node sentiment first.`);
        process.exit(-1);
    }
    FileUtil.lastResultsFiles = FileUtil.collectLastResultFiles(Math.min(90, Math.max(30, Math.ceil(Variables.numPreviousDaySentiments * 1.3))));

    let svmResults: SvmResult[] = await predict();
    console.log(`Results: ${svmResults.length}`);
    let buys = svmResults.map(s => {
        console.log(`Buy ${s.prediction.symbol} with Probability ${s.probability.toFixed(3)}`);
        return s.prediction.symbol.replace(/\$/, '');
    });
    return new Promise<number>((resolve, reject) => {
        if (buys.length > 0) {
            fs.writeFileSync(FileUtil.buyFile, JSON.stringify(svmResults, null, 4), 'utf-8');

            if (argv.past) {
                let earnings: StockClosePercent[];
                if (Variables.sellOnIncrease) {
                    earnings = sellOnIncrease(buys);
                }
                else {
                    earnings = determineHighestEarners(buys);
                }
                 
                //updateStockSuccesses(earnings);
                const earningPercent = StockClosePercent.findAverage(earnings);
                console.log(`Average Earning Percent: ${earningPercent}`, `Median Percent: ${findMedian(earnings.map(e => e.percent))}`);

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

function updateStockSuccesses(earnings: StockClosePercent[]): void {
    let stockSuccesses: StockSuccess[] = [];
    if (fs.existsSync(FileUtil.stockSuccessesFile)) {
        stockSuccesses = StockSuccess.read();
    }
    earnings.forEach(earning => {
        const stockSuccess = StockSuccess.findForSymbol(stockSuccesses, earning.symbol);
        stockSuccess.updateCount(earning);
    });

    fs.writeFileSync(FileUtil.stockSuccessesFile, JSON.stringify(stockSuccesses, null, 4), 'utf-8');
}

export class StockSuccess {
    numPositive: number = 0;
    numNegative: number = 0;
    totalEarning: number = 0;

    constructor(public symbol: string) { }

    static findForSymbol(stockSuccesses: StockSuccess[], symbol: string): StockSuccess {
        let stockSuccess: StockSuccess = stockSuccesses.find(s => s.symbol === symbol);
        if (!stockSuccess) {
            stockSuccess = new StockSuccess(symbol);
            stockSuccesses.push(stockSuccess);
        }
        return stockSuccess;
    }

    updateCount(earning: StockClosePercent): void {
        if (earning.percent >= 0) {
            this.numPositive++;
        }
        else {
            this.numNegative++;
        }
        this.totalEarning += earning.percent;
    }

    get fractionPositive(): number {
        return this.numPositive / this.total;
    }

    get fractionNegative(): number {
        return this.numNegative / this.total;
    }
    get averageEarning(): number {
        return this.totalEarning / this.total;
    }

    get total(): number {
        return this.numNegative + this.numPositive;
    }

    static parseArray(arr: any[]): StockSuccess[] {
        const stockSuccesses: StockSuccess[] = [];
        arr.forEach(a => {
            const stockSuccess = new StockSuccess(a.symbol);
            stockSuccess.numPositive = a.numPositive;
            stockSuccess.numNegative = a.numNegative;
            stockSuccess.totalEarning = a.totalEarning;
            stockSuccesses.push(stockSuccess);
        });
        return stockSuccesses;
    }

    static read(loc?: string): StockSuccess[] {
        return StockSuccess.parseArray(JSON.parse(fs.readFileSync(loc || FileUtil.stockSuccessesFile, 'utf-8')));
    }
}

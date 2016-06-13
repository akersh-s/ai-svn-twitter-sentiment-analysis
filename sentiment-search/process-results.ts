import * as path from 'path';
import * as fs from 'fs';
import {FileUtil} from '../shared/util/file-util';
import {StockAction, Action, DaySentiment} from './twitter/day-sentiment';
import {Stock} from './stock.model';
import {runSentiment, SvmResult} from '../svm';
import {debug} from './util/log-util';
function processResults() {
    if (!fs.existsSync(FileUtil.resultsFile)) {
        console.log('results.json does not exist! please run ts-node sentiment-search first.');
        process.exit(-1);
    }

    let results: StockAction[] = JSON.parse(fs.readFileSync(FileUtil.resultsFile, 'utf-8')).map(result => {
        let stock = new Stock(result.stock.symbol, result.stock.keywords);
        let daySentiments = result.daySentiments.map(d => {
            let daySentiment = new DaySentiment(new Date(d.day));
            daySentiment.numTweets = d.numTweets;
            daySentiment.totalSentiment = d.totalSentiment;
            return daySentiment;
        });
        let sa = new StockAction(stock, result.action, result.percentChange, result.numTweets, daySentiments);
        sa.price = result.price;
        return sa;
    });

    let buyResults = results.filter((a) => {
        let isBuy = a.action === Action.Buy;
        let isMinimumTweets = a.numTweets > 40;
        return isBuy && isMinimumTweets;
    }).sort((a, b) => {
        return b.percentChange - a.percentChange;
    });
    let buys = [];
    if (buyResults.length === 0) {
        console.log('Do Nothing');
    }
    else {
        console.log('Buy.......');

        buyResults.forEach((stockAction) => {
            let percentChange = (stockAction.percentChange * 100).toFixed(2);
            console.log(`${stockAction.stock.symbol} - ${percentChange}%`)

            buys.push(stockAction.stock.getSymbolNoDollar());
        });
    }
    fs.writeFileSync(FileUtil.buyFile, JSON.stringify(buys, null, 4), 'utf-8');
    let resultsPriceThreshold;
    let svmResults:SvmResult[] = [];
    [2, 1, 0.50, 0.25, 0].forEach(priceThreshold => {
        if (svmResults.length < 3) {
            resultsPriceThreshold = priceThreshold;
            svmResults = runSentiment(results, priceThreshold);    
            debug(`Price Threshold: ${resultsPriceThreshold}, Results Length: ${svmResults.length}`);    
        }
    });
    buys = svmResults.map(s => {
        return s.prediction.symbol.replace(/\$/, '');
    });
    if (buys.length > 0) {
        fs.writeFileSync(FileUtil.buyFile, JSON.stringify(buys, null, 4), 'utf-8');
    }
    
    
}
processResults();


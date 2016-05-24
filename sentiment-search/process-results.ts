import * as path from 'path';
import * as fs from 'fs';
import {FileUtil} from '../shared/util/file-util';

import {StockAction, Action} from './twitter/day-sentiment';
import {Stock} from './stock.model';

if (!fs.existsSync(FileUtil.resultsFile)) {
    console.log('results.json does not exist! please run ts-node sentiment-search first.');
    process.exit(-1);
}

let results:StockAction[] = JSON.parse(fs.readFileSync(FileUtil.resultsFile, 'utf-8')).map(result => {
    let stock = new Stock(result.stock.symbol, result.stock.keywords);
    return new StockAction(stock, result.action, result.percentChange, result.numTweets)
});

results = results.filter((a) => {
    
    let isBuy = a.action === Action.Buy;
    let isMinimumTweets = a.numTweets > 40;
    return isBuy && isMinimumTweets;
}).sort((a, b) => {
   return b.percentChange - a.percentChange; 
});
let buys = [];
if (results.length === 0) {
    console.log('Do Nothing');
}
else {
    console.log('Buy.......');
    
    results.forEach((stockAction) => {
        let percentChange = (stockAction.percentChange * 100).toFixed(2);
        console.log(`${stockAction.stock.symbol} - ${percentChange}%`)
        
        buys.push(stockAction.stock.getSymbolNoDollar());
    });
}
fs.writeFileSync(FileUtil.buyFile, JSON.stringify(buys, null, 4), 'utf-8');

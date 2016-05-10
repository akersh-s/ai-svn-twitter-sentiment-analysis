import * as path from 'path';
import * as fs from 'fs';

import {StockAction, Action} from './twitter/day-sentiment';

let resultsFile = path.join(__dirname, '..', 'results.json');

if (!fs.existsSync(resultsFile)) {
    console.log('results.json does not exist! please run ts-node sentiment-search first.');
    process.exit(-1);
}

let results:StockAction[] = JSON.parse(fs.readFileSync(resultsFile, 'utf-8')).map(result => new StockAction(result.stock, result.action, result.percentChange));

results = results.filter((a) => {
    return a && a.action === Action.Buy;
}).sort((a, b) => {
   return b.percentChange - a.percentChange; 
});

if (results.length === 0) {
    console.log('Do Nothing');
}
else {
    console.log('Buy.......');
    results.forEach((stockAction) => {
        let percentChange = (stockAction.percentChange * 100).toFixed(2);
        console.log(`${stockAction.stock.symbol} - ${percentChange}%`)
    });
}

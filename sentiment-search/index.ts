import {Stock} from './stock.model';
import * as fs from 'fs';
import * as path from 'path';
import {determineActionForStock} from './stock-sentiment-search';
import {StockAction, Action} from './twitter/day-sentiment';
import * as yargs from 'yargs';

let argv = yargs.argv;
let symbol = argv.symbol;
let keywords = argv.keywords || ''

if (!symbol) {
    throw 'Please specify a stock tag.';
}

let stock = new Stock(symbol, keywords);
determineActionForStock(stock, (err, stockAction: StockAction) => {
    let error = err || stockAction.error;
    if (error) throw error;
    
    let resultsFile = path.join(__dirname, '..', 'results.json');
    let results = [];
    if (fs.existsSync(resultsFile)) {
        results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
    }
    results.push(stockAction);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 4), 'utf-8');
});

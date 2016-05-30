import {Stock} from './stock.model';
import * as fs from 'fs';
import * as path from 'path';
import {determineActionForStock} from './stock-sentiment-search';
import {StockAction, Action} from './twitter/day-sentiment';
import {FileUtil} from '../shared/util/file-util';
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
    
    let results = [];
    
    if (fs.existsSync(FileUtil.resultsFile)) {
        results = JSON.parse(fs.readFileSync(FileUtil.resultsFile, 'utf-8'));
    }
    results.push(stockAction);
    fs.writeFileSync(FileUtil.resultsFile, JSON.stringify(results, null, 4), 'utf-8');
    fs.writeFileSync(FileUtil.resultsFileDate, JSON.stringify(results, null, 4), 'utf-8');

    let svmData = [];
    if (fs.existsSync(FileUtil.svmFile)) {
        svmData = JSON.parse(fs.readFileSync(FileUtil.svmFile, 'utf-8'));
    }
});

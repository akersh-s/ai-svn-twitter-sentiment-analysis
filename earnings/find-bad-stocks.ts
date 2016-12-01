import { FileUtil } from '../shared/util/file-util';
import { StockSuccess } from '../process/process-results';
import * as fs from 'fs';
import * as path from 'path';

let stockSuccesses = StockSuccess.read();
const stocks = FileUtil.getStocks();
stockSuccesses = stockSuccesses.filter(s => stocks.indexOf(s.symbol) !== -1);
stockSuccesses.sort((a, b) => a.totalEarning - b.totalEarning);
stockSuccesses = stockSuccesses.filter((a, i) => a.total > 5 && a.fractionNegative >= 0.70 && a.totalEarning < 0);
//stockSuccesses = stockSuccesses.filter((a, i) => a.averageEarning > 10);
const total = stockSuccesses.map(a => a.totalEarning / a.total).reduce((a, b) => a + b) / stockSuccesses.length;

const newStocks = [];

stockSuccesses.forEach(s => {
    console.log(JSON.stringify(s), );

});
const stockFailureNames = stockSuccesses.map(s => s.symbol);
stocks.forEach(stock => {
    if (stockFailureNames.indexOf(stock) === -1) {
        newStocks.push(stock);
    }
});
fs.writeFileSync(path.join(__dirname, '../shared/stocks'), newStocks.join('\n') + '\n', 'utf-8');
console.log(`$${total}`);
console.log(stockSuccesses.length);

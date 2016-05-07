import {IStock} from './stock';
import * as fs from 'fs';
import * as async from 'async';
import {determineActionForStock} from './stock-sentiment-search';
let stocks: IStock[] = JSON.parse(fs.readFileSync(__dirname + '/stocks.json', 'utf-8'));
var asyncFuncs = [];

stocks.forEach((stock: IStock) => {
    asyncFuncs.push((done) => {
        determineActionForStock(stock, done);
    });
});


async.series(asyncFuncs, (err, data) => {
    if (err) throw err;
    
    console.log(data);
})
import {Stock} from './stock.model';
import * as fs from 'fs';
import * as async from 'async';
import {determineActionForStock} from './stock-sentiment-search';
import {StockAction, Action} from './twitter/day-sentiment';
let stocks: Stock[] = JSON.parse(fs.readFileSync(__dirname + '/stocks.json', 'utf-8')).map(item => new Stock(item.symbol, item.keywords));
var asyncFuncs = [];

stocks.forEach((stock: Stock) => {
    asyncFuncs.push((done) => {
        try {
            determineActionForStock(stock, done);
        }
        catch (e) {
            console.log(e, JSON.stringify(e));
            done(null, new StockAction(null, null, null, JSON.stringify(e)));
        }
    });
});


async.series(asyncFuncs, (err, stockActions: StockAction[]) => {
    if (err) {
        console.log('Error', err);
    }
    stockActions = stockActions.filter((a) => {
        return a && a.action === Action.Buy;
    }).sort((a, b) => {
        return b.percentChange - a.percentChange;
    });
    if (stockActions.length === 0) {
        console.log('Do Nothing');
        return;
    }
    console.log('Buy.......');
    stockActions.forEach((stockAction) => {
        let percentChange = (stockAction.percentChange * 100).toFixed(2);
        console.log(`${stockAction.stock.symbol} - ${percentChange}%`)
    });
});
import {Stock, IResult} from './stock.model';
import {TwitterSearch} from './twitter';
import {getLast3Days} from './util/date-util';
import {Status} from './twitter/search.model';
import {DaySentiment, determineBuyOrSell, StockAction} from './twitter/day-sentiment';
import * as async from 'async';

export function determineActionForStock(stock: Stock, cb: Function) {
    let search = new TwitterSearch(stock);
    let days = getLast3Days();
    let asyncFuncs = [];    
    days.forEach((day) => {
        asyncFuncs.push((done) => {
           search.getTweets(day, done); 
        });
    });
    
    async.series(asyncFuncs, (err, daySentiments: DaySentiment[]) => {
        if (err) throw err;
        let stockAction:StockAction = determineBuyOrSell(stock, daySentiments);
        cb(err, stockAction);
    });
    
}
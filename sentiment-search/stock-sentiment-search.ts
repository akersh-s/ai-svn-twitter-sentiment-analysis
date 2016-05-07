import {IStock, IResult} from './stock';
import {TwitterSearch} from './twitter';
import {getLast3Days} from './util/date-util';
import * as async from 'async';

export function determineActionForStock(stock: IStock, cb: Function) {
    let search = new TwitterSearch(stock);
    let days = getLast3Days();
    let asyncFuncs = [];    
    days.forEach((day) => {
        asyncFuncs.push((done) => {
           search.getTweets(day, done); 
        });
    });
    
    async.series(asyncFuncs, (err, data) => {
        if (err) throw err;
        
        console.log(data);
        cb(data);
    });
    
}
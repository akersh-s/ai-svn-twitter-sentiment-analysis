import * as fs from 'fs';
import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';
import {Stock} from '../sentiment-search/stock.model';
import {runSentiment} from './index';
let stockActions:StockAction[] = JSON.parse(fs.readFileSync(__dirname + '/../shared/results.json', 'utf-8')).map(s => {
    let stock = new Stock(s.stock.symbol, s.stock.keywords);
    let stockAction = new StockAction(stock, s.action, s.percentChange, s.numTweets, s.daySentiments);
    return stockAction;
});

runSentiment(stockActions, true);

let googleFinance = require('google-finance');

import * as fs from 'fs';
import * as path from 'path';

import {FileUtil} from '../shared/util/file-util';
import {formatDate, yesterday, today, getDaysAgo} from '../shared/util/date-util';
import {Variables} from '../shared/variables';

export async function determineHighestEarners(stocks: string[]): Promise<StockClosePercent[]> {
    /*if (fs.existsSync(FileUtil.earningsFileDate)) {
        return new Promise<StockClosePercent[]>((resolve, reject) => {
            let results = fs.readFile(FileUtil.earningsFileDate, 'utf-8', (err, data) => {
                if (err) return reject(err);
                let parsedData = JSON.parse(data);
                let cachedStockClosePercents:StockClosePercent[] = parsedData.map(d => new StockClosePercent(d.symbol, d.percent));
                resolve(cachedStockClosePercents);
            })
        });
    }*/
    //let stocksFile = fs.readFileSync(path.join(__dirname, '..', 'sentiment', 'stocks'), 'utf-8');
    /*let stocks = stocksFile.trim().split(/[\n\r]+/g).map(line => {
        return line.split(/\s/)[0].replace(/\$/, '');
    });*/
    let i = 0;
    
    let stockClosePercents:StockClosePercent[] = [];
    while (i < stocks.length) {
        try {
            let stockClosePercent = await getPriceIncrease(stocks[i]);
            stockClosePercents.push(stockClosePercent);
        }
        catch (e) {
            console.log(stocks[i] + ' failed:', e);
        }
        i++;
    }
    stockClosePercents.sort((a, b) => {
        return b.percent - a.percent;
    });
    stockClosePercents.forEach(s => {
        console.log(s.toString());
    });
    fs.writeFileSync(FileUtil.earningsFileDate, JSON.stringify(stockClosePercents), 'utf-8');
    return stockClosePercents;
}

async function getPriceIncrease(symbol: string): Promise<StockClosePercent> {
    console.log(formatDate(getDaysAgo(Variables.numDays * -1)));
    return new Promise<StockClosePercent>((resolve, reject) => {
        googleFinance.historical({
            symbol: symbol,
            from: formatDate(today),
            to: formatDate(getDaysAgo(Variables.numDays * -1))
        }, (err, quotes) => {
            if (err) return reject(err);
            if (quotes.length < 2) {
                console.log(quotes);
                return reject('Not enough results');
            }
            let historicalQuotes:HistoricalQuote[] = quotes.map(q => new HistoricalQuote(q));
            let todaysQuote = historicalQuotes[historicalQuotes.length - 1];
            
            let previousQuote = historicalQuotes[0];
            let percent = ((todaysQuote.close - previousQuote.close) / previousQuote.close) * 100;
            console.log(`${symbol} - Today's Quote (${formatDate(todaysQuote.date)}): ${todaysQuote.close} - Previous Quote (${formatDate(previousQuote.date)}): ${previousQuote.close} - ${percent}%`);
            resolve(new StockClosePercent(symbol, percent));
        });
    });
}

export class StockClosePercent {
    constructor(public symbol: string, public percent: number) {}

    toString() {
        return `${this.symbol}: %${this.percent}`;
    }

    static findEarning(stockClosePercents: StockClosePercent[], symbol: string): number {
        let earning = 0;
        stockClosePercents.forEach(stockClosePercent => {
            if (stockClosePercent.symbol === symbol) {
                earning = stockClosePercent.percent;
            }
        })
        return earning;
    }
}
class HistoricalQuote {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
    constructor(obj: any) {
        this.date = obj.date;
        this.open = obj.open;
        this.high = obj.high;
        this.low = obj.low;
        this.close = obj.close;
        this.volume = obj.volume;
        this.symbol = obj.symbol;
    }
}

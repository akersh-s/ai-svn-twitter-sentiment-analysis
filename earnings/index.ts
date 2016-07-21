let googleFinance = require('google-finance');

import * as fs from 'fs';
import * as path from 'path';

import {FileUtil} from '../shared/util/file-util';
import {formatDate, yesterday, today, getDaysAgo, isWeekend} from '../shared/util/date-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {Variables} from '../shared/variables';

export function determineHighestEarners(stocks: string[]): StockClosePercent[] {
    let i = 0;
    stocks = stocks.map(stock => stock.replace(/^\$?/, '$'));

    let fromDate: Date = today;
    let toDate: Date = getDaysAgo(Variables.numDays * -1);
    while (!fs.existsSync(FileUtil.getResultsFileForDate(toDate)) && +fromDate < +toDate && !isWeekend(toDate)) {
        ++i;
        toDate = getDaysAgo((Variables.numDays * -1) + i);
    }
    if (!fs.existsSync(FileUtil.getResultsFileForDate(toDate))) {
        return [];
    }

    const fromDateSentiments: DaySentiment[] = getDaySentimentsForStocks(stocks, fromDate);
    const toDateSentiments: DaySentiment[] = getDaySentimentsForStocks(stocks, toDate);

    let stockClosePercents: StockClosePercent[] = [];
    stocks.forEach(stock => {
        const fromDateSentiment = getSingle(fromDateSentiments.filter(s => s.stock.symbol === stock));
        const toDateSentiment = getSingle(toDateSentiments.filter(s => s.stock.symbol === stock));
        if (fromDateSentiment && toDateSentiment) {
            stockClosePercents.push(new StockClosePercent(stock, toDateSentiment.price, fromDateSentiment.price));
        }
    });
    stockClosePercents.sort((a, b) => {
        return b.percent - a.percent;
    });
    stockClosePercents.forEach(s => {
        console.log(s.toString());
    });
    return stockClosePercents;
}

function getDaySentimentsForStocks(stocks: string[], date: Date): DaySentiment[] {
    let daySentiments: DaySentiment[] = DaySentiment.parseArray(JSON.parse(fs.readFileSync(FileUtil.getResultsFileForDate(date), 'utf-8')));
    return daySentiments.filter(daySentiment => {
        return stocks.indexOf(daySentiment.stock.symbol) !== -1;
    });
}

function getSingle<T>(arr: T[]): T {
    if (arr && arr.length > 0) {
        return arr[0];
    }
    else {
        return undefined;
    }
}

export class StockClosePercent {
    public percent: number;
    constructor(public symbol: string, public futureQuote: number, public currentQuote: number) {
        if (!futureQuote || !currentQuote) {
            this.percent = 0;
        }
        else {
            this.percent = ((futureQuote - currentQuote) / currentQuote) * 100;
        }
    }

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

    static findAverage(stockClosePercents: StockClosePercent[]): number {
        if (stockClosePercents.length === 0) {
            return 0;
        }
        let totalPercent = 0;
        stockClosePercents.forEach(buy => {
            totalPercent += StockClosePercent.findEarning(stockClosePercents, buy.symbol);
        });
        return totalPercent / stockClosePercents.length;
    }
}

type StockClose = {
    stock: string;
    close: number;
};

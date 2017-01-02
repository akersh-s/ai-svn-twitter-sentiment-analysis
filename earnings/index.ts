import * as fs from 'fs';

import { FileUtil } from '../shared/util/file-util';
import { today, getDaysAgo, isWeekend, formatDate } from '../shared/util/date-util';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';
import { Variables } from '../shared/variables';

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
            stockClosePercents.push(new StockClosePercent(stock, toDateSentiment, fromDateSentiment));
        }
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
    public futureQuote: number;
    public currentQuote: number;
    constructor(public symbol: string, public future: DaySentiment, public current: DaySentiment) {
        this.futureQuote = this.future.price;
        this.currentQuote = this.current.price;
        if (!this.futureQuote || !this.currentQuote) {
            this.percent = 0;
        }
        else {
            this.percent = ((this.futureQuote - this.currentQuote) / this.currentQuote) * 100;
        }
    }

    toString() {
        return `${this.symbol}: %${this.percent}, Current: ${this.currentQuote}, Future: ${this.futureQuote}, Current Day: ${formatDate(this.current.day)}, Future Day: ${formatDate(this.future.day)}`;
    }

    static findEarning(stockClosePercents: StockClosePercent[], symbol: string): number {
        let earning = 0;
        stockClosePercents.forEach(stockClosePercent => {
            if (stockClosePercent.symbol === symbol) {
                earning = stockClosePercent.percent;
            }
        });
        return earning;
    }

    static findAverage(stockClosePercents: StockClosePercent[]): number {
        if (stockClosePercents.length === 0) {
            return 0;
        }
        let totalPercent = 0;
        stockClosePercents.forEach(buy => {
            const earning = StockClosePercent.findEarning(stockClosePercents, buy.symbol);
            totalPercent += earning;
        });
        return totalPercent / stockClosePercents.length;
    }
}

type StockClose = {
    stock: string;
    close: number;
};

import * as fs from 'fs';

import { FileUtil } from '../shared/util/file-util';
import { today, getDaysAgo, isWeekend } from '../shared/util/date-util';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';
import { StockClosePercent } from './stock-close-percent.model';
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

export function getDaySentimentsForStocks(stocks: string[], date: Date): DaySentiment[] {
    let daySentiments: DaySentiment[] = DaySentiment.parseArray(JSON.parse(fs.readFileSync(FileUtil.getResultsFileForDate(date), 'utf-8')));
    return daySentiments.filter(daySentiment => {
        return stocks.indexOf(daySentiment.stock.symbol) !== -1;
    });
}

export function getSingle<T>(arr: T[]): T {
    if (arr && arr.length > 0) {
        return arr[0];
    }
    else {
        return undefined;
    }
}


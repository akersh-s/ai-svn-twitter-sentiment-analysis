import { getDaySentimentsForStocks, getSingle } from './';
import { today, getDaysAgo } from '../shared/util/date-util';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';
import { StockClosePercent } from './stock-close-percent.model';
import { Variables } from '../shared/variables';

export function sellOnIncrease(stocks: string[]): StockClosePercent[] {
    let stockClosePercents: StockClosePercent[] = [];
    let remainingStocks = stocks.map(stock => stock.indexOf('$') === -1 ? '$' + stock : stock);

    let fromDate: Date = today;
    const fromDateSentiments: DaySentiment[] = getDaySentimentsForStocks(remainingStocks, fromDate);
    let toDate: Date;
    let lastToDateSentiments: DaySentiment[];
    let toDateSentiments: DaySentiment[];
    for (let i = 1; i <= Variables.numDays && remainingStocks.length > 0; i++) {
        try {
            toDate = getDaysAgo((i * -1));
            toDateSentiments = getDaySentimentsForStocks(remainingStocks, toDate);
            remainingStocks.forEach(stock => {
                const fromDateSentiment = getSingle(fromDateSentiments.filter(s => s.stock.symbol === stock));
                const lastToDateSentiment = lastToDateSentiments && getSingle(lastToDateSentiments.filter(s => s.stock.symbol === stock));
                const toDateSentiment = getSingle(toDateSentiments.filter(s => s.stock.symbol === stock));
                if (fromDateSentiment && toDateSentiment) {
                    const increase = fromDateSentiment.price ? 100 * change(toDateSentiment.price, fromDateSentiment.price) : 0;
                    const increaseFromYesterday = lastToDateSentiment && lastToDateSentiment.price ? 100 * change(toDateSentiment.price, lastToDateSentiment.price) : 0;
                    const isLastIteration = i === Variables.numDays - 1;
                    if (increase >= Variables.calculateSellAmountForDayIndex(i) || isLastIteration || increase <= Variables.calculateSellWallForDayIndex(i)) {
                        stockClosePercents.push(new StockClosePercent(stock, toDateSentiment, fromDateSentiment));
                    }
                }
            });
            lastToDateSentiments = toDateSentiments;
        }
        catch (e) { }
        const finished = stockClosePercents.map(s => s.symbol);
        remainingStocks = remainingStocks.filter(r => finished.indexOf(r) === -1);
    }
    stockClosePercents.forEach(s => {
        console.log(s.toString());
    });
    return stockClosePercents;
}
/*sellOnIncrease([ '$AERI',
  '$LOXO',
  '$OVAS',
  '$URTY',
  '$NXTDW',
  '$WGBS',
  '$INDL',
  '$UWM',
  '$LPCN',
  '$TVIA',
  '$RSO',
  '$TWI',
  '$LBJ',
  '$IEP',
  '$TRIL',
  '$HMHC',
  '$RIC',
  '$GWPH',
  '$BOOM',
  '$BIS' ]);
*/
function change(one: number, two: number) {
    return two === 0 ? 0 : (one - two) / two;
}
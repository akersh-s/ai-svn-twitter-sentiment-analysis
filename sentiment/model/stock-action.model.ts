import {DaySentiment} from './day-sentiment.model';
import {Action} from './action.enum';
import {formatDate, today} from '../../shared/util/date-util';
import {Stock} from './stock.model';
import {Robinhood, QuoteDataResultBody, QuoteDataResult} from '../../shared/robinhood.api';
import {calculateMeanVarianceAndDeviation, calculateBuyPrice, calculateSellPrice, calcIncreasePercent} from '../../shared/util/math-util';
export class StockAction {
    public price: number;
    private cachedDate: Date;
    private quoteDataResult: QuoteDataResult;
    constructor(public stock: Stock, public action: Action, public percentChange: number, public numTweets: number, public daySentiments: DaySentiment[], public error?: string) { }

    addPrice(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (!this.stock) {
                reject('No Stock Symbol to find price');
            }
            let symbolFormatted = this.stock.symbol.replace(/\$/, '').toUpperCase();
            let robinhood = new Robinhood(null, null);
            robinhood.quote_data(symbolFormatted, (err, response, body: QuoteDataResultBody) => {
                if (err) return reject(err);

                if (!body || !body.results || body.results.length < 1) {
                    return reject('No results');
                }
                this.quoteDataResult = body.results[0];
                this.price = parseFloat(this.quoteDataResult.bid_price);
                
                resolve(this.price);
            });
        });
    }

    getDate(): Date {
        if (this.cachedDate) {
            return this.cachedDate;
        }
        let date: Date = null;
        this.daySentiments.forEach(daySentiment => {
            if (date) {
                if (daySentiment.day) {
                    date = new Date(Math.max(+date, +daySentiment.day));    
                }
            }
            else {
                date = daySentiment.day;
            }
        });
        this.cachedDate = date;
        return date;
    }

    static findStockActionForSymbolAndDate(symbol: string, date: Date, stockActions: StockAction[]): StockAction {
        let formattedDate = formatDate(date);
        let foundStockAction = null;
        
        stockActions.forEach(s => {
            let sDate = s.getDate();
            let sformattedDate = formatDate(sDate);
            if (formattedDate === sformattedDate && symbol === s.stock.symbol) {
                foundStockAction = s;
            }
        });
        
        return foundStockAction;
    }
}
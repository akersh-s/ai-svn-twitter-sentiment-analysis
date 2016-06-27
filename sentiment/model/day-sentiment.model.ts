import {formatDate} from '../../shared/util/date-util'
import {Stock} from './stock.model';
import {Robinhood, QuoteDataResultBody, QuoteDataResult} from '../../shared/robinhood.api';

export class DaySentiment {
    public totalSentiment: number = 0;
    public numTweets: number = 0;
    public quoteDataResult: QuoteDataResult;

    constructor(public stock: Stock, public day: Date) { }

    addTweetSentiment(sentiment: number) {
        this.numTweets++;
        this.totalSentiment += sentiment;
    }
    get average(): number {
        if (this.numTweets > 0) {
            return this.totalSentiment / this.numTweets;
        }
        else {
            return 0;
        }
    }

    isForDate(date: Date): boolean {
        return formatDate(date) === formatDate(this.day);
    }

    get price():number {
        return parseFloat(this.quoteDataResult.bid_price);
    }

    addPrice(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            let symbolFormatted = this.stock.symbol.replace(/\$/, '').toUpperCase();
            let robinhood = new Robinhood(null, null);
            robinhood.quote_data(symbolFormatted, (err, response, body: QuoteDataResultBody) => {
                if (err) return reject(err);

                if (!body || !body.results || body.results.length < 1) {
                    return reject('No results');
                }
                this.quoteDataResult = body.results[0];
                let price = parseFloat(this.quoteDataResult.bid_price);

                resolve(price);
            });
        });
    }

    static parseArray(a: any[]): DaySentiment[] {
        return a.map(result => {
            if (result.daySentiments) {
                //Legacy with StockActions
                let stock = new Stock(result.stock.symbol, result.stock.keywords);
                let d = result.daySentiments[0];
                let daySentiment = new DaySentiment(stock, new Date(d.day));
                daySentiment.numTweets = d.numTweets;
                daySentiment.totalSentiment = d.totalSentiment;
                daySentiment.quoteDataResult = result.quoteDataResult || {
                    bid_price: result.price
                };
                return daySentiment;
            }
            else {
                let stock = new Stock(result.stock.symbol, result.stock.keywords);
                let daySentiment = new DaySentiment(stock, new Date(result.day));
                daySentiment.totalSentiment = result.totalSentiment;
                daySentiment.numTweets = result.numTweets;
                daySentiment.quoteDataResult = result.quoteDataResult;
                return daySentiment;
            }
        });
    }

    static findDaySentimentForSymbolAndDate(symbol: string, date: Date, daySentiments: DaySentiment[]): DaySentiment {
        let formattedDate = formatDate(date);
        let foundStockAction = null;
        
        daySentiments.forEach(s => {
            let sDate = s.day;
            let sformattedDate = formatDate(sDate);
            if (formattedDate === sformattedDate && symbol === s.stock.symbol) {
                foundStockAction = s;
            }
        });
        return foundStockAction;
    }
}
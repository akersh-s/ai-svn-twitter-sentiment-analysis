import {formatDate} from '../../shared/util/date-util'
import {Stock} from './stock.model';
import {Robinhood, QuoteDataResultBody, QuoteDataResult, FundamentalResponse} from '../../shared/robinhood.api';

export class DaySentiment {
    public totalSentiment: number = 0;
    public numTweets: number = 0;
    public quoteDataResult: QuoteDataResult;
    public fundamentals: FundamentalResponse;

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
    
    get volume(): number {
        if (!this.fundamentals || !this.fundamentals.volume) {
            return 0;
        }
        return parseFloat(this.fundamentals.volume);
    }

    //Adds price and fundamental information
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

                robinhood.fundamentals(symbolFormatted, (err, response, body: FundamentalResponse) => {
                    if (err) return reject(err);

                    if (!body) {
                        return reject('No fundamental results');
                    }

                    this.fundamentals = body;
                    resolve(price);
                })
            });
        });
    }

    static parseArray(a: any[]): DaySentiment[] {
        let daySentiments: DaySentiment[] = [];
        a.forEach(result => {
            if (result.daySentiments) {
                //Legacy with StockActions
                let stock = new Stock(result.stock.symbol, result.stock.keywords);
                let d = result.daySentiments[result.daySentiments.length - 1];
                let daySentiment = new DaySentiment(stock, new Date(d.day));
                daySentiment.numTweets = d.numTweets;
                daySentiment.totalSentiment = d.totalSentiment;
                daySentiment.quoteDataResult = result.quoteDataResult || {
                    bid_price: result.price
                };
                daySentiments.push(daySentiment);
            }
            else {
                let stock = new Stock(result.stock.symbol, result.stock.keywords);
                let daySentiment = new DaySentiment(stock, new Date(result.day));
                daySentiment.totalSentiment = result.totalSentiment;
                daySentiment.numTweets = result.numTweets;
                daySentiment.quoteDataResult = result.quoteDataResult;
                daySentiment.fundamentals = result.fundamentals;
                daySentiments.push(daySentiment);
            }
        });
        return daySentiments;
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
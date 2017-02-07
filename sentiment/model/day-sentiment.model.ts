import { formatDate } from '../../shared/util/date-util';
import { Stock } from './stock.model';
import { Robinhood, QuoteDataResultBody, QuoteDataResult, FundamentalResponse } from '../../shared/robinhood.api';
import * as fs from 'fs';

export class DaySentiment {
    public totalSentiment: number = 0;
    public numTweets: number = 0;
    public quoteDataResult: QuoteDataResult;
    public fundamentals: FundamentalResponse;

    public tweetsComplete: boolean = false;
    public twitsComplete: boolean = false;
    public priceComplete: boolean = false;


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

    get price(): number {
        return parseFloat(this.quoteDataResult.last_trade_price);
    }

    get volume(): number {
        if (!this.fundamentals || !this.fundamentals.volume) {
            return 0;
        }
        return parseFloat(this.fundamentals.volume);
    }

    get calcPeRatio(): number {
        if (!this.fundamentals) {
            return 0;
        }
        if (this.fundamentals.pe_ratio) {
            return parseFloat(this.fundamentals.pe_ratio);
        }
        else if (this.fundamentals.market_cap && this.volume) {
            return parseFloat(this.fundamentals.market_cap) / this.volume;
        }
        else {
            return 0;
        }
    }

    //Adds price and fundamental information
    addPrice(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            let symbolFormatted = this.stock.symbol.replace(/\$/, '').toUpperCase();
            let robinhood = new Robinhood(null, null);
            robinhood.quote_data(symbolFormatted, (err, response, body: QuoteDataResultBody) => {
                if (err) { return reject(err); }

                if (!body || !body.results || body.results.length < 1) {
                    return reject('No results');
                }
                this.quoteDataResult = body.results[0];
                let price = parseFloat(this.quoteDataResult.bid_price);
                setTimeout(() => {
                    robinhood.fundamentals(symbolFormatted, (err2, response2, body2: FundamentalResponse) => {
                        if (err2) { return reject(err2); }

                        if (!body2) {
                            return reject('No fundamental results');
                        }

                        this.fundamentals = body2;
                        this.priceComplete = true;
                        resolve(price);
                    });
                }, 100);
            });
        });
    }

    isComplete(): boolean {
        return this.tweetsComplete && this.twitsComplete && this.priceComplete;
    }

    deleteUnusedFields(): DaySentiment {
        delete this.fundamentals.instrument;
        delete this.fundamentals.description;
        delete this.quoteDataResult.instrument;

        delete this.priceComplete;
        delete this.twitsComplete;
        delete this.tweetsComplete;

        for (let property in this.stock) {
            if (!this.stock[property]) {
                delete this.stock[property];
            }
        }
        for (let property in this.fundamentals) {
            if (!this.fundamentals[property]) {
                delete this.fundamentals[property];
            }
        }
        for (let property in this.quoteDataResult) {
            if (!this.quoteDataResult[property]) {
                delete this.quoteDataResult[property];
            }
        }
        return this;
    }

    static parseArray(a: any[]): DaySentiment[] {
        let daySentiments: DaySentiment[] = [];
        a.forEach(result => {
            if (result.daySentiments) {
                //Legacy with StockActions
                let stock = new Stock(result.stock.symbol, result.stock.keywords);
                let d = result.daySentiments[result.daySentiments.length - 1];
                let daySentiment = new DaySentiment(stock, new Date(reformatDate(result.day)));
                daySentiment.numTweets = d.numTweets;
                daySentiment.totalSentiment = d.totalSentiment;
                daySentiment.quoteDataResult = result.quoteDataResult || {
                    last_trade_price: result.price
                };
                daySentiments.push(daySentiment);
            }
            else {
                let stock = new Stock(result.stock.symbol, result.stock.keywords);
                let daySentiment = new DaySentiment(stock, new Date(reformatDate(result.day)));
                daySentiment.totalSentiment = result.totalSentiment;
                daySentiment.numTweets = result.numTweets;
                daySentiment.quoteDataResult = result.quoteDataResult;
                daySentiment.fundamentals = result.fundamentals;
                daySentiments.push(daySentiment);
            }
        });
        return daySentiments;
    }

    static parseArrayFromFile(f: string): DaySentiment[] {
        return DaySentiment.parseArray(JSON.parse(fs.readFileSync(f, 'utf-8')));
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

function reformatDate(s: string) {
    const tIndex = s && s.indexOf('T');
    if (tIndex !== -1) {
        let d = s.substring(0, tIndex).replace(/-/g, '/');
        return d;
    }
    else {
        throw new Error('Some weird string formatting: ' + s);
    }
}
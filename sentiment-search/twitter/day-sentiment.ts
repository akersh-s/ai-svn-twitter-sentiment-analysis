import {formatDate, today} from '../util/date-util';
import {Stock} from '../stock.model';
import {Robinhood, QuoteDataResultBody, QuoteDataResult} from '../../shared/robinhood.api';
import {calculateMeanVarianceAndDeviation, calculateBuyPrice, calculateSellPrice, calcIncreasePercent} from '../util/math-util';
export class DaySentiment {
    public totalSentiment: number = 0;
    public numTweets: number = 0;
    constructor(public day: Date) { }

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
}

export function determineBuyOrSell(stock: Stock, daySentiments: DaySentiment[]): StockAction {
    var todaysSentiment: number;
    var previousSentiments: number[] = [];
    var totalTweets: number = 0;
    daySentiments.forEach((daySentiment) => {
        if (daySentiment.isForDate(today)) {
            todaysSentiment = daySentiment.average
        }
        else {
            previousSentiments.push(daySentiment.average);
        }
        totalTweets += daySentiment.numTweets;
    });


    //Validate results
    if (!todaysSentiment) {
        return new StockAction(null, null, null, 0, null, 'No Sentiment for today.');
    }
    if (previousSentiments.length === 0) {
        return new StockAction(null, null, null, 0, null, 'No previous sentiments.');
    }

    let distribution = calculateMeanVarianceAndDeviation(previousSentiments);
    let buyPrice = calculateBuyPrice(distribution);
    let sellPrice = calculateSellPrice(distribution);
    let increasePercent: number = calcIncreasePercent(todaysSentiment, distribution.mean);
    var action: Action;
    if (todaysSentiment > buyPrice) {
        action = Action.Buy;
    }
    else if (todaysSentiment < sellPrice) {
        action = Action.Sell;
    }
    else {
        action = Action.DoNothing;
    }

    return new StockAction(stock, action, increasePercent, totalTweets, daySentiments);
}

export class StockAction {
    public price: number;
    constructor(public stock: Stock, public action: Action, public percentChange: number, public numTweets: number, public daySentiments: DaySentiment[], public error?: string) { }

    addPrice(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            if (!this.stock) {
                reject('No Stock Symbol to find price');
            }
            let symbolFormatted = this.stock.symbol.replace(/\$/, '').toUpperCase();
            let robinhood = new Robinhood(null, null);
            robinhood.quote_data(symbolFormatted, (err, response, body: QuoteDataResultBody) => {
                if (err) reject(err);
                
                if (!body.results || body.results.length < 1) {
                    reject('No results');
                }
                this.price = parseFloat(body.results[0].bid_price);
                resolve(this.price);
            });
        });
    }
}
export enum Action {
    Buy, Sell, DoNothing
}
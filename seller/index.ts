'use strict';

import {Robinhood, QuoteDataResult} from '../shared/robinhood.api';
import {validate, isNotWeekend} from '../shared/validate';
import {SellSymbol, sellStats} from './sell-symbol';
import * as yargs from 'yargs';
import * as async from 'async';

isNotWeekend();
let argv = yargs.argv;
let username = validate('username', argv.username);
let password = validate('password', argv.password);

//Start
let robinhood = new Robinhood(username, password);
robinhood.login(() => {
    robinhood.positions((err, response, body) => {
        if (err) throw err;

        let asyncFuncs = [];
        let results: PositionResult[] = body.results;
        results.forEach((result) => {
            let quantity: number = parseFloat(result.quantity);
            let lastUpdate: Date = new Date(result.updated_at);
            if (quantity > 0) {
                asyncFuncs.push((done) => {
                    robinhood.get(result.instrument, (err, response, body: InstrumentResult) => {
                        if (err) throw err;

                        console.log(body.symbol);
                        let symbol: string = body.symbol;
                        done(null, new SellSymbolNoPrice(symbol, quantity, lastUpdate));
                    });
                });
            }
        });

        async.series(asyncFuncs, (err, sellSymbolNoPrices: SellSymbolNoPrice[]) => {
            let symbols: string[] = sellSymbolNoPrices.map(s => s.symbol);
            robinhood.quote_data(symbols.join(','), (err, response, body) => {
                if (err) throw err;
                console.log(body, symbols.join(','));
                let quoteData = body.results;
                let sellSymbols = [];
                sellSymbolNoPrices.forEach((s) => {
                    let price = lookupPrice(quoteData, s.symbol);
                    sellSymbols.push(new SellSymbol(s.symbol, price, s.quantity, s.lastUpdate));
                });
                sellStocks(sellSymbols)
            });
        });

    });
});

function sellStocks(sellSymbols: SellSymbol[]) {
    let asyncFuncs = [];

    sellSymbols.forEach(sellSymbol => {
        if (sellSymbol.isReadyToSell()) {
            console.log(`${sellSymbol.symbol} is ready to sell`);
            asyncFuncs.push((done) => {
                setTimeout(() => {
                    console.log(`Selling ${sellSymbol.quantity} shares of ${sellSymbol.symbol}.`)
                    robinhood.sell(sellSymbol.symbol, sellSymbol.quantity, (err, response, body) => {
                       done(err, body); 
                    });
                }, 1000);
            });
        }
    })


    async.series(asyncFuncs, () => {
        console.log('Completed selling.');
        sellStats.update(sellSymbols);
    });
}

function lookupPrice(quoteData: QuoteDataResult[], symbol: string): number {
    let price = 0;
    quoteData.forEach((quoteItem) => {
        if (quoteItem.symbol === symbol) {
            price = parseFloat(quoteItem.bid_price);
        }
    });
    return price;
}

interface PositionResult {
    account: string; //url
    intraday_quantity: string;
    shares_held_for_sells: string;
    url: string;
    created_at: string;
    updated_at: string;
    shares_held_for_buys: string;
    average_buy_prices: string;
    instrument: string;
    quantity: string;
}

interface InstrumentResult {
    splits: string, //url
    margin_initial_ratio: string;
    url: string;
    quote: string; //url
    symbol: string;
    bloomberg_unique: string;
    list_date: string;
    fundamentals: string; //url
    state: string;
    tradeable: boolean;
    maintenance_ratio: string;
    id: string;
    market: string; //url
    name: string;
}

class SellSymbolNoPrice {
    constructor(public symbol: string, public quantity: number, public lastUpdate: Date) { }
}
'use strict';

import { Robinhood, QuoteDataResult } from '../shared/robinhood.api';
import { validate, isNotWeekend } from '../shared/validate';
import { SellSymbol, hasEnoughTimeElapsedFromDate } from './sell-symbol';
import * as yargs from 'yargs';
import * as async from 'async';

isNotWeekend();
let argv = yargs.argv;
let username = validate('username', argv.username);
let password = validate('password', argv.password);

//Start
async function run() {
    let robinhood = new Robinhood(username, password);
    await robinhood.loginPromise();
    const positions = await robinhood.positionsPromise();
    let results: PositionResult[] = positions.results;
    results = results.filter(r => parseFloat(r.quantity) > 0);
    const orderResponseBody = await robinhood.orders();
    let orders = orderResponseBody.results;
    let sellSymbolPromises: Promise<SellSymbol>[] = orders.filter(o => {
        const hasEnoughTimeElapsed = hasEnoughTimeElapsedFromDate(new Date(o.created_at));
        const currentlyOwned = !!results.find(r => r.instrument === o.instrument);
        return o.state !== 'cancelled' && o.side === 'buy' && hasEnoughTimeElapsed && currentlyOwned;
    }).map(async function(o) {
        const instrument: InstrumentResult = await robinhood.getPromise(o.instrument);
        return new SellSymbol(instrument.symbol, parseFloat(o.quantity), new Date(o.created_at));
    });
    const completed = Promise.all(sellSymbolPromises);
    const sellSymbols: SellSymbol[] = await completed;
    sellStocks(robinhood, sellSymbols); 
}
run();


async function sellStocks(robinhood: Robinhood, sellSymbols: SellSymbol[]) {
    let asyncFuncs = [];

    sellSymbols.forEach(async function(sellSymbol) {
        if (sellSymbol.isReadyToSell()) {
            console.log(`${sellSymbol.symbol} is ready to sell - ${sellSymbol.quantity} stocks`);
            const response = await robinhood.sell(sellSymbol.symbol, sellSymbol.quantity);
            console.log(response);
        }
    })
    console.log('Completed selling.');
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

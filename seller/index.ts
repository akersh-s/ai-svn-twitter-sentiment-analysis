'use strict';

import { Robinhood, QuoteDataResult, Order, OrderResponseBody } from '../shared/robinhood.api';
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
    let orders: Order[] = [];
    let next: string;
    let num: number = 0;
    while ((next || num === 0) && num < 2) {
        console.log('Requesting orders page ' + num);
        const orderResponseBody: OrderResponseBody = next ? await robinhood.getPromise(next) : await robinhood.orders();  
        orders = orders.concat(orderResponseBody.results);
        next = orderResponseBody.next;

        num++;
    }

    let sellSymbolPromises: Promise<SellSymbol>[] = orders.filter(o => {
        const hasEnoughTimeElapsed = hasEnoughTimeElapsedFromDate(new Date(o.created_at));
        const currentlyOwned = !!results.find(r => r.instrument === o.instrument);
        return o.side === 'buy' && hasEnoughTimeElapsed && currentlyOwned;
    }).map(async function (o) {
        const instrument: InstrumentResult = await robinhood.getPromise(o.instrument);
        const position = results.find(r => r.instrument === o.instrument);
        const quantity = Math.min(parseInt(o.quantity), parseInt(position.quantity));
        return new SellSymbol(instrument.symbol, quantity, new Date(o.created_at));
    });
    const completed = Promise.all(sellSymbolPromises);
    let sellSymbols: SellSymbol[] = await completed;
    sellSymbols = sellSymbols.filter((s, i) => {
        const othersOfSymbol = sellSymbols.filter((e, j) => e.symbol === s.symbol && i !== j).sort((a, b) => b.quantity - a.quantity);
        if (othersOfSymbol.length) {
            const largestOther = othersOfSymbol[0];
            return largestOther.quantity < s.quantity;
        }
        else {
            return true;
        }
    });
    sellStocks(robinhood, sellSymbols);
}
run();


async function sellStocks(robinhood: Robinhood, sellSymbols: SellSymbol[]) {
    let asyncFuncs = [];

    sellSymbols.forEach(async function (sellSymbol) {
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

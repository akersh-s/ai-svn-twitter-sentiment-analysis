'use strict';

import { Robinhood, Order, OrderResponseBody } from '../shared/robinhood.api';
import { validate, isNotWeekend } from '../shared/validate';
import { SellSymbol, hasEnoughTimeElapsedFromDate } from './sell-symbol';
import * as yargs from 'yargs';

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
    }).map(async function(o) {
        const instrument: InstrumentResult = await robinhood.getPromise(o.instrument);
        const position = results.find(r => r.instrument === o.instrument);
        const quantity = Math.min(parseInt(o.quantity, 10), parseInt(position.quantity, 10));
        return new SellSymbol(instrument.symbol, quantity, new Date(o.created_at));
    });
    const completed = Promise.all(sellSymbolPromises);
    const sellSymbols: SellSymbol[] = await completed;
    const sellSymbolsFiltered: SellSymbol[] = [];
    let curSellSymbol: SellSymbol;
    while (curSellSymbol = sellSymbols.pop()) {
        const greaterSellSymbols = sellSymbols.filter(s => s.symbol === curSellSymbol.symbol && s.quantity >= curSellSymbol.quantity);
        console.log('Current', curSellSymbol.symbol, curSellSymbol.quantity);
        console.log('Greater ones', greaterSellSymbols);
        if (greaterSellSymbols.length === 0) {
            sellSymbolsFiltered.push(curSellSymbol);
        }
    }
    sellStocks(robinhood, sellSymbolsFiltered);
}
run();

async function sellStocks(robinhood: Robinhood, sellSymbols: SellSymbol[]) {
    sellSymbols.forEach(async function(sellSymbol) {
        if (sellSymbol.isReadyToSell()) {
            console.log(`${sellSymbol.symbol} is ready to sell - ${sellSymbol.quantity} stocks`);
            const response = await robinhood.sell(sellSymbol.symbol, sellSymbol.quantity);
            console.log(response);
        }
    });
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
    splits: string; //url
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

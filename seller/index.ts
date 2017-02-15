'use strict';

import { oneDay, formatDate } from '../shared/util/date-util';
import { changePercent } from '../shared/util/math-util';
import { Robinhood, Order, OrderResponseBody, PositionResult, InstrumentResult } from '../shared/robinhood.api';
import { validate, isNotWeekend } from '../shared/validate';
import { TradeHistory } from '../shared/trade-history.model';
import { Variables } from '../shared/variables';
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
    while ((next || num === 0) && num < 5) {
        console.log('Requesting orders page ' + num);
        const orderResponseBody: OrderResponseBody = next ? await robinhood.getPromise(next) : await robinhood.orders();
        orders = orders.concat(orderResponseBody.results);
        next = orderResponseBody.next;

        num++;
    }

    let sellSymbolPromises: Promise<SellSymbol>[] = orders.filter(o => {
        const currentlyOwned = !!results.find(r => r.instrument === o.instrument);
        return o.side === 'buy' && currentlyOwned;
    }).map(async function (o) {
        const instrument: InstrumentResult = await robinhood.getPromise(o.instrument);
        const position = results.find(r => r.instrument === o.instrument);
        const quantity = Math.min(parseInt(o.quantity, 10), parseInt(position.quantity, 10));
        
        return new SellSymbol(instrument.symbol, quantity, new Date(o.created_at), position.average_buy_price ? parseFloat(position.average_buy_price) : undefined);
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
    const history = TradeHistory.readHistory();
    console.log(sellSymbols);
    for (let i = 0; i < sellSymbols.length; i++) {
        const sellSymbol = sellSymbols[i];
        try {
            const currentPrice = await robinhood.getPriceBySymbol(sellSymbol.symbol);
            const buyHistoryForSymbol = history.filter(h => h.action === 'buy' && h.stock === sellSymbol.symbol);
            const buyPrice = sellSymbol.averageBuyPrice ? sellSymbol.averageBuyPrice : buyHistoryForSymbol.length > 0 ? buyHistoryForSymbol[0].price : Infinity;
            const increase = changePercent(currentPrice, buyPrice);
            const changeInMs = Date.now() - +sellSymbol.lastUpdate;
            const changeInDays = changeInMs / oneDay;
            console.log(`${sellSymbol.symbol} - Current Price: $${currentPrice}, Buy Price: $${buyPrice}, Increase: %${increase.toFixed(2)}, Date Purchased: ${formatDate(sellSymbol.lastUpdate)} (${changeInDays.toFixed(1)} days ago)`);
            if (sellSymbol.isReadyToSell(currentPrice, buyPrice)) {
                console.log(`${sellSymbol.symbol} is ready to sell - ${sellSymbol.quantity} stocks`);
                const price = await robinhood.sell(sellSymbol.symbol, sellSymbol.quantity);
                history.push(new TradeHistory('sell', sellSymbol.symbol, sellSymbol.quantity, price));
                console.log(price);
            }
        } catch (e) {
            console.log(e);
        }
    }
    TradeHistory.writeHistory(history);
    console.log('Completed selling.');
}

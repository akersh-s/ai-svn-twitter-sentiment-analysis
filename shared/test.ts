'use strict';

import { oneDay, formatDate } from '../shared/util/date-util';
import { changePercent } from '../shared/util/math-util';
import { Robinhood, Order, OrderResponseBody, PositionResult, InstrumentResult } from '../shared/robinhood.api';
import { validate, isNotWeekend } from '../shared/validate';
import { TradeHistory } from '../shared/trade-history.model';
import { Variables } from '../shared/variables';
import * as yargs from 'yargs';

let argv = yargs.argv;
let username = 'tomskytwo'
let password = 'Bigapples1!'

//Start
async function run() {
    let robinhood = new Robinhood(username, password);
    await robinhood.loginPromise();
    let orders: Order[] = await collectOrderObjs(robinhood);
    inflateOrderObjs(robinhood, orders);
}
run();

async function collectOrderObjs(robinhood: Robinhood): Promise<Order[]> {
    let orders: Order[] = [];
    let next: string;
    let num: number = 0;
    while ((next || num === 0) && num < 5) {
        console.log('Requesting orders page ' + num);
        const orderResponseBody: OrderResponseBody = next ? await robinhood.getPromise(next) : await robinhood.orders();
        orders = orders.concat(orderResponseBody.results.filter(r => r.state === 'filled'));
        next = orderResponseBody.next;

        num++;
    }
    return orders;
}

async function inflateOrderObjs(robinhood: Robinhood, orders: Order[]): Promise<any[]> {
    const results = await Promise.all(orders.map(async o => {
        const data = await robinhood.getPromise(o.instrument);
        o['symbol'] = data.symbol;
    }));
    return results;
}
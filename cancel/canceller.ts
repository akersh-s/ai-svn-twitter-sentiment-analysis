'use strict';

import { Robinhood } from '../shared/robinhood.api';
import { validate } from '../shared/validate';

import * as yargs from 'yargs';
let argv = yargs.argv;
let username = validate('username', argv.username);
let password = validate('password', argv.password);
const robinhood = new Robinhood(username, password);

async function run() {
    await robinhood.loginPromise();
    const orders = await robinhood.orders();
    const activeOrders = orders.results.filter(order => order.state !== 'cancelled' && order.state !== 'filled');
    if (activeOrders.length > 0) {
        const res = activeOrders.map(async function(activeOrder) {
            return await robinhood.cancel(activeOrder.id);
        });
        const results = await Promise.all(res);
        console.log(results);
    }
    console.log('Completed cancelling');
}
run();

import { Robinhood, Order, OrderResponseBody, InstrumentResult } from '../shared/robinhood.api';
import { formatDate } from '../shared/util/date-util';
import { changePercent } from '../shared/util/math-util';

import * as yargs from 'yargs';
import * as fs from 'fs';

const numDays = yargs.argv['num-days'] || 7;
const numDaysMs = numDays * 8.64e+7;
review();

async function review() {
    const robinhood = new Robinhood(yargs.argv['username'], yargs.argv['password']);
    await robinhood.loginPromise();

    const orderItems = await collectOrderItems(robinhood);
    //const orderItems = JSON.parse(fs.readFileSync('./order-items.json', 'utf-8')).map(i => new OrderItem(i.symbol, i.quantity, i.price, new Date(i.date), i.side));
    findGainLoss(orderItems);
}


class OrderItem {
    constructor(
        public symbol: string,
        public quantity: number,
        public price: number,
        public date: Date,
        public side: 'buy' | 'sell'
    ) { }
}

async function collectOrderItems(robinhood: Robinhood): Promise<OrderItem[]> {
    let orders: Order[] = [];
    let next: string;
    let num: number = 0;
    const maxIterations = 20;
    while ((next || num === 0) && num < maxIterations) {
        console.log('Requesting orders page ' + num);
        const orderResponseBody: OrderResponseBody = next ? await robinhood.getPromise(next) : await robinhood.orders();
        orders = orders.concat(orderResponseBody.results);
        next = orderResponseBody.next;
        num++;
        const oldest = orderResponseBody.results[0];
        const oldestDate = new Date(oldest.updated_at);
        if ((Date.now() - +oldestDate) > numDaysMs) {
            num = maxIterations;
        }
    }

    const orderItems: OrderItem[] = await Promise.all(orders.filter(o => {
        if (o.state === 'cancelled') {
            return false;
        }
        if (o.side === 'buy') {
            return true;
        }
        if (o.side === 'sell') {
            const date = new Date(o.updated_at);
            return ((Date.now() - +date) < numDaysMs)
        }
        return false;
    }).map(async function(o) {
        const instrument: InstrumentResult = await robinhood.getPromise(o.instrument);
        const quantity = Math.min(parseInt(o.quantity, 10));
        return new OrderItem(instrument.symbol, quantity, parseFloat(o.average_price), new Date(o.created_at), o.side as ('buy' | 'sell'));
    }));

    //fs.writeFileSync('./order-items.json', JSON.stringify(orderItems, null, 4), 'utf-8');

    return orderItems;
}

function findGainLoss(orderItems: OrderItem[]) {
    let fullBuy = 0;
    let fullSell = 0;
    const todaysSells = orderItems.filter(o => o.side === 'sell');
    todaysSells.forEach((todaySell) => {
        const equivBuy = findRelatedBuy(orderItems.filter(t => t.symbol === todaySell.symbol && todaySell.date > t.date));
        if (equivBuy) {
            const increaseAmount = changePercent(todaySell.price, equivBuy.price);
            const totalBuy = equivBuy.price * equivBuy.quantity;
            const totalSell = todaySell.price * equivBuy.quantity;

            fullBuy += totalBuy;
            fullSell += totalSell;
            console.log(`Attempted to sell ${todaySell.quantity} shares of ${todaySell.symbol} at $${todaySell.price.toFixed(2)} on ${formatDate(todaySell.date)}, likely purchased at $${equivBuy.price.toFixed(2)} on ${formatDate(equivBuy.date)}, Percent Changed: %${increaseAmount.toFixed(2)}`);
        }
    });
    const word = fullBuy < fullSell ? 'gained' : 'lost';
    const change = Math.abs(changePercent(fullSell, fullBuy));
    console.log(`You overall ${word} %${change}. Total Buy: $${fullBuy.toFixed(2)} Total Sell: $${fullSell.toFixed(2)}`);
}

function findRelatedBuy(oi: OrderItem[]): OrderItem {
    return oi.sort((a, b) => +b.date - +a.date).find(a => true);
}

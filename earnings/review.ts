import { Robinhood, Order, OrderResponseBody, InstrumentResult } from '../shared/robinhood.api';
import { formatDate } from '../shared/util/date-util';
import { changePercent } from '../shared/util/math-util';
import { findMedian, findMean } from '../scripts/run-loop/median';
import { Transaction } from './transaction.model';

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
        orders = orders.concat(orderResponseBody.results.filter(r => r.state === 'filled'));
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
    const transactions = Transaction.readTransactions();
    
    let fullBuy = 0;
    let fullSell = 0;
    const percents: number[] = [];
    const todaysSells = orderItems.filter(o => o.side === 'sell');
    todaysSells.forEach((todaySell) => {
        const equivBuy = findRelatedBuy(orderItems.filter(t => t.symbol === todaySell.symbol && todaySell.date > t.date));
        if (equivBuy && !isNaN(todaySell.price) && !isNaN(equivBuy.price)) {
            const increaseAmount = changePercent(todaySell.price, equivBuy.price);
            const totalBuy = equivBuy.price * equivBuy.quantity;
            const totalSell = todaySell.price * equivBuy.quantity;
            const earning = totalSell - totalBuy;

            fullBuy += totalBuy;
            fullSell += totalSell;
            console.log(`Sold ${todaySell.quantity} shares of ${todaySell.symbol} at $${formatPrice(todaySell.price)} on ${formatDate(todaySell.date)}, purchased at $${formatPrice(equivBuy.price)} on ${formatDate(equivBuy.date)}, Percent Changed: %${increaseAmount.toFixed(2)}, Total Earning: $${earning.toFixed(2)}`);
            transactions.push(new Transaction(equivBuy.date, equivBuy.price, todaySell.date, todaySell.price, todaySell.symbol, todaySell.quantity));
            percents.push(increaseAmount);
        }
    });
    const word = fullBuy < fullSell ? 'gained' : 'lost';
    const change = Math.abs(changePercent(fullSell, fullBuy));
    console.log(`You overall ${word} %${change.toFixed(3)}. Total Buy: $${fullBuy.toFixed(2)} Total Sell: $${fullSell.toFixed(2)}`);

    const mean = findMean(percents)
    const median = findMedian(percents);
    const numAbove0 = percents.filter(n => n > 0).length;
    const numBelow0 = percents.filter(n => n < 0).length;
    const num0 = percents.filter(n => n === 0).length;
    const percentAbove = (numAbove0 / percents.length) * 100;
    console.log(`Mean: %${mean.toFixed(2)}, Median: %${median.toFixed(2)}, Above 0: ${numAbove0}, Below 0: ${numBelow0}, Num 0: ${num0}, Percent Above: %${percentAbove.toFixed(2)}`);

    
    Transaction.writeTransactions(transactions);
}

function findRelatedBuy(oi: OrderItem[]): OrderItem {
    return oi.sort((a, b) => +b.date - +a.date).find(a => true);
}

function formatPrice(price: number): string {
    if (price < 0.9) {
        return price + '';
    }
    else {
        return price.toFixed(2);
    }
}

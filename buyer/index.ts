import {Robinhood} from '../shared/robinhood.api';
import {validate, isNotWeekend} from '../shared/validate';
import {today, formatDate} from '../shared/util/date-util';
import {BuySymbol, determineNumToBuy} from './buy-symbol';
import {FileUtil} from '../shared/util/file-util';
import {Variables} from '../shared/variables';
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as async from 'async';

let argv = yargs.argv;
let username = validate('username', argv.username);
let password = validate('password', argv.password);

if (!fs.existsSync(FileUtil.buyFile)) {
    console.log(`Buy file is missing. Exiting.`);
    process.exit(-1);
}
let stockSymbolsToBuy: string[] = JSON.parse(fs.readFileSync(FileUtil.buyFile, 'utf-8'));

runBuyer();
async function runBuyer(): Promise<any> {
    //Start
    let robinhood = new Robinhood(username, password);
    await robinhood.loginPromise();

    stockSymbolsToBuy = await filterOutNonOwnedStocks(robinhood, stockSymbolsToBuy);
    const quoteDataBody = await robinhood.quote_dataPromise(stockSymbolsToBuy.join(','));
    const results = quoteDataBody.results;
    const buySymbols: BuySymbol[] = [];
    results.forEach((result) => {
        if (result && result.symbol) {
            buySymbols.push(new BuySymbol(result.symbol, parseFloat(result.bid_price)));
        }
    });
    const accounts = await robinhood.accountsPromise();
    const account = accounts.results[0];
    const buyingPower: number = parseFloat(account.buying_power);

    const portfolioBody = await robinhood.getPromise(account.portfolio);

    const portionOfPreviousEquity = parseFloat(portfolioBody.last_core_equity) / (Variables.numDays - 1); // Allow for one day with no results.
    const amountOfMoneySpentToday = await getAmountOfMoneySpentToday(robinhood);
    const maxAmountOfMoneyToSpend = Math.max(0, Math.min(buyingPower - amountOfMoneySpentToday, portionOfPreviousEquity - amountOfMoneySpentToday));
    console.log(`Amount of money to spend: $${maxAmountOfMoneyToSpend}`);
    determineNumToBuy(maxAmountOfMoneyToSpend, buySymbols);

    console.log(JSON.stringify(buySymbols, null, 4));
    await buyStocks(robinhood, buySymbols);
}

async function filterOutNonOwnedStocks(robinhood: Robinhood, stockList: string[]): Promise<string[]> {
    const positionData = await robinhood.positionsPromise();
    const positions = positionData.results;
    const ownedSymbols: string[] = [];
    for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        const quantity = parseFloat(position.quantity);
        if (quantity > 0) {
            try {
                const instrumentData = await robinhood.getPromise(positions[i].instrument);
                const symbol = instrumentData.symbol;
                console.log(`Currently own ${quantity} shares of ${symbol}`);
                ownedSymbols.push(symbol);
            }
            catch (e) {
                console.log(e);
            }
        }

    }
    const nonOwnedSymbols = stockList.filter(s => ownedSymbols.indexOf(s) === -1);
    console.log(`Stocks not owned: ${nonOwnedSymbols.join(', ')}`)
    return nonOwnedSymbols;
}

async function getAmountOfMoneySpentToday(robinhood: Robinhood): Promise<number> {
    const positionData = await robinhood.positionsPromise();
    let positions = positionData.results;
    let moneySpentToday = 0;
    const formattedToday = formatDate(today);
    positions.forEach(p => {
        const formattedDate = formatDate(new Date(p.updated_at));
        const quantity = parseFloat(p.quantity);
        const averageBuyPrice = parseFloat(p.average_buy_price);
        if (formattedDate === formattedToday && quantity > 0) {
            moneySpentToday += (quantity * averageBuyPrice);
        }
    });
    console.log(`Amount of money spent today: $${moneySpentToday}`);
    return moneySpentToday;
}

async function buyStocks(robinhood: Robinhood, buySymbols: BuySymbol[]) {
    let asyncFuncs = [];
    let body;
    buySymbols = buySymbols.filter(b => b.numToBuy !== 0);

    for (let i = 0; i < buySymbols.length; i++) {
        let buySymbol = buySymbols[i];

        console.log(`Requesting ${buySymbol.numToBuy} shares of ${buySymbol.symbol} at price $${buySymbol.price}...`);
        body = await robinhood.buyPromise(buySymbol.symbol, buySymbol.numToBuy);
        console.log(`Completed purchase request for ${buySymbol.numToBuy} shares of ${buySymbol.symbol}!`, body);
        await sleep(1000);
    }

    console.log('Completed purchases.');
}

async function sleep(time: number): Promise<any> {
    return new Promise<any>((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

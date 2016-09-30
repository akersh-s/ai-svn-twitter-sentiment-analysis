import {Robinhood} from '../shared/robinhood.api';
import {validate, isNotWeekend} from '../shared/validate';
import {today, formatDate} from '../shared/util/date-util';
import {BuySymbol, determineNumToBuy} from './buy-symbol';
import {SvmResult} from '../svm/svm-result';
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
let stockSymbolsToBuy: SvmResult[] = SvmResult.readArrayFromFile(FileUtil.buyFile);

runBuyer();
async function runBuyer(): Promise<any> {
    //Start
    let robinhood = new Robinhood(username, password);
    await robinhood.loginPromise();

    stockSymbolsToBuy = await filterOutNonOwnedStocks(robinhood, stockSymbolsToBuy);
    stockSymbolsToBuy = stockSymbolsToBuy.filter(svmResult => svmResult.probability > 0.5);
    const quoteDataBody = await robinhood.quote_dataPromise(stockSymbolsToBuy.map((svmResult => svmResult.prediction.symbol.replace(/\$/, ''))).join(','));
    const results = quoteDataBody.results;
    const buySymbols: BuySymbol[] = [];
    results.forEach((result) => {
        if (result && result.symbol) {
            const svmResult: SvmResult = stockSymbolsToBuy.find(s => s.prediction.symbol.replace(/\$/, '') === result.symbol);
            svmResult && buySymbols.push(new BuySymbol(result.symbol, parseFloat(result.bid_price), svmResult));
        }
    });
    const accounts = await robinhood.accountsPromise();
    const account = accounts.results[0];
    const buyingPower: number = parseFloat(account.buying_power);

    const portfolioBody = await robinhood.getPromise(account.portfolio);

    const previousEquity = parseFloat(portfolioBody.last_core_equity);
    const maxAmountOfMoneyToSpend = Math.max(0, Math.min(buyingPower * 0.95, previousEquity));
    console.log(`Amount of money to spend: $${maxAmountOfMoneyToSpend}`);
    determineNumToBuy(maxAmountOfMoneyToSpend, previousEquity, buySymbols);

    console.log(JSON.stringify(buySymbols, null, 4));
    await buyStocks(robinhood, buySymbols);
}

async function filterOutNonOwnedStocks(robinhood: Robinhood, stockList: SvmResult[]): Promise<SvmResult[]> {
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
    const nonOwnedSymbols = stockList.filter(s => ownedSymbols.indexOf(s.prediction.symbol.replace(/\$/, '')) === -1);
    console.log(`Stocks not owned: ${nonOwnedSymbols.map(n => n.prediction.symbol).join(', ')}`)
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
        await sleep(Math.floor(Math.random() * 10000));
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

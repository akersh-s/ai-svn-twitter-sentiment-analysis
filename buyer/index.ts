import { Robinhood } from '../shared/robinhood.api';
import { validate } from '../shared/validate';
import { BuySymbol, determineNumToBuy } from './buy-symbol';
import { SvmResult } from '../svm/svm-result';
import { FileUtil } from '../shared/util/file-util';
import { TradeHistory } from '../shared/trade-history.model';

import * as yargs from 'yargs';
import * as fs from 'fs';

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
    //stockSymbolsToBuy = stockSymbolsToBuy.filter(svmResult => svmResult.probability > 0.3);
    const quoteDataBody = await robinhood.quote_dataPromise(stockSymbolsToBuy.map((svmResult => svmResult.prediction.symbol.replace(/\$/, ''))).join(','));
    const results = quoteDataBody.results;
    const buySymbols: BuySymbol[] = [];
    results.forEach((result) => {
        if (result && result.symbol) {
            const svmResult: SvmResult = stockSymbolsToBuy.find(s => s.prediction.symbol.replace(/\$/, '') === result.symbol);
            svmResult && buySymbols.push(new BuySymbol(result.symbol, parseFloat(result.last_trade_price), svmResult));
        }
    });
    const accounts = await robinhood.accountsPromise();
    const account = accounts.results[0];
    const buyingPower: number = parseFloat(account.buying_power);
    let buyingPowerWithGold = buyingPower;
    if (account.margin_balances && account.margin_balances.unallocated_margin_cash) {
        const unallocatedMarginCash = parseFloat(account.margin_balances.unallocated_margin_cash);
        buyingPowerWithGold = Math.max(buyingPower, unallocatedMarginCash);
    }

    const portfolioBody = await robinhood.getPromise(account.portfolio);

    const previousEquity = parseFloat(portfolioBody.last_core_equity);
    const maxAmountOfMoneyToSpend = Math.max(0, Math.min(buyingPowerWithGold, previousEquity));
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
    console.log(`Stocks not owned: ${nonOwnedSymbols.map(n => n.prediction.symbol).join(', ')}`);
    return nonOwnedSymbols;
}

async function buyStocks(robinhood: Robinhood, buySymbols: BuySymbol[]) {
    let price: number;
    buySymbols = buySymbols.filter(b => b.numToBuy !== 0);
    const history = TradeHistory.readHistory();
    for (let i = 0; i < buySymbols.length; i++) {
        let buySymbol = buySymbols[i];
        console.log(`Requesting ${buySymbol.numToBuy} shares of ${buySymbol.symbol} at price $${buySymbol.price}...`);
        price = await robinhood.buyPromise(buySymbol.symbol, buySymbol.numToBuy);
        history.push(new TradeHistory('buy', buySymbol.symbol, buySymbol.numToBuy, price));
        console.log(`Completed purchase request for ${buySymbol.numToBuy} shares of ${buySymbol.symbol}!`, price);
        await sleep(Math.floor(Math.random() * 10000));
    }
    TradeHistory.writeHistory(history);
    console.log('Completed purchases.');
}

async function sleep(time: number): Promise<any> {
    return new Promise<any>((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

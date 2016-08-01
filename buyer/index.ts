import {Robinhood} from '../shared/robinhood.api';
import {validate, isNotWeekend} from '../shared/validate';
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

//Start
let robinhood = new Robinhood(username, password);
robinhood.login(() => {
    robinhood.quote_data(stockSymbolsToBuy.join(','), (err, response, body) => {
        if (err) throw err;

        const results = body.results;
        const buySymbols: BuySymbol[] = [];
        results.forEach((result) => {
            if (result && result.symbol) {
                buySymbols.push(new BuySymbol(result.symbol, parseFloat(result.bid_price)));
            }
        });
        robinhood.accounts((err, response, body) => {
            if (err) throw err;

            const account = body.results[0];

            const buyingPower: number = parseFloat(account.buying_power);
            
            
            robinhood.get(account.portfolio, (err, response, body) => {
                if (err) throw err;

                const portionOfPreviousEquity = parseFloat(body.last_core_equity) / Variables.numDays;
                const maxAmountOfMoneyToSpend = Math.min(buyingPower, portionOfPreviousEquity);
                determineNumToBuy(maxAmountOfMoneyToSpend, buySymbols);

                console.log(JSON.stringify(buySymbols, null, 4));
                buyStocks(robinhood, buySymbols);
            })
            
        });

    });
});

function buyStocks(robinhood: Robinhood, buySymbols: BuySymbol[]) {
    let asyncFuncs = [];

    buySymbols.forEach((buySymbol) => {
        asyncFuncs.push((done) => {
            if (buySymbol.numToBuy === 0) {
                return done();
            }
            //Sleep between purchases so it looks less automated.
            setTimeout(() => {
                console.log(`Requesting ${buySymbol.numToBuy} shares of ${buySymbol.symbol}...`);
                robinhood.buy(buySymbol.symbol, buySymbol.numToBuy, (err, response, body) => {
                    if (err) throw err;

                    console.log(`Completed purchase request for ${buySymbol.numToBuy} shares of ${buySymbol.symbol}!`, body);
                    done();
                });
            }, 10000);
        });
    });

    async.series(asyncFuncs, () => {
        console.log('Completed purchases.');
    });
}
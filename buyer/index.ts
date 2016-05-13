import {Robinhood} from '../shared/robinhood.api';
import {validate, isNotWeekend} from '../shared/validate';
import {BuySymbol, determineNumToBuy} from './buy-symbol';
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as async from 'async';

isNotWeekend();
let argv = yargs.argv;
let username = validate('username', argv.username);
let password = validate('password', argv.password);
let buyFile = path.join(__dirname, '..', 'buy.json');

if (!fs.existsSync(buyFile)) {
    console.log(`Buy file is missing. Exiting.`);
    process.exit(-1);
}
let stockSymbolsToBuy: string[] = JSON.parse(fs.readFileSync(buyFile, 'utf-8'));

//Start
let robinhood = new Robinhood(username, password);
robinhood.login(() => {
    robinhood.quote_data(stockSymbolsToBuy.join(','), (err, response, body) => {
        if (err) throw err;
        console.log(body.results);
        let results = body.results;
        let buySymbols: BuySymbol[] = [];
        results.forEach((result) => {
            if (result && result.symbol) {
              buySymbols.push(new BuySymbol(result.symbol, parseFloat(result.bid_price)));  
            }
        });
        robinhood.accounts((err, response, body) => {
            if (err) throw err;

            var account = body.results[0];
            let buyingPower:number = parseFloat(account.buying_power);
            determineNumToBuy(buyingPower, buySymbols);
            console.log(JSON.stringify(buySymbols, null, 4));
            
            buyStocks(robinhood, buySymbols);
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
          }, 1000); 
       });
    });
    
    async.series(asyncFuncs, () => {
        console.log('Completed purchases.');
    });
}
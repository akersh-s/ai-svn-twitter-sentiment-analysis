import {BuyUtil} from './buy.util';
const MIN_SYMBOL_SPEND = 100; //Min $100 per symbol
const MIN_SYMBOLS = 3;

export class BuySymbol {
    numToBuy: number = 0;
    constructor(public symbol: string, public price: number) { }
}

export function determineNumToBuy(buyPower: number, buySymbols: BuySymbol[]): void {
    if (buySymbols.length === 0) {
        return;
    }
    let currentPower = buyPower * 0.95; //Robinhood only allows you spend 95%
    buySymbols = BuyUtil.getRandomSubset(buySymbols, Math.floor(currentPower / MIN_SYMBOL_SPEND));
    let shareForEach = currentPower / Math.max(buySymbols.length, MIN_SYMBOLS);
    buySymbols.forEach((buySymbol) => {
        var amountToSpend = Math.max(buySymbol.price, shareForEach);
        amountToSpend = Math.min(currentPower, amountToSpend);

        while (amountToSpend > buySymbol.price) {
            buySymbol.numToBuy++;
            currentPower -= buySymbol.price;
            amountToSpend -= buySymbol.price;
        }
    });

    if (buySymbols.length > MIN_SYMBOLS) {
        //Finish remaining money off the top down
        var i;
        for (i = 0; i < 3; i++) {
            buySymbols.forEach((buySymbol) => {
                if (currentPower > buySymbol.price) {
                    buySymbol.numToBuy++;
                    currentPower -= buySymbol.price;
                }
            });
        }
    }

}

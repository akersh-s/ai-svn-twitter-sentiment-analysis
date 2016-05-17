export class BuySymbol {
    numToBuy: number = 0;
    constructor(public symbol: string, public price: number) { }
}

let MIN_SYMBOLS = 3;
export function determineNumToBuy(buyPower: number, buySymbols: BuySymbol[]): void {
    if (buySymbols.length === 0) {
        return;
    }
    var currentPower = buyPower * 0.95; //Robinhood only allows you spend 95%
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
        buySymbols.forEach((buySymbol) => {
            while (currentPower > buySymbol.price) {
                buySymbol.numToBuy++;
                currentPower -= buySymbol.price;
            }
        });
    }

}
export class BuySymbol {
    numToBuy: number = 0;
    constructor(public symbol: string, public price: number) {}
}

export function determineNumToBuy(buyPower: number, buySymbols: BuySymbol[]):void {
    if (buySymbols.length === 0) {
        return;
    }
    var currentPower = buyPower * 0.95; //Robinhood only allows you spend 95%
    let shareForEach = currentPower / Math.max(buySymbols.length, 3);
    buySymbols.forEach((buySymbol) => {
         var amountToSpend = Math.max(buySymbol.price, shareForEach);
         amountToSpend = Math.min(currentPower, amountToSpend);
         
         while (amountToSpend > buySymbol.price) {
             buySymbol.numToBuy++;
             currentPower -= buySymbol.price;
             amountToSpend -= buySymbol.price;
         }
    });
    
    //Finish remaining money off the top down
    buySymbols.forEach((buySymbol) => {
        while (currentPower > buySymbol.price) {
            buySymbol.numToBuy++;
            currentPower -= buySymbol.price;
        } 
    })
}
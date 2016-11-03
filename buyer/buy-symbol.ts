import { SvmResult } from '../svm/svm-result';

export class BuySymbol {
    numToBuy: number = 0;
    constructor(public symbol: string, public price: number, public svmResult: SvmResult) { }
}

export function determineNumToBuy(buyPower: number, equity: number, buySymbols: BuySymbol[]): void {
    if (buySymbols.length === 0) {
        return;
    }

    let currentPower = buyPower;
    buySymbols.forEach((buySymbol) => {
<<<<<<< HEAD
        const moneyToSpend = Math.min(buyPower / 9, currentPower);
=======
        const probabilityVal: number = (buySymbol.svmResult.probability - 0.5);
        const moneyToSpend = Math.min(buyPower / 30, currentPower);
>>>>>>> d96ee0ae0dae6a83085480e69ce0466c77cb3b61
        let moneySpent = 0;
        while (currentPower > buySymbol.price && moneySpent < (moneyToSpend - buySymbol.price)) {
            buySymbol.numToBuy++;
            currentPower -= buySymbol.price;
            moneySpent += buySymbol.price;
        }
    });
}

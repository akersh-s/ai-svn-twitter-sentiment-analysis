import { SvmResult } from '../svm/svm-result';
import { Variables } from '../shared/variables';

export class BuySymbol {
    numToBuy: number = 0;
    constructor(public symbol: string, public price: number, public svmResult: SvmResult) { }
}

export function determineNumToBuy(buyPower: number, equity: number, buySymbols: BuySymbol[]): void {
    if (buySymbols.length === 0) {
        return;
    }

    const numToBuy = Math.min(Variables.topNumToBuy, buySymbols.length);

    let currentPower = buyPower;
    buySymbols.forEach((buySymbol) => {
        const moneyToSpend = Math.min(buyPower / numToBuy, currentPower);
        let moneySpent = 0;
        while (currentPower > buySymbol.price && moneySpent < (moneyToSpend - buySymbol.price)) {
            buySymbol.numToBuy++;
            currentPower -= buySymbol.price;
            moneySpent += buySymbol.price;
        }
    });
}

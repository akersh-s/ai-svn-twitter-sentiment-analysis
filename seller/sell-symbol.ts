import { oneDay, getDaysAgo } from '../shared/util/date-util';
import { Variables } from '../shared/variables';

export class SellSymbol {
    constructor(public symbol: string, public quantity: number, public lastUpdate: Date) { }

    isReadyToSell(currentPrice: number, buyPrice: number): boolean {
        return this.hasEnoughTimeElapsed() || (Variables.sellOnFirstIncrease && this.hasMinimumTimeElapsed() && this.hasPriceIncreasedMinimum(currentPrice, buyPrice));
    }

    hasEnoughTimeElapsed(): boolean {
        return hasEnoughTimeElapsedFromDate(this.lastUpdate);
    }

    hasMinimumTimeElapsed(): boolean {
        return hasEnoughTimeElapsedFromDate(this.lastUpdate, 1);
    }

    hasPriceIncreasedMinimum(currentPrice: number, buyPrice: number): boolean {
        if (!currentPrice || !buyPrice) {
            return false;
        }
        const increasedPrice = 100 * ((currentPrice - buyPrice) / buyPrice);
        return increasedPrice > Variables.sellOnIncreaseAmount;
    }
}

export function hasEnoughTimeElapsedFromDate(lastUpdate: Date, numDays?: number) {
    let sellDate = getDaysAgo((numDays || Variables.numDays) * -1, lastUpdate);
    sellDate = new Date(+sellDate - (oneDay / 2));

    return Date.now() > +sellDate;
}

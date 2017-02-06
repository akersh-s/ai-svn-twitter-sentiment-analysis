import { oneDay, getDaysAgo } from '../shared/util/date-util';
import { Variables } from '../shared/variables';

export class SellSymbol {
    constructor(public symbol: string, public quantity: number, public lastUpdate: Date) { }

    isReadyToSell(currentPrice: number, buyPrice: number): boolean {
        //return this.hasMinimumTimeElapsed();
        return this.hasEnoughTimeElapsed() || (Variables.sellOnIncrease && this.hasMinimumTimeElapsed() && this.hasPriceIncreasedMinimum(currentPrice, buyPrice));
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
        const daysPast = Math.floor((Date.now() - +this.lastUpdate) / 86400000);
        const increasedPrice = 100 * ((currentPrice - buyPrice) / buyPrice);
        return increasedPrice >= Variables.calculateSellAmountForDayIndex(daysPast) || increasedPrice <= Variables.calculateSellWallForDayIndex(daysPast);
    }
}

export function hasEnoughTimeElapsedFromDate(lastUpdate: Date, numDays?: number) {
    let sellDate = getDaysAgo((numDays || Variables.numDays) * -1, lastUpdate);
    sellDate = new Date(+sellDate - (oneDay / 2));

    return Date.now() > +sellDate;
}

import { oneDay, getDaysAgo } from '../shared/util/date-util';
import { Variables } from '../shared/variables';

export class SellSymbol {
    constructor(public symbol: string, public quantity: number, public lastUpdate: Date) { }

    isReadyToSell(): boolean {
        return this.hasEnoughTimeElapsed();
    }

    hasEnoughTimeElapsed(): boolean {
        return hasEnoughTimeElapsedFromDate(this.lastUpdate);
    }
}

export function hasEnoughTimeElapsedFromDate(lastUpdate: Date) {
    let sellDate = getDaysAgo(Variables.numDays * -1, lastUpdate);
    sellDate = new Date(+sellDate - (oneDay / 2));

    return Date.now() > +sellDate;
}

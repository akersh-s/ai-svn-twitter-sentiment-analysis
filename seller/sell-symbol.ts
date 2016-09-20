import * as fs from 'fs';
import { FileUtil } from '../shared/util/file-util';
import { oneDay, getDaysAgo } from '../shared/util/date-util';
import { Variables } from '../shared/variables';

const sellCurrentPrice = 0.998; //If it drops 0.2% from the highest recorded price, sell the stock.
export class SellSymbol {
    constructor(public symbol: string, public quantity: number, public lastUpdate: Date) { }

    isReadyToSell(): boolean {
        /*const sellStat = sellStats.findForSymbol(this.symbol);
        if (!this.hasEnoughTimeElapsed() || !sellStat) {
            return false;
        } 
        var allowedDropAmount = sellStat.price * sellCurrentPrice;
        
        return this.price < allowedDropAmount;*/
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

/*class SellStats {
    sellStats: SellStat[];
    constructor() {
        if (fs.existsSync(FileUtil.sellStatsFile)) {
            this.sellStats = JSON.parse(fs.readFileSync(FileUtil.sellStatsFile, 'utf-8')).map(item => {
                return new SellStat(item.symbol, item.price, new Date(item.date));
            });
        }
        else {
            this.sellStats = [];
        }
    }

    findForSymbol(symbol: string): SellStat {
        let sellStat = undefined;
        this.sellStats.forEach(s => {
            if (s.symbol === symbol) {
                sellStat = s;
            }
        });
        return sellStat;
    }

    update(sellSymbols: SellSymbol[]) {
        let newSellStats: SellStat[] = sellSymbols.map(s => {
            let oldSellStat = this.findForSymbol(s.symbol);
            let oldPrice: number = oldSellStat ? oldSellStat.price : 0;
            return new SellStat(s.symbol, /*Math.max(s.price, oldPrice), new Date());
        });

        fs.writeFileSync(FileUtil.sellStatsFile, JSON.stringify(newSellStats, null, 4), 'utf-8');
    }
}

class SellStat {
    constructor(public symbol: string, public date: Date) { }
}

export const sellStats = new SellStats();
*/
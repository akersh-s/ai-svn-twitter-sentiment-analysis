import * as fs from 'fs';
import {FileUtil} from '../shared/util/file-util';
let tHours = 1000 * 60 * 60 * 12; //12 hours 
const sellCurrentPrice = 0.998; //If it drops 0.2% from the highest recorded price, sell the stock.
export class SellSymbol {
    constructor(public symbol: string, public price: number, public quantity: number, public lastUpdate: Date) {}
    
    isReadyToSell(): boolean {
        let now = new Date();
        let elapsedTime:number = +now - +this.lastUpdate;
        const enoughTimeElapsed = elapsedTime > tHours;
        const sellStat = sellStats.findForSymbol(this.symbol);
        if (!enoughTimeElapsed || !sellStat) {
            return false;
        } 
        var allowedDropAmount = sellStat.price * sellCurrentPrice;
        
        return this.price < allowedDropAmount;
    }
}

class SellStats {
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
    
    findForSymbol(symbol: string):SellStat {
        let sellStat = undefined;
        this.sellStats.forEach(s => {
            if (s.symbol === symbol) {
                sellStat = s;
            }
        });
        return sellStat;
    }
    
    update(sellSymbols: SellSymbol[]) {
        let newSellStats:SellStat[] = sellSymbols.map(s => {
           let oldSellStat = this.findForSymbol(s.symbol);
           let oldPrice:number = oldSellStat ? oldSellStat.price : 0;
           return new SellStat(s.symbol, Math.max(s.price, oldPrice), new Date()); 
        });
        
        fs.writeFileSync(FileUtil.sellStatsFile, JSON.stringify(newSellStats, null, 4), 'utf-8');
    }
}

class SellStat {
    constructor(public symbol: string, public price: number, public date: Date) {}
}

export const sellStats = new SellStats();

import { DaySentiment } from '../sentiment/model/day-sentiment.model';
import { formatDate } from '../shared/util/date-util';

export class StockClosePercent {
    public percent: number;
    public futureQuote: number;
    public currentQuote: number;
    constructor(public symbol: string, public future: DaySentiment, public current: DaySentiment, multiplier?: number) {
        this.futureQuote = this.future.price;
        this.currentQuote = this.current.price;
        if (!this.futureQuote || !this.currentQuote) {
            this.percent = 0;
        }
        else {
            this.percent = ((this.futureQuote - this.currentQuote) / this.currentQuote) * 100;
        }
        if (multiplier) {
            this.percent = this.percent * multiplier;
        }
    }

    toString() {
        return `${this.symbol}: %${this.percent}, Current: ${this.currentQuote}, Future: ${this.futureQuote}, Current Day: ${formatDate(this.current.day)}, Future Day: ${formatDate(this.future.day)}`;
    }

    static findAverage(stockClosePercents: StockClosePercent[]): number {
        if (stockClosePercents.length === 0) {
            return 0;
        }
        let totalPercent = stockClosePercents.map(buy => buy.percent).reduce((a, b) => a + b);
        return totalPercent / stockClosePercents.length;
    }
}

export type StockClose = {
    stock: string;
    close: number;
};

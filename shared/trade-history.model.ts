import * as path from 'path';
import * as fs from 'fs';
import { formatDate, getDaysAgo, today } from './util/date-util';
import { FileUtil } from './util/file-util';
import { Variables } from './variables';

export class TradeHistory {
    constructor(
        public action: 'buy' | 'sell',
        public stock: string,
        public quantity: number,
        public price: number,
        public date?: Date
    ) {
        if (!this.date) {
            this.date = new Date();
        }
    }

    static tradeHistoryPathForDate(date?: Date | string): string {
        if (!date) {
            return path.join(FileUtil.userHome, `trade-history.json`);;
        }
        const fDate = date instanceof Date ? formatDate(date) : date;
        return path.join(FileUtil.userHome, `trade-history-${fDate}.json`);
    }

    static readHistory(): TradeHistory[] {
        let day: Date = today;
        const history: TradeHistory[] = TradeHistory.readHistoryForDate();
        for (let i = 0; i < (Variables.numDays + 5); i++) {
            TradeHistory.readHistoryForDate(day).forEach(t => history.push(t));
            day = getDaysAgo(i, today);
        }
        return history;
    }

    static readHistoryForDate(date?: Date): TradeHistory[] {
        const path = TradeHistory.tradeHistoryPathForDate(date);
        if (fs.existsSync(path)) {
            const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
            return json.map(i => new TradeHistory(i.action, i.stock, i.quantity, i.price, new Date(i.date)));
        }
        else {
            return [];
        }
    }

    static writeHistory(th: TradeHistory[]): void {
        const uniqueDates = TradeHistory.findUniqueFormattedDates(th);
        uniqueDates.forEach(date => {
            console.log('Writing history for Date: ' + date);
            const path = TradeHistory.tradeHistoryPathForDate(date);
            const ths = th.filter(t => formatDate(t.date) === date);
            fs.writeFileSync(path, JSON.stringify(ths, null, 4), 'utf-8');
        });

    }

    static findUniqueFormattedDates(th: TradeHistory[]): string[] {
        const set = new Set<string>();
        th.forEach(t => set.add(formatDate(t.date)));
        return Array.from(set);
    }
}

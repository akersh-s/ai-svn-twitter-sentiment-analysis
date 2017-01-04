import * as path from 'path';
import * as fs from 'fs';

import { FileUtil } from './util/file-util';
const tradeHistoryPath = path.join(FileUtil.userHome, 'trade-history.json');

export class TradeHistory {
    public date: Date = new Date();
    constructor(
        public action: 'buy' | 'sell',
        public stock: string,
        public quantity: number,
        public price: number
    ) { }

    static readHistory(): TradeHistory[] {
        if (fs.existsSync(tradeHistoryPath)) {
            const json = JSON.parse(fs.readFileSync(tradeHistoryPath, 'utf-8'));
            return json.map(i => new TradeHistory(i.action, i.stock, i.quantity, i.price));
        }
        else {
            return [];
        }
    }

    static writeHistory(th: TradeHistory[]): void {
        fs.writeFileSync(tradeHistoryPath, JSON.stringify(th, null, 4), 'utf-8');
    }
}

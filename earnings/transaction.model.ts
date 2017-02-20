import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';

import { formatDate, getDaysAgo, today } from '../shared/util/date-util';
import { FileUtil } from '../shared/util/file-util';
import { Variables } from '../shared/variables';


const transactionHome = path.join(FileUtil.userHome, 'transactions');
if (!fs.existsSync(transactionHome)) {
    fs.mkdirSync(transactionHome);
}

export class Transaction {
    constructor(
        public buyDate: Date,
        public buyPrice: number,
        public sellDate: Date,
        public sellPrice: number,
        public stock: string,
        public quantity: number
    ) { }

    static transactionPathForDate(date: Date | string): string {
        const fDate = date instanceof Date ? formatDate(date) : date;
        return path.join(transactionHome, `transactions-${fDate}.json`);
    }

    static readTransactions(): Transaction[] {
        let day: Date = today;
        const history: Transaction[] = [];
        for (let i = 0; i < (Variables.numDays * 2); i++) {
            Transaction.readTransactionsForDate(day).forEach(t => history.push(t));
            day = getDaysAgo(i, today);
        }
        return history;
    }
    static readTransactionsForDate(date?: Date): Transaction[] {
        const path = Transaction.transactionPathForDate(date);
        if (fs.existsSync(path)) {
            const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
            return json.map((i: Transaction) => new Transaction(new Date(i.buyDate), i.buyPrice, new Date(i.sellDate), i.sellPrice, i.stock, i.quantity));
        }
        else {
            return [];
        }
    }

    static writeTransactions(trans: Transaction[]): void {
        console.log('Writing transactions.');
        const uniqueDates = Transaction.findUniqueFormattedDates(trans);
        uniqueDates.forEach(date => {

            const path = Transaction.transactionPathForDate(date);
            let ths = trans.filter(t => formatDate(t.buyDate) === date);
            ths = _.uniqBy(ths, th => th.buyDate.toString() + th.stock);
            fs.writeFileSync(path, JSON.stringify(ths, null, 4), 'utf-8');
        });

    }

    static findUniqueFormattedDates(th: Transaction[]): string[] {
        const set = new Set<string>();
        th.forEach(t => set.add(formatDate(t.buyDate)));
        return Array.from(set);
    }
}
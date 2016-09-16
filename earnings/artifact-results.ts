import {FileUtil} from '../shared/util/file-util';
import {formatDate, getDaysAgo, today} from '../shared/util/date-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';

import {readdirSync, readFileSync} from 'fs';
import {join} from 'path';

class Result {
    changePrice: number
    constructor(
        public symbol: string,
        public date: Date,
        public probability: number,
        public startPrice: number,
        public endPrice: number
    ) {
        this.changePrice = ((this.endPrice - this.startPrice) / startPrice) * 100;
    }

    toString() {
        return `${this.symbol} - ${this.probability} - ${formatDate(this.date)} - ${this.changePrice}`
    }
}
let results: Result[] = [];
const tradeArtifactFiles: string[] = readdirSync(FileUtil.tradeArtifacts);
tradeArtifactFiles.forEach(tradeArtifactFile => {
    const filePieces = tradeArtifactFile.replace(/\.json$/, '').split('-');
    filePieces.shift();
    const startDate = new Date(filePieces.join('/'));
    const endDate = getDaysAgo(-5, startDate);
    if (endDate > today) {
        return;
    }
    const formattedDate = formatDate(startDate);
    const absPath = join(FileUtil.tradeArtifacts, tradeArtifactFile);
    const predictions = JSON.parse(readFileSync(absPath, 'utf-8'));
    const symbols = predictions.map(p => p.prediction.symbol);
    try {
        const daySentimentsStart = getDaySentimentsForStocks(symbols, startDate);
        const daySentimentsEnd = getDaySentimentsForStocks(symbols, endDate);
        predictions.forEach(p => {
            const symbol = p.prediction.symbol;
            const probability = p.probability;
            const daySentimentStart = daySentimentsStart.find(d => d.stock.symbol === symbol);
            const daySentimentEnd = daySentimentsEnd.find(d => d.stock.symbol === symbol);

            if (daySentimentStart && daySentimentEnd) {
                const startPrice = daySentimentStart.price;
                const endPrice = daySentimentEnd.price;
                const result = new Result(symbol, startDate, probability, startPrice, endPrice);
                results.push(result);
            }
            else if (!daySentimentStart && !daySentimentEnd) {
                console.log("Didn't find a day sentiment for either start or end", formatDate(startDate), formatDate(endDate));
            }
            else if (!daySentimentStart) {
                console.log("Didn't find a day sentiment for start", formatDate(startDate), formatDate(endDate));
            }
            else if (!daySentimentEnd) {
                console.log("Didn't find a day sentiment for end", formatDate(startDate), formatDate(endDate));
            }
            else {
                console.log('Well shit...');
            }
        });
    }
    catch (e) {
        console.log(tradeArtifactFile, e);
    }
});

function getStockPriceForDate(symbol: String, date: Date): number {
    const resultsFile = FileUtil.getResultsFileForDate(date);
    console.log(resultsFile);
    return 0;
}

function getDaySentimentsForStocks(stocks: string[], date: Date): DaySentiment[] {
    let daySentiments: DaySentiment[] = DaySentiment.parseArray(JSON.parse(readFileSync(FileUtil.getResultsFileForDate(date), 'utf-8')));
    return daySentiments.filter(daySentiment => {
        return stocks.indexOf(daySentiment.stock.symbol) !== -1;
    });
}
results = results.filter(r => r.probability > 0.6 && r.probability < 1.0)
results.forEach(r => console.log(r.toString()));
const totalPrice = results.map(a => a.changePrice).reduce((a, b) => a + b);
console.log(`Total: ${results.length}, Average Gain: ${totalPrice / results.length}`)
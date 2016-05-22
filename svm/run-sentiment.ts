import * as JSONStream from 'JSONStream';
import * as fs from 'fs';
import * as path from 'path';
import * as sentiment from 'sentiment';
import {formatDate} from '../sentiment-search/util/date-util';
//let file = `${__dirname}/../data/stocktwits_messages_dec_2015_8206.json`;
let file = `${__dirname}/../data/stocktwits_messages_jan_2016_3c83.json`;
const stream = fs.createReadStream(file, {encoding: 'utf-8'});
const parser = JSONStream.parse();
stream.pipe(parser);

class DataHolder {
    data: any = {};
    addValue(symbol: string, sentiment: number, date: Date) {
        const formattedDate = formatDate(date, '/');
        const symbolData = this.data[symbol] = this.data[symbol] || {};
        const symbolDataForDate = symbolData[formattedDate] = symbolData[formattedDate] || { count: 0, totalSentiment: 0};
        
        symbolDataForDate.count += 1;
        symbolDataForDate.totalSentiment += sentiment;
        console.log(symbolDataForDate);
    }
}

const dataHolder = new DataHolder();

parser.on('data', (obj:Twit) => {
    let symbols = [];
    obj.entities.symbols.forEach(twitSymbol => {
        if (twitSymbol && twitSymbol.symbol) {
            symbols.push(twitSymbol.symbol);   
        }
    });
    if (symbols.length === 0) {
        return;
    }
    const s:number = sentiment(obj.body).score;
    if (s === 0) {
        return;
    }
    const date = new Date(obj.object.postedTime);
    symbols.forEach(symbol => {
        dataHolder.addValue(symbol, s, date);
    });
});

parser.on('end', () => {
    fs.writeFileSync(path.join(__dirname, 'data2.json'), JSON.stringify(dataHolder.data, null, 4), 'utf-8');
    console.log('end!!');
});


interface Twit {
    body: string;
    object: TwitObject;
    entities: TwitEntities;
}
interface TwitObject {
    postedTime: string;
}
interface TwitEntities {
    symbols: TwitSymbol[];
}
interface TwitSymbol {
    symbol: string;
}


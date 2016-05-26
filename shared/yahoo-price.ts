import * as request from 'request';
import * as fs from 'fs';
const req = request.defaults({});

export async function getLastNPrices(symbol: string, date: Date, n: number): Promise<YahooQueryResult[]> {
    let aWeekAgo = new Date(+date - (1000 * 60 * 60 * 24 * n * 2));
    let formattedDate = [date.getFullYear(), leftPad(date.getMonth() + 1, 2, 0), leftPad(date.getDate(), 2, 0)].join('-');
    let formattedDateAWeekAgo = [aWeekAgo.getFullYear(), leftPad(aWeekAgo.getMonth() + 1, 2, 0), leftPad(aWeekAgo.getDate(), 2, 0)].join('-');

    return new Promise<YahooQueryResult[]>((resolve, reject) => {
        setTimeout(function () {
            let url = `https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22${symbol}%22%20and%20startDate%20%3D%20%222016-05-15%22%20and%20endDate%20%3D%20%22${formattedDate}%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`;
            console.log(url);
            req.get(url, (err, response, body) => {
                console.log(body);
                body = JSON.parse(body);
                if (!body.query.results) {
                    return resolve([]);
                }
                let results: YahooQueryResult[] = body.query.results.quote.slice(0, n);
                resolve(results);
            });
        }, 1000);

    });
}

function leftPad(str, len, ch) {
    // convert `str` to `string`
    str = str + '';

    // doesn't need to pad
    len = len - str.length;
    if (len <= 0) return str;

    // convert `ch` to `string`
    if (!ch && ch !== 0) ch = ' ';
    ch = ch + '';
    var pad = '';
    while (true) {
        if (len & 1) pad += ch;
        len >>= 1;
        if (len) ch += ch;
        else break;
    }
    return pad + str;
}

export interface YahooQueryResult {
    Symbol: string;
    Date: string;
    Open: string;
    High: string;
    Low: string;
    Close: string;
    Volume: string;
    Adj_Close: string;
}

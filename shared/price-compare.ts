import * as request from 'request';
import * as fs from 'fs';

const url = 'https://finance-yql.media.yahoo.com/v7/finance/chart/BOX?period2=1463540257&period1=1461812257&interval=5m&indicators=quote&includeTimestamps=true&includePrePost=true&events=div%7Csplit%7Cearn&corsDomain=finance.yahoo.com';
const req = request.defaults({});

req.get(url, (err, response, body) => {
    if (err) throw err;
    
    console.log(body);
    body = JSON.parse(body);
    fs.writeFileSync('results.json', JSON.stringify(body, null, 4), 'utf-8');
})
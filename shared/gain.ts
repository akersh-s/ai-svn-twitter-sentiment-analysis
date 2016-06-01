import * as async from 'async';
import {getLastNPrices, YahooQueryResult} from './yahoo-price';
import {today} from '../sentiment-search/util/date-util';

determineGainForStocks([
    'AVP',
    'AVP',
    'ABX',
    'BBW',
    'CALX',
    'CBZ',
    'CHK',
    'CDE',
    'TCS',
    'DV',
    'DGI',
    'FFA',
    'FMY',
    'INST',
    'KBH',
    'KMI',
    'KND',
    'MHO',
    'MEG',
    'NMBL',
    'OAS',
    'OOMA',
    'RNG',
    'SWN',
    'SRI',
    'SVU',
    'TWTR',
    'UCP',
    'VER',
    'YELP'
]);
function determineGainForStocks(stocks: string[]) {
    const asyncFuncs = [];
    stocks.forEach(stock => {
        asyncFuncs.push(done => {
            getLastNPrices(stock, today, 2).then((results: YahooQueryResult[]) => {
                console.log(results);
                var todaysPrice = parseFloat(results[0].Close);
                var yesterdaysPrice = parseFloat(results[0].Open);
                var diff = todaysPrice - yesterdaysPrice;
                var increasePerent = (diff / yesterdaysPrice) * 100;
                done(null, increasePerent);
            });
        });
    });

    async.series(asyncFuncs, (err, results: number[]) => {
        var total = 0;
        results.forEach(num => total += num);
        var average = total / results.length;
        console.log('Average percent: ' + average);
    });
}
/*
Prediction for $AVP: 1
Prediction for $BNED: -1
Prediction for $DDD: -1
Prediction for $AVP: 1
Prediction for $BNED: -1
Prediction for $ABX: 1
Prediction for $BBW: 1
Prediction for $CALX: 1
Prediction for $CBZ: 1
Prediction for $CMCM: -1
Prediction for $CHK: 1
Prediction for $CDE: 1
Prediction for $CNX: -1
Prediction for $TCS: 1
Prediction for $DV: 1
Prediction for $DGI: 1
Prediction for $FFA: 1
Prediction for $FMY: 1
Prediction for $FCX: -1
Prediction for $GES: -1
Prediction for $INST: 1
Prediction for $KBH: 1
Prediction for $KMI: 1
Prediction for $KND: 1
Prediction for $MHO: 1
Prediction for $MEG: 1
Prediction for $NMBL: 1
Prediction for $OAS: 1
Prediction for $OOMA: 1
Prediction for $OPWR: -1
Prediction for $PN: -1
Prediction for $RNG: 1
Prediction for $SWN: 1
Prediction for $STO: -1
Prediction for $SRI: 1
Prediction for $SVU: 1
Prediction for $TLRD: -1
Prediction for $RIG: -1
Prediction for $TPUB: -1
Prediction for $TWTR: 1
Prediction for $UCP: 1
Prediction for $VER: 1
Prediction for $WTW: -1
Prediction for $YELP: 1*/
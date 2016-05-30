import * as fs from 'fs';
import * as path from 'path';
import {formatDate} from '../sentiment-search/util/date-util';
var ml = require('machine_learning');
const dataFile = path.join(__dirname, 'data2.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

class PriceDate {
    constructor(public price: number, public date: Date) { }
}

class DaySentiment {
    constructor(public date: Date, public totalSentiment: number) { }
}
let count = 0;
var symbol, dateString;
const cacheData = {};
const lines = [];
const copies = [];
for (symbol in data) {
    const dateData = data[symbol];
    for (dateString in dateData) {
        const date = new Date(dateString);
        const symbolDateData = dateData[dateString];
        addLine(symbol, date, dateData, symbolDateData);
    }
}
console.log(count);
function addLine(symbol: string, date: Date, symbolData: any, symbolDateData: any) {
    const price = getPrice(symbol, date);
    const tomorrowsPrice = getPrice(symbol, addDays(date, 1));
    if (!price || !tomorrowsPrice || price === tomorrowsPrice) {
        return;
    }
    const increasePercent = ((tomorrowsPrice - price) / price) * 100;
    const action = increasePercent > 3 ? 1 : 1;
    const todaysSentiment = symbolDateData.totalSentiment;
    const yesterdaysDaySentiment = getYesterdaysDaySentiment(symbolData, date);
    if (!yesterdaysDaySentiment) {
        return;
    }
    const twoDaysAgoDaySentiment = getYesterdaysDaySentiment(symbolData, yesterdaysDaySentiment.date);
    if (!twoDaysAgoDaySentiment) {
        return;
    }
    const threeDaysAgoDaySentiment = getYesterdaysDaySentiment(symbolData, twoDaysAgoDaySentiment.date);
    if (!threeDaysAgoDaySentiment) {
        return;
    }
    let data = [];

    data.push(threeDaysAgoDaySentiment.totalSentiment);
    data.push(twoDaysAgoDaySentiment.totalSentiment);
    data.push(yesterdaysDaySentiment.totalSentiment);
    data.push(todaysSentiment);

    const dataAndResult = [data, action];
    if (lines.length < 10000) {
        lines.push(dataAndResult);    
    }
    
    if (increasePercent < 0 && Math.random() > 0.96) {
        console.log(symbol, dataAndResult, price, tomorrowsPrice);
        copies.push(`console.log('${symbol} ${price} -> ${tomorrowsPrice} : ', svm.predict(${JSON.stringify(data)}));`);
    }
    count++;
}
fs.writeFileSync('data.txt', copies.join('\n'), 'utf-8');
runSentiment();
function runSentiment() {
    const x = lines.map(line => {
        return line[0];
    });
    const y = lines.map(line => {
        return line[1];
    });

    var svm = new ml.SVM({
        x: x,
        y: y
    });

    svm.train({
        C: 1.1, // default : 1.0. C in SVM.
        tol: 1e-5, // default : 1e-4. Higher tolerance --> Higher precision
        max_passes: 20, // default : 20. Higher max_passes --> Higher precision
        alpha_tol: 1e-5, // default : 1e-5. Higher alpha_tolerance --> Higher precision

        kernel: //{ type: "polynomial", c: 1, d: 5 }
        // default : {type : "gaussian", sigma : 1.0}
        // {type : "gaussian", sigma : 0.5}
        {type : "linear"} // x*y
        // {type : "polynomial", c : 1, d : 8} // (x*y + c)^d
        // Or you can use your own kernel.
        // kernel : function(vecx,vecy) { return dot(vecx,vecy);}
    });

    console.log('Buys');
    console.log("IAE 1.42 -> 1.5 : ", svm.predict([1, 2, 8, 1]));
    console.log("IAE 1.29 -> 1.42 : ", svm.predict([2, 1, 2, 8]));
    console.log("GOLD 65 -> 68 : ", svm.predict([3, 1, -3, 8]));
    console.log("SHOP 20 -> 22 : ", svm.predict([-2, 3, 12, 9]));
    console.log("NEON 2.21 -> 2.45 : ", svm.predict([1, 30, -2, 3]));
    console.log("N 65 -> 69 : ", svm.predict([6, -1, -1, 13]));
    console.log('BCRX 6.99 -> 7.55', svm.predict([-1, 4, -1, 2]));
    console.log('SYNA 66 -> 73', svm.predict([1, 3, 3, 5]));
    console.log('');

    console.log('Do Nothings');
    console.log('CELG 106.699997 -> 105.989998 : ', svm.predict([21, 8, 6, 2]));
    console.log('PLUG 1.81 -> 1.75 : ', svm.predict([6, 2, 0, 72]));
    console.log('AAPL 102.709999 -> 100.699997 : ', svm.predict([89, 126, 1084, 613]));
    console.log('AAPL 100.699997 -> 96.449997 : ', svm.predict([126, 1084, 613, 946]));
    console.log('AAPL 97.129997 -> 96.660004 : ', svm.predict([662, 109, 104, 199]));
    console.log('AMZN 601.25 -> 583.349976 : ', svm.predict([23, 43, 123, 181]));
    console.log('ZIOP 5.94 -> 5.47 : ', svm.predict([4, 0, -11, 10]));
    console.log('HART 1.98 -> 1.79 : ', svm.predict([31, 4, 3, 14]));
    console.log('SWKS 64.540001 -> 60.669998 : ', svm.predict([6, 4, 45, 9]));
    console.log('SGYP 4.03 -> 3.74 : ', svm.predict([43, 2, 13, -3]));
    console.log('C 50.860001 -> 50.119999 : ', svm.predict([1, 0, 3, -7]));
    console.log('LLY 81.25 -> 80.269997 : ', svm.predict([5, 1, -2, 4]));
    console.log('LLY 82.540001 -> 81.239998 : ', svm.predict([11, -1, 4, 10]));
    console.log('HAS 69.889999 -> 69.120003 : ', svm.predict([2, -1, 2, 18]));
    console.log('RUN 9.31 -> 8.67 : ', svm.predict([8, 4, 4, -1]));
    console.log('WMB 16.540001 -> 13.61 : ', svm.predict([1, -3, 2, 13]));
    console.log('WMB 18.290001 -> 16.1 : ', svm.predict([2, 13, -6, 55]));
    console.log('WMB 19.74 -> 18.309999 : ', svm.predict([3, 60, 4, 1]));
    console.log('MYL 53.93 -> 51.23 : ', svm.predict([12, 6, -7, -3]));
    console.log('VICL 0.37 -> 0.34 : ', svm.predict([23, -3, 3, 2]));
    console.log('BTU 7.34 -> 6.66 : ', svm.predict([7, 5, 2, 4]));
    console.log('BBY 31.15 -> 29.950001 : ', svm.predict([3, 2, 19, 5]));
    console.log('BBY 29.26 -> 26.43 : ', svm.predict([3, 6, 7, 11]));
    console.log('COST 158.449997 -> 154.820007 : ', svm.predict([5, -3, 15, 2]));
    console.log('DVAX 25.030001 -> 23.65 : ', svm.predict([42, 11, 13, 16]));
    console.log('TGT 70.410004 -> 70.080002 : ', svm.predict([4, 10, -2, 5]));
    console.log('ANFI 10.35 -> 10.01 : ', svm.predict([16, 191, 60, 9]));
    console.log('SDRL 2.07 -> 2.05 : ', svm.predict([0, -3, -5, -1]));
    console.log('DKS 38.110001 -> 38.07 : ', svm.predict([-2, 2, 2, 5]));
    console.log('NTES 165.369995 -> 163.460007 : ', svm.predict([28, 9, 5, 12]));
    console.log('NTES 163.460007 -> 158.789993 : ', svm.predict([5, 12, -9, 9]));
    console.log('OMER 10.08 -> 9.94 : ', svm.predict([24, 6, 6, 43]));
    console.log('POT 16.09 -> 15.44 : ', svm.predict([9, 11, 4, 1]));
    console.log('POT 16.299999 -> 15.88 : ', svm.predict([2, -2, 1, -1]));
    console.log('ITEK 10.66 -> 9.81 : ', svm.predict([1, 5, -2, -1]));
    console.log('CEMP 21.870001 -> 21.190001 : ', svm.predict([1, 2, 2, 5]));
    console.log('BTE 1.63 -> 1.32 : ', svm.predict([0, 6, 4, 2]));
    console.log('CPRX 2.36 -> 2.2 : ', svm.predict([2, -1, 2, -1]));
    console.log('CPRX 2.04 -> 1.96 : ', svm.predict([10, 1, -2, 2]));
    console.log('NTI 24.43 -> 24.360001 : ', svm.predict([-4, -2, 0, -2]));
    console.log('MT 3.62 -> 3.39 : ', svm.predict([12, 3, 5, 0]));
    console.log('OAS 4.39 -> 4.32 : ', svm.predict([15, 2, 1, 16]));
    console.log('OAS 5.32 -> 4.79 : ', svm.predict([4, 1, 15, 1]));
    console.log('AUY 1.55 -> 1.41 : ', svm.predict([3, -3, 3, 2]));
    console.log('AUY 1.66 -> 1.61 : ', svm.predict([3, 14, 9, 5]));
    console.log('TASR 15.48 -> 14.63 : ', svm.predict([14, 5, 1, -8]));
    console.log('PAH 7.55 -> 7.42 : ', svm.predict([1, -2, 7, -1]));
    console.log('LIVE 1.17 -> 1.06 : ', svm.predict([-5, -2, -3, 1]));
    console.log('LIVE 1.43 -> 1.3 : ', svm.predict([26, 2, -4, 8]));
    console.log('UBS 16.43 -> 16.309999 : ', svm.predict([14, 3, 14, 0]));
    console.log('CB 110.690002 -> 109.43 : ', svm.predict([2, 2, -2, 1]));
    console.log('QRVO 45.639999 -> 44.490002 : ', svm.predict([3, 2, -1, -16]));
    console.log('CONN 14.81 -> 13.62 : ', svm.predict([-7, 4, 4, 2]));
    console.log('UNH 115.489998 -> 112.089996 : ', svm.predict([2, 4, 3, 8]));
    console.log('MDVN 38.419998 -> 37.650002 : ', svm.predict([1, 18, -2, 5]));
    console.log('NVRO 66.089996 -> 64.68 : ', svm.predict([17, 10, 2, 3]));
    console.log('NEWT 13.69 -> 13.25 : ', svm.predict([3, 4, 0, -1]));
    console.log('ERF 2.4 -> 2.29 : ', svm.predict([1, 4, -2, 4]));
    console.log('AVP 3 -> 2.79 : ', svm.predict([1, 14, 6, -7]));
    console.log('AGN 295.23999 -> 291.790009 : ', svm.predict([29, 20, -3, 7]));
    console.log('WPCS 1.2 -> 1.19 : ', svm.predict([1, -8, 2, -3]));
    console.log('WPCS 1.3 -> 1.25 : ', svm.predict([-3, -3, 7, -2]));
    console.log('SCHW 29.18 -> 29 : ', svm.predict([14, 5, 4, 5]));
    console.log('MEET 3.14 -> 3.13 : ', svm.predict([6, 7, 1, -5]));
    console.log('ALV 105.18 -> 104.669998 : ', svm.predict([1, 2, 6, -1]));
    console.log('RDS.A 40.43 -> 39.51 : ', svm.predict([-2, 3, -4, -2]));
    console.log('UAL 52.630001 -> 51.889999 : ', svm.predict([18, 11, 19, 12]));
    console.log('FTK 7.67 -> 7.33 : ', svm.predict([3, -1, 0, -2]));
    console.log('LNC 39.130001 -> 38.880001 : ', svm.predict([2, 2, 2, 1]));
    console.log('ATW 6.07 -> 5.64 : ', svm.predict([-1, -1, 3, 2]));
    console.log('PACD 0.51 -> 0.41 : ', svm.predict([-5, 6, -8, -8]));
    console.log('RDHL 10.31 -> 10.04 : ', svm.predict([2, -6, 16, 7]));
    console.log('ATI 8.29 -> 8.27 : ', svm.predict([-1, 1, 4, 3]));
    console.log('RTEC 12.48 -> 12.41 : ', svm.predict([6, 1, 1, 1]));
    console.log('RARE 86.510002 -> 76.82 : ', svm.predict([10, 3, 4, 4]));
    console.log('PPL 33.630001 -> 32.799999 : ', svm.predict([2, -2, -1, -1]));
    console.log('EURN 10.19 -> 10.09 : ', svm.predict([2, -1, 4, -5]));
    console.log('VNTV 45.02 -> 44.080002 : ', svm.predict([4, 2, 7, 2]));
    console.log('MPW 10.59 -> 10.08 : ', svm.predict([5, -3, -4, -3]));
    console.log('ESRX 79.690002 -> 77.510002 : ', svm.predict([-1, 4, -1, 5]));
    console.log('LXU 5.21 -> 5.13 : ', svm.predict([1, 10, 4, 6]));
    console.log('SFL 12.94 -> 12.92 : ', svm.predict([1, 1, 4, 3]));
    console.log('RLD 10.63 -> 10.58 : ', svm.predict([10, 2, -3, 2]));
    console.log('BLPH 2.49 -> 2.43 : ', svm.predict([10, 2, -2, 6]));
    console.log('TMH 41.560001 -> 41.32 : ', svm.predict([1, -3, 4, 2]));
    console.log('LYV 21.549999 -> 21.43 : ', svm.predict([1, 2, 1, 3]));
    console.log('SBLK 0.42 -> 0.4 : ', svm.predict([4, 3, 3, 1]));
    console.log('GLPW 2.6 -> 2.5 : ', svm.predict([2, 1, -2, 1]));
    console.log('ACIW 18.01 -> 17.52 : ', svm.predict([2, 1, 1, -1]));
}

function getPrice(stock: string, date: Date): number {
    let price = undefined;
    if (cacheData[stock]) {
        return getPriceFromData(cacheData[stock], date).price;
    }
    const filename = path.join(__dirname, '..', 'prices', `${stock}.json`);
    if (!fs.existsSync(filename)) {
        return price;
    }
    cacheData[stock] = JSON.parse(fs.readFileSync(filename, 'utf-8').replace(/-/g, '-'));
    return getPriceFromData(cacheData[stock], date).price;
}

function getPriceFromData(data, date: Date, isFuture?: boolean): PriceDate {
    let price = undefined;
    const formattedDate = formatDate(date);
    if (data[formattedDate]) {
        price = parseFloat(data[formattedDate]);
    }
    if (!price) {
        var i;
        if (isFuture) {
            for (i = 0; i < 5; i++) {
                if (!price) {
                    date = addDays(date, 1);
                    price = parseFloat(data[formatDate(date)]);
                }
            }
        }
        else {
            for (i = 0; i < 5; i++) {
                if (!price) {
                    date = addDays(date, -1);
                    price = parseFloat(data[formatDate(date)]);
                }
            }
        }
    }
    return new PriceDate(price, date);
}

function addDays(date: Date, n: number) {
    const oneDay = 1000 * 60 * 60 * 24;
    return new Date(+date + (n * oneDay));
}

function getYesterdaysDaySentiment(symbolData, date: Date): DaySentiment {
    var i;
    for (i = -1; i >= -5; i--) {
        var dateToday = addDays(date, i);
        var formattedDateToday = formatDate(dateToday, '/');
        var data = symbolData[formattedDateToday];
        if (data) {
            return new DaySentiment(dateToday, data.totalSentiment);
        }
    }
    return null;
}


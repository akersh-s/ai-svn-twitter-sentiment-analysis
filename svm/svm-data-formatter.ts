import * as fs from 'fs';
import * as _ from 'lodash';

import { oneDay, formatDate, isWeekend, isSameDay, today, getPreviousWorkDay, getNextWorkDay } from '../shared/util/date-util';
import { Distribution, calculateBuyPrice, calculateMeanVarianceAndDeviation } from '../shared/util/math-util';
import { FileUtil } from '../shared/util/file-util';
import { SvmData } from './svm-data.model';
import { Prediction } from './prediction.model';
import { debug } from '../shared/util/log-util';
import { Variables } from '../shared/variables';
import { Stock } from '../sentiment/model/stock.model';
import { DaySentiment } from '../sentiment/model/day-sentiment.model';

export async function getSvmData(): Promise<SvmData> {
	let formattedSvmData = await formatSvmData();
	debug('formattedSvmData: ' + formattedSvmData.x.length);
	return formattedSvmData;
}

export async function getPredictions(todaysDaySentiments: DaySentiment[]): Promise<Prediction[]> {
	debug(`Collecting Predictions from ${todaysDaySentiments.length} sentiments`);
	let predictions = [];

	let groupedTodaysDaySentiments: DaySentiment[][] = group(todaysDaySentiments, 1500);
	let i = 0;

	while (i < groupedTodaysDaySentiments.length) {
		let groupedTDS: DaySentiment[] = groupedTodaysDaySentiments[i++];
		let allPreviousDaySentiments: DaySentiment[] = await gatherPreviousDaySentiments(groupedTDS.map(t => t.stock.symbol));
		groupedTDS.forEach(todaysDaySentiment => {
			let price = todaysDaySentiment.price;
			let isValid: boolean = !!price;
			let prevDaySentiment = todaysDaySentiment;
			let collectedDaySentiments: DaySentiment[] = [prevDaySentiment];
			let thisPreviousDaySentiments = allPreviousDaySentiments.filter(d => {
				return d.stock.symbol === todaysDaySentiment.stock.symbol;
			});
			for (var i = 1; i < Variables.numPreviousDaySentiments; i++) {
				prevDaySentiment = getPreviousDaySentiment(prevDaySentiment, thisPreviousDaySentiments);
				prevDaySentiment && collectedDaySentiments.push(prevDaySentiment);
			}
			isValid = isValid && collectedDaySentiments.length === Variables.numPreviousDaySentiments;
			if (isValid) {
				let x = createX(collectedDaySentiments);
				predictions.push(new Prediction(todaysDaySentiment.stock.symbol, x));
			}
		});
	}

	debug(`Completed collecting ${predictions.length} predictions.`);
	return predictions;
}

function gatherPreviousDaySentiments(stocks?: string[]): Promise<DaySentiment[]> {
	let daySentiments: DaySentiment[] = [];
	let promiseFuncs = [];
	FileUtil.lastResultsFiles.forEach(f => {
		promiseFuncs.push(readDaySentiments(f));
	});
	return new Promise<DaySentiment[]>((resolve, reject) => {
		Promise.all(promiseFuncs).then((daySentimentsArray: DaySentiment[][]) => {
			daySentimentsArray.forEach(moreDaySentiments => {
				daySentiments = daySentiments.concat(moreDaySentiments.filter(daySentiment => {
					return !stocks || stocks.indexOf(daySentiment.stock.symbol) !== -1;
				}));
			});
			resolve(daySentiments);
		});
	});
}

function readDaySentiments(f: string): Promise<DaySentiment[]> {
	return new Promise<DaySentiment[]>((resolve, reject) => {
		fs.readFile(f, 'utf-8', (err, data) => {
			if (err) return resolve([]);
			try {
				resolve(DaySentiment.parseArray(JSON.parse(data)));
			}
			catch (e) {
				resolve([]);
			}
		});
	});
}

async function formatSvmData(): Promise<SvmData> {
	let svmData = new SvmData();
	let increases = [];
	let stocks = FileUtil.getStocks();
	let groupedStocks: string[][] = group<string>(stocks, 1500);
	let i = 0;

	while (i < groupedStocks.length) {
		let groupedStock: string[] = groupedStocks[i++];
		let allPreviousDaySentiments: DaySentiment[] = await gatherPreviousDaySentiments(groupedStock);
		groupedStock.forEach(stock => {
			//debug(`SVM Data size: ${svmData.x.length}`);
			let stockPreviousDaySentiments = allPreviousDaySentiments.filter(d => d.stock.symbol === stock);

			stockPreviousDaySentiments.forEach(daySentiment => {
				let svmRecord = [];
				let date = daySentiment.day;
				let price = daySentiment.price;
				let isValidSvmItem: boolean = !!price && !isWeekend(date);
				let prevDaySentiment = daySentiment;
				let collectedDaySentiments: DaySentiment[] = [prevDaySentiment];
				for (var i = 1; i < Variables.numPreviousDaySentiments && isValidSvmItem; i++) {
					prevDaySentiment = getPreviousDaySentiment(prevDaySentiment, stockPreviousDaySentiments);
					isValidSvmItem = isValidSvmItem && !!prevDaySentiment;
					prevDaySentiment && collectedDaySentiments.push(prevDaySentiment);
				}
				isValidSvmItem = isValidSvmItem && collectedDaySentiments.length === Variables.numPreviousDaySentiments;

				let nextDaySentiment: DaySentiment = isValidSvmItem && getDaySentimentInNDays(Variables.numDays, daySentiment, stockPreviousDaySentiments);
				isValidSvmItem = isValidSvmItem && !!nextDaySentiment && !!nextDaySentiment.price;
				if (isValidSvmItem) {
					const increasePercent = ((nextDaySentiment.price - daySentiment.price) / daySentiment.price) * 100;

					const y = increasePercent > Variables.priceThreshold ? 1 : 0;
					//const y = Math.floor(increasePercent);
					increases.push(increasePercent);
					//debug(`${daySentiment.stock.symbol}: ${nextDaySentiment.price} on ${formatDate(nextDaySentiment.day)}, ${daySentiment.price} on ${formatDate(date)} - Increase Percent: ${increasePercent}`)
					const xy = createX(collectedDaySentiments);
					xy.push(y);

					svmData.xy.push(xy);
				}
			});
		});
	}
	increases.sort((a, b) => b - a);
	let t5i = Math.floor(increases.length * 0.05);
	let t10i = Math.floor(increases.length * 0.1);
	let t20i = Math.floor(increases.length * 0.2);
	let t30i = Math.floor(increases.length * 0.3);

	debug(`Finished formatting SVM Data... Top 5 Price: ${increases[t5i]}, Top 10 Price: ${increases[t10i]}, Top 20 Price: ${increases[t20i]}, Top 30 Price: ${increases[t30i]}`);
	svmData.xy = _.sampleSize(svmData.xy, Variables.maxSvmData);
	svmData.createXsYs();
	return svmData;
}

function getPreviousDaySentiment(daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
	return getNearbyDaySentiment(daySentiment, allPreviousDaySentiments, false);
}

function getNextDaySentiment(daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
	return getNearbyDaySentiment(daySentiment, allPreviousDaySentiments, true);
}

function group<T>(arr: T[], size: number): T[][] {
	const groupedArr: T[][] = [];
	let sub = [];
	for (let i = 0; i < arr.length; i++) {
		sub.push(arr[i]);
		if (sub.length % size === 0) {
			groupedArr.push(sub);
			sub = [];
		}
	}
	if (sub.length) {
		groupedArr.push(sub);
	}

	return groupedArr;
}

function getNearbyDaySentiment(daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[], isForward: boolean): DaySentiment {
	if (!daySentiment) {
		return null;
	}
	const date = daySentiment.day;
	const nearbyDaySentiment: DaySentiment = null;
	if (!daySentiment.price || !date) {
		return null;
	}
	const nextDate = isForward ? getNextWorkDay(date) : getPreviousWorkDay(date);
	const candidate = DaySentiment.findDaySentimentForSymbolAndDate(daySentiment.stock.symbol, nextDate, allPreviousDaySentiments);
	return candidate;
}

function getDaySentimentInNDays(n: number, daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
	if (!daySentiment || !daySentiment.price || !daySentiment.day) {
		return null;
	}

	let i = 0;
	let candidateDate: Date = daySentiment.day;
	while (i < n) {
		i++;
		candidateDate = getNextWorkDay(candidateDate);
	}
	const candidate = DaySentiment.findDaySentimentForSymbolAndDate(daySentiment.stock.symbol, candidateDate, allPreviousDaySentiments);
	return candidate;
}

function createX(daySentiments: DaySentiment[]): number[] {
	let x: number[] = [];
	Variables.includeDayOfWeek && x.push(daySentiments[0].day.getDay());
	for (let i = 0; i < daySentiments.length - (Variables.skipDaySentiments + 1); i += Variables.skipDaySentiments) {
		var d1 = daySentiments[i];
		var d2 = daySentiments[i + Variables.skipDaySentiments];

		Variables.includeSentimentChange && x.push(change(d1.totalSentiment, d2.totalSentiment));
		Variables.includePriceChange && x.push(Math.round(change(d1.price, d2.price)));
		Variables.includeTimeChange && x.push(change(+d1.day, +d2.day));
		Variables.includeVolumeChange && x.push(Math.round(change(d1.volume, d2.volume)));
	}

	// Least Squares
	Variables.leastSquaresSentiment && x.push(getLeastSquares(daySentiments, 'totalSentiment'));
	Variables.leastSquaresPrice && x.push(getLeastSquares(daySentiments, 'price'));
	Variables.leastSquaresTime && x.push(getLeastSquares(daySentiments, 'day'));
	Variables.leastSquaresVolume && x.push(getLeastSquares(daySentiments, 'volume'));

	for (let i = 0; i < daySentiments.length; i += Variables.skipDaySentiments) {
		let d = daySentiments[i];
		Variables.includeSentiment && x.push(d.totalSentiment);
		Variables.includePrice && x.push(d.price);
		Variables.includeNumTweets && x.push(d.numTweets);
		Variables.includeTime && x.push(+d.day);
		Variables.includePriceBracket && x.push(getPriceBracket(d.price));
	}

	return x;
}

function change(one, two) {
	return (one - two) / Math.max(two, 1);
}

function getPriceBracket(price: number): number {
	if (price >= 0 && price <= 1) {
		return 0;
	}
	else if (price > 1 && price <= 10) {
		return 1;
	}
	else if (price > 10 && price <= 50) {
		return 2;
	}
	else if (price > 50 && price <= 200) {
		return 3;
	}
	else {
		return 4;
	}
}

function getIncreaseOrDecrease(num1: number, num2: number): number {
	return num1 === num2 ? 0 : num1 > num2 ? 1 : -1;
}

function getLeastSquares(daySentiments: DaySentiment[], propertyName: string): number {
	const lsq = require('least-squares')
	const ret: { m?: number } = {};
	const x = daySentiments.map((val, i) => i);
	const y = daySentiments.map(val => +(val[propertyName]));
	lsq(x, y, false, ret);
	return ret.m;
}
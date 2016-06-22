import * as fs from 'fs';
import {oneDay, formatDate, isWeekend} from '../shared/util/date-util';
import {Distribution, calculateBuyPrice, calculateMeanVarianceAndDeviation} from '../shared/util/math-util';
import {FileUtil} from '../shared/util/file-util';
import {SvmData} from './svm-data.model';
import {Prediction} from './prediction.model';
import {debug} from '../shared/util/log-util';
import {Stock} from '../sentiment/model/stock.model';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';

export function getSvmData(priceThreshold: number): SvmData {
	let allPreviousDaySentiments:DaySentiment[] = gatherPreviousDaySentiments();
	debug('All Previous Stock Actions Length: ' + allPreviousDaySentiments.length);
	let formattedSvmData = formatSvmData(allPreviousDaySentiments, priceThreshold);
	debug('formattedSvmData: ' + formattedSvmData.x.length);
	return formattedSvmData;
}

export function getPredictions(todaysDaySentiments: DaySentiment[]): Prediction[] {
	let allPreviousDaySentiments = gatherPreviousDaySentiments();
	let predictions = [];
	todaysDaySentiments.forEach(todaysDaySentiment => {
		let price = todaysDaySentiment.price;
		let isValid: boolean = !!price;
		let prevDaySentiment = todaysDaySentiment;
		let collectedDaySentiments:DaySentiment[] = [prevDaySentiment];
		for (var i = 0; i < 9; i++) {
			prevDaySentiment = getPreviousDaySentiment(prevDaySentiment, allPreviousDaySentiments);
			if (prevDaySentiment && prevDaySentiment.price) {
				collectedDaySentiments.push(prevDaySentiment);
			}
		}

		isValid = isValid && collectedDaySentiments.length === 10;

		if (isValid) {
			let x = createX(collectedDaySentiments);
			predictions.push(new Prediction(todaysDaySentiment.stock.symbol, x));
		}
	});
	return predictions;
}

function gatherPreviousDaySentiments(): DaySentiment[] {
	let daySentiments:DaySentiment[] = [];
	FileUtil.lastResultsFiles.forEach(f => {
		let fDaySentiments = DaySentiment.parseArray(JSON.parse(fs.readFileSync(f, 'utf-8')));
		daySentiments = daySentiments.concat(fDaySentiments);
	});
	return daySentiments;
}

function formatSvmData(allPreviousDaySentiments: DaySentiment[], priceThreshold: number): SvmData {
	let svmData = new SvmData();
	allPreviousDaySentiments.forEach(daySentiment => {
		let svmRecord = [];
		let date = daySentiment.day;
		let price = daySentiment.price;
		let isValidSVmItem: boolean = !!price && !isWeekend(date);
		let prevDaySentiment = daySentiment;
		let collectedDaySentiments:DaySentiment[] = [prevDaySentiment];
		for (var i = 0; i < 9; i++) {
			prevDaySentiment = getPreviousDaySentiment(prevDaySentiment, allPreviousDaySentiments);
			if (prevDaySentiment && prevDaySentiment.price) {
				collectedDaySentiments.push(prevDaySentiment);
			}
		}

		isValidSVmItem = isValidSVmItem && collectedDaySentiments.length === 10;

		let nextDaySentiment = getNextDaySentiment(daySentiment, allPreviousDaySentiments);
		isValidSVmItem = isValidSVmItem && !!nextDaySentiment && !!nextDaySentiment.price;

		if (isValidSVmItem) {
			const increasePercent = ((nextDaySentiment.price - daySentiment.price) / daySentiment.price) * 100;

			let y = increasePercent > priceThreshold ? 1 : -1;

			debug(`${daySentiment.stock.symbol}: ${nextDaySentiment.price} on ${formatDate(nextDaySentiment.day)}, ${daySentiment.price} on ${formatDate(date)} - Increase Percent: ${increasePercent}`)
			let x = createX(collectedDaySentiments);
			svmData.addRecord(x, y);
		}
	});

	return svmData;
}

function getPreviousDaySentiment(daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
	return getNearbyDaySentiment(daySentiment, allPreviousDaySentiments, false);
}

function getNextDaySentiment(daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
	return getNearbyDaySentiment(daySentiment, allPreviousDaySentiments, true);
}

function getNearbyDaySentiment(daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[], isForward: boolean): DaySentiment {
	if (!daySentiment) {
		return null;
	} 
	let date = daySentiment.day;
	let nearbyDaySentiment: DaySentiment = null;
	if (!daySentiment.price || !date) {
		return null;
	}
	let direction = isForward ? 1 : -1;
	let i = 0;
	while (!nearbyDaySentiment && i < 5) {
		i++;

		let candidateDate = new Date(+date + (i * oneDay * direction));
		let candidate = DaySentiment.findDaySentimentForSymbolAndDate(daySentiment.stock.symbol, candidateDate, allPreviousDaySentiments);
		if (candidate && candidate.price && candidate.price !== daySentiment.price && !isWeekend(candidate.day)) {
			nearbyDaySentiment = candidate;
		}

	}
	return nearbyDaySentiment;
}

function createX(daySentiments: DaySentiment[]): number[] {
	let x = [];
	daySentiments.forEach(d => {
		x.push(d.totalSentiment);
		x.push(d.price);
	})

	return x;
}

function change(one, two) {
	return (one - two) / Math.max(two, 1);
}
import * as fs from 'fs';
import {oneDay, formatDate, isWeekend, isSameDay, yesterday} from '../shared/util/date-util';
import {Distribution, calculateBuyPrice, calculateMeanVarianceAndDeviation} from '../shared/util/math-util';
import {FileUtil} from '../shared/util/file-util';
import {SvmData} from './svm-data.model';
import {Prediction} from './prediction.model';
import {debug} from '../shared/util/log-util';
import {Variables} from '../shared/variables';
import {Stock} from '../sentiment/model/stock.model';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';

export function getSvmData(): SvmData {
	let allPreviousDaySentiments: DaySentiment[] = gatherPreviousDaySentiments();
	debug('All Previous Stock Actions Length: ' + allPreviousDaySentiments.length);
	let formattedSvmData = formatSvmData(allPreviousDaySentiments);
	debug('formattedSvmData: ' + formattedSvmData.x.length);
	return formattedSvmData;
}

export function getPredictions(todaysDaySentiments: DaySentiment[]): Prediction[] {
	debug(`Collecting Predictions from ${todaysDaySentiments.length} sentiments`);
	let allPreviousDaySentiments = gatherPreviousDaySentiments();
	let predictions = [];
	todaysDaySentiments = todaysDaySentiments.filter(d => {
		return isSameDay(d.day, yesterday);
	});
	todaysDaySentiments.forEach(todaysDaySentiment => {
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
	debug(`Completed collecting ${predictions.length} predictions.`);
	return predictions;
}

function gatherPreviousDaySentiments(): DaySentiment[] {
	debug('Gathering previous sentiments...');
	let daySentiments: DaySentiment[] = [];
	FileUtil.lastResultsFiles.forEach(f => {
		debug('Reading ' + f);
		let fDaySentiments = DaySentiment.parseArray(JSON.parse(fs.readFileSync(f, 'utf-8')));
		daySentiments = daySentiments.concat(fDaySentiments);
	});
	return daySentiments;
}

function formatSvmData(allPreviousDaySentiments: DaySentiment[]): SvmData {
	debug('Formatting SVM Data...');
	let svmData = new SvmData();
	allPreviousDaySentiments.forEach(daySentiment => {
		let svmRecord = [];
		let date = daySentiment.day;
		let price = daySentiment.price;
		let isValidSvmItem: boolean = !!price && !isWeekend(date);
		let prevDaySentiment = daySentiment;
		let collectedDaySentiments: DaySentiment[] = [prevDaySentiment];
		let thisPreviousDaySentiments: DaySentiment[] = isValidSvmItem && allPreviousDaySentiments.filter(d => {
			return d.stock.symbol === daySentiment.stock.symbol && +daySentiment.day > +d.day;
		});
		for (var i = 1; i < Variables.numPreviousDaySentiments && isValidSvmItem; i++) {
			prevDaySentiment = getPreviousDaySentiment(prevDaySentiment, thisPreviousDaySentiments);
			isValidSvmItem = isValidSvmItem && !!prevDaySentiment;
			prevDaySentiment && collectedDaySentiments.push(prevDaySentiment);
		}
		if (collectedDaySentiments.length > 1) {
			console.log(collectedDaySentiments.length, collectedDaySentiments.length === Variables.numPreviousDaySentiments)
		}
		isValidSvmItem = isValidSvmItem && collectedDaySentiments.length === Variables.numPreviousDaySentiments;

		let nextDaySentiment: DaySentiment = isValidSvmItem && getDaySentimentInNDays(Variables.numDays, daySentiment, allPreviousDaySentiments);
		if (collectedDaySentiments.length > 1) {
			console.log('Next Day Sentiment', nextDaySentiment);
		}
		isValidSvmItem = isValidSvmItem && !!nextDaySentiment && !!nextDaySentiment.price;

		if (isValidSvmItem) {
			const increasePercent = ((nextDaySentiment.price - daySentiment.price) / daySentiment.price) * 100;
			
			let y = increasePercent > Variables.priceThreshold ? 1 : -1;

			//debug(`${daySentiment.stock.symbol}: ${nextDaySentiment.price} on ${formatDate(nextDaySentiment.day)}, ${daySentiment.price} on ${formatDate(date)} - Increase Percent: ${increasePercent}`)
			let x = createX(collectedDaySentiments);
			svmData.addRecord(x, y);
			debug(`Found Valid! Increase Percent: ${increasePercent} - Price Threshold: ${Variables.priceThreshold} - x: ${x}`);
		}
	});
	debug('Finished formatting SVM Data');
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

	while (!nearbyDaySentiment && i < 8) {
		i++;

		let candidateDate = new Date(+date + (i * oneDay * direction));
		if (!isWeekend(candidateDate)) {
			let candidate = DaySentiment.findDaySentimentForSymbolAndDate(daySentiment.stock.symbol, candidateDate, allPreviousDaySentiments);
			const fullfillsFundamentalReq:boolean = candidate && Variables.includeFundamentals() ? !!candidate.fundamentals : true;
			if (candidate && candidate.price && candidate.price !== daySentiment.price && fullfillsFundamentalReq) {
				nearbyDaySentiment = candidate;
			}
		}

	}
	return nearbyDaySentiment;
}

function getDaySentimentInNDays(n: number, daySentiment: DaySentiment, allPreviousDaySentiments: DaySentiment[]): DaySentiment {
	if (!daySentiment || !daySentiment.price || !daySentiment.day) {
		return null;
	}
	let weekDaySentiment: DaySentiment = null;

	let i = 6;
	let maxI = (n + i + 3) * 2;
	while (!weekDaySentiment && i < maxI) {
		i++;
		let candidateDate = new Date(+daySentiment.day + (i * oneDay));
		if (!isWeekend(candidateDate)) {
			let candidate = DaySentiment.findDaySentimentForSymbolAndDate(daySentiment.stock.symbol, candidateDate, allPreviousDaySentiments);
			const fullfillsFundamentalReq:boolean = candidate && Variables.includeFundamentals() ? !!candidate.fundamentals : true;
			if (candidate && candidate.price && candidate.price !== daySentiment.price && fullfillsFundamentalReq) {
				weekDaySentiment = candidate;
			}
		}
	}
	return weekDaySentiment;
}

function createX(daySentiments: DaySentiment[]): number[] {
	let x = [];
	for (var i = 0; i < daySentiments.length - 2; i++) {
		var d1 = daySentiments[i];
		var d2 = daySentiments[i + 1];
		Variables.includeSentimentChange && x.push(change(d1.totalSentiment, d2.totalSentiment));
		Variables.includePriceChange && x.push(change(d1.price, d2.price));
		Variables.includeTimeChange && x.push(change(+d1.day, +d2.day));
	}
	daySentiments.forEach(d => {
		Variables.includeSentiment && x.push(d.totalSentiment);
		Variables.includePrice && x.push(d.price);
		Variables.includeNumTweets && x.push(d.numTweets);
		Variables.includeTime && x.push(+d.day);
	});

	return x;
}

function change(one, two) {
	return (one - two) / Math.max(two, 1);
}
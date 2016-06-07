import * as fs from 'fs';
import {oneDay, formatDate} from '../sentiment-search/util/date-util';
import {FileUtil} from '../shared/util/file-util';
import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';
import {SvmData} from './svm-data.model';
import {Prediction} from './prediction.model';
import {debug} from '../sentiment-search/util/log-util';
import {Stock} from '../sentiment-search/stock.model';
import {DaySentiment} from '../sentiment-search/twitter/day-sentiment';
export function getSvmData(priceThreshold: number): SvmData {
	let allPreviousStockActions = gatherPreviousStockActions();
	debug('All Previous Stock Actions Length: ' + allPreviousStockActions.length);
	let formattedSvmData = formatSvmData(allPreviousStockActions, priceThreshold);
	debug('formattedSvmData: ' + formattedSvmData.x.length);
	return formattedSvmData;
}

export function getPredictions(todaysStockActions: StockAction[]): Prediction[] {
	let allPreviousStockActions = gatherPreviousStockActions();
	let predictions = [];
	todaysStockActions.forEach(todaysStockAction => {
		let price = todaysStockAction.price;
		let isValid: boolean = !!price;

		let previousStockAction = getPreviousStockAction(todaysStockAction, allPreviousStockActions);
		isValid = isValid && !!previousStockAction && !!previousStockAction.price;

		isValid = isValid && todaysStockAction.daySentiments.length === 4;

		if (isValid) {
			let x = createX(todaysStockAction, previousStockAction);
			predictions.push(new Prediction(todaysStockAction.stock.symbol, x));
		}
	});
	return predictions;
}

function gatherPreviousStockActions(): StockAction[] {
	let stockActions = [];
	FileUtil.lastResultsFiles.forEach(f => {
		let fStockActions = JSON.parse(fs.readFileSync(f, 'utf-8') || '[]').map(result => {
			let stock = new Stock(result.stock.symbol, result.stock.keywords);
			let daySentiments = result.daySentiments.map(d => {
				let daySentiment = new DaySentiment(new Date(d.day));
				daySentiment.numTweets = d.numTweets;
				daySentiment.totalSentiment = d.totalSentiment;
				return daySentiment;
			});
			let sa = new StockAction(stock, result.action, result.percentChange, result.numTweets, daySentiments);
			sa.price = result.price;
			return sa;
		});

		stockActions = stockActions.concat(fStockActions);
	});
	return stockActions;
}
function formatSvmData(allPreviousStockActions: StockAction[], priceThreshold: number): SvmData {
	let svmData = new SvmData();
	allPreviousStockActions.forEach(stockAction => {
		let svmRecord = [];

		let price = stockAction.price;
		let isValidSVmItem: boolean = !!price;

		let previousStockAction = getPreviousStockAction(stockAction, allPreviousStockActions);
		isValidSVmItem = isValidSVmItem && !!previousStockAction && !!previousStockAction.price;

		let nextStockAction = getNextStockAction(stockAction, allPreviousStockActions);
		isValidSVmItem = isValidSVmItem && !!nextStockAction && !!nextStockAction.price;

		//Validate Sentiments
		isValidSVmItem = isValidSVmItem && stockAction.daySentiments.length === 4;

		if (isValidSVmItem) {
			const increasePercent = ((nextStockAction.price - stockAction.price) / stockAction.price) * 100;

			let y = increasePercent > priceThreshold ? 1 : -1;
			debug(`${stockAction.stock.symbol}: ${nextStockAction.price} on ${formatDate(nextStockAction.getDate())}, ${stockAction.price} on ${formatDate(stockAction.getDate())} - Increase Percent: ${increasePercent}`)
			let x = createX(stockAction, previousStockAction);
			svmData.addRecord(x, y);
		}
	});

	return svmData;
}

function getPreviousStockAction(stockAction: StockAction, allPreviousStockActions: StockAction[]): StockAction {
	return getNearbyStockAction(stockAction, allPreviousStockActions, false);
}

function getNextStockAction(stockAction: StockAction, allPreviousStockActions: StockAction[]): StockAction {
	return getNearbyStockAction(stockAction, allPreviousStockActions, true);
}

function getNearbyStockAction(stockAction: StockAction, allPreviousStockActions: StockAction[], isForward: boolean): StockAction {
	let date = stockAction.getDate();
	let nearbyStockAction: StockAction = null;
	if (!stockAction.price) {
		return null;
	}
	let direction = isForward ? 1 : -1;
	let i = 0;
	while (!nearbyStockAction && i < 10) {
		i++;

		let candidateDate = new Date(+date + (i * oneDay * direction));
		let candidate = StockAction.findStockActionForSymbolAndDate(stockAction.stock.symbol, candidateDate, allPreviousStockActions);
		if (candidate && candidate.price && candidate.price !== stockAction.price) {
			nearbyStockAction = candidate;
		}

	}
	return nearbyStockAction;
}

function createX(stockAction: StockAction, previousStockAction: StockAction): number[] {
	let x = [];
	let timeGoneBy = +stockAction.getDate() - +previousStockAction.getDate();
	let changeInPrice = (stockAction.price - previousStockAction.price) / previousStockAction.price;

	let d0 = stockAction.daySentiments[0].totalSentiment;
	let d1 = stockAction.daySentiments[1].totalSentiment;
	let d2 = stockAction.daySentiments[2].totalSentiment;
	let d3 = stockAction.daySentiments[3].totalSentiment;

	x.push(changeInPrice);

	x.push(change(d0, d1));
	x.push(change(d1, d2));
	x.push(change(d2, d3));

	d0 = stockAction.daySentiments[0].numTweets;
	d1 = stockAction.daySentiments[1].numTweets;
	d2 = stockAction.daySentiments[2].numTweets;
	d3 = stockAction.daySentiments[3].numTweets;
	
	x.push(change(d0, d1));
	x.push(change(d1, d2));
	x.push(change(d2, d3));

	return x;
}

function change(one, two) {
	return (one - two) / Math.max(two, 1);
}
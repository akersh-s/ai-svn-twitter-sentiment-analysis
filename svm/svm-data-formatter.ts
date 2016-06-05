import * as fs from 'fs';

import {FileUtil} from '../shared/util/file-util';
import {StockAction, Action} from '../sentiment-search/twitter/day-sentiment';

export function getSvmData() {
	let allPreviousStockActions = gatherPreviousStockActions();
	let formattedSvmData = formatSvmData(allPreviousStockActions);
}

function gatherPreviousStockActions():StockAction[] {
	let stockActions = [];
	FileUtil.lastResultsFiles.forEach(f => {
		let fStockActions = JSON.parse(fs.readFileSync(f, 'utf-8') || '[]');
		stockActions = stockActions.concat(fStockActions);
	});
	return stockActions;
}
function formatSvmData(allPreviousStockActions: StockAction[]): number[][] {
	let svmDataFormatted: number[][] = [];
	allPreviousStockActions.forEach(previousStockAction => {
		let svmRecord = [];
		let price = previousStockAction.price;
	});
	
	return svmDataFormatted;
}



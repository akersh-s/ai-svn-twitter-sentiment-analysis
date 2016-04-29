var fs = require('fs');
require('./util/funcs');

var companyList = fs.readFileSync(__dirname + '/../companylist.csv', 'utf-8');
var count = 0;
var isFirst = true;
var lines = companyList.split(/[\n\r]+/g);

lines.forEach(function(line) {
	if (isFirst) {
		isFirst = false;
		return;
	}
	var pieces = line.split('","');
	if (!pieces[1]) {
		return;
	}
	var symbol = pieces[0].replace('"', '').trim();
	var name = pieces[1].trim().replace(/[.]/g, '');
	var lastSale = parseFloat(pieces[2]);
	if (symbol.containsAny('^', '.') || isNaN(lastSale)) {
		return;
	}
	if (lastSale > 20) {
		return;
	} 
	if (lastSale < 5) {
		return;
	}
	count++;

	console.log("node scripts/sentiment-search.js --tag='$" + symbol + "' --search='" + name + "' | tee -a $out")
});

console.log(count);

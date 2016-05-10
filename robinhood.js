var Robinhood = require('./robinhood.api');

var robinhood = Robinhood({
    username: 'tomskytwo',
    password: ''
}, function() {
    robinhood.portfolios(function(error, response, body) {
        if (error) {
            console.error(error);
            process.exit(1);
        }
        var account = body.results[0];
        var equity = parseFloat(account.equity);
        var marketValue = parseFloat(account.market_value);
        var buyingPower = ((equity - marketValue) * 0.95).toFixed(2);
        console.log('Buying Power: ' + buyingPower);
        console.log(account);
    });

    robinhood.instruments('BCS', function(err, response, body) {
        if (err) throw err;
        console.log('instruments', body.results[0]);
    });
    robinhood.quote_data('BCS', function(err, response, body) {
        if (err) throw err;
        console.log('quote data', body.results[0]);
    });

    robinhood.orders(function(err, response, body) {
        //Buy sell history
        if (err) throw err;

        console.log('investment profile', JSON.stringify(body.results, null, 4));
    });
})

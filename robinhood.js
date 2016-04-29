var Robinhood = require('robinhood');

Robinhood(null).quote_data('GOOG,MSFT', function(error, response, body) {
    if (error) {
        console.error(error);
        process.exit(1);
    }

    console.log(body);
});
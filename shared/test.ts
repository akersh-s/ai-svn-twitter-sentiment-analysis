import {Robinhood} from './robinhood.api';

let robinhood = new Robinhood(null, null);
robinhood.quote_data('GOOG', (err, response, body) => {
    console.log(body);
});

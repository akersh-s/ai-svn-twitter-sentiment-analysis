import {Robinhood} from './robinhood.api';

let robinhood = new Robinhood('tomskytwo', 'Bigapples1!');
robinhood.login(() => {
    robinhood.quote_data('GOOG', (err, response, body) => {
        console.log(body);
    })
});

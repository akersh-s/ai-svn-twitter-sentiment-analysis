'use strict';

import * as request from 'request';
import { RequestAPI, Request, CoreOptions } from 'request';

import * as yargs from 'yargs';
const argv = yargs.argv;

let endpoints = {
  login: 'https://api.robinhood.com/api-token-auth/',
  investment_profile: 'https://api.robinhood.com/user/investment_profile/',
  accounts: 'https://api.robinhood.com/accounts/',
  ach_iav_auth: 'https://api.robinhood.com/ach/iav/auth/',
  ach_relationships: 'https://api.robinhood.com/ach/relationships/',
  ach_transfers: 'https://api.robinhood.com/ach/transfers/',
  applications: 'https://api.robinhood.com/applications/',
  dividends: 'https://api.robinhood.com/dividends/',
  edocuments: 'https://api.robinhood.com/documents/',
  instruments: 'https://api.robinhood.com/instruments/',
  margin_upgrade: 'https://api.robinhood.com/margin/upgrades/',
  markets: 'https://api.robinhood.com/markets/',
  notifications: 'https://api.robinhood.com/notifications/',
  orders: 'https://api.robinhood.com/orders/',
  password_reset: 'https://api.robinhood.com/password_reset/request/',
  quotes: 'https://api.robinhood.com/quotes/',
  document_requests: 'https://api.robinhood.com/upload/document_requests/',
  user: 'https://api.robinhood.com/user/',
  watchlists: 'https://api.robinhood.com/watchlists/',
  positions: 'https://api.robinhood.com/positions/',
  portfolios: 'https://api.robinhood.com/portfolios/',
  fundamentals: 'https://api.robinhood.com/fundamentals/', // Need to concatenate symbol to end.
  cancel(orderId: string) {
    return `https://api.robinhood.com/orders/${orderId}/cancel/`;
  }
};

export class Robinhood {
  request: RequestAPI<Request, CoreOptions, any>;
  account: string;
  authToken: string;
  headers: any;
  constructor(private username: string, private password: string) {
    this.headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en;q=1, fr;q=0.9, de;q=0.8, ja;q=0.7, nl;q=0.6, it;q=0.5',
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'X-Robinhood-API-Version': '1.0.0',
      'Connection': 'keep-alive',
      'User-Agent': 'Robinhood/823 (iPhone; iOS 7.1.2; Scale/2.00)'
    };
    this.request = request.defaults({
      headers: this.headers,
      json: true,
      gzip: true
    });
  }

  login(cb: Function) {
    this.request.post({
      uri: endpoints.login,
      form: {
        username: this.username,
        password: this.password
      }
    }, (err, httpResponse, body) => {
      if (err) {
        throw err;
      }

      this.authToken = body.token;
      this.headers.Authorization = 'Token ' + this.authToken;

      this.accounts((err2, response, body2) => {
        this.account = body2.results[0].url;
        cb();
      });
    });
  }
  loginPromise(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        this.login(() => {
          resolve();
        });
      }
      catch (e) {
        reject();
      }
    });
  }

  accounts(cb: (err, response, body) => any) {
    return this.get(endpoints.accounts, cb);
  }

  accountsPromise(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.accounts((err, response, body) => {
        if (err) {
          return reject(err);
        }

        resolve(body);
      });
    });
  }

  cancel(orderId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.request.post(endpoints.cancel(orderId), (err, response, body) => {
        if (err) {
          return reject(err);
        }
        resolve(body);
      });
    });
  }

  get(uri: string, cb: (err, response, body) => any) {
    return this.request.get({
      uri: uri
    }, cb);
  }

  getPromise(uri: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.get(uri, (err, response, body) => {
        if (err) {
          return reject(err);
        }

        resolve(body);
      });
    });
  }

  investment_profile(cb: (err, response, body) => any) {
    return this.get(endpoints.investment_profile, cb);
  }

  instruments(symbol: string, cb: (err, response, body) => any) {
    return this.request.get({
      uri: endpoints.instruments,
      qs: { query: symbol.toUpperCase() }
    }, cb);
  }

  quote_data(symbol: string, cb: (err, response, body: QuoteDataResultBody) => any) {
    return this.request.get({
      uri: endpoints.quotes,
      qs: { symbols: symbol.toUpperCase(), statistics: true }
    }, cb);
  }

  quote_dataPromise(symbol: string): Promise<QuoteDataResultBody> {
    return new Promise<QuoteDataResultBody>((resolve, reject) => {
      this.quote_data(symbol, (err, response, body) => {
        if (err) {
          return reject(err);
        }

        return resolve(body);
      });
    });
  }

  statistics(symbol: string, cb: (err, response, body) => any) {
    return this.request.get({
      uri: 'https://api.robinhood.com/stats/',
      qs: { symbols: symbol.toUpperCase() }
    }, cb);
  }

  user(cb: (err, response, body) => any) {
    return this.get(endpoints.user, cb);
  }

  dividends(cb: (err, response, body) => any) {
    return this.get(endpoints.dividends, cb);
  }

  orders(): Promise<OrderResponseBody> {
    return new Promise<OrderResponseBody>((resolve, reject) => {
      this.get(endpoints.orders, (err, response, body) => {
        if (err) {
          return reject(err);
        }
        return resolve(body);
      });
    });
  }

  positions(cb: (err, response, body) => any) {
    return this.get(endpoints.positions, cb);
  }

  positionsPromise(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        this.positions((err, response, body) => {
          if (err) {
            return reject(err);
          }
          resolve(body);
        });
      }
      catch (e) {
        reject(e);
      }
    });
  }

  applications(cb: (err, response, body) => any) {
    return this.get(endpoints.applications, cb);
  }

  portfolios(cb: (err, response, body) => any) {
    return this.get(endpoints.portfolios, cb);
  }

  watchlists(cb: (err, response, body) => any) {
    return this.get(endpoints.watchlists, cb);
  }

  document_requests(cb: (err, response, body) => any) {
    return this.get(endpoints.document_requests, cb);
  }

  fundamentals(symbol: string, cb: (err, response, body: FundamentalResponse) => any) {
    return this.get(`${endpoints.fundamentals}${symbol}/`, cb);
  }

  market(symbol: string, cb: (err, response, body) => any) {
    return this.get(`${endpoints.markets}${symbol}/`, cb);
  }

  placeOrder(symbol: string, quantity: number, transaction: string, cb: (err, response, body) => any) {
    const form: OrderForm = {
      account: this.account,
      quantity: quantity,
      side: transaction,
      symbol: symbol.toUpperCase(),
      time_in_force: 'gfd',
      trigger: 'immediate',
      type: 'market',
      instrument: null,
      price: undefined
    };

    this.instruments(symbol, (e1, resp, b1) => {
      if (e1) {
        throw e1;
      }
      else if (b1.results.length === 0) {
        return cb(e1, resp, b1);
      }

      const instrument = b1.results[0];
      form.instrument = instrument.url;

      this.quote_data(symbol, (err, response, body) => {
        if (err) {
          throw err;
        }

        const quoteData = body.results[0];

        const bidPrice = parseFloat(quoteData.bid_price);
        const askPrice = parseFloat(quoteData.ask_price);
        const betweenPrice = parseFloat(((bidPrice * 0.75) + (askPrice * 0.25)).toFixed(2));
        console.log(`${symbol} - Bid Price: ${bidPrice}, Ask Price: ${askPrice}, Between: ${betweenPrice}`);
        const price = argv.desperate ? betweenPrice : transaction === 'buy' ? bidPrice : askPrice;
        form.price = parseFloat(quoteData.last_trade_price);
        console.log(`Requesting ${quantity} ${symbol} stocks at $${price}`);
        return this.request.post({
          uri: endpoints.orders,
          form
        }, (e3, resp3, body3) => {
          if (body3 && body3.detail && body3.detail.indexOf('You can only purchase ') !== -1) {
            const newQuantity = parseFloat(body3.detail.replace(/You can only purchase (\d+).*/, '$1'));
            this.placeOrder(symbol, newQuantity, transaction, cb);
          }
          else {
            cb(err, response, body3);
          }
        });
      });
    });
  }

  buy(symbol: string, quantity: number, callback: (err, response, body) => any) {
    return this.placeOrder(symbol, quantity, 'buy', callback);
  }

  buyPromise(symbol: string, quantity: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.buy(symbol, quantity, (err, response, body) => {
        if (err) {
          return reject(err);
        }

        resolve(body);
      });
    });
  }

  sell(symbol: string, quantity: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.placeOrder(symbol, quantity, 'sell', (err, response, body) => {
        if (err) {
          return reject(err);
        }

        resolve(body);
      });
    });
  }
}

export interface QuoteDataResultBody {
  results: QuoteDataResult[];
}
export interface QuoteDataResult {
  ask_price: string;
  ask_size: string;
  bid_price: string;
  bid_size: number;
  last_trade_price: string;
  last_extended_hours_trade_price: string;
  previous_close: string;
  adjusted_previous_close: string;
  previous_close_date: string;
  symbol: string;
  trading_halted: boolean;
  updated_at: string;

  //Delete these fields
  instrument?: string;
}

export interface FundamentalResponse {
  open: string;
  high: string;
  low: string;
  volume: string;
  average_volume: string;
  high_52_weeks: string;
  dividend_yield: string;
  low_52_weeks: string;
  market_cap: string;
  pe_ratio: string;

  //Delete these fields
  description?: string;
  instrument?: string;
}

export interface OrderResponseBody {
  results: Order[];
  next: string;
}

export interface Order {
  updated_at: string;
  time_in_force: string;
  fees: string;
  id: string;
  cumulative_quantity: string;
  instrument: string;
  state: string; //filled
  trigger: string; //immediate
  type: string; //market
  last_transaction_at: string; //Date
  price: string; //number
  executions: any[];
  account: string;
  url: string;
  created_at: string;
  side: string; //buy or sell
  position: string;
  average_price: string;
  quantity: string;
}

type OrderForm = {
  account: string,
  instrument: string,
  symbol: string,
  type: string,
  time_in_force: string,
  trigger: string,
  price: number,
  stop_price?: number,
  quantity: number,
  side: string
};

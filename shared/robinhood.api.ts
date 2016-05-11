'use strict';

import * as request from 'request';
import {RequestAPI, Request, CoreOptions} from 'request';

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
  portfolios: 'https://api.robinhood.com/portfolios/'
};

export class Robinhood {
  request: RequestAPI<Request, CoreOptions, any>;
  account: string;
  auth_token: string;
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
      if (err) throw err;

      this.auth_token = body.token;
      this.headers.Authorization = 'Token ' + this.auth_token;

      this.accounts((err, response, body) => {
        this.account = body.results[0].url;
        cb();
      });
    });
  }

  accounts(cb: (err, response, body) => any) {
    return this.get(endpoints.accounts, cb);
  }

  private get(uri: string, cb: (err, response, body) => any) {
    return this.request.get({
      uri: uri
    }, cb);
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

  quote_data(symbol: string, cb: (err, response, body) => any) {
    return this.request.get({
      uri: endpoints.quotes,
      qs: { symbols: symbol.toUpperCase() }
    }, cb);
  }

  user(cb: (err, response, body) => any) {
    return this.get(endpoints.user, cb);
  }

  dividends(cb: (err, response, body) => any) {
    return this.get(endpoints.dividends, cb);
  }

  orders(cb: (err, response, body) => any) {
    return this.get(endpoints.orders, cb);
  }

  positions(cb: (err, response, body) => any) {
    return this.get(endpoints.positions, cb);
  }

  applications(cb: (err, response, body) => any) {
    return this.get(endpoints.applications, cb);
  }

  portfolios(cb: (err, response, body) => any) {
    return this.get(endpoints.portfolios, cb);
  }

  private placeOrder(symbol: string, quantity: number, transaction: string, cb: (err, response, body) => any) {
    let form = {
      account: this.account,
      quantity: quantity,
      side: transaction,
      symbol: symbol.toUpperCase(),
      time_in_force: 'gfd',
      trigger: 'immediate',
      type: 'market',
      instrument: null,
      price: null
    };

    this.instruments(symbol, (err, response, body) => {
      if (err) throw err;

      var instrument = body.results[0];
      form.instrument = instrument.url;

      this.quote_data(symbol, (err, response, body) => {
        if (err) throw err;

        var quoteData = body.results[0];
        form.price = quoteData.bid_price;

        return this.request.post({
          uri: endpoints.orders,
          form: form
        }, cb);
      });
    });
  }

  buy(symbol: string, quantity: number, callback: (err, response, body) => any) {
    return this.placeOrder(symbol, quantity, 'buy', callback);
  }

  sell(symbol: string, quantity: number, callback: (err, response, body) => any) {
    return this.placeOrder(symbol, quantity, 'sell', callback);
  }
}
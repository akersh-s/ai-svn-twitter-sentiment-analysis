import * as request from 'request';
import * as fs from 'fs';
import * as sentiment from 'sentiment';

import {RequestAPI, Request, CoreOptions} from 'request';
import {formatDate, today, yesterday, getLast3Days} from '../../shared/util/date-util';
import {DaySentiment} from '../model/day-sentiment.model';
import {Stock} from '../model/stock.model';
import {debug} from '../../shared/util/log-util';

export class StockTwits {
    headers: any;
    request: RequestAPI<Request, CoreOptions, any>;
    allTwits: Twit[];
    constructor(private stock: Stock) {
        this.headers = {
            'Accept': '*/*',
            'Accept-Language': 'en;q=1, fr;q=0.9, de;q=0.8, ja;q=0.7, nl;q=0.6, it;q=0.5',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'X-Robinhood-API-Version': '1.0.0',
            'Connection': 'keep-alive',
            'User-Agent': 'Robinhood/823 (iPhone; iOS 7.1.2; Scale/2.00)'
        };
        this.request = request.defaults({
            headers: this.headers
        });
    }

    async processStocktwitsSentiment(daySentiment: DaySentiment): Promise<DaySentiment> {
        try {
            let twits = await this.getHtmlPage(daySentiment.day);
            twits.forEach(twit => {
                let s: number = sentiment(twit.body).score;
                if (s !== 0) {
                    daySentiment.addTweetSentiment(s);
                }
            });
        }
        catch (e) {
            debug(e);
        }
        daySentiment.twitsComplete = true;
        return daySentiment;
    }

    private getHtmlPage(date: Date): Promise<Twit[]> {
        let symbol = this.stock.symbol.replace('$', '');
        
        return new Promise<Twit[]>((resolve, reject) => {
            this.request.get(`http://stocktwits.com/symbol/${symbol}`, (err, response, body) => {
                if (err) return reject(err);

                let twits: Twit[] = this.parseTwitsFromHtml(body);
                let minTwitId: number = this.getMinTwitId(twits);
                let csrfToken: string = this.parseCsrfToken(body);
                let streamId: string = this.parseTag(body, 'stream-id');
                let dataId: string = this.parseTag(body, 'data-id');
                this.headers['X-CSRF-Token'] = csrfToken;
                this.headers['X-Requested-With'] = 'XMLHttpRequest';
                this.request = request.defaults({
                    headers: this.headers
                });
                this.getMoreTwits(date, streamId, dataId, minTwitId * 100, []).then((twits: Twit[]) => {
                    resolve(twits);
                }, err => {
                    reject(err);
                });
            });
        });

    }

    private getMoreTwits(date: Date, streamId: string, dataId: string, minTwitId: number, twits: Twit[]):Promise<Twit[]> {
        minTwitId = Math.min(minTwitId, 9007199254740991);
        let url = `http://stocktwits.com/streams/poll?stream=symbol&max=${minTwitId}&stream_id=${streamId}&substream=all&item_id=${dataId}`;
        debug(url);
        return new Promise<Twit[]>((resolve, reject) => {
            this.request.get(url, (err, response, body) => {
                if (err) return reject(err);

                body = JSON.parse(body);
                let twitsToAddToList: Twit[] = [];
                if (Array.isArray(body.messages) && body.messages.length > 0) {
                    let messages: Twit[] = body.messages;
                    messages.forEach(message => {
                        if (this.isDate(message, date)) {
                            twitsToAddToList.push(message);
                        }
                    });
                }
                debug('Stocktwits Search completed. Results: ' + twitsToAddToList.length);
                if (twitsToAddToList.length > 0) {
                    twits = twits.concat(twitsToAddToList);
                    console.log('Getting more twits', twits.length);
                    let minTwitId = this.getMinTwitId(twits);
                    this.getMoreTwits(date, streamId, dataId, minTwitId, twits).then((twits: Twit[]) => {
                        resolve(twits);
                    });
                }
                else {
                    resolve(twits);
                }
            });
        });

    }

    private parseTwitsFromHtml(html): Twit[] {
        let parts: string[] = html.split('<li data-src=');
        parts.shift();

        let twits: Twit[] = parts.map((part) => {
            var encodedJson: string = part.split('"')[1];
            encodedJson = encodedJson.replace(/&quot;/g, '"');
            return JSON.parse(encodedJson);
        });

        return twits;
    }

    private parseCsrfToken(html): string {
        let parts: string[] = html.split('<meta content=');
        parts.shift();
        var csrfToken: string = null;
        parts.forEach((part) => {
            if (part.indexOf('csrf-token') !== -1) {
                csrfToken = part.split('"')[1];
            }
        });
        return csrfToken;
    }

    private parseTag(html: string, tag: string): string {
        let s = `${tag}=`; //Stream Id Tag
        var parsed = html.substring(html.indexOf(s) + s.length + 1);
        parsed = parsed.replace(/'/g, '"')
        parsed = parsed.substring(0, parsed.indexOf('"'));
        return parsed;
    }

    private getMinTwitId(twits: Twit[]) {
        var min = Infinity;
        twits.forEach((twit) => {
            if (twit.id < min) {
                min = twit.id;
            }
        })
        return min;
    }

    private isDate(twit: Twit, date: Date) {
        let messageDate = new Date(twit.created_at);
        return formatDate(date) === formatDate(messageDate); 
    }
}

export interface Twit {
    id: number;
    body: string;
    created_at: string; //Date
}

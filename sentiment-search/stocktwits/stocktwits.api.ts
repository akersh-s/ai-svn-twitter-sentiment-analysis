import * as request from 'request';
import * as fs from 'fs';
import * as sentiment from 'sentiment';

import {RequestAPI, Request, CoreOptions} from 'request';
import {formatDate, today, yesterday, getLast3Days} from '../util/date-util';
import {DaySentiment} from '../twitter/day-sentiment';
import {Stock} from '../stock.model';
import {debug} from '../util/log-util';


let datesToCollect = getLast3Days();
let formattedToday = formatDate(today);

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

    processStocktwitsSentimentForDay(day: Date, daySentiment: DaySentiment, cb: (err, daySentiment: DaySentiment) => any) {
        this.getTwitsForDate(day, (err, twits) => {
            if (err) cb(err, null);
            twits.forEach(twit => {
                let s: number = sentiment(twit.body).score;
                if (s !== 0) {
                    daySentiment.addTweetSentiment(s);
                }
            });
            cb(null, daySentiment);
        });
    }

    getAllTwits(cb: (err: any, twits: Twit[]) => any) {
        if (this.allTwits) {
            cb(null, this.allTwits);
        }
        else {
            this.getHtmlPage((err, twits) => {
                this.allTwits = twits;
                cb(err, twits);
            });
        }

    }

    getTwitsForDate(date: Date, cb: (err: any, twits: Twit[]) => any) {
        let formattedDate = formatDate(date);
        this.getAllTwits((err, twits) => {
            if (err) cb(err, null);
            let twitsForDate = twits.filter(twit => {
                let twitDate = new Date(twit.created_at);
                let formattedTwitDate = formatDate(twitDate);
                return formattedTwitDate === formattedDate;
            });
            debug(`${formattedDate} has ${twitsForDate.length} twits`);

            cb(null, twitsForDate);
        });
    }

    private getHtmlPage(cb: (err: any, twits: Twit[]) => any) {
        let symbol = this.stock.symbol.replace('$', '');
        this.request.get(`http://stocktwits.com/symbol/${symbol}`, (err, response, body) => {
            if (err) throw err;

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

            this.getMoreTwits(streamId, dataId, minTwitId * 100, [], cb);
        });
    }

    private getMoreTwits(streamId: string, dataId: string, minTwitId: number, twits: Twit[], cb: (err: any, twits: Twit[]) => any) {
        let url = `http://stocktwits.com/streams/poll?stream=symbol&max=${minTwitId}&stream_id=${streamId}&substream=all&item_id=${dataId}`;
        debug(url);
        this.request.get(url, (err, response, body) => {
            if (err) throw err;

            body = JSON.parse(body);
            let twitsToAddToList: Twit[] = [];
            if (Array.isArray(body.messages) && body.messages.length > 0) {
                let messages: Twit[] = body.messages;
                messages.forEach(message => {
                    if (this.isOneOfKeepDates(message)) {
                        twitsToAddToList.push(message);
                    }
                });
            }
            if (twitsToAddToList.length > 0) {
                twits = twits.concat(twitsToAddToList);
                console.log('Getting more twits', twits.length);
                let minTwitId = this.getMinTwitId(twits);
                this.getMoreTwits(streamId, dataId, minTwitId, twits, cb);
            }
            else {
                cb(null, twits);
            }
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

    private isOneOfKeepDates(twit: Twit) {
        var oneOfKeepDates = false;
        datesToCollect.forEach(date => {
            let messageDate = new Date(twit.created_at);
            oneOfKeepDates = oneOfKeepDates || formatDate(date) === formatDate(messageDate);
        })
        return oneOfKeepDates;
    }
}

export interface Twit {
    id: number;
    body: string;
    created_at: string; //Date
}


/*
import * as stocktwits from 'stocktwits';
import * as request from 'request';
import * as fs from 'fs';

let req = request.defaults({
    headers: {
        'Accept': '/*',
        'Accept-Language': 'en;q=1, fr;q=0.9, de;q=0.8, ja;q=0.7, nl;q=0.6, it;q=0.5',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'X-Robinhood-API-Version': '1.0.0',
        'Connection': 'keep-alive',
        'User-Agent': 'Robinhood/823 (iPhone; iOS 7.1.2; Scale/2.00)'//,
        //'X-CSRF-Token':'qW26qT5RAkkuLqTjMY4n9sxhwPftYv+++E0ZGjGpkRY=',
        //'X-Requested-With':'XMLHttpRequest'
    }
});
/*stocktwits.get('search/symbols', { q: '$GOOG' }, (err, res) => {
    if (err) throw JSON.stringify(err);
    console.log(res);
});




req.get('http://stocktwits.com/streams/poll?stream=symbol&max=54806081&stream_id=686&substream=top&item_id=686', (err, response, body) => {
    if (err) throw err;
    
    console.log(body);
})


*/
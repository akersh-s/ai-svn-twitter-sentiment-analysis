import * as fs from 'fs';
import * as path from 'path';
import * as sentiment from 'sentiment';

import {Stock} from '../model/stock.model';
import {today, formatDate, getUntilDate, getLast3Days, getOldestDate} from '../../shared/util/date-util';
import {debug} from '../../shared/util/log-util';
import {FileUtil} from '../../shared/util/file-util';
import {SearchParams, SearchResult, Status} from '../model/search.model';
import {DaySentiment} from '../model/day-sentiment.model';
import {Twitter} from './twitter-api/index.js';

let totalRequests = 0;
const formattedToday = formatDate(today);
let config = JSON.parse(fs.readFileSync(__dirname + '/twitter-config.json', 'utf-8'));
export class TwitterSearch {
    private requestTime: Date;
    private requests: number = 0;
    twitter: Twitter;
    cache: SentimentCacheItem[];

    constructor() {
        this.twitter = new Twitter(config);
    }

    async getTweetSentiment(daySentiment: DaySentiment): Promise<DaySentiment> {
        if (!this.cache) {
            this.cache = await this.downloadAllTweets();
        }
        let tweetSentiments = this.cache.filter(c => {
            return c.symbols.indexOf(daySentiment.stock.symbol) !== -1;
        });
        tweetSentiments.forEach(t => {
            daySentiment.addTweetSentiment(t.sentiment);
        });
        daySentiment.tweetsComplete = true;
        return daySentiment;
    }

    private async downloadAllTweets(): Promise<SentimentCacheItem[]> {
        let sentimentCache: SentimentCacheItem[] = []
        let symbols = FileUtil.getStocks();
        let currentIndex = 0;
        while (currentIndex < symbols.length) {
            let subSymbols = [];
            while (subSymbols.join(' OR ').length < 330 && currentIndex < symbols.length) {
                subSymbols.push(symbols[currentIndex++]);
            }
            let statuses = await this.get100Tweets(subSymbols.join(' OR '));
            statuses.forEach(status => {
                let s: number = sentiment(status.text).score;
                let symbols = this.findSymbolsInText(status.text, subSymbols);
                if (s && s !== 0) {
                    sentimentCache.push(new SentimentCacheItem(s, symbols))
                }
            });

        }
        return sentimentCache;
    }

    private findSymbolsInText(text: string, subSymbols: string[]): string[] {
        const upperText = text.toUpperCase();
        let symbolsInText: string[] = [];

        subSymbols.forEach(s => {
            if (upperText.indexOf(s.toUpperCase()) !== -1) {
                symbolsInText.push(s);
            }
        });

        return symbolsInText;
    }

    private get100Tweets(q: string, maxId?: string): Promise<Status[]> {
        const untilDate = getUntilDate(today);
        return new Promise<Status[]>((resolve, reject) => {
            setTimeout(() => {
                this.twitter.get('search/tweets', new SearchParams(q, untilDate, maxId).format(), (err: Error, tweets: SearchResult) => {
                    if (err) {
                        debug(err);
                        return resolve([]);
                    }
                    let statuses: Status[] = tweets.statuses || [];
                    statuses = statuses.filter(s => formatDate(new Date(s.created_at)) === formattedToday)
                    debug('Twitter Search completed. Results: ' + statuses.length);
                    let nextId: string = null;
                    if (tweets.search_metadata && tweets.search_metadata.next_results) {
                        nextId = this.parseNextId(tweets.search_metadata.next_results);
                    }
                    if (statuses.length > 0 && nextId) {
                        this.get100Tweets(q, nextId).then((moreStatuses: Status[]) => {
                            resolve(statuses.concat(moreStatuses));
                        });
                    }
                    else {
                        resolve(statuses);
                    }
                });
            }, this.getRequestTime());
        });
    }

    parseNextId(nextResults: string): string {
        var nextId = null;
        if (!nextResults) {
            return nextId;
        }
        var pieces = nextResults.split('&');
        pieces.forEach(function (param) {
            if (param.indexOf('max_id') !== -1) {
                var paramPieces = param.split('=');
                nextId = paramPieces[1];
            }
        });
        return nextId;
    }

    private getRequestTime(): number {
        const t15min = 1000 * 60 * 15;
        if (!this.requestTime || ((+new Date() - +this.requestTime)) > t15min) {
            this.requestTime = new Date();
            this.requests = 0;
        }
        this.requests++;
        let requestTime;
        if (this.requests < 170) {
            requestTime = 0;
        }
        else {
            let endTime: number = +this.requestTime + t15min;
            requestTime = Math.max(0, endTime - +new Date());
        }
        debug(`Request Pause Time: ${requestTime} ms - Total Requests: ${++totalRequests}`);
        return requestTime;
    }
}

class SentimentCacheItem {
    constructor(public sentiment: number, public symbols: string[]) { }
}

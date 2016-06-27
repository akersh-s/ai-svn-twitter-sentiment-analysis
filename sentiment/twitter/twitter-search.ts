import * as fs from 'fs';
import * as path from 'path';
import * as sentiment from 'sentiment';

import {Stock} from '../model/stock.model';
import {formatDate, getUntilDate, getLast3Days, getOldestDate} from '../../shared/util/date-util';
import {debug} from '../../shared/util/log-util';
import {SearchParams, SearchResult, Status} from '../model/search.model';
import {DaySentiment} from '../model/day-sentiment.model';
import {Twitter} from './twitter-api/index.js';


let config = JSON.parse(fs.readFileSync(__dirname + '/twitter-config.json', 'utf-8'));
export class TwitterSearch {
    twitter: Twitter;
    cache: SentimentCacheItem[];
    cacheFilled: boolean;

    constructor(private stock: Stock) {
        this.twitter = new Twitter(config);
        this.cache = [];
        this.cacheFilled = false;
    }

    async getTweets(daySentiment: DaySentiment): Promise<DaySentiment> {
        if (!this.cacheFilled) {
            await this.get100(daySentiment);
            this.cacheFilled = true;
        }
        let formattedDate = formatDate(daySentiment.day);
        let tweetSentiments = this.cache.filter(c => {
            return formatDate(c.date) === formattedDate && c.sentiment !== 0;
        });
        tweetSentiments.forEach(t => {
            daySentiment.addTweetSentiment(t.sentiment);
        });
        return daySentiment;
    }

    private get100(daySentiment: DaySentiment, maxId?: string):Promise<DaySentiment> {
        let q = this.stock.q;
        let untilDate = getUntilDate(daySentiment.day);
        
        debug('Doing search with maxId ' + maxId + ' for date ' + formatDate(daySentiment.day));
        return new Promise<DaySentiment>((resolve, reject) => {
            setTimeout(() => {
                this.twitter.get('search/tweets', new SearchParams(q, untilDate, maxId).format(), (err: Error, tweets: SearchResult) => {
                    if (err) {
                        debug(err);
                        return resolve(daySentiment);
                    }
                    
                    let statuses: Status[] = tweets.statuses || [];
                    debug('Search completed. Results: ' + statuses.length);
                    statuses.forEach((status) => {
                        let date = new Date(status.created_at);
                        let s:number = sentiment(status.text).score;
                        this.cache.push(new SentimentCacheItem(date, s));
                    });

                    var nextId:string = null;
                    if (tweets.search_metadata && tweets.search_metadata.next_results) {
                        nextId = this.parseNextId(tweets.search_metadata.next_results);
                    }
                    if (statuses.length > 0 && nextId) {
                        this.get100(daySentiment, nextId).then((daySentiment => {
                            resolve(daySentiment);
                        }));
                    } else {
                        resolve(daySentiment);
                    }
                });
            }, 5020); //Stay in the Allowed Number of calls.
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
}

class SentimentCacheItem {
    constructor(public date: Date, public sentiment: number) {}
}
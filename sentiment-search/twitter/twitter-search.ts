import {Stock} from '../stock.model';
import {formatDate, getUntilDate, today, yesterday} from '../util/date-util';
import {debug} from '../util/log-util';
import {SearchParams, SearchResult, Status} from './search.model';
import {DaySentiment} from './day-sentiment';
import * as sentiment from 'sentiment';
import {Twitter} from './twitter-api/index.js';
import * as fs from 'fs';
import * as path from 'path';

let config = JSON.parse(fs.readFileSync(__dirname + '/twitter-config.json', 'utf-8'));
export class TwitterSearch {
    twitter: Twitter;
    constructor(private stock: Stock) {
        this.twitter = new Twitter(config);

    }

    getTweets(date: Date, cb:Function) {
        let daySentiment = new DaySentiment(date);
        this.get100(date, daySentiment, cb);
    }

    private get100(day: Date, daySentiment: DaySentiment, cb: Function, prevStatuses?, maxId?: string) {
        let q = this.stock.q;
        let untilDate = getUntilDate(day);
        
        debug('Doing search with maxId ' + maxId + ' for date ' + formatDate(day));
        setTimeout(() => {
            this.twitter.get('search/tweets', new SearchParams(q, untilDate, maxId).format(), (err: Error, tweets: SearchResult) => {
                if (err) {
                    console.log(JSON.stringify(err));
                    throw err;
                }
                var containsYesterdaysTweets = false;
                let statuses: Status[] = tweets.statuses || [];
                debug('Search completed. Results: ' + statuses.length);
                statuses.forEach((status) => {
                    let date = new Date(status.created_at);
                    if (date.getDate() === day.getDate()) {
                        let s:number = sentiment(status.text).score;
                        if (s !== 0) {
                            daySentiment.addTweetSentiment(s);
                        }
                    } else {
                        containsYesterdaysTweets = true;
                    }
                });

                if (prevStatuses) {
                    statuses = prevStatuses.concat(statuses);
                }
                var nextId:string = null;
                if (tweets.search_metadata && tweets.search_metadata.next_results) {
                    nextId = this.parseNextId(tweets.search_metadata.next_results);
                }
                if (statuses.length > 0 && nextId && !containsYesterdaysTweets) {
                    this.get100(day, daySentiment, cb, statuses, nextId);
                } else {
                    cb(null, daySentiment);
                }
            });
        }, 5 * 1000); //Stay in the Allowed Number of calls.
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
        return nextId
    }
}
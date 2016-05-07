/// <reference path="sentiment.d.ts" />

import {IStock} from '../stock';
import {formatDate, getUntilDate} from '../util/date-util';
import {debug} from '../util/log-util';
import {SearchParams, SearchResult, Status} from './search.model';
import {DaySentiment} from './day-sentiment';
import sentiment from 'sentiment';
import {Twitter} from 'twitter';

export class TwitterSearch {
    constructor(private stock: IStock) {
    }

    getTweets(date: Date, cb:Function) {
        let formattedDate = formatDate(date);
        let isToday = formattedDate === formatDate(new Date());
        
        let daySentiment = new DaySentiment();
        this.get100(date, daySentiment, cb);
    }

    private get100(day: Date, daySentiment: DaySentiment, cb: Function, prevStatuses?, maxId?: string) {
        let q = '';
        let untilDate = getUntilDate(day);
        
        debug('Doing search');
        setTimeout(() => {
            twitter.get('search/tweets', new SearchParams(q, untilDate, maxId), (err: Error, tweets: SearchResult) => {
                if (err) {
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
                var nextId = null;
                if (tweets.search_metadata && tweets.search_metadata.next_results) {
                    nextId = this.parseNextId(tweets.search_metadata.next_results);
                }
                if (statuses.length > 0 && nextId !== -1 && !containsYesterdaysTweets) {
                    this.get100(day, daySentiment, cb, statuses, nextId);
                } else {
                    cb(statuses);
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
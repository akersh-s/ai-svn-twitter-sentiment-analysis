var twitter = new require('twitter')(require('./util/twitter-config.json'));
var sentiment = require('sentiment');
var fs = require('fs');
var path = require('path');
var async = require('async');
var argv = require('yargs').argv
var tag = argv.tag;
debug('Debug on.');
if (!argv.tag) {
    console.log('Please specify a Tag parameter');
    process.exit(1);
}
var search = tag;
if (argv.search) {
    search = [search, argv.search].join(' OR ');

}
debug('Searching with: ' + search);
var oneDay = 1000 * 60 * 60 * 24;
var last3Days = getLast3Days();

var sentiments = {};
try {
    sentiments = JSON.parse(fs.readFileSync(getSentimentFileName(), 'utf-8'));
} catch (e) {
    debug(getSentimentFileName() + ' doesnt exist.');
}

function getTweets(day, cb) {
    var formattedDate = formatDate(day);
    var isToday = formattedDate === formatDate(new Date());

    if (isToday || !sentiments[formattedDate]) {
        sentiments[formattedDate] = {
            totalSentiment: 0,
            numTweets: 0,
            count: 0
        };
        get100(day, cb);
    }
    else {
        cb();
    }

}


function get100(day, cb, prevStatuses, maxId) {
    var searchParams = {
        q: search,
        lang: 'en',
        count: 100,
        result_type: 'recent',
        until: getUntilDate(day)
    };
    if (maxId) {
        searchParams.max_id = maxId;
    }
    debug('Doing search');
    setTimeout(function() {
        twitter.get('search/tweets', searchParams, function(err, tweets, response) {
            if (err) {
                throw err;
            }
            var containsYesterdaysTweets = false;
            var statuses = tweets.statuses || [];
            debug('Search completed. Results: ' + statuses.length);
            var daySentiment = sentiments[formatDate(day)];
            statuses.forEach(function(status) {
                var date = new Date(status.created_at);
                if (date.getDate() === day.getDate()) {
                    var s = sentiment(status.text).score;
                    if (s !== 0) {
                        var multiplier = 1;
                        if (status.user && status.user.followers_count) {
                            //multiplier = status.user.followers_count;
                        }
                        daySentiment.totalSentiment += (s * multiplier);
                        daySentiment.numTweets += multiplier;
                        daySentiment.count++;
                    }
                } else {
                    containsYesterdaysTweets = true;
                }
            });

            if (prevStatuses) {
                statuses = prevStatuses.concat(statuses);
            }
            var nextId = -1;
            if (tweets.search_metadata) {
                nextId = parseNextId(tweets.search_metadata.next_results);
            }
            if (statuses.length > 0 && nextId !== -1 && !containsYesterdaysTweets) {
                get100(day, cb, statuses, nextId);
            } else {
                cb(statuses);
            }
        });
    }, 5 * 1000); //Stay in the Allowed Number of calls.
}

function parseNextId(nextResults) {
    var nextId = -1;
    if (!nextResults) {
        return nextId;
    }
    var pieces = nextResults.split('&');
    pieces.forEach(function(param) {
        if (param.indexOf('max_id') !== -1) {
            var paramPieces = param.split('=');
            nextId = paramPieces[1];
        }
    });
    return nextId
}

function getLast3Days() {
    return [getDaysAgo(3), getDaysAgo(2), getDaysAgo(1), getDaysAgo(0)];
}

function getDaysAgo(n) {
    var today = new Date();
    return new Date(+today - (n * oneDay));
}

function getUntilDate(day) {
    var tomorrow = new Date(+day + oneDay)
    return formatDate(tomorrow);
}

function formatDate(date) {
    var year = date.getFullYear() + '';
    var month = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;
    var day = date.getDate() + '';
    day = (day < 10 ? '0' : '') + day;
    var formatted = [year, month, day].join('-');
    return formatted;
}

function debug(out) {
    if (argv.debug) {
        console.log.apply(this, arguments);
    }
}

function calculateMeanVarianceAndDeviation(a) {
    var r = { mean: 0, variance: 0, deviation: 0 },
        t = a.length;
    for (var m, s = 0, l = t; l--; s += a[l]);
    for (m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
    return r.deviation = Math.sqrt(r.variance = s / t), r;
}

var seriesFuncs = [];
last3Days.forEach(function(day) {
    seriesFuncs.push(function(done) {
        debug('Running day:' + day);
        getTweets(day, function(tweets) {
            debug('Completed day: ' + day);
            done();
        });
    });
});


async.series(seriesFuncs, function() {
    var day;
    var formattedToday = formatDate(new Date());
    

    for (day in sentiments) {
        var daySentiment = sentiments[day];
        if (daySentiment.numTweets > 5) {
            daySentiment.average = daySentiment.totalSentiment / daySentiment.numTweets;
        }
    }
    
    debug(JSON.stringify(sentiments, null, 4));
    writeFile();

    var todaysSentiment = sentiments[formattedToday].average;
    var previousAverages = [];
    last3Days.forEach(function(day)  {
        var formattedDate = formatDate(day);
        var daySentiment = sentiments[formattedDate];
        if (formattedDate !== formattedToday && daySentiment.average) {
            previousAverages.push(daySentiment.average);
        }
    });
    if (previousAverages.length < 3 || !todaysSentiment) {
        console.log('Not enough tweets: ' + tag);
        
        return;
    }
    var math = calculateMeanVarianceAndDeviation(previousAverages);
    var buyPrice = math.mean + math.deviation;
    var sellPrice = math.mean - math.deviation;
    var change = calcIncreasePercent(todaysSentiment, math.mean);
    if (todaysSentiment > buyPrice) {
        console.log('Buy ' + tag + '. Change: ' + change);
    } else if (todaysSentiment < sellPrice) {
        console.log('Sell ' + tag + '. Change: ' + change);
    } else {
        console.log('Do nothing');
    }
});

function getSentimentFileName() {
    var filename = tag.toUpperCase().replace('$', '') + '.json';
    return path.join(__dirname, '..', 'data', filename);
}

function writeFile() {
    fs.writeFileSync(getSentimentFileName(), JSON.stringify(sentiments), 'utf-8');
}

function calcIncreasePercent(today, previous) {
    var diff = today - previous;
    var div = diff / previous;
    return (div * 100).toFixed(2) + '%';
}
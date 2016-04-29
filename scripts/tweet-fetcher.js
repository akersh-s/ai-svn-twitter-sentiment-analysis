var twitter = new require('twitter')(require('./util/twitter-config.json'));
var sentiment = require('sentiment');
var fs = require('fs');
var path = require('path');

var tweets = [];

twitter.stream('statuses/sample', {
    language: 'en'
}, function(stream) {
    stream.on('data', function(twitterData) {
        var s = sentiment(twitterData.text);

        //Don't care about tweets with 0 sentiment.
        if (s.comparative === 0) {
            return;
        }

        tweets.push({
            created_at: twitterData.created_at,
            text: twitterData.text,
            followers_count: twitterData.user.followers_count,
            friends_count: twitterData.user.friends_count,
            sentiment: {
                comparative: s.comparative,
                score: s.score
            }
        });

        if (tweets.length >= 10000) {
            save(tweets);
            tweets = [];
            
        }
    });
});

function save(group) {
    var loc = path.join(__dirname, '..', 'data', +new Date() + '.json');
    fs.writeFile(loc, JSON.stringify(group), 'utf-8');
}

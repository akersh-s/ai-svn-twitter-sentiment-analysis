rm -rf results.json

#Do Sentiment Analysis on each symbol from Twitter
while read symbol keywords; do
    ts-node sentiment-search --symbol="$symbol" --keywords="$keywords" --debug
done < "sentiment-search/stocks"

#Determine which to buy and save symbols to buy.json
ts-node sentiment-search/process-results.ts

#Read buy.json and send in requests based on buy power.
ts-node buyer/index.ts --username='tomskytwo' --password='Bigapples1!'

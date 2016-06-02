rm -rf ~/results.json
rm -rf ~/svm.json

today=`date`

#Do Sentiment Analysis on each symbol from Twitter
while read symbol keywords; do
    ts-node sentiment-search --symbol="$symbol" --keywords="$keywords" --today="$today" --debug
    echo "ts-node sentiment-search --symbol=$symbol --keywords=$keywords" --today="$today" --debug
done < "sentiment-search/stocks"

#Determine which to buy and save symbols to buy.json
ts-node sentiment-search/process-results.ts --today="$today" --debug

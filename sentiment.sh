rm -rf ~/results.json
rm -rf ~/svm.json

#Do Sentiment Analysis on each symbol from Twitter
while read symbol keywords; do
    ts-node sentiment-search --symbol="$symbol" --keywords="$keywords" --debug
    echo "ts-node sentiment-search --symbol=$symbol --keywords=$keywords --debug"
done < "sentiment-search/stocks"

#Determine which to buy and save symbols to buy.json
ts-node sentiment-search/process-results.ts

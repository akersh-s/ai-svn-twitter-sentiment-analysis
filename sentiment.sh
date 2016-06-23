rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json

#today=`date`
today='06/22/2016'

tsc --p ./
cp -R sentiment/ build/sentiment/

#Do Sentiment Analysis on each symbol from Twitter
while read symbol keywords; do
    date
    node build/sentiment --symbol="$symbol" --keywords="$keywords" --today="$today" --debug
    echo "ts-node sentiment --symbol=\"$symbol\" --keywords=\"$keywords\" --today=\"$today\" --debug"
done < "sentiment/stocks"

#Determine which to buy and save symbols to buy.json
ts-node process --today="$today" --debug

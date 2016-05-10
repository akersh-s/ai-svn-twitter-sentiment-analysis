rm -rf results.json

while read symbol keywords; do
    ts-node sentiment-search --symbol="$symbol" --keywords="$keywords" --debug
done < "sentiment-search/stocks"

ts-node sentiment-search/process-results.ts

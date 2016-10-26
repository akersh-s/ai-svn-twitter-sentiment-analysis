cat run-out-* | grep 'Run:' > records

f=results.csv
echo 'Total, Price Threshold, Num Days, Previous Day Sentiments, Include Sentiment Change, Include Price Change, Include Num Tweets Change, Include Sentiment, Include Price, Include Price Bracket, Include Num Tweets, Include Time, Include Time Change, Include Volume Change, Include Day of Week' > $f

while read record; do
    total=`echo "$record" | awk -F 'Total: ' '{print $2}' | awk -F ' ' '{print $1}'`
    priceThreshold=`echo "$record" | awk -F '--price-threshold=' '{print $2}' | awk -F ' ' '{print $1}'`
    numDays=`echo "$record" | awk -F '--num-days=' '{print $2}' | awk -F ' ' '{print $1}'`
    previousDaySentiments=`echo "$record" | awk -F '--previous-day-sentiments=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeSentimentChange=`echo "$record" | awk -F '--include-sentiment-change=' '{print $2}' | awk -F ' ' '{print $1}'`
    includePriceChange=`echo "$record" | awk -F '--include-price-change=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeNumTweetsChange=`echo "$record" | awk -F '--include-num-tweets-change=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeSentiment=`echo "$record" | awk -F '--include-sentiment=' '{print $2}' | awk -F ' ' '{print $1}'`
    includePrice=`echo "$record" | awk -F '--include-price=' '{print $2}' | awk -F ' ' '{print $1}'`
    includePriceBracket=`echo "$record" | awk -F '--include-price-bracket=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeNumTweets=`echo "$record" | awk -F '--include-num-tweets=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeTime=`echo "$record" | awk -F '--include-time=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeTimeChange=`echo "$record" | awk -F '--include-time-change=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeVolumeChange=`echo "$record" | awk -F '--include-volume-change=' '{print $2}' | awk -F ' ' '{print $1}'`
    includeDayOfWeek=`echo "$record" | awk -F '--include-day-of-week=' '{print $2}' | awk -F ' ' '{print $1}'`
    
    echo "$total, $priceThreshold, $numDays, $previousDaySentiments, $includeSentimentChange, $includePriceChange, $includeNumTweetsChange, $includeSentiment, $includePrice, $includePriceBracket, $includeNumTweets, $includeTime, $includeTimeChange, $includeVolumeChange, $includeDayOfWeek" >> $f

done < records


rm records
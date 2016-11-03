cat run-* | grep 'Run:' > records

f=results.csv
echo 'Total, Num Above, Num Below' > $f

while read record; do
    total=`echo "$record" | awk -F 'Total: ' '{print $2}' | awk -F ' ' '{print $1}'`
    runId=`echo "$record" | awk -F 'Run: ' '{print $2}' | awk -F ' ' '{print $1}'`
    numAbove=`cat run-* | grep -B 450 "Run: $runId" | grep -A 500 'SVM Finished' | grep -c '%\d'`
    numBelow=`cat run-* | grep -B 450 "Run: $runId" | grep -A 500 'SVM Finished' | grep -c '%-\d'`
    options=`echo "$record" | awk -F 'Options: ' '{print $2}' | sed 's/ --/, /g' | sed 's/--//g'`
    percentAbove=$(((100 * $numAbove) / ($numAbove + $numBelow)))
    if [ $percentAbove -gt 50 ]; then
        echo "$runId, Total: \$$total, $numAbove, $numBelow, %$percentAbove, $options"
    fi
    
    #echo "$total, $priceThreshold, $numDays, $previousDaySentiments, $includeSentimentChange, $includePriceChange, $includeNumTweetsChange, $includeSentiment, $includePrice, $includePriceBracket, $includeNumTweets, $includeTime, $includeTimeChange, $includeVolumeChange, $includeDayOfWeek" >> $f

done < records


rm records
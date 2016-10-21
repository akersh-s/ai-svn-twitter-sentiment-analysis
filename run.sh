today='09/12/2016'
	
rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json
touch runs;
run=0

while [ 1 ]; do
	previousDaySentiments=10
    skipDaySentiments=2
    
	includeDayOfWeek=false #`ts-node shared/random-of`
	includeNumTweetsChange=true #`ts-node shared/random-of`
    includeNumTweets=true #`ts-node shared/random-of`
    includePriceBracket=false #`ts-node shared/random-of`
    includeTimeChange=false #`ts-node shared/random-of`
    includeSentimentChange=false #`ts-node shared/random-of`
    includePriceChange=false #`ts-node shared/random-of`
    skipDaySentiments=1 #`ts-node shared/random-of --random=1,3,5`
    includeSentiment=true #`ts-node shared/random-of`
    includePrice=false #`ts-node shared/random-of`
    includeVolumeChange=true #`ts-node shared/random-of`
    priceThreshold=`ts-node shared/random-of --random=0,1,3,5`
    numDays=`ts-node shared/random-of --random=1,2,3,4,5,10`
    data=7000

	rm -rf out

	options="--price-threshold=$priceThreshold --num-days=$numDays --previous-day-sentiments=$previousDaySentiments --skip-day-sentiments=$skipDaySentiments --include-sentiment-change=$includeSentimentChange --include-price-change=$includePriceChange --include-num-tweets-change=$includeNumTweetsChange --include-sentiment=$includeSentiment --include-price=$includePrice --include-price-bracket=$includePriceBracket --include-num-tweets=$includeNumTweets --include-time=false --include-time-change=$includeTimeChange --include-volume-change=$includeVolumeChange --include-day-of-week=$includeDayOfWeek --max-svm-data=$data"
    optionsEscaped=`echo "$options" | sed 's/-/\\\-/g'`
    ranAlready=`cat runs | grep '$optionsEscaped'`
    if [ -n "$ranAlready" ]; then
    	continue;
    fi
    
	ts-node process/format --today="$today" --debug $options
	ts-node process/run-svm --today="$today" --debug $options
    echo "SVM Finished"

	ts-node process/run-process-results --today="10/12/2016" --debug --past $options | tee -a out
	ts-node process/run-process-results --today="10/6/2016" --debug --past $options | tee -a out
	ts-node process/run-process-results --today="10/7/2016" --debug --past $options | tee -a out
	ts-node process/run-process-results --today="09/14/2016" --debug --past $options | tee -a out
	ts-node process/run-process-results --today="09/20/2016" --debug --past $options | tee -a out
	total=`cat out | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1} END {print s}'`
    run=$(($run + 1))
    echo "Run: $run - Total: $total $options"
    echo "$options" >> runs
done

#today=`ts-node shared/get-yesterday`
#ts-node sentiment --today="$today" --debug
#ts-node process/run-process-results --today="$today" --debug
#rm -rf out
#ts-node process/run-process-results --today="10/14/2016" --debug --past | tee -a out
#ts-node process/run-process-results --today="10/13/2016" --debug --past | tee -a out
#ts-node process/run-process-results --today="10/3/2016" --debug --past | tee -a out
#ts-node process/run-process-results --today="10/4/2016" --debug --past | tee -a out
#ts-node process/run-process-results --today="09/13/2016" --debug --past | tee -a out
#ts-node process/run-process-results --today="09/19/2016" --debug --past | tee -a out
#ts-node process/run-process-results --today="09/6/2016" --debug --past
#ts-node process/run-process-results --today="09/7/2016" --debug --past
#ts-node process/run-process-results --today="09/8/2016" --debug --past
#ts-node process/run-process-results --today="08/3/2016" --debug --past
#ts-node process/run-process-results --today="08/10/2016" --debug --past
#ts-node process/run-process-results --today="08/17/2016" --debug --past
#ts-node process/run-process-results --today="08/24/2016" --debug --past
#ts-node process/run-process-results --today="08/16/2016" --debug --past
#ts-node process/run-process-results --today="08/15/2016" --debug --past
#ts-node process/run-process-results --today="08/12/2016" --debug --past
#ts-node process/run-process-results --today="08/10/2016" --debug --past
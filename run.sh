today='09/13/2016'
	
rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json
touch runs;
out=out-$RANDOM
echo "Out: $out"
while [ 1 ]; do
	previousDaySentiments=`ts-node shared/random-of --random=3,5,10,15`
    #skipDaySentiments=1
    
	#includeDayOfWeek=`ts-node shared/random-of`
	#includeNumTweetsChange=false #`ts-node shared/random-of`
    #includeNumTweets=`ts-node shared/random-of`
    #includePriceBracket=`ts-node shared/random-of`
    #includeTimeChange=false #`ts-node shared/random-of`
    #includeSentimentChange=false #`ts-node shared/random-of`
    #includePriceChange=false #`ts-node shared/random-of`
    #skipDaySentiments=1 #`ts-node shared/random-of --random=1,3,5`
    #includeSentiment=`ts-node shared/random-of`
    #includePrice=`ts-node shared/random-of`
    #includeVolumeChange=false #`ts-node shared/random-of`
    #priceThreshold=0 #`ts-node shared/random-of --random=0,1,3,5,6,8`
    numDays=`ts-node shared/random-of --random=2,5,10`
    #svmType=`ts-node shared/random-of --random=C_SVC,NU_SVC`
    #kernelType=`ts-node shared/random-of --random=LINEAR,RBF,SIGMOID`
    includeStockVolatility=`ts-node shared/random-of`
    includeStockMomentum=`ts-node shared/random-of`
    includeVolumeVolatility=`ts-node shared/random-of`
    includeVolumeMomentum=`ts-node shared/random-of`
    includeSentimentVolatility=`ts-node shared/random-of`
    includeSentimentMomentum=`ts-node shared/random-of`
    includePriceChange=`ts-node shared/random-of`
    includeVolumeChange=`ts-node shared/random-of`

	rm -rf $out

	options="--include-stock-volatility=$includeStockVolatility --include-stock-momentum=$includeStockMomentum --include-volume-volatility=$includeVolumeVolatility --include-volume-momentum=$includeVolumeMomentum --include-sentiment-volatility=$includeSentimentVolatility --include-sentiment-momentum=$includeSentimentMomentum --num-days=$numDays --previous-day-sentiments=$previousDaySentiments --include-price-change=$includePriceChange --include-volume-change=$includeVolumeChange"
    echo $options
    optionsEscaped=`echo "$options" | sed 's/-/\\\-/g'`
    ranAlready=`cat runs | grep "$optionsEscaped"`
    if [ -n "$ranAlready" ]; then
    	continue;
    fi
    
	ts-node process/format --today="$today" --debug --run-id=$out $options
	ts-node process/run-svm --today="$today" --debug --run-id=$out $options
    echo "SVM Finished"

    ts-node process/run-process-results --today="09/23/2016" --debug --past --run-id=$out $options | tee -a $out &
    ts-node process/run-process-results --today="09/27/2016" --debug --past --run-id=$out $options | tee -a $out &
	ts-node process/run-process-results --today="09/28/2016" --debug --past --run-id=$out $options | tee -a $out &
   	ts-node process/run-process-results --today="10/13/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="10/12/2016" --debug --past --run-id=$out $options | tee -a $out &
	ts-node process/run-process-results --today="10/6/2016" --debug --past --run-id=$out $options | tee -a $out &
	ts-node process/run-process-results --today="10/7/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/14/2016" --debug --past --run-id=$out $options | tee -a $out 
	ts-node process/run-process-results --today="09/20/2016" --debug --past --run-id=$out $options | tee -a $out

	total=`cat $out | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1; t++} END {print "Total:", s, "Average:", s/t}'`
    if [ -n "$total" ]; then
        echo "Run: $RANDOM - $total Options: $options"
        echo "$options" >> runs
    fi
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
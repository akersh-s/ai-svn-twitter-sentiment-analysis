today='08/16/2016'

rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json
rm -rf runs
touch runs;
out=out-$RANDOM
echo "Out: $out"
while [ 1 ]; do
	#previousDaySentiments=7 #`ts-node shared/random-of --random=3,4,5,6,7,8,9,10`
    #skipDaySentiments=1
    
	#includeDayOfWeek=false #`ts-node shared/random-of`
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
    #priceThreshold=`ts-node shared/random-of --random=0,0,0,0,0,1,3,5,6,8`
    numDays=`ts-node shared/random-of --random=1,2,3,4,5`
    #svmType=`ts-node shared/random-of --random=C_SVC,NU_SVC`
    
    includeStockVolatility=`ts-node shared/random-of`
    includeStockMomentum=`ts-node shared/random-of`
    includeVolumeVolatility=`ts-node shared/random-of`
    includeVolumeMomentum=`ts-node shared/random-of`
    includeSentimentVolatility=`ts-node shared/random-of`
    includeSentimentMomentum=`ts-node shared/random-of`
    includeSentimentChange=`ts-node shared/random-of`
    includePriceChange=`ts-node shared/random-of`
    includeVolumeChange=`ts-node shared/random-of`
    #flag=`ts-node shared/random-of --random=include-stock-volatility,include-stock-momentum,include-volume-volatility,include-volume-momentum,include-sentiment-volatility,include-sentiment-momentum,include-price-change,include-volume-change`

    #kernelType=`ts-node shared/random-of --random=LINEAR,RBF,SIGMOID`
    #svmType=`ts-node shared/random-of --random=C_SVC,NU_SVC`
    #normalize=`ts-node shared/random-of`
    #reduce=`ts-node shared/random-of`
    #kFold=`ts-node shared/random-of --random=1,2,3,4`
    retainedVariance=1 #`ts-node shared/random-of --random=0.99,0.95,0.85,0.75,0.50`
    #shrinking=`ts-node shared/random-of`

	rm -rf $out

    options="--retained-variance=$retainedVariance"
	#options="--num-days=$numDays --include-stock-volatility=$includeStockVolatility --include-stock-momentum=$includeStockMomentum --include-volume-volatility=$includeVolumeVolatility --include-volume-momentum=$includeVolumeMomentum --include-sentiment-volatility=$includeSentimentVolatility --include-sentiment-momentum=$includeSentimentMomentum  --include-price-change=$includePriceChange --include-volume-change=$includeVolumeChange --include-sentiment-change=$includeSentimentChange"
    
    #options="--kernel-type=$kernelType --svm-type=$svmType --normalize=$normalize --reduce=$reduce --k-fold=$kFold --retained-variance=$retainedVariance --shrinking=$shrinking"
    echo $options
    optionsEscaped=`echo "$options" | sed 's/-/\\\-/g'`
    ranAlready=`cat runs | grep "$optionsEscaped"`
    #if [ -n "$ranAlready" ]; then
    	#continue;
    #fi

    rm -rf "~/svm-model-$out.json"
    
	ts-node process/format --today="$today" --debug --run-id=$out $options
	ts-node process/run-svm --today="$today" --debug --run-id=$out $options
    
    #if [ -e "~/svm-model-$out.json" ]; then
        #echo "SVM Finished"
    #else
        #continue;
    #fi

    ts-node process/run-process-results --today="08/22/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/23/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/24/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/25/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/26/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/29/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/30/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="08/31/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/01/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/05/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/06/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/07/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/08/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/09/2016" --debug --past --run-id=$out $options | tee -a $out
   	ts-node process/run-process-results --today="09/12/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/13/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/14/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/15/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/16/2016" --debug --past --run-id=$out $options | tee -a $out
   	ts-node process/run-process-results --today="09/19/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/20/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/21/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/22/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/23/2016" --debug --past --run-id=$out $options | tee -a $out
	ts-node process/run-process-results --today="09/26/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/27/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/28/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/29/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="09/30/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/03/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/04/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/05/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/06/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/07/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/11/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/12/2016" --debug --past --run-id=$out $options | tee -a $out
    ts-node process/run-process-results --today="10/13/2016" --debug --past --run-id=$out $options | tee -a $out


	total=`cat $out | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1; t++} END {print "Total:", s, "Average:", s/t}'`
    numAbove=`cat $out | grep -c '%\d'`
    numBelow=`cat $out | grep -c '%-\d'`
    if [ "$numAbove" -gt 0 ]; then
        percentAbove=$(((100 * $numAbove) / ($numAbove + $numBelow)))
    else
        percentAbove=0
    fi
    
    if [ -n "$total" ]; then
        echo "Run: $RANDOM - $total, Above: $numAbove, Below: $numBelow, Success Rate: %$percentAbove, Options: $options"
        echo "$options" >> runs
    fi
done

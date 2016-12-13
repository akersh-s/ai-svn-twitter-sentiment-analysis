test() {
    rm -rf "~/svm-model-$out.json"

    ts-node process/format --today="$today" --debug --run-id=$out $options
	ts-node process/run-svm --today="$today" --debug --run-id=$out $options
    
    rm -rf $outfile
    while read date; do
        ts-node process/run-process-results --today="$date" --debug --past --max-svm-data=20000 --run-id=$out $options | tee -a $outfile
    done < ./scripts/dates
	
    totalNum=`cat $outfile | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1; t++} END {print s}'`
    total=`cat $outfile | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1; t++} END {print "Total:", s, "Average:", s/t}'`
    numAbove=`cat $outfile | grep -c '%\d'`
    numBelow=`cat $outfile | grep -c '%-\d'`
    if [ "$numAbove" -gt 0 ]; then
        percentAbove=$(((100 * $numAbove) / ($numAbove + $numBelow)))
    else
        percentAbove=0
    fi
    
    median=`ts-node ./scripts/run-loop/find-median.ts --file="$file"`
    if [ -n "$totalNum" ]; then
        echo "Run: $RANDOM - $total, Median: $median, Above: $numAbove, Below: $numBelow, Success Rate: %$percentAbove, Options: $options"
    else
        totalNum=0
    fi
    newOut=out-$RANDOM
    msg=`ts-node ./scripts/run-loop/update-if-better.ts --median="$median" $options`
    echo "$msg"
    terminal-notifier -message "$msg" -title "Run Complete"
    #ls | grep "out-" | xargs rm -rf
    #for file in `ls ~/ | grep 'out-'`; do
        #rm -rf ~/$file
    #done
}

#Start
mkdir .tmp || true
today='09/15/2016'
out=out-$RANDOM
outfile=".tmp/$out"
file="`pwd`/$outfile"
echo "Out: $out"

while [ 1 ]; do
    options=`ts-node ./scripts/run-loop/read-config.ts`
    echo "Testing Options: $options"
    test
done
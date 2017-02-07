test() {

    rm -rf $outfile
    ts-node scripts/run-loop/test-dates.ts --run-id='' | tee -a $outfile
    #while read date; do
    #    ts-node process/run-process-results --fast --today="$date" --debug --past --run-id=$out $options | tee -a $outfile
    #done < ./scripts/dates

	
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
    now=`date`
    if [ -n "$totalNum" ]; then
        echo "Date: $now - $total, Median: $median, Above: $numAbove, Below: $numBelow, Success Rate: %$percentAbove, Options: $options"
    else
        totalNum=0
    fi
    msg=`ts-node ./scripts/run-loop/update-if-better.ts --median="$median" $options`
    echo "$msg $options" | tee -a messages
    terminal-notifier -message "$msg" -title "Run Complete"
    #ls | grep "out-" | xargs rm -rf
    #for file in `ls ~/ | grep 'out-'`; do
        #rm -rf ~/$file
    #done
}

#Start

mkdir .tmp || true
today='09/19/2016'
out=out-$RANDOM
outfile=".tmp/$out"
file="`pwd`/$outfile"
echo "Out: $out"


#cat ./shared/all-stocks | while read stock; do
#    echo "$stock" > ./shared/stocks
#    echo "Stock: $stock"
#    options=""
#    test
#done
#exit 0

#cat ./scripts/custom-options | while read options; do
#    echo "Testing Options: $options"
#    test
#done
#exit 0

while [ 1 ]; do
    #options=`ts-node ./scripts/run-loop/read-config.ts`
    options=''
    echo "Testing Options: $options"
    test
    exit 0
done
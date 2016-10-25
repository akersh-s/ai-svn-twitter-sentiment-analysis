today='09/12/2016'

out=out-$RANDOM
echo "Out: $out"
ts-node process/run-process-results --today="10/3/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/4/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/5/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/6/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/7/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/11/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/12/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/13/2016" --debug --past | tee -a $out &
ts-node process/run-process-results --today="10/14/2016" --debug --past | tee -a $out
ts-node process/run-process-results --today="10/17/2016" --debug --past | tee -a $out

total=`cat $out | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1; t++} END {print "Total:", s, "Average:", s/t}'`

echo "Run: $run - $total Options: $options" | tee -a $out

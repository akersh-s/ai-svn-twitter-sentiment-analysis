today='08/16/2016'
ts-node process/format --today="$today" --debug
ts-node process/run-svm --today="$today" --debug


out=out-$RANDOM
echo "Out: $out"

ts-node process/run-process-results --today="08/22/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="08/23/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="08/24/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="08/25/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="08/26/2016" --debug --past  | tee -a $out

ts-node process/run-process-results --today="08/29/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="08/30/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="08/31/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/01/2016" --debug --past  | tee -a $out &

ts-node process/run-process-results --today="09/05/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/06/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/07/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/08/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/09/2016" --debug --past  | tee -a $out

ts-node process/run-process-results --today="09/12/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/13/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/14/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/15/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/16/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/19/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/20/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/21/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="02/22/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/23/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/26/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/27/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/28/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="09/29/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="09/30/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="10/03/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="10/04/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="10/05/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="10/06/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="10/07/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="10/11/2016" --debug --past  | tee -a $out &
ts-node process/run-process-results --today="10/12/2016" --debug --past  | tee -a $out
ts-node process/run-process-results --today="10/13/2016" --debug --past  | tee -a $out


total=`cat $out | grep 'Average Earning Percent' | awk -F ':' '{print $2}' | awk '{s+=$1; t++} END {print "Total:", s, "Average:", s/t}'`

echo "Run: $out - $total" | tee -a $out

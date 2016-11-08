today=`date`
ts-node process/format --today="$today" --debug
ts-node process/run-svm --today="$today" --debug --max-svm-data=30000

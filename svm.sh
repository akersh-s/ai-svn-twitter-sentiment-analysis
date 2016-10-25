today=`date`
today='09/28/2016'
ts-node process/format --today="$today" --debug
ts-node process/run-svm --today="$today" --debug

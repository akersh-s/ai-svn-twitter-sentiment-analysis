today=`date`
today='2016/12/15'
ts-node process/format --today="$today" --debug
ts-node process/run-svm --today="$today" --debug

#today=`date`
today='2017/1/20'
ts-node process/format --today="$today" --debug
ts-node process/run-svm --today="$today" --debug

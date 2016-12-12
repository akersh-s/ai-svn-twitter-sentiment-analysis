today=`date`
today='2016/11/09'
ts-node process/format --today="$today" --debug
ts-node process/run-svm --today="$today" --debug --max-svm-data=35000

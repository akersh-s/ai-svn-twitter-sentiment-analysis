rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json

today=`date`
ts-node sentiment --today="$today" --debug

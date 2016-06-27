rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json

today=`date`
ts-node sentiment --today="$today" --debug

#Determine which to buy and save symbols to buy.json
ts-node process --today="$today" --debug

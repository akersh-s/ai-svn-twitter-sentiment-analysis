rm -rf ~/results.json
rm -rf ~/svm.json
rm -rf ~/buy.json

today=`ts-node shared/get-yesterday`
ts-node sentiment --today="$today" --debug
ts-node process/run-process-results --today="$today" --debug

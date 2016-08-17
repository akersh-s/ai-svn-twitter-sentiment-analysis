today=`date`
ts-node process/format --today="$today" --debug
ts-node process/run --today="$today" --debug

yesterday=`ts-node shared/get-yesterday.ts`
ts-node process/format --today="$yesterday" --debug
ts-node process/run --today="$yesterday" --debug
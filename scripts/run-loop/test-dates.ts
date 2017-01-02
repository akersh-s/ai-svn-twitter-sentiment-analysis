import * as fs from 'fs';
import { exec } from 'child_process';
import { argv } from 'yargs';
const runId = argv['run-id'];
const options = argv['options'];
const dates = fs.readFileSync(__dirname + '/../dates', 'utf-8').trim().split(/[\n\r]+/).map(d => new Date(d));

function getNextN(n: number, startIndex: number): Date[] {
    return dates.filter((d, i) => i >= startIndex && i < (startIndex + n));
}

async function runDateGroup(dateGroup: Date[]): Promise<void[]> {
    const runs = dateGroup.map(date => new Promise<void>((resolve, reject) => {
        const command = `ts-node process/run-process-results --fast --today="${date}" --debug --past --run-id=${runId} ${options}`;
        console.log(command);
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            stdout && console.log(stdout);
            stderr && console.log(stderr);
            resolve();
        });
    }));
    return Promise.all(runs);
}

run();
async function run() {
    let curIndex: number = 0;
    while (curIndex < dates.length) {
        const curDates: Date[] = getNextN(3, curIndex);
        curIndex += curDates.length;
        await runDateGroup(curDates);
    }
}

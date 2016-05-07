import * as yargs from 'yargs';

let isDebug = yargs.argv.debug;

export function debug(val: any) {
    if (isDebug) {
        console.log(val);
    } 
}
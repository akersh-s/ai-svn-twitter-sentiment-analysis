import { LoopConfig } from './loop-config.model';
import * as fs from 'fs';
import * as path from 'path';
import { argv } from 'yargs';

const f = path.join(__dirname, '../custom-options');
const triedOptionsF = path.join(__dirname, '../tried-options');
const customOptions = fs.existsSync(f) && fs.readFileSync(f, 'utf-8').trim().split(/[\n\r]+/);
let triedOptions = (fs.existsSync(triedOptionsF) && fs.readFileSync(triedOptionsF, 'utf-8').trim().split(/[\n\r]+/)) || [];

function createOptions(): string {
    if (argv.now) {
        const config = LoopConfig.read();
        return config.toString();
    }
    if (customOptions && customOptions[0]) {
        const first = customOptions.shift();
        fs.writeFileSync(f, customOptions.join('\n'), 'utf-8');
        return first;
    } else {
        const config = LoopConfig.read();
        const numChanges = Math.random() > 0.75 ? 150 : Math.ceil(Math.random() * 6);
        for (let i = 0; i < numChanges; i++) {
            config.makeChange();
        }

        return config.toString();
    }
}

function isValidOptions(options: string): boolean {
    if (!triedOptions.find(o => o === options)) {
        triedOptions.push(options);
        fs.writeFileSync(triedOptionsF, triedOptions.join('\n').trim(), 'utf-8');
        return true;
    }
    return false;
}

let validConfigFound = false;
for (let i = 0; i < 100 && !validConfigFound; i++) {
    const options = createOptions();
    if (argv.now || isValidOptions(options)) {
        console.log(options);
        validConfigFound = true;
        break;
    }
}
if (!validConfigFound) {
    console.log('');
}
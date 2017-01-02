import { LoopConfig } from './loop-config.model';
import * as fs from 'fs';
import * as path from 'path';

const f = path.join(__dirname, '../custom-options');
const customOptions = fs.existsSync(f) && fs.readFileSync(f, 'utf-8').trim().split(/[\n\r]+/);
if (customOptions && customOptions[0]) {
    const first = customOptions.shift();
    console.log(first);
    fs.writeFile(f, customOptions.join('\n'), 'utf-8');

} else {
    const config = LoopConfig.read();
    const numChanges = Math.random() > 0.01 ? 150 : Math.ceil(Math.random() * 6);
    for (let i = 0; i < numChanges; i++) {
        config.makeChange();
    }

    console.log(config.toString());

}


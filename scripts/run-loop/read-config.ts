import { LoopConfig } from './loop-config.model';

const config = LoopConfig.read();
const numChanges = Math.floor(Math.random() * 10);
for (let i = 0; i < numChanges; i++) {
    config.makeChange();
}

console.log(config.toString());

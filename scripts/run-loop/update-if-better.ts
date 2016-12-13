import { argv } from 'yargs';
import { LoopConfig } from './loop-config.model';
import { Variables } from '../../shared/variables';

function readMedian(): number {
    try {
        return parseFloat(argv.median);
    }
    catch (e) {
        return 0;
    }
}

const loopConfig = LoopConfig.read();

const median = readMedian() / Variables.numDays;

loopConfig.lastChangedIndex = loopConfig.incrementIndex(loopConfig.lastChangedIndex);
if (median > loopConfig.bestTotal) {
    console.log('New median was greater!', `${median} > ${loopConfig.bestTotal}`);
    loopConfig.update(median);
    loopConfig.save();
}
else {
    console.log('New median was less!', `${median} <= ${loopConfig.bestTotal}`);
    loopConfig.lastChangedIndex = loopConfig.incrementIndex(loopConfig.lastChangedIndex);
}


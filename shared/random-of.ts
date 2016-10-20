import {argv} from 'yargs';

const randomValues = (argv.random || 'true,false').split(',');
const rand = randomValues[Math.floor(Math.random() * randomValues.length)];

console.log(rand);

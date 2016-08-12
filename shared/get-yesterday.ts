import {oneDay} from './util/date-util';

let time = Date.now() - oneDay;
console.log(new Date(time));
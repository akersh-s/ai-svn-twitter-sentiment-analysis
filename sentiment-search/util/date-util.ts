import * as yargs from 'yargs';
import {debug} from './log-util';
let argv = yargs.argv;

export let oneDay = 1000 * 60 * 60 * 24;
export let today = argv.today ? new Date(argv.today) : new Date();
export let yesterday = new Date(+today - oneDay);
export let tomorrow = new Date(+today + oneDay);

debug(`Today: ${formatDate(today)}`);

export function formatDate(date: Date, char?: string): string {
    char = char || '-';
    let year: string = date.getFullYear() + '';
    let month: number = date.getMonth() + 1;
    let monthStr: string = (month < 10 ? '0' : '') + month;
    let day: string = (date.getDate() < 10 ? '0' : '') + date.getDate();

    let formatted = [year, monthStr, day].join(char);
    return formatted;
}

export function getLast3Days(): Date[] {
    let dates = [today], i;
    for (i = 0; i < 3; i++) {
        dates.unshift(getPreviousWorkDay(dates[0]));
    }
    
    return dates;
}

export function getPreviousWorkDay(date: Date): Date {
    var prevDate = date;
    var isWeekend = true;
    while (isWeekend) {
        prevDate = new Date(+prevDate - oneDay);
        isWeekend = (prevDate.getDay() == 6) || (prevDate.getDay() == 0);
    }
    return prevDate;
}

export function getDaysAgo(n: number): Date {
    var today = new Date();
    return new Date(+today - (n * oneDay));
}

export function getUntilDate(day: Date): string {
    var tomorrow = new Date(+day + oneDay)
    return formatDate(tomorrow);
}

export function isWeekend(date:Date) {
    var day = date.getDay();
    var isWeekend = (day == 6) || (day == 0);

    return isWeekend;
};
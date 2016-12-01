import * as yargs from 'yargs';
import {debug} from './log-util';
import {FileUtil} from './file-util';
let argv = yargs.argv;
export let today;
export let yesterday;
export let tomorrow;
export let oneDay = 1000 * 60 * 60 * 24;
setToday(argv.today ? new Date(argv.today) : new Date())

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
    let prevDate = date;
    let isWeekend = true;
    while (isWeekend) {
        prevDate = new Date(+prevDate - oneDay);
        isWeekend = (prevDate.getDay() === 6) || (prevDate.getDay() === 0);
    }
    return prevDate;
}

export function getNextWorkDay(date: Date): Date {
    let nextDate = date;
    let isWeekend = true;
    while (isWeekend) {
        nextDate = new Date(+nextDate + oneDay);
        isWeekend = (nextDate.getDay() === 6) || (nextDate.getDay() === 0);
    }
    return nextDate;
}

export function getDaysAgo(n: number, refDate?: Date): Date {
    refDate = refDate || today;
    let daysRemoved = 0, i = 0;
    let posMultiplier = n >= 0 ? 1 : -1;
    let date: Date = refDate;
    while (daysRemoved <= Math.abs(n)) {
        date = new Date(+refDate - (i * oneDay * posMultiplier));
        if (!isWeekend(date)) {
            daysRemoved++;
        }
        i++;
    }
    return date;
}

export function getUntilDate(day: Date): string {
    const t = new Date(+day + oneDay);
    return formatDate(t);
}

export function getOldestDate(dates: Date[]): Date {
    let oldestDateMs: number = Infinity;
    dates.forEach(d => {
        oldestDateMs = Math.min(oldestDateMs, +d);
    });
    return new Date(oldestDateMs);
}

export function isWeekend(date:Date): boolean {
    var day = date.getDay();
    var isWeekend = (day == 6) || (day == 0);

    return isWeekend;
};

export function isSameDay(d1: Date, d2: Date): boolean {
    return formatDate(d1) === formatDate(d2);
}

export function setToday(date: Date):void {
    today = date;
    yesterday = determinePreviousWorkDay(today);
    tomorrow = new Date(+today + oneDay);

    debug(`Today: ${formatDate(today)} - Yesterday: ${formatDate(yesterday)}`);
}

function determinePreviousWorkDay(today:Date): Date {
    let previousDay = new Date(+today - oneDay);
    while (previousDay.getDay() === 6 || previousDay.getDay() === 0) {
        previousDay = new Date(+previousDay - oneDay);
    }
    return previousDay;
}

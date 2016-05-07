let oneDay = 1000 * 60 * 60 * 24;

export function formatDate(date: Date): string {
    let year:string = date.getFullYear() + '';
    let month:number = date.getMonth() + 1;
    let monthStr:string = (month < 10 ? '0' : '') + month;
    let day:string = (date.getDate() < 10 ? '0' : '') + date.getDate;
    
    let formatted = [year, monthStr, day].join('-');
    return formatted;
}

export function getLast3Days():Date[] {
    return [getDaysAgo(3), getDaysAgo(2), getDaysAgo(1), getDaysAgo(0)];
}

export function getDaysAgo(n:number):Date {
    var today = new Date();
    return new Date(+today - (n * oneDay));
}

export function getUntilDate(day: Date): string {
    var tomorrow = new Date(+day + oneDay)
    return formatDate(tomorrow);
}
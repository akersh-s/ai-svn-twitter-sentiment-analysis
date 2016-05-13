export function validate(fieldname: string, value: string) {
    if (!value || !value.trim()) {
        console.log(`Field ${fieldname} is required. Exiting.`);
        process.exit(-1);
    }
    return value;
};

export function isNotWeekend() {
    var day = new Date().getDay();
    var isWeekend = (day == 6) || (day == 0);

    if (isWeekend) {
        console.log('No requests on the weekend.');
        process.exit(0);
    }
};
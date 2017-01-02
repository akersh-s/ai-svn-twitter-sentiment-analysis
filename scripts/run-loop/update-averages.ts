import * as fs from 'fs';
import { argv } from 'yargs';

class Average {
    constructor(
        public name: string,
        public value: number,
        public count: number
    ) { }

    static parse(obj): Average {
        return new Average(obj.name, obj.value, obj.count);
    }
}
class AverageGroup {
    static averagesFile: string = __dirname + '/averages.json';
    averages: Average[];
    constructor(public obj: any) {
        this.averages = obj.map(o => Average.parse(o));
    }

    static read(): AverageGroup {
        const obj = fs.existsSync(AverageGroup.averagesFile) ? JSON.parse(fs.readFileSync(AverageGroup.averagesFile, 'utf-8')) : [];
        return new AverageGroup(obj);
    }
    write(): void {
        fs.writeFileSync(AverageGroup.averagesFile, JSON.stringify(this.averages, null, 4), 'utf-8');
    }

    addAverage(name: string, value: number): void {
        const average = this.averages.find(a => a.name === name);
        if (average) {
            average.value += value;
            average.count++;
        }
        else {
            this.averages.push(new Average(name, value, 1));
        }
    }
}
function isValidFlag(flag: string) {
    return flag.indexOf('-') !== -1 && flag.indexOf('median') === -1 && flag.indexOf('update-if-better') === -1;
}
export function updateAverages(median: number) {
    const averageGroup = AverageGroup.read();
    for (let value in argv) {
        if (isValidFlag(value)) {
            const flag = `${value}=${argv[value]}`;
            averageGroup.addAverage(flag, median);
        }
    }
    averageGroup.write();
}

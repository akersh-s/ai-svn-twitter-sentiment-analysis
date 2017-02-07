import * as fs from 'fs';
import { argv } from 'yargs';

const loopConfigFile = './config.json';

export class LoopConfig {
    fields: Field<any>[] = [];
    static read(): LoopConfig {
        if (!fs.existsSync(loopConfigFile)) {
            return LoopConfig.create();
        }
        const fContents = fs.readFileSync(loopConfigFile, 'utf-8');
        const loopConfig = LoopConfig.parse(JSON.parse(fContents));
        return loopConfig;
    }

    static parse(obj: LoopConfig): LoopConfig {
        const loopConfig = new LoopConfig(obj.lastChangedIndex, obj.bestTotal, obj.version);
        const fieldArr: any[] = obj.fields;
        fieldArr.forEach((field) => {
            loopConfig.fields.push(new Field(field.key, field.value, field.otherValues));
        });
        return loopConfig;
    }
    static create(): LoopConfig {
        const loopConfig = new LoopConfig(0, 0, 0);
        loopConfig.fields.push(new Field('--include-stock-volatility', true, []));
        loopConfig.fields.push(new Field('--include-stock-momentum', true, []));

        loopConfig.fields.push(new Field('--include-volume-volatility', true, []));
        loopConfig.fields.push(new Field('--include-volume-momentum', true, []));

        loopConfig.fields.push(new Field('--include-sentiment-volatility', true, []));
        loopConfig.fields.push(new Field('--include-sentiment-momentum', true, []));

        loopConfig.fields.push(new Field('--include-volume-change', true, []));
        loopConfig.fields.push(new Field('--include-sentiment-change', true, []));
        loopConfig.fields.push(new Field('--include-price-change', true, []));

        loopConfig.fields.push(new Field('--include-sub', 'true', ['true', 'false']));

        loopConfig.fields.push(new Field('--price-thresold', 0, [0, 1, 2, 3, 4]));
        loopConfig.fields.push(new Field('--kernel-type', 'RBF', ['RBF', 'SIGMOID']));
        loopConfig.fields.push(new Field('--svm-type', 'C_SVC', ['C_SVC', 'NU_SVC', 'NU_SVR']));
        loopConfig.fields.push(new Field('--normalize', 'false', ['true', 'false']));
        loopConfig.fields.push(new Field('--k-fold', 4, [1, 2, 3, 4]));
        loopConfig.fields.push(new Field('--retained-variance', 0.5, [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99]));
        loopConfig.fields.push(new Field('--num-days', 3, [2, 3, 4, 5, 6, 7]));
        loopConfig.fields.push(new Field('--eps', 1e-3, [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 0, 1]));
        loopConfig.save();
        return loopConfig;
    }

    makeChange() {
        let madeChange = false;
        let i = this.incrementIndex(this.lastChangedIndex);
        while (!madeChange) {
            const curField = this.fields[i];
            if (curField.canChange()) {
                curField.change();
                madeChange = true;
            }
            else {
                i = this.incrementIndex(i);
            }
        }
        this.lastChangedIndex = i;
    }
    incrementIndex(cur: number): number {
        return Math.floor(Math.random() * this.fields.length);
        /*cur++;
        if (cur >= this.fields.length) {
            cur = 0;
        }
        return cur;*/
    }

    update(newTotal: number) {
        this.version++;
        this.bestTotal = newTotal;
        this.fields.forEach(field => {
            const newValue = argv[field.keyNoDashes];
            if (newValue) {
                if (typeof field.value === 'number') {
                    field.value = parseFloat(newValue);
                }
                else {
                    field.value = newValue;
                }
            }
        });
    }

    save() {
        fs.writeFileSync(loopConfigFile, JSON.stringify(this, null, 4), 'utf-8');
    }

    toString() {
        return this.fields.map(f => f.toString()).join(' ');
    }

    constructor(
        public lastChangedIndex: number,
        public bestTotal: number,
        public version: number
    ) { }
}

class Field<T> {
    constructor(
        public key: string,
        public value: T,
        public otherValues: T[]
    ) { }

    canChange(): boolean {
        return this.otherValues.length > 0;
    }
    change(): void {
        const originalValue = this.value;
        let newValue: T = this.getNewCandidateValue();
        for (let i = 0; i < 10 && originalValue === newValue; i++) {
            newValue = this.getNewCandidateValue();
        }
        this.value = newValue;
    }

    get keyNoDashes() {
        return this.key.replace('--', '');
    }

    toString(): string {
        return `${this.key}=${this.value}`;
    }

    private getNewCandidateValue(): T {
        return this.otherValues[Math.floor(Math.random() * this.otherValues.length)];
    }
}

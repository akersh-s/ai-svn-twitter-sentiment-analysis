import * as fs from 'fs';
import * as async from 'async';

import {Variables} from '../shared/variables';
import {FileUtil} from '../shared/util/file-util';
import {setToday, formatDate} from '../shared/util/date-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {runSentiment, SvmResult} from './';
import {processResults} from '../process/process-results';

const dates = [new Date('07/13/2016'), new Date('07/15/2016')];
async function runTests() {
    for (let run = 1; run < 10000; run++) {
        console.log(`Run ${run}`);

        const priceThreshold = getRandomIntInclusive(0, 5);
        const numDays = getRandomIntInclusive(1, 4);
        const numPreviousDaySentiments = getRandomIntInclusive(2, 5);
        const rbfsigma = 0.5;//getRandomBoolean ? 0.5 : getRandomIntInclusive(1e-3, 1e3);
        const C = 1;//getRandomBoolean() ? 1 : getRandomIntInclusive(1e-3, 1e3);
        const includeSentimentChange = getRandomBoolean();
        const includePriceChange = getRandomBoolean();
        const includeNumTweetsChange = getRandomBoolean();
        const includeSentiment = getRandomBoolean();
        const includePrice = false;//getRandomBoolean();
        const includeNumTweets = getRandomBoolean();
        const includeTime = false;//getRandomBoolean();
        const includeTimeChange = getRandomBoolean();
        const includeHighChange = getRandomBoolean();
        const includeLowChange = getRandomBoolean();
        const includeVolumeChange = getRandomBoolean();
        const kernelType = ['LINEAR', 'POLY', 'RBF', 'SIGMOID'][getRandomIntInclusive(0, 3)];
        const svmType = 'C_SVC';//['C_SVC', 'NU_SVC', 'ONE_CLASS', 'EPSILON_SVR', 'NU_SVR'][getRandomIntInclusive(0, 4)];


        const testDetails = new TestDetails(priceThreshold, numDays, numPreviousDaySentiments, rbfsigma, C, includeSentimentChange, includePriceChange, includeNumTweetsChange, includeSentiment, includePrice, includeNumTweets, includeTime, includeTimeChange, includeHighChange, includeLowChange, includeVolumeChange, kernelType, svmType, dates);

        try {
            console.log(JSON.stringify(testDetails));
            await runTest(testDetails);
        }
        catch (e) {
            console.error(e);
        }
    }
}

async function runTest(testDetails: TestDetails): Promise<any> {
    let moneyMade: number = 0;
    for (var i = 0; i < testDetails.days.length; i++) {
        let day = testDetails.days[i];

        setToday(day);
        FileUtil.refreshFileNames();
        testDetails.setup();
        
        console.log(`Day: ${formatDate(day)}`);
        let m:number = 0;
        try {
            m = await processResults();
        }
        catch (e) {}
        moneyMade += m;
    }
    if (!moneyMade) {
        return;
    } 
    testDetails.moneyMade = moneyMade;

    let bestSearchResults = [];
    if (fs.existsSync(FileUtil.bestSearchFile)) {
        bestSearchResults = JSON.parse(fs.readFileSync(FileUtil.bestSearchFile, 'utf-8'));
    }
    bestSearchResults.push(testDetails);

    fs.writeFileSync(FileUtil.bestSearchFile, JSON.stringify(bestSearchResults, null, 4), 'utf-8');

    return;
}


class TestDetails {
    public moneyMade: number;
    constructor(
        public priceThreshold: number,
        public numDays: number,
        public numPreviousDaySentiments: number,
        public rbfsigma: number,
        public C: number,
        public includeSentimentChange: boolean,
        public includePriceChange: boolean,
        public includeNumTweetsChange: boolean,
        public includeSentiment: boolean,
        public includePrice: boolean,
        public includeNumTweets: boolean,
        public includeTime: boolean,
        public includeTimeChange: boolean,
        public includeHighChange: boolean,
        public includeLowChange: boolean,
        public includeVolumeChange: boolean,
        public kernelType: string,
        public svmType: string,
        public days: Date[]) { }

    setup(): void {
        Variables.priceThreshold = this.priceThreshold;
        Variables.numDays = this.numDays;
        Variables.numPreviousDaySentiments = this.numPreviousDaySentiments;
        Variables.rbfsigma = this.rbfsigma;
        Variables.C = this.C;
        Variables.includeSentimentChange = this.includeSentimentChange;
        Variables.includePriceChange = this.includePriceChange;
        Variables.includeNumTweetsChange = this.includeNumTweetsChange;
        Variables.includeSentiment = this.includeSentiment;
        Variables.includePrice = this.includePrice;
        Variables.includeNumTweets = this.includeNumTweets;
        Variables.includeTime = this.includeTime;
        Variables.includeTimeChange = this.includeTimeChange;

        Variables.includeHighChange = this.includeHighChange;
        Variables.includeLowChange = this.includeLowChange;
        Variables.includeVolumeChange = this.includeVolumeChange;
        Variables.kernelType = this.kernelType;
        Variables.svmType = this.svmType;

        FileUtil.lastResultsFiles = FileUtil.collectLast45ResultFiles();
    }
}

function getRandomIntInclusive(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomBoolean(): boolean {
    return Math.random() > 0.5;
}

runTests();

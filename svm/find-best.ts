import * as fs from 'fs';
import * as async from 'async';

import {Variables} from '../shared/variables';
import {FileUtil} from '../shared/util/file-util';
import {setToday} from '../shared/util/date-util';
import {DaySentiment} from '../sentiment/model/day-sentiment.model';
import {runSentiment, SvmResult} from './';
import {processResults} from '../process';

const dates = [new Date('06/23/2016'), new Date('06/28/2016'), new Date('06/29/2016')];
async function runTests() {
    for (let run = 1; run < 10000; run++) {
        console.log(`Run ${run}`);

        const priceThreshold = getRandomIntInclusive(0, 3);
        const numDays = getRandomIntInclusive(1, 4);
        const numPreviousDaySentiments = getRandomIntInclusive(2, 5);
        const rbfsigma = 0.5;//getRandomBoolean ? 0.5 : getRandomIntInclusive(1e-3, 1e3);
        const C = 1;//getRandomBoolean() ? 1 : getRandomIntInclusive(1e-3, 1e3);
        const includeSentimentChange = getRandomBoolean();
        const includePriceChange = getRandomBoolean();
        const includeNumTweetsChange = getRandomBoolean();
        const includeSentiment = getRandomBoolean();
        const includePrice = getRandomBoolean();
        const includeNumTweets = getRandomBoolean();
        const includeTime = getRandomBoolean();
        const includeTimeChange = getRandomBoolean();
        const includeHigh = false;//getRandomBoolean();
        const includeLow = false;//getRandomBoolean();
        const includeVolume = false;//getRandomBoolean();

        const testDetails = new TestDetails(priceThreshold, numDays, numPreviousDaySentiments, rbfsigma, C, includeSentimentChange, includePriceChange, includeNumTweetsChange, includeSentiment, includePrice, includeNumTweets, includeTime, includeTimeChange, includeHigh, includeLow, includeVolume, dates);

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
        

        let m:number = await processResults();
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
    public moneyMade:number;
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
        public includeHigh: boolean,
        public includeLow: boolean,
        public includeVolume: boolean,
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

        Variables.includeHigh = this.includeHigh;
        Variables.includeLow = this.includeLow;
        Variables.includeVolume = this.includeVolume;

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

import {Variables} from '../shared/variables';

export async function runTests():Promise<any> {
    
}

export function runTest(testDetails: TestDetails) {

}


class TestDetails {
    constructor(
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
        public includeVolume: boolean) {}

    setup():void {
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
    }
}

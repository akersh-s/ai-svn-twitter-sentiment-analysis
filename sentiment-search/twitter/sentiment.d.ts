declare module "sentiment" {
    /**
 * Performs sentiment analysis on the provided input 'phrase'.
 *
 * @param {String} Input phrase
 * @param {Object} Optional sentiment additions to AFINN (hash k/v pairs)
 *
 * @return {Object}
 */
    export default function (phrase: any): {
        score: number;
        comparative: number;
        tokens: any;
        words: any[];
        positive: any[];
        negative: any[];
    };

}

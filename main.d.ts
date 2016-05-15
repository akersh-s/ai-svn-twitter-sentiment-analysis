declare var __dirname: string;

declare var sentiment: (phrase: any, inject?: any, callback?: any) => {
    score: number;
    comparative: number;
    tokens: any;
    words: any[];
    positive: any[];
    negative: any[];
};
declare module "sentiment" {
    export = sentiment;
}

declare module "stocktwits" {
    export function get(path: string, params: any, cb: (err, res) => any);
}
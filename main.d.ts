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

declare module 'JSONStream' {

	export interface Options {
		recurse: boolean;
	}

	export function parse(pattern?: any): NodeJS.ReadWriteStream;
	export function parse(patterns: any[]): NodeJS.ReadWriteStream;

	export function stringify(): NodeJS.ReadWriteStream;
	export function stringify(open: string, sep: string, close: string): NodeJS.ReadWriteStream;

	export function stringifyObject(): NodeJS.ReadWriteStream;
	export function stringifyObject(open: string, sep: string, close: string): NodeJS.ReadWriteStream;
}
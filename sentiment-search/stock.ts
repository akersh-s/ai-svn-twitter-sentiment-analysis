export interface IStock {
    symbol: string,
    keywords: string[]
}

export interface IResult {
    symbol: string,
    action: Action
}

export enum Action {
    Buy,
    Sell
}
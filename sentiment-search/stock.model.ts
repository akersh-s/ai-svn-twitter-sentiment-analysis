export class Stock {
    constructor(public symbol: string, public keywords: string) {}
    
    get q():string {
        let searchTerms = [this.symbol, this.keywords];
        let args:string = searchTerms.join(' OR ');
        return args;
    }
    
    getSymbolNoDollar() {
        return this.symbol.replace('$', '');
    }
}

export interface IResult {
    symbol: string,
    action: Action
}

export enum Action {
    Buy,
    Sell
}
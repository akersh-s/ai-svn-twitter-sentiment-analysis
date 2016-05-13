let tHours = 1000 * 60 * 60 * 36; //36 hours 
export class SellSymbol {
    constructor(public symbol: string, public price: number, public quantity: number, public lastUpdate: Date) {}
    
    isReadyToSell(): boolean {
        let now = new Date();
        let elapsedTime:number = +now - +this.lastUpdate;
        return elapsedTime > tHours;
    }
}
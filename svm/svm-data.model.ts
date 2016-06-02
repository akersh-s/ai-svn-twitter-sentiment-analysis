export class SvmData {
	x: number[][] = [];
	y: number[] = [];
	
	addRecord(x: number[], y: number): void {
		this.x.push(x);
        this.y.push(y);
	}
}
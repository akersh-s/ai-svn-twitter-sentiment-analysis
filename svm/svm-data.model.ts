export class SvmData {
	x: number[][] = [];
	y: number[] = [];
	
	addRecord(x: number[], y: number): void {
		this.x.push(x);
        this.y.push(y);
	}
	
	getSvmParams() {
		let normalizedX = normalize(x);
		return {
			x: normalizedX,
			y: this.y
		}
	}
}
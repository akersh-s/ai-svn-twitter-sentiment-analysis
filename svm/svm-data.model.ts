export class SvmData {
	xy: number[][] = [];
	x: number[][] = [];
	y: number[] = [];

	createXsYs(): void {
		this.x = [];
		this.y = [];
		this.xy.forEach(oneXy => {
			this.x.push(oneXy.filter((el, i) => i < oneXy.length - 2));
			this.y.push(oneXy[oneXy.length - 1]);
		});
	}
}

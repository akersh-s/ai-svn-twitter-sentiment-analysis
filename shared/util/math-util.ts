export function calculateMeanVarianceAndDeviation(a: number[]): Distribution {
    var r = new Distribution(),
        t = a.length;
    for (var m, s = 0, l = t; l--; s += a[l]);
    for (m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
    return r.deviation = Math.sqrt(r.variance = s / t), r;
};

export class Distribution {
    public mean: number = 0;
    public variance: number = 0;
    public deviation: number = 0;
};

export function calcIncreasePercent(today: number, previous: number): number {
    let diff = today - previous;
    let div = Math.abs(diff / previous);
    return div;
};

export function calculateBuyPrice(distribution: Distribution): number {
    return distribution.mean + distribution.deviation;
};

export function calculateSellPrice(distribution: Distribution): number {
    return distribution.mean - distribution.deviation;
};

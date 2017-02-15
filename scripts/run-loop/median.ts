export function findMedian(data: number[]): number {
    if (!data || !data.length) {
        return 0;
    }

    data.sort((a, b) => a - b);
    const middle = Math.floor((data.length - 1) / 2);
    if (data.length % 2) {
        return data[middle];
    } else {
        return (data[middle] + data[middle + 1]) / 2.0;
    }
}

export function findMean(data: number[]): number {
    if (!data || !data.length) {
        return 0;
    }
    const total = data.reduce((a, b) => a + b);
    return total / data.length;
}
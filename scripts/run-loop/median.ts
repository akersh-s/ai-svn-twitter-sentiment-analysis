export function findMedian(data: number[]): number {
    if (!data || !data.length) {
        return 0;
    }
    if (data.length < 10) {
        return -1.11 * data.length;
    }
    data.sort((a, b) => a - b);
    //console.log(JSON.stringify(data), data.length);
    const middle = Math.floor((data.length - 1) / 2);
    if (data.length % 2) {
        return data[middle];
    } else {
        return (data[middle] + data[middle + 1]) / 2.0;
    }
}

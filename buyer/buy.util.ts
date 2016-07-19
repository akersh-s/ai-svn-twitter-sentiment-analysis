export class BuyUtil {

    /**
     * Note - this function will randomize the input array.
     */
    static getRandomSubset<T>(arr: T[], maxLength: number): T[] {
        const subArr: T[] = [];
        arr.sort(() => Math.random() > 0.5 ? 0 : 1);
        return arr.filter((val, i) => {
            return i <= maxLength - 1;
        });
    }
}

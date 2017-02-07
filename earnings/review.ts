import { TradeHistory } from '../shared/trade-history.model';
import { formatDate, getDaysAgo, today, oneDay } from '../shared/util/date-util';
import { changePercent } from '../shared/util/math-util';
const threshold = +today - (oneDay * 10);
const th = TradeHistory.readHistory();

const todaysSells = th.filter(t => t.action === 'sell' && +t.date > threshold);

todaysSells.forEach((todaySell) => {
    const equivBuy = findRelatedBuy(th.filter(t => t.stock === todaySell.stock && todaySell.date > t.date));
    if (equivBuy) {
        const increaseAmount = changePercent(todaySell.price, equivBuy.price);
        console.log(`Sold ${todaySell.quantity} shares of ${todaySell.stock} on ${formatDate(todaySell.date)}, likely purchased at ${equivBuy.price} on ${formatDate(equivBuy.date)}, Increased: %${increaseAmount.toFixed(2)}`);
    }
});

function findRelatedBuy(th: TradeHistory[]): TradeHistory {
    return th.sort((a, b) => +b.date - +a.date).find(a => true);
}
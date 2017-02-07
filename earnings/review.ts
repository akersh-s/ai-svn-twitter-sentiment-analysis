import { TradeHistory } from '../shared/trade-history.model';
import { formatDate, getDaysAgo, today, oneDay } from '../shared/util/date-util';
import { changePercent } from '../shared/util/math-util';
const threshold = +today - (oneDay * 10);
const th = TradeHistory.readHistory();
const reported: any = {};
const todaysSells = th.filter(t => t.action === 'sell' && +t.date > threshold);

todaysSells.forEach((todaySell) => {
    const equivBuy = findRelatedBuy(th.filter(t => t.stock === todaySell.stock && todaySell.date > t.date));
    if (equivBuy && !reported[todaySell.stock + formatDate(todaySell.date)]) {
        const increaseAmount = changePercent(todaySell.price, equivBuy.price);
        console.log(`Attempted to sell ${todaySell.quantity} shares of ${todaySell.stock} at $${todaySell.price.toFixed(2)} on ${formatDate(todaySell.date)}, likely purchased at $${equivBuy.price.toFixed(2)} on ${formatDate(equivBuy.date)}, Percent Changed: %${increaseAmount.toFixed(2)}`);
        reported[todaySell.stock + formatDate(todaySell.date)] = true;
    }
});

function findRelatedBuy(th: TradeHistory[]): TradeHistory {
    return th.sort((a, b) => +b.date - +a.date).find(a => true);
}
/**
 * Strategy stats computation — extracted from CalculatorPage to remove duplication.
 * Computes maxProfit/maxLoss/ROI/R/R/POP/capital required for a given legs + payoff set.
 *
 * Shared between Strategy A (with commissions) and Strategy B (comparison mode, no commissions).
 */
import { riskRewardRatio } from './blackScholes';

const MAX_UNLIMITED = 5_000_000;

/**
 * Compute net premium (credit/debit) from option legs. Positive = credit, negative = debit.
 */
const computeNetPremium = (legs) =>
  legs.reduce((sum, l) => {
    if (l.type === 'stock') return sum;
    const sign = l.action === 'buy' ? -1 : 1;
    return sum + l.premium * sign * (l.quantity || 1) * 100;
  }, 0);

/**
 * Reg-T margin approximation for naked short positions (unlimited-risk strategies).
 */
const computeNakedMargin = (legs, spot) => {
  let total = 0;
  legs.forEach((l) => {
    if (l.type === 'stock' || l.action !== 'sell') return;
    const S = spot;
    const K = l.strike || S;
    const qty = l.quantity || 1;
    const premRecv = (l.premium || 0) * 100;
    if (l.type === 'call') {
      const otm = Math.max(0, K - S);
      total += (Math.max(0.2 * S - otm, 0.1 * S) * 100 + premRecv) * qty;
    } else {
      const otm = Math.max(0, S - K);
      total += (Math.max(0.2 * S - otm, 0.1 * K) * 100 + premRecv) * qty;
    }
  });
  return total;
};

/**
 * Capital required — Reg-T per leg for unlimited, |max loss| or |premium| otherwise.
 */
const computeCapitalRequired = (legs, maxLoss, premium, spot) => {
  const isUnlimited = maxLoss < -MAX_UNLIMITED;
  if (isUnlimited && spot) {
    const naked = computeNakedMargin(legs, spot);
    return naked > 0 ? naked : Math.abs(premium);
  }
  return Math.max(Math.abs(maxLoss), premium < 0 ? Math.abs(premium) : 0);
};

/**
 * Total commissions = commission_per_contract × Σ(qty) for option legs only.
 */
const computeCommissions = (legs, commission) =>
  legs.reduce(
    (s, l) => (l.type !== 'stock' ? s + (commission || 0) * (l.quantity || 1) : s),
    0
  );

const EMPTY_STATS = {
  maxProfit: '0',
  maxLoss: '0',
  premium: '0',
  commissions: '0',
  breakEvens: [],
  roi: '0.0',
  rr: '—',
  isMaxProfitUnlimited: false,
  isMaxLossUnlimited: false,
  pop: '0.0',
  capitalRequired: '0',
};

/**
 * Compute strategy statistics from payoff data + legs.
 *
 * @param {Array} payoffData - Array of {price, pnl, pnlAtExpiry} points
 * @param {Array} legs - Strategy legs
 * @param {Object} stock - Underlying stock {price}
 * @param {number} pop - Probability of profit (%)
 * @param {Array} breakEvens - Break-even prices
 * @param {number} [commission=0] - Per-contract commission (0 for comparison strategy B)
 * @returns {Object} Stats object with maxProfit/maxLoss/roi/rr/pop/capitalRequired/etc.
 */
export const computeStrategyStats = (payoffData, legs, stock, pop, breakEvens, commission = 0) => {
  if (!payoffData || payoffData.length === 0) return { ...EMPTY_STATS, breakEvens: breakEvens || [] };

  const expPnls = payoffData.map((p) => p.pnlAtExpiry);
  const maxProfit = Math.max(...expPnls);
  const maxLoss = Math.min(...expPnls);

  const premium = computeNetPremium(legs);
  const totalCommissions = computeCommissions(legs, commission);

  // Commissions hurt both sides
  const maxProfitNet = maxProfit - totalCommissions;
  const maxLossNet = maxLoss - totalCommissions;

  const roi = premium !== 0 ? (maxProfitNet / Math.abs(premium)) * 100 : 0;
  const rr = riskRewardRatio(maxProfitNet, maxLossNet);
  const isMaxLossUnlimited = maxLoss < -MAX_UNLIMITED;
  const capitalRequired = computeCapitalRequired(legs, maxLoss, premium, stock?.price);

  return {
    maxProfit: maxProfitNet > MAX_UNLIMITED ? 'Unlimited' : maxProfitNet.toFixed(0),
    maxLoss: maxLossNet.toFixed(0),
    premium: premium.toFixed(0),
    commissions: totalCommissions.toFixed(2),
    breakEvens: breakEvens || [],
    roi: roi.toFixed(1),
    rr: rr > 100 ? '∞' : rr.toFixed(2),
    isMaxProfitUnlimited: maxProfitNet > MAX_UNLIMITED,
    isMaxLossUnlimited,
    pop: (pop || 0).toFixed(1),
    capitalRequired: capitalRequired.toFixed(0),
  };
};

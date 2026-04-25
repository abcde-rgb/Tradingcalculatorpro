// Black-Scholes Option Pricing and Greeks Calculations
import { DAYS_PER_YEAR } from './constants';

// Standard normal cumulative distribution function
function normalCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Standard normal probability density function
function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Calculate d1 and d2 — supports continuous dividend yield q (default 0)
function d1d2(S, K, T, r, sigma, q = 0) {
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return { d1, d2 };
}

// Black-Scholes-Merton Call Price (with dividend yield q)
export function callPrice(S, K, T, r, sigma, q = 0) {
  if (T <= 0) return Math.max(0, S - K);
  const { d1, d2 } = d1d2(S, K, T, r, sigma, q);
  return S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
}

// Black-Scholes-Merton Put Price (with dividend yield q)
export function putPrice(S, K, T, r, sigma, q = 0) {
  if (T <= 0) return Math.max(0, K - S);
  const { d1, d2 } = d1d2(S, K, T, r, sigma, q);
  return K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1);
}

// Greeks
export function delta(S, K, T, r, sigma, optionType, q = 0) {
  if (T <= 0) {
    if (optionType === 'call') return S > K ? 1 : 0;
    return S < K ? -1 : 0;
  }
  const { d1 } = d1d2(S, K, T, r, sigma, q);
  if (optionType === 'call') return Math.exp(-q * T) * normalCDF(d1);
  return Math.exp(-q * T) * (normalCDF(d1) - 1);
}

export function gamma(S, K, T, r, sigma, q = 0) {
  if (T <= 0) return 0;
  const { d1 } = d1d2(S, K, T, r, sigma, q);
  return (Math.exp(-q * T) * normalPDF(d1)) / (S * sigma * Math.sqrt(T));
}

export function theta(S, K, T, r, sigma, optionType, q = 0) {
  if (T <= 0) return 0;
  const { d1, d2 } = d1d2(S, K, T, r, sigma, q);
  const term1 = -(S * Math.exp(-q * T) * normalPDF(d1) * sigma) / (2 * Math.sqrt(T));
  if (optionType === 'call') {
    return (term1 - r * K * Math.exp(-r * T) * normalCDF(d2) + q * S * Math.exp(-q * T) * normalCDF(d1)) / 365;
  }
  return (term1 + r * K * Math.exp(-r * T) * normalCDF(-d2) - q * S * Math.exp(-q * T) * normalCDF(-d1)) / 365;
}

export function vega(S, K, T, r, sigma, q = 0) {
  if (T <= 0) return 0;
  const { d1 } = d1d2(S, K, T, r, sigma, q);
  return (S * Math.exp(-q * T) * Math.sqrt(T) * normalPDF(d1)) / 100;
}

export function rho(S, K, T, r, sigma, optionType, q = 0) {
  if (T <= 0) return 0;
  const { d2 } = d1d2(S, K, T, r, sigma, q);
  if (optionType === 'call') {
    return (K * T * Math.exp(-r * T) * normalCDF(d2)) / 100;
  }
  return -(K * T * Math.exp(-r * T) * normalCDF(-d2)) / 100;
}

// Calculate option price at a given stock price and time
export function optionPrice(S, K, T, r, sigma, optionType, q = 0) {
  if (optionType === 'call') return callPrice(S, K, T, r, sigma, q);
  return putPrice(S, K, T, r, sigma, q);
}

// Calculate payoff at expiration
export function payoffAtExpiry(S, K, optionType, action, premium, quantity = 1) {
  let intrinsic;
  if (optionType === 'call') {
    intrinsic = Math.max(0, S - K);
  } else {
    intrinsic = Math.max(0, K - S);
  }

  const multiplier = action === 'buy' ? 1 : -1;
  return (intrinsic * multiplier - premium * multiplier * (action === 'buy' ? 1 : -1)) * quantity * 100;
}

// Calculate P&L for a leg (with optional dividend yield q)
export function legPnL(stockPrice, leg, currentTime, r = 0.05, q = 0) {
  const { strike, type, action, premium, iv, quantity = 1 } = leg;
  const T = Math.max(0, currentTime / DAYS_PER_YEAR);
  const multiplier = action === 'buy' ? 1 : -1;

  const currentValue = optionPrice(stockPrice, strike, T, r, iv, type, q);
  const pnl = (currentValue - premium) * multiplier * quantity * 100;
  return pnl;
}

// Calculate total strategy P&L across price range (with optional dividend yield q)
export function calculateStrategyPayoff(legs, stockPrice, priceRange, daysToExpiry, r = 0.05, q = 0) {
  const points = [];
  const minPrice = stockPrice * (1 - priceRange);
  const maxPrice = stockPrice * (1 + priceRange);
  const step = (maxPrice - minPrice) / 200;

  for (let price = minPrice; price <= maxPrice; price += step) {
    let totalPnL = 0;
    let totalPnLAtExpiry = 0;

    legs.forEach((leg) => {
      if (leg.type === 'stock') {
        const multiplier = leg.action === 'buy' ? 1 : -1;
        totalPnL += (price - stockPrice) * multiplier * (leg.quantity || 100);
        totalPnLAtExpiry += (price - stockPrice) * multiplier * (leg.quantity || 100);
      } else {
        totalPnL += legPnL(price, leg, daysToExpiry, r, q);
        totalPnLAtExpiry += legPnL(price, leg, 0, r, q);
      }
    });

    points.push({
      price: +price.toFixed(2),
      pnl: +totalPnL.toFixed(2),
      pnlAtExpiry: +totalPnLAtExpiry.toFixed(2),
    });
  }

  return points;
}

// Find break-even points
export function findBreakEvenPoints(payoffData) {
  const breakEvens = [];
  for (let i = 1; i < payoffData.length; i++) {
    const prev = payoffData[i - 1].pnlAtExpiry;
    const curr = payoffData[i].pnlAtExpiry;
    if ((prev <= 0 && curr >= 0) || (prev >= 0 && curr <= 0)) {
      // Linear interpolation
      const ratio = Math.abs(prev) / (Math.abs(prev) + Math.abs(curr));
      const breakEvenPrice = payoffData[i - 1].price + ratio * (payoffData[i].price - payoffData[i - 1].price);
      breakEvens.push(+breakEvenPrice.toFixed(2));
    }
  }
  return breakEvens;
}

// Calculate all Greeks for a strategy (with optional dividend yield q)
export function calculateStrategyGreeks(legs, stockPrice, r = 0.05, q = 0) {
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalRho = 0;

  legs.forEach((leg) => {
    if (leg.type === 'stock') {
      const multiplier = leg.action === 'buy' ? 1 : -1;
      totalDelta += multiplier * (leg.quantity || 100) / 100;
      return;
    }

    const T = leg.daysToExpiry / DAYS_PER_YEAR;
    const multiplier = leg.action === 'buy' ? 1 : -1;
    const qty = leg.quantity || 1;

    totalDelta += delta(stockPrice, leg.strike, T, r, leg.iv, leg.type, q) * multiplier * qty;
    totalGamma += gamma(stockPrice, leg.strike, T, r, leg.iv, q) * multiplier * qty;
    totalTheta += theta(stockPrice, leg.strike, T, r, leg.iv, leg.type, q) * multiplier * qty;
    totalVega += vega(stockPrice, leg.strike, T, r, leg.iv, q) * multiplier * qty;
    totalRho += rho(stockPrice, leg.strike, T, r, leg.iv, leg.type, q) * multiplier * qty;
  });

  return {
    delta: +totalDelta.toFixed(4),
    gamma: +totalGamma.toFixed(4),
    theta: +totalTheta.toFixed(4),
    vega: +totalVega.toFixed(4),
    rho: +totalRho.toFixed(4),
  };
}

// Probability of Profit calculation
export function probabilityOfProfit(legs, stockPrice, r = 0.05) {
  const T = (legs[0]?.daysToExpiry || 30) / DAYS_PER_YEAR;
  const iv = legs[0]?.iv || 0.3;
  const minPrice = stockPrice * 0.5;
  const maxPrice = stockPrice * 2.0;
  const steps = 500;
  const step = (maxPrice - minPrice) / steps;
  let profitProb = 0;

  for (let i = 0; i < steps; i++) {
    const price = minPrice + i * step;
    let pnl = 0;

    legs.forEach((leg) => {
      const multiplier = leg.action === 'buy' ? 1 : -1;
      const qty = leg.quantity || 1;
      if (leg.type === 'stock') {
        pnl += (price - stockPrice) * multiplier * qty;
      } else {
        const intrinsic = leg.type === 'call' ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price);
        pnl += (intrinsic - leg.premium) * multiplier * qty * 100;
      }
    });

    if (pnl > 0 && T > 0) {
      // Log-normal probability density
      const d = (Math.log(price / stockPrice) - (r - 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
      const pdfVal = Math.exp(-0.5 * d * d) / (price * iv * Math.sqrt(2 * Math.PI * T));
      profitProb += pdfVal * step;
    }
  }

  return Math.min(100, Math.max(0, profitProb * 100));
}

// Risk/Reward ratio
export function riskRewardRatio(maxProfit, maxLoss) {
  if (maxLoss === 0) return Infinity;
  return Math.abs(maxProfit / maxLoss);
}

// Implied Volatility calculation using Newton-Raphson method
export function impliedVolatility(marketPrice, S, K, T, r, optionType, maxIterations = 100) {
  let sigma = 0.3; // Initial guess
  for (let i = 0; i < maxIterations; i++) {
    const price = optionPrice(S, K, T, r, sigma, optionType);
    const v = vega(S, K, T, r, sigma) * 100;
    if (Math.abs(v) < 1e-10) break;
    const diff = price - marketPrice;
    if (Math.abs(diff) < 1e-6) break;
    sigma -= diff / v;
    if (sigma <= 0) sigma = 0.01;
  }
  return sigma;
}

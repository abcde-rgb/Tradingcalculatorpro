// Ultra-comprehensive mock data for options calculator
// Supports ANY ticker with dynamic generation + 33 strategies

const KNOWN_STOCKS = {
  AAPL: { name: 'Apple Inc.', price: 198.45, sector: 'Technology' },
  TSLA: { name: 'Tesla, Inc.', price: 271.83, sector: 'Automotive' },
  MSFT: { name: 'Microsoft Corp.', price: 442.57, sector: 'Technology' },
  SPY: { name: 'SPDR S&P 500 ETF', price: 563.48, sector: 'ETF' },
  NVDA: { name: 'NVIDIA Corp.', price: 131.28, sector: 'Semiconductors' },
  AMZN: { name: 'Amazon.com Inc.', price: 205.74, sector: 'Technology' },
  META: { name: 'Meta Platforms', price: 598.32, sector: 'Technology' },
  GOOG: { name: 'Alphabet Inc.', price: 176.49, sector: 'Technology' },
  GOOGL: { name: 'Alphabet Inc. Class A', price: 177.12, sector: 'Technology' },
  NFLX: { name: 'Netflix Inc.', price: 1032.75, sector: 'Entertainment' },
  AMD: { name: 'Advanced Micro Devices', price: 158.92, sector: 'Semiconductors' },
  INTC: { name: 'Intel Corp.', price: 24.18, sector: 'Semiconductors' },
  BA: { name: 'Boeing Co.', price: 178.34, sector: 'Aerospace' },
  DIS: { name: 'Walt Disney Co.', price: 112.56, sector: 'Entertainment' },
  JPM: { name: 'JPMorgan Chase', price: 258.91, sector: 'Finance' },
  V: { name: 'Visa Inc.', price: 312.45, sector: 'Finance' },
  MA: { name: 'Mastercard Inc.', price: 528.73, sector: 'Finance' },
  WMT: { name: 'Walmart Inc.', price: 92.18, sector: 'Retail' },
  COST: { name: 'Costco Wholesale', price: 912.45, sector: 'Retail' },
  HD: { name: 'Home Depot Inc.', price: 378.92, sector: 'Retail' },
  PG: { name: 'Procter & Gamble', price: 172.34, sector: 'Consumer' },
  KO: { name: 'Coca-Cola Co.', price: 63.28, sector: 'Consumer' },
  PEP: { name: 'PepsiCo Inc.', price: 148.56, sector: 'Consumer' },
  JNJ: { name: 'Johnson & Johnson', price: 156.78, sector: 'Healthcare' },
  UNH: { name: 'UnitedHealth Group', price: 512.34, sector: 'Healthcare' },
  ABBV: { name: 'AbbVie Inc.', price: 178.92, sector: 'Pharma' },
  PFE: { name: 'Pfizer Inc.', price: 26.45, sector: 'Pharma' },
  MRK: { name: 'Merck & Co.', price: 128.34, sector: 'Pharma' },
  LLY: { name: 'Eli Lilly & Co.', price: 892.45, sector: 'Pharma' },
  XOM: { name: 'Exxon Mobil', price: 108.45, sector: 'Energy' },
  CVX: { name: 'Chevron Corp.', price: 156.78, sector: 'Energy' },
  QQQ: { name: 'Invesco QQQ Trust', price: 498.23, sector: 'ETF' },
  IWM: { name: 'iShares Russell 2000', price: 214.56, sector: 'ETF' },
  GLD: { name: 'SPDR Gold Shares', price: 289.34, sector: 'ETF' },
  SLV: { name: 'iShares Silver Trust', price: 31.28, sector: 'ETF' },
  TLT: { name: 'iShares 20+ Year Treasury', price: 92.45, sector: 'ETF' },
  COIN: { name: 'Coinbase Global', price: 267.89, sector: 'Crypto' },
  MSTR: { name: 'MicroStrategy Inc.', price: 398.12, sector: 'Crypto' },
  PLTR: { name: 'Palantir Technologies', price: 112.34, sector: 'Technology' },
  CRM: { name: 'Salesforce Inc.', price: 312.56, sector: 'Technology' },
  ORCL: { name: 'Oracle Corp.', price: 178.23, sector: 'Technology' },
  UBER: { name: 'Uber Technologies', price: 78.92, sector: 'Technology' },
  SNAP: { name: 'Snap Inc.', price: 12.34, sector: 'Technology' },
  ROKU: { name: 'Roku Inc.', price: 78.56, sector: 'Technology' },
  SQ: { name: 'Block Inc.', price: 72.34, sector: 'Finance' },
  PYPL: { name: 'PayPal Holdings', price: 68.92, sector: 'Finance' },
  RIVN: { name: 'Rivian Automotive', price: 14.56, sector: 'Automotive' },
  LCID: { name: 'Lucid Group', price: 3.28, sector: 'Automotive' },
  NIO: { name: 'NIO Inc.', price: 5.67, sector: 'Automotive' },
  BABA: { name: 'Alibaba Group', price: 128.45, sector: 'Technology' },
  TSM: { name: 'Taiwan Semiconductor', price: 189.34, sector: 'Semiconductors' },
  AVGO: { name: 'Broadcom Inc.', price: 218.56, sector: 'Semiconductors' },
  MU: { name: 'Micron Technology', price: 98.23, sector: 'Semiconductors' },
  SMCI: { name: 'Super Micro Computer', price: 42.18, sector: 'Technology' },
  ARM: { name: 'Arm Holdings', price: 168.92, sector: 'Semiconductors' },
  SHOP: { name: 'Shopify Inc.', price: 108.45, sector: 'Technology' },
  NET: { name: 'Cloudflare Inc.', price: 112.89, sector: 'Technology' },
  SNOW: { name: 'Snowflake Inc.', price: 178.34, sector: 'Technology' },
  DDOG: { name: 'Datadog Inc.', price: 132.56, sector: 'Technology' },
  ZS: { name: 'Zscaler Inc.', price: 198.92, sector: 'Cybersecurity' },
  CRWD: { name: 'CrowdStrike Holdings', price: 342.18, sector: 'Cybersecurity' },
  PANW: { name: 'Palo Alto Networks', price: 178.92, sector: 'Cybersecurity' },
  GS: { name: 'Goldman Sachs', price: 512.45, sector: 'Finance' },
  MS: { name: 'Morgan Stanley', price: 112.34, sector: 'Finance' },
  BAC: { name: 'Bank of America', price: 42.18, sector: 'Finance' },
  WFC: { name: 'Wells Fargo & Co.', price: 68.92, sector: 'Finance' },
  C: { name: 'Citigroup Inc.', price: 68.45, sector: 'Finance' },
  F: { name: 'Ford Motor Co.', price: 12.34, sector: 'Automotive' },
  GM: { name: 'General Motors', price: 48.92, sector: 'Automotive' },
  ADBE: { name: 'Adobe Inc.', price: 478.34, sector: 'Technology' },
  NOW: { name: 'ServiceNow Inc.', price: 892.18, sector: 'Technology' },
  INTU: { name: 'Intuit Inc.', price: 618.92, sector: 'Technology' },
  ABNB: { name: 'Airbnb Inc.', price: 148.92, sector: 'Travel' },
  BKNG: { name: 'Booking Holdings', price: 4218.45, sector: 'Travel' },
  NKE: { name: 'Nike Inc.', price: 78.34, sector: 'Consumer' },
  SBUX: { name: 'Starbucks Corp.', price: 98.18, sector: 'Consumer' },
  MCD: { name: "McDonald's Corp.", price: 298.92, sector: 'Consumer' },
  LULU: { name: 'Lululemon Athletica', price: 298.92, sector: 'Retail' },
  SPOT: { name: 'Spotify Technology', price: 578.92, sector: 'Entertainment' },
  SOFI: { name: 'SoFi Technologies', price: 14.92, sector: 'Finance' },
  HOOD: { name: 'Robinhood Markets', price: 48.34, sector: 'Finance' },
  DELL: { name: 'Dell Technologies', price: 118.45, sector: 'Technology' },
  IBM: { name: 'IBM Corp.', price: 228.92, sector: 'Technology' },
};

export function getStockData(symbol) {
  const upper = symbol.toUpperCase();
  if (KNOWN_STOCKS[upper]) {
    const s = KNOWN_STOCKS[upper];
    const change = +(((Math.random() - 0.4) * s.price * 0.03)).toFixed(2);
    return {
      symbol: upper, name: s.name, price: s.price, change,
      changePercent: +((change / s.price) * 100).toFixed(2),
      high52w: +(s.price * (1 + Math.random() * 0.4)).toFixed(2),
      low52w: +(s.price * (1 - Math.random() * 0.3)).toFixed(2),
      volume: `${(Math.random() * 100 + 5).toFixed(1)}M`, sector: s.sector,
    };
  }
  const price = +(Math.random() * 400 + 10).toFixed(2);
  const change = +(((Math.random() - 0.4) * price * 0.03)).toFixed(2);
  return {
    symbol: upper, name: `${upper} Corp.`, price, change,
    changePercent: +((change / price) * 100).toFixed(2),
    high52w: +(price * 1.3).toFixed(2), low52w: +(price * 0.7).toFixed(2),
    volume: `${(Math.random() * 50 + 1).toFixed(1)}M`, sector: 'Unknown',
  };
}

export function searchTickers(query) {
  if (!query) return Object.keys(KNOWN_STOCKS).slice(0, 12);
  const q = query.toUpperCase();
  return Object.entries(KNOWN_STOCKS)
    .filter(([sym, data]) => sym.includes(q) || data.name.toUpperCase().includes(q))
    .map(([sym]) => sym).slice(0, 12);
}

function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function generateOptionsChain(currentPrice, daysToExpiry) {
  const strikes = [];
  let strikeStep;
  if (currentPrice < 20) strikeStep = 0.5;
  else if (currentPrice < 50) strikeStep = 1;
  else if (currentPrice < 200) strikeStep = 2.5;
  else if (currentPrice < 500) strikeStep = 5;
  else strikeStep = 10;
  const baseStrike = Math.round(currentPrice / strikeStep) * strikeStep;
  const iv = 0.28 + Math.random() * 0.12;
  const T = daysToExpiry / 365;
  for (let i = -15; i <= 15; i++) {
    const strike = +(baseStrike + i * strikeStep).toFixed(2);
    if (strike <= 0) continue;
    const moneyness = Math.log(currentPrice / strike) / (iv * Math.sqrt(T || 0.001));
    const nd1 = 0.5 * (1 + erf(moneyness / Math.sqrt(2)));
    const callIntrinsic = Math.max(0, currentPrice - strike);
    const putIntrinsic = Math.max(0, strike - currentPrice);
    const callTimeVal = currentPrice * iv * Math.sqrt(T) * Math.exp(-moneyness * moneyness / 8) * 0.4;
    const putTimeVal = currentPrice * iv * Math.sqrt(T) * Math.exp(-moneyness * moneyness / 8) * 0.4;
    const callMid = Math.max(0.01, callIntrinsic + callTimeVal);
    const putMid = Math.max(0.01, putIntrinsic + putTimeVal);
    const callDelta = nd1;
    const putDelta = nd1 - 1;
    const g = Math.exp(-moneyness * moneyness / 2) / (currentPrice * iv * Math.sqrt(2 * Math.PI * (T || 0.001)));
    const callTheta = -(currentPrice * iv * g) / (2 * Math.sqrt(T || 0.001)) / 365;
    const v = currentPrice * Math.sqrt(T || 0.001) * g;
    const spread = Math.max(0.01, callMid * 0.03);
    strikes.push({
      strike,
      call: {
        bid: +Math.max(0.01, callMid - spread).toFixed(2), ask: +(callMid + spread).toFixed(2),
        mid: +callMid.toFixed(2), last: +callMid.toFixed(2),
        volume: Math.floor(Math.random() * 8000) + 50, openInterest: Math.floor(Math.random() * 30000) + 200,
        iv: +(iv + (Math.random() - 0.5) * 0.04).toFixed(4), delta: +callDelta.toFixed(4),
        gamma: +g.toFixed(6), theta: +callTheta.toFixed(4), vega: +(v / 100).toFixed(4),
      },
      put: {
        bid: +Math.max(0.01, putMid - spread).toFixed(2), ask: +(putMid + spread).toFixed(2),
        mid: +putMid.toFixed(2), last: +putMid.toFixed(2),
        volume: Math.floor(Math.random() * 8000) + 50, openInterest: Math.floor(Math.random() * 30000) + 200,
        iv: +(iv + (Math.random() - 0.5) * 0.04).toFixed(4), delta: +putDelta.toFixed(4),
        gamma: +g.toFixed(6), theta: +callTheta.toFixed(4), vega: +(v / 100).toFixed(4),
      },
      itm: currentPrice > strike ? 'call' : currentPrice < strike ? 'put' : 'atm',
    });
  }
  return strikes;
}

export function generateExpirations() {
  const expirations = [];
  const today = new Date();
  const daysOptions = [3, 7, 14, 21, 30, 45, 60, 90, 120, 150, 180, 270, 365];
  daysOptions.forEach((days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    const dayOfWeek = date.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysUntilFriday);
    const actualDays = Math.round((date - today) / (1000 * 60 * 60 * 24));
    expirations.push({
      date: date.toISOString().split('T')[0], daysToExpiry: actualDays,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isWeekly: days < 30, isMonthly: days >= 30 && days < 100, isLeaps: days >= 180,
    });
  });
  return expirations;
}

// ═══════════════════════════════════════════════════════════════
// 33 STRATEGIES - Complete professional options strategy library
// ═══════════════════════════════════════════════════════════════

export const STRATEGIES = [
  // ═══ BULLISH (8) ═══
  {
    id: 'long_call', name: 'Long Call', category: 'Bullish', color: '#22c55e',
    description: 'Compra una call. Potencial de beneficio ilimitado al alza.',
    legs: [{ type: 'call', action: 'buy', qty: 1, offset: 0 }],
    risk: 'Limitado', reward: 'Ilimitado', shape: 'call_buy',
    maxProfit: 'Ilimitado', maxLoss: 'Prima pagada',
    whenToUse: 'IV baja, tendencia alcista fuerte',
  },
  {
    id: 'short_put', name: 'Short Put (CSP)', category: 'Bullish', color: '#06b6d4',
    description: 'Vende una put con garantía en efectivo. Cobra prima.',
    legs: [{ type: 'put', action: 'sell', qty: 1, offset: -1 }],
    risk: 'Alto', reward: 'Limitado', shape: 'put_sell',
    maxProfit: 'Prima cobrada', maxLoss: 'Strike - Prima',
    whenToUse: 'Neutral-alcista, IV elevada',
  },
  {
    id: 'bull_call_spread', name: 'Bull Call Spread', category: 'Bullish', color: '#10b981',
    description: 'Compra call inferior + vende call superior. Débito definido.',
    legs: [{ type: 'call', action: 'buy', qty: 1, offset: 0 }, { type: 'call', action: 'sell', qty: 1, offset: 3 }],
    risk: 'Limitado', reward: 'Limitado', shape: 'bull_spread',
    maxProfit: 'Dif. strikes - Débito', maxLoss: 'Débito neto',
    whenToUse: 'Alcista moderado',
  },
  {
    id: 'bull_put_spread', name: 'Bull Put Spread', category: 'Bullish', color: '#34d399',
    description: 'Vende put superior + compra put inferior. Crédito neto alcista.',
    legs: [{ type: 'put', action: 'sell', qty: 1, offset: -1 }, { type: 'put', action: 'buy', qty: 1, offset: -4 }],
    risk: 'Limitado', reward: 'Limitado', shape: 'bull_spread',
    maxProfit: 'Crédito neto', maxLoss: 'Dif. strikes - Crédito',
    whenToUse: 'Alcista, quiere cobrar crédito',
  },
  {
    id: 'call_ratio_backspread', name: 'Call Ratio Backspread', category: 'Bullish', color: '#4ade80',
    description: 'Vende 1 call ATM + compra 2 calls OTM. Ilimitado al alza.',
    legs: [
      { type: 'call', action: 'sell', qty: 1, offset: 0 },
      { type: 'call', action: 'buy', qty: 2, offset: 2 },
    ],
    risk: 'Limitado', reward: 'Ilimitado', shape: 'call_ratio',
    maxProfit: 'Ilimitado al alza', maxLoss: 'Dif. strikes - Crédito',
    whenToUse: 'Muy alcista, movimiento fuerte',
  },
  {
    id: 'collar', name: 'Collar', category: 'Bullish', color: '#2dd4bf',
    description: 'Stock + compra put OTM + vende call OTM. Protección con coste reducido.',
    legs: [
      { type: 'stock', action: 'buy', qty: 100, offset: 0 },
      { type: 'put', action: 'buy', qty: 1, offset: -3 },
      { type: 'call', action: 'sell', qty: 1, offset: 3 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'collar',
    maxProfit: 'Call strike - Spot + Crédito/Débito', maxLoss: 'Spot - Put strike - Crédito/Débito',
    whenToUse: 'Proteger posición larga existente',
  },
  {
    id: 'synthetic_long', name: 'Synthetic Long', category: 'Bullish', color: '#059669',
    description: 'Compra call ATM + vende put ATM. Replica posición larga de stock.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: 0 },
      { type: 'put', action: 'sell', qty: 1, offset: 0 },
    ],
    risk: 'Alto', reward: 'Ilimitado', shape: 'synthetic_long',
    maxProfit: 'Ilimitado', maxLoss: 'Strike - Débito neto',
    whenToUse: 'Alcista fuerte, alternativa a comprar stock',
  },
  {
    id: 'long_combo', name: 'Long Combo', category: 'Bullish', color: '#0d9488',
    description: 'Compra call OTM + vende put OTM. Exposición alcista con menos capital.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: 2 },
      { type: 'put', action: 'sell', qty: 1, offset: -2 },
    ],
    risk: 'Alto', reward: 'Ilimitado', shape: 'long_combo',
    maxProfit: 'Ilimitado', maxLoss: 'Put strike + Débito neto',
    whenToUse: 'Alcista con menos capital que synthetic',
  },

  // ═══ BEARISH (7) ═══
  {
    id: 'long_put', name: 'Long Put', category: 'Bearish', color: '#ef4444',
    description: 'Compra una put. Beneficio cuando cae con fuerza.',
    legs: [{ type: 'put', action: 'buy', qty: 1, offset: 0 }],
    risk: 'Limitado', reward: 'Alto', shape: 'put_buy',
    maxProfit: 'Strike - Prima', maxLoss: 'Prima pagada',
    whenToUse: 'IV baja, caída esperada',
  },
  {
    id: 'short_call', name: 'Short Call', category: 'Bearish', color: '#f97316',
    description: 'Vende una call desnuda. Cobra prima, riesgo ilimitado.',
    legs: [{ type: 'call', action: 'sell', qty: 1, offset: 1 }],
    risk: 'Ilimitado', reward: 'Limitado', shape: 'call_sell',
    maxProfit: 'Prima cobrada', maxLoss: 'Ilimitado',
    whenToUse: 'Bajista, IV elevada',
  },
  {
    id: 'bear_put_spread', name: 'Bear Put Spread', category: 'Bearish', color: '#f43f5e',
    description: 'Compra put superior + vende put inferior. Débito bajista.',
    legs: [{ type: 'put', action: 'buy', qty: 1, offset: 0 }, { type: 'put', action: 'sell', qty: 1, offset: -3 }],
    risk: 'Limitado', reward: 'Limitado', shape: 'bear_spread',
    maxProfit: 'Dif. strikes - Débito', maxLoss: 'Débito neto',
    whenToUse: 'Bajista moderado',
  },
  {
    id: 'bear_call_spread', name: 'Bear Call Spread', category: 'Bearish', color: '#fb7185',
    description: 'Vende call inferior + compra call superior. Crédito bajista.',
    legs: [{ type: 'call', action: 'sell', qty: 1, offset: 1 }, { type: 'call', action: 'buy', qty: 1, offset: 4 }],
    risk: 'Limitado', reward: 'Limitado', shape: 'bear_spread',
    maxProfit: 'Crédito neto', maxLoss: 'Dif. strikes - Crédito',
    whenToUse: 'Bajista, quiere cobrar crédito',
  },
  {
    id: 'put_ratio_backspread', name: 'Put Ratio Backspread', category: 'Bearish', color: '#e11d48',
    description: 'Vende 1 put ATM + compra 2 puts OTM. Gran beneficio si cae fuerte.',
    legs: [
      { type: 'put', action: 'sell', qty: 1, offset: 0 },
      { type: 'put', action: 'buy', qty: 2, offset: -3 },
    ],
    risk: 'Limitado', reward: 'Alto', shape: 'put_ratio',
    maxProfit: 'Put strike bajo × 100 - Débito', maxLoss: 'Dif. strikes - Crédito',
    whenToUse: 'Muy bajista, espera crash',
  },
  {
    id: 'synthetic_short', name: 'Synthetic Short', category: 'Bearish', color: '#dc2626',
    description: 'Compra put ATM + vende call ATM. Replica posición corta de stock.',
    legs: [
      { type: 'put', action: 'buy', qty: 1, offset: 0 },
      { type: 'call', action: 'sell', qty: 1, offset: 0 },
    ],
    risk: 'Ilimitado', reward: 'Alto', shape: 'synthetic_short',
    maxProfit: 'Strike + Crédito neto', maxLoss: 'Ilimitado',
    whenToUse: 'Bajista fuerte, alternativa a venta en corto',
  },
  {
    id: 'short_combo', name: 'Short Combo', category: 'Bearish', color: '#b91c1c',
    description: 'Vende call OTM + compra put OTM. Exposición bajista con menos capital.',
    legs: [
      { type: 'call', action: 'sell', qty: 1, offset: 2 },
      { type: 'put', action: 'buy', qty: 1, offset: -2 },
    ],
    risk: 'Ilimitado', reward: 'Alto', shape: 'short_combo',
    maxProfit: 'Put strike + Crédito', maxLoss: 'Ilimitado',
    whenToUse: 'Bajista fuerte con OTM',
  },

  // ═══ NEUTRAL / INCOME (11) ═══
  {
    id: 'covered_call', name: 'Covered Call', category: 'Neutral', color: '#8b5cf6',
    description: 'Stock largo + venta de call OTM. Ingresos sobre posición.',
    legs: [{ type: 'stock', action: 'buy', qty: 100, offset: 0 }, { type: 'call', action: 'sell', qty: 1, offset: 2 }],
    risk: 'Limitado', reward: 'Limitado', shape: 'covered_call',
    maxProfit: 'Prima + (Strike - Spot)', maxLoss: 'Spot - Prima',
    whenToUse: 'Generar ingresos sobre posición larga',
  },
  {
    id: 'iron_condor', name: 'Iron Condor', category: 'Neutral', color: '#a78bfa',
    description: 'Vende put spread + call spread OTM. Beneficio en rango.',
    legs: [
      { type: 'put', action: 'buy', qty: 1, offset: -5 },
      { type: 'put', action: 'sell', qty: 1, offset: -2 },
      { type: 'call', action: 'sell', qty: 1, offset: 2 },
      { type: 'call', action: 'buy', qty: 1, offset: 5 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'iron_condor',
    maxProfit: 'Crédito neto', maxLoss: 'Dif. strikes - Crédito',
    whenToUse: 'Neutral, baja IV esperada',
  },
  {
    id: 'iron_butterfly', name: 'Iron Butterfly', category: 'Neutral', color: '#d946ef',
    description: 'Vende straddle ATM + compra alas OTM. Máximo crédito ATM.',
    legs: [
      { type: 'put', action: 'buy', qty: 1, offset: -4 },
      { type: 'put', action: 'sell', qty: 1, offset: 0 },
      { type: 'call', action: 'sell', qty: 1, offset: 0 },
      { type: 'call', action: 'buy', qty: 1, offset: 4 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'iron_butterfly',
    maxProfit: 'Crédito neto', maxLoss: 'Dif. strikes - Crédito',
    whenToUse: 'Neutral exacto, máximo crédito',
  },
  {
    id: 'butterfly_call', name: 'Butterfly Call', category: 'Neutral', color: '#c084fc',
    description: 'Compra 1 call baja + vende 2 ATM + compra 1 alta.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: -2 },
      { type: 'call', action: 'sell', qty: 2, offset: 0 },
      { type: 'call', action: 'buy', qty: 1, offset: 2 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'butterfly',
    maxProfit: 'Dif. strikes - Débito', maxLoss: 'Débito neto',
    whenToUse: 'Neutral, bajo coste',
  },
  {
    id: 'butterfly_put', name: 'Butterfly Put', category: 'Neutral', color: '#e879f9',
    description: 'Compra 1 put alta + vende 2 ATM + compra 1 baja. Versión put.',
    legs: [
      { type: 'put', action: 'buy', qty: 1, offset: 2 },
      { type: 'put', action: 'sell', qty: 2, offset: 0 },
      { type: 'put', action: 'buy', qty: 1, offset: -2 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'butterfly',
    maxProfit: 'Dif. strikes - Débito', maxLoss: 'Débito neto',
    whenToUse: 'Neutral, alternativa con puts',
  },
  {
    id: 'jade_lizard', name: 'Jade Lizard', category: 'Neutral', color: '#14b8a6',
    description: 'Short put spread + naked short call. Sin riesgo al alza si crédito > ancho put.',
    legs: [
      { type: 'put', action: 'buy', qty: 1, offset: -4 },
      { type: 'put', action: 'sell', qty: 1, offset: -1 },
      { type: 'call', action: 'sell', qty: 1, offset: 3 },
    ],
    risk: 'Limitado abajo', reward: 'Limitado', shape: 'jade_lizard',
    maxProfit: 'Crédito neto', maxLoss: 'Dif. strikes puts - Crédito',
    whenToUse: 'Neutral-alcista, IV alta',
  },
  {
    id: 'short_straddle', name: 'Short Straddle', category: 'Neutral', color: '#7c3aed',
    description: 'Vende call + put mismo strike ATM. Máximo Theta, riesgo alto.',
    legs: [
      { type: 'call', action: 'sell', qty: 1, offset: 0 },
      { type: 'put', action: 'sell', qty: 1, offset: 0 },
    ],
    risk: 'Ilimitado', reward: 'Limitado', shape: 'short_straddle',
    maxProfit: 'Prima total cobrada', maxLoss: 'Ilimitado',
    whenToUse: 'Neutral, IV muy alta, crush esperado',
  },
  {
    id: 'short_strangle', name: 'Short Strangle', category: 'Neutral', color: '#6d28d9',
    description: 'Vende call OTM + put OTM. Beneficio en rango amplio.',
    legs: [
      { type: 'call', action: 'sell', qty: 1, offset: 2 },
      { type: 'put', action: 'sell', qty: 1, offset: -2 },
    ],
    risk: 'Ilimitado', reward: 'Limitado', shape: 'short_strangle',
    maxProfit: 'Prima total cobrada', maxLoss: 'Ilimitado',
    whenToUse: 'Neutral, rango amplio, IV alta',
  },
  {
    id: 'ratio_call_spread', name: 'Ratio Call Spread', category: 'Neutral', color: '#9333ea',
    description: 'Compra 1 call ATM + vende 2 calls OTM. Neutral-alcista con crédito.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: 0 },
      { type: 'call', action: 'sell', qty: 2, offset: 3 },
    ],
    risk: 'Ilimitado al alza', reward: 'Limitado', shape: 'ratio_spread',
    maxProfit: 'Dif. strikes + Crédito', maxLoss: 'Ilimitado si sube mucho',
    whenToUse: 'Alcista moderado, no espera rally fuerte',
  },
  {
    id: 'ratio_put_spread', name: 'Ratio Put Spread', category: 'Neutral', color: '#a855f7',
    description: 'Compra 1 put ATM + vende 2 puts OTM. Neutral-bajista con crédito.',
    legs: [
      { type: 'put', action: 'buy', qty: 1, offset: 0 },
      { type: 'put', action: 'sell', qty: 2, offset: -3 },
    ],
    risk: 'Alto si baja mucho', reward: 'Limitado', shape: 'ratio_spread_put',
    maxProfit: 'Dif. strikes + Crédito', maxLoss: 'Alto si cae fuerte',
    whenToUse: 'Bajista moderado, no espera crash',
  },
  {
    id: 'broken_wing_butterfly', name: 'Broken Wing Butterfly', category: 'Neutral', color: '#7e22ce',
    description: 'Butterfly asimétrica. Compra 1 baja + vende 2 ATM + compra 1 más OTM.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: -2 },
      { type: 'call', action: 'sell', qty: 2, offset: 0 },
      { type: 'call', action: 'buy', qty: 1, offset: 4 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'broken_wing',
    maxProfit: 'Crédito neto + beneficio en ala corta', maxLoss: 'Dif. alas - Crédito',
    whenToUse: 'Neutral con sesgo direccional',
  },

  // ═══ VOLATILE (7) ═══
  {
    id: 'straddle', name: 'Long Straddle', category: 'Volatile', color: '#eab308',
    description: 'Compra call + put mismo strike. Gana con movimiento fuerte.',
    legs: [{ type: 'call', action: 'buy', qty: 1, offset: 0 }, { type: 'put', action: 'buy', qty: 1, offset: 0 }],
    risk: 'Limitado', reward: 'Ilimitado', shape: 'straddle',
    maxProfit: 'Ilimitado', maxLoss: 'Prima total pagada',
    whenToUse: 'Espera movimiento fuerte, IV baja',
  },
  {
    id: 'strangle', name: 'Long Strangle', category: 'Volatile', color: '#f59e0b',
    description: 'Compra call OTM + put OTM. Más barato que straddle.',
    legs: [{ type: 'call', action: 'buy', qty: 1, offset: 2 }, { type: 'put', action: 'buy', qty: 1, offset: -2 }],
    risk: 'Limitado', reward: 'Ilimitado', shape: 'strangle',
    maxProfit: 'Ilimitado', maxLoss: 'Prima total pagada',
    whenToUse: 'Espera alta volatilidad',
  },
  {
    id: 'reverse_iron_condor', name: 'Reverse Iron Condor', category: 'Volatile', color: '#fbbf24',
    description: 'Compra strangle + vende strangle más OTM. Beneficio si rompe rango.',
    legs: [
      { type: 'put', action: 'sell', qty: 1, offset: -5 },
      { type: 'put', action: 'buy', qty: 1, offset: -2 },
      { type: 'call', action: 'buy', qty: 1, offset: 2 },
      { type: 'call', action: 'sell', qty: 1, offset: 5 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'reverse_ic',
    maxProfit: 'Dif. strikes - Débito', maxLoss: 'Débito neto',
    whenToUse: 'Espera ruptura de rango, IV baja',
  },
  {
    id: 'reverse_iron_butterfly', name: 'Reverse Iron Butterfly', category: 'Volatile', color: '#d97706',
    description: 'Compra straddle ATM + vende alas OTM. Beneficio si se mueve.',
    legs: [
      { type: 'put', action: 'sell', qty: 1, offset: -4 },
      { type: 'put', action: 'buy', qty: 1, offset: 0 },
      { type: 'call', action: 'buy', qty: 1, offset: 0 },
      { type: 'call', action: 'sell', qty: 1, offset: 4 },
    ],
    risk: 'Limitado', reward: 'Limitado', shape: 'reverse_ib',
    maxProfit: 'Dif. strikes - Débito', maxLoss: 'Débito neto',
    whenToUse: 'Espera movimiento fuerte, coste reducido vs straddle',
  },
  {
    id: 'long_guts', name: 'Long Guts', category: 'Volatile', color: '#ca8a04',
    description: 'Compra call ITM + put ITM. Similar a straddle pero con valor intrínseco.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: -2 },
      { type: 'put', action: 'buy', qty: 1, offset: 2 },
    ],
    risk: 'Limitado', reward: 'Ilimitado', shape: 'long_guts',
    maxProfit: 'Ilimitado', maxLoss: 'Dif. strikes + Prima - Valor intrínseco',
    whenToUse: 'Movimiento fuerte, alternativa a straddle',
  },
  {
    id: 'strap', name: 'Strap', category: 'Volatile', color: '#65a30d',
    description: 'Compra 2 calls + 1 put mismo strike. Volátil con sesgo alcista.',
    legs: [
      { type: 'call', action: 'buy', qty: 2, offset: 0 },
      { type: 'put', action: 'buy', qty: 1, offset: 0 },
    ],
    risk: 'Limitado', reward: 'Ilimitado', shape: 'strap',
    maxProfit: 'Ilimitado (más si sube)', maxLoss: 'Prima total pagada',
    whenToUse: 'Volátil con sesgo alcista',
  },
  {
    id: 'strip', name: 'Strip', category: 'Volatile', color: '#dc2626',
    description: 'Compra 1 call + 2 puts mismo strike. Volátil con sesgo bajista.',
    legs: [
      { type: 'call', action: 'buy', qty: 1, offset: 0 },
      { type: 'put', action: 'buy', qty: 2, offset: 0 },
    ],
    risk: 'Limitado', reward: 'Alto', shape: 'strip',
    maxProfit: 'Alto (más si baja)', maxLoss: 'Prima total pagada',
    whenToUse: 'Volátil con sesgo bajista',
  },
];

export const STRATEGY_CATEGORIES = ['Bullish', 'Bearish', 'Neutral', 'Volatile'];

// ─────────────────────────────────────────────────────────────
// EDUCATION CONTENT
// ─────────────────────────────────────────────────────────────
export const EDU_MODULES = [
  {
    icon: '◈', title: 'Fundamentos de Opciones', color: '#22c55e',
    content: 'Un contrato de opción otorga el derecho —no la obligación— de comprar (Call) o vender (Put) un activo subyacente a un precio predefinido (Strike) antes de la fecha de vencimiento.',
    items: [
      'CALL → Derecho a comprar. Beneficio si el activo sube.',
      'PUT → Derecho a vender. Beneficio si el activo baja.',
      'PRIMA → Coste de adquirir ese derecho (pagado al vendedor).',
      'STRIKE → Precio de ejercicio pactado en el contrato.',
    ],
  },
  {
    icon: 'Δ', title: 'Las Griegas', color: '#3b82f6',
    content: 'Las griegas cuantifican la sensibilidad de la prima ante distintos factores. Dominarlas es lo que separa al trader profesional del amateur.',
    items: [
      'Delta Δ → Cambio en prima por $1 de movimiento del subyacente.',
      'Theta Θ → Pérdida de valor temporal por cada día transcurrido.',
      'Vega ν → Sensibilidad al cambio en la volatilidad implícita (IV).',
      'Gamma Γ → Velocidad de cambio del Delta; máximo cerca ATM.',
    ],
  },
  {
    icon: '⬡', title: 'Moneyness: ITM / ATM / OTM', color: '#eab308',
    content: 'La relación entre el precio del activo y el Strike determina el "estado" de la opción y su composición de valor.',
    items: [
      'ITM (In The Money) → Tiene valor intrínseco. Mayor coste, menor apalancamiento.',
      'ATM (At The Money) → Strike ≈ Spot. Máximo valor extrínseco (tiempo).',
      'OTM (Out of The Money) → Solo valor temporal. Más barato, mayor riesgo.',
    ],
  },
  {
    icon: '⌬', title: 'Volatilidad Implícita (IV)', color: '#ef4444',
    content: 'La IV es el precio del mercado para la incertidumbre futura. Una IV alta encarece las primas; una IV baja las abarata.',
    items: [
      'IV Rank / IV Percentile → Contextualizan la IV actual vs. histórica.',
      'Crush post-earnings → La IV colapsa tras el evento; los compradores suelen perder.',
      'Vega Long vs. Short → Compradores ganan si la IV sube; vendedores si baja.',
    ],
  },
];

export const GUIDE_ITEMS = [
  { t: 'Leer el gráfico', d: 'La línea azul muestra tu P&L actual (T+0). La línea blanca es tu P&L en vencimiento. Las áreas verde/roja indican zonas de beneficio/pérdida.' },
  { t: 'Delta Δ', d: 'Sensibilidad por $1 de movimiento. Delta 0.50 = +$0.50 si el activo sube $1.' },
  { t: 'Theta Θ', d: 'Decaimiento diario. Los vendedores cobran Theta; los compradores lo pagan.' },
  { t: 'Vega ν', d: 'Si IV sube 1%, tu posición gana/pierde Vega dólares. Comprar opciones = long Vega.' },
  { t: 'Prob. Beneficio (PoP)', d: 'Probabilidad estadística de terminar en positivo al vencimiento según distribución log-normal.' },
  { t: 'Risk / Reward', d: 'Ratio de Max Profit / Max Loss. Un R/R de 2x con PoP 40% puede ser más rentable que un R/R 0.5x con PoP 70%.' },
];

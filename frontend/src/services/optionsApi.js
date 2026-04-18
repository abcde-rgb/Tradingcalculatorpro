import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 10000,
});

export async function fetchStock(symbol) {
  try {
    const res = await api.get(`/stock/${symbol}`);
    return res.data;
  } catch (e) {
    // console.error('Error fetching stock:', e);
    return null;
  }
}

export async function searchTickersAPI(query) {
  try {
    const res = await api.get(`/tickers/search`, { params: { q: query } });
    return res.data.results || [];
  } catch (e) {
    // console.error('Error searching tickers:', e);
    return [];
  }
}

export async function fetchExpirations(symbol) {
  try {
    const res = await api.get(`/options/expirations/${symbol}`);
    return res.data;
  } catch (e) {
    // console.error('Error fetching expirations:', e);
    return null;
  }
}

export async function fetchOptionsChain(symbol, expirationIdx = 3) {
  try {
    const res = await api.get(`/options/chain/${symbol}`, {
      params: { expiration_idx: expirationIdx },
    });
    return res.data;
  } catch (e) {
    // console.error('Error fetching options chain:', e);
    return null;
  }
}

export async function calculatePayoff(legs, stockPrice, priceRange = 0.35, daysToChart = 30) {
  try {
    const res = await api.post('/calculate/payoff', {
      legs,
      stockPrice,
      priceRange,
      daysToChart,
    });
    return res.data;
  } catch (e) {
    // console.error('Error calculating payoff:', e);
    return null;
  }
}

export async function calculateGreeks(legs, stockPrice) {
  try {
    const res = await api.post('/calculate/greeks', {
      legs,
      stockPrice,
    });
    return res.data;
  } catch (e) {
    // console.error('Error calculating greeks:', e);
    return null;
  }
}

export default api;

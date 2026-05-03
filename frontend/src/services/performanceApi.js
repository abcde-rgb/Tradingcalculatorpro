import axios from 'axios';
import { useAuthStore } from '@/lib/store';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  timeout: 15000,
});

// Auto-attach the JWT bearer from the auth store
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Performance / Trade Journal API client. All endpoints require auth.
 */

export async function createTrade(payload) {
  const { data } = await client.post('/performance/trades', payload);
  return data;
}

export async function listTrades(params = {}) {
  const { data } = await client.get('/performance/trades', { params });
  return data;
}

export async function getTrade(id) {
  const { data } = await client.get(`/performance/trades/${id}`);
  return data;
}

export async function updateTrade(id, payload) {
  const { data } = await client.put(`/performance/trades/${id}`, payload);
  return data;
}

export async function deleteTrade(id) {
  const { data } = await client.delete(`/performance/trades/${id}`);
  return data;
}

export async function fetchAnalytics() {
  const { data } = await client.get('/performance/analytics');
  return data;
}

// Lista de criptomonedas soportadas
export const CRYPTO_LIST = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: 'text-orange-500' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: 'text-blue-500' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: 'text-purple-500' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', color: 'text-yellow-500' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple', color: 'text-gray-400' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: 'text-blue-400' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: 'text-yellow-400' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', color: 'text-red-500' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', color: 'text-pink-500' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', color: 'text-blue-300' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', color: 'text-gray-300' },
];

export const COMMODITIES = [
  { id: 'gold', symbol: 'XAUUSD', name: 'Oro/USD', color: 'text-yellow-500' },
];

export const ALL_ASSETS = [...CRYPTO_LIST, ...COMMODITIES];

// Niveles de Fibonacci
export const FIBONACCI_LEVELS = [
  { level: 0, label: '0%' },
  { level: 0.236, label: '23.6%' },
  { level: 0.382, label: '38.2%' },
  { level: 0.5, label: '50%' },
  { level: 0.618, label: '61.8%' },
  { level: 0.786, label: '78.6%' },
  { level: 1, label: '100%' },
  { level: 1.272, label: '127.2%' },
  { level: 1.618, label: '161.8%' },
];

// Patrones de Trading con imágenes y pasos

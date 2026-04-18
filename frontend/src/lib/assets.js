// Sistema de activos - Trading Calculator PRO
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Categorías de activos
export const ASSET_CATEGORIES = {
  crypto: {
    id: 'crypto',
    name: 'Criptomonedas',
    icon: 'Bitcoin',
    color: 'text-orange-500'
  },
  forex: {
    id: 'forex',
    name: 'Forex',
    icon: 'DollarSign',
    color: 'text-green-500'
  },
  stocks: {
    id: 'stocks',
    name: 'Acciones',
    icon: 'TrendingUp',
    color: 'text-blue-500'
  },
  indices: {
    id: 'indices',
    name: 'Índices',
    icon: 'BarChart3',
    color: 'text-purple-500'
  },
  commodities: {
    id: 'commodities',
    name: 'Materias Primas',
    icon: 'Gem',
    color: 'text-yellow-500'
  },
  futures: {
    id: 'futures',
    name: 'Futuros',
    icon: 'Calendar',
    color: 'text-red-500'
  }
};

// Todos los activos disponibles
export const ALL_ASSETS = {
  // Crypto
  BTC: { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', pair: 'BTCUSDT', coingeckoId: 'bitcoin', tradingviewSymbol: 'BINANCE:BTCUSDT' },
  ETH: { symbol: 'ETH', name: 'Ethereum', category: 'crypto', pair: 'ETHUSDT', coingeckoId: 'ethereum', tradingviewSymbol: 'BINANCE:ETHUSDT' },
  SOL: { symbol: 'SOL', name: 'Solana', category: 'crypto', pair: 'SOLUSDT', coingeckoId: 'solana', tradingviewSymbol: 'BINANCE:SOLUSDT' },
  BNB: { symbol: 'BNB', name: 'BNB', category: 'crypto', pair: 'BNBUSDT', coingeckoId: 'binancecoin', tradingviewSymbol: 'BINANCE:BNBUSDT' },
  XRP: { symbol: 'XRP', name: 'Ripple', category: 'crypto', pair: 'XRPUSDT', coingeckoId: 'ripple', tradingviewSymbol: 'BINANCE:XRPUSDT' },
  ADA: { symbol: 'ADA', name: 'Cardano', category: 'crypto', pair: 'ADAUSDT', coingeckoId: 'cardano', tradingviewSymbol: 'BINANCE:ADAUSDT' },
  DOGE: { symbol: 'DOGE', name: 'Dogecoin', category: 'crypto', pair: 'DOGEUSDT', coingeckoId: 'dogecoin', tradingviewSymbol: 'BINANCE:DOGEUSDT' },
  AVAX: { symbol: 'AVAX', name: 'Avalanche', category: 'crypto', pair: 'AVAXUSDT', coingeckoId: 'avalanche-2', tradingviewSymbol: 'BINANCE:AVAXUSDT' },
  DOT: { symbol: 'DOT', name: 'Polkadot', category: 'crypto', pair: 'DOTUSDT', coingeckoId: 'polkadot', tradingviewSymbol: 'BINANCE:DOTUSDT' },
  LINK: { symbol: 'LINK', name: 'Chainlink', category: 'crypto', pair: 'LINKUSDT', coingeckoId: 'chainlink', tradingviewSymbol: 'BINANCE:LINKUSDT' },
  LTC: { symbol: 'LTC', name: 'Litecoin', category: 'crypto', pair: 'LTCUSDT', coingeckoId: 'litecoin', tradingviewSymbol: 'BINANCE:LTCUSDT' },
  
  // Forex
  EURUSD: { symbol: 'EURUSD', name: 'Euro/Dólar', category: 'forex', pair: 'EUR/USD', tradingviewSymbol: 'FX:EURUSD', pipValue: 0.0001 },
  GBPUSD: { symbol: 'GBPUSD', name: 'Libra/Dólar', category: 'forex', pair: 'GBP/USD', tradingviewSymbol: 'FX:GBPUSD', pipValue: 0.0001 },
  USDJPY: { symbol: 'USDJPY', name: 'Dólar/Yen', category: 'forex', pair: 'USD/JPY', tradingviewSymbol: 'FX:USDJPY', pipValue: 0.01 },
  USDCHF: { symbol: 'USDCHF', name: 'Dólar/Franco', category: 'forex', pair: 'USD/CHF', tradingviewSymbol: 'FX:USDCHF', pipValue: 0.0001 },
  AUDUSD: { symbol: 'AUDUSD', name: 'Aussie/Dólar', category: 'forex', pair: 'AUD/USD', tradingviewSymbol: 'FX:AUDUSD', pipValue: 0.0001 },
  USDCAD: { symbol: 'USDCAD', name: 'Dólar/CAD', category: 'forex', pair: 'USD/CAD', tradingviewSymbol: 'FX:USDCAD', pipValue: 0.0001 },
  NZDUSD: { symbol: 'NZDUSD', name: 'NZD/Dólar', category: 'forex', pair: 'NZD/USD', tradingviewSymbol: 'FX:NZDUSD', pipValue: 0.0001 },
  EURGBP: { symbol: 'EURGBP', name: 'Euro/Libra', category: 'forex', pair: 'EUR/GBP', tradingviewSymbol: 'FX:EURGBP', pipValue: 0.0001 },
  EURJPY: { symbol: 'EURJPY', name: 'Euro/Yen', category: 'forex', pair: 'EUR/JPY', tradingviewSymbol: 'FX:EURJPY', pipValue: 0.01 },
  GBPJPY: { symbol: 'GBPJPY', name: 'Libra/Yen', category: 'forex', pair: 'GBP/JPY', tradingviewSymbol: 'FX:GBPJPY', pipValue: 0.01 },
  
  // Stocks
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', tradingviewSymbol: 'NASDAQ:AAPL' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks', tradingviewSymbol: 'NASDAQ:GOOGL' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft', category: 'stocks', tradingviewSymbol: 'NASDAQ:MSFT' },
  AMZN: { symbol: 'AMZN', name: 'Amazon', category: 'stocks', tradingviewSymbol: 'NASDAQ:AMZN' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks', tradingviewSymbol: 'NASDAQ:TSLA' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA', category: 'stocks', tradingviewSymbol: 'NASDAQ:NVDA' },
  META: { symbol: 'META', name: 'Meta Platforms', category: 'stocks', tradingviewSymbol: 'NASDAQ:META' },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase', category: 'stocks', tradingviewSymbol: 'NYSE:JPM' },
  
  // Indices
  SPX: { symbol: 'SPX', name: 'S&P 500', category: 'indices', tradingviewSymbol: 'FOREXCOM:SPXUSD' },
  NDX: { symbol: 'NDX', name: 'Nasdaq 100', category: 'indices', tradingviewSymbol: 'NASDAQ:NDX' },
  DJI: { symbol: 'DJI', name: 'Dow Jones', category: 'indices', tradingviewSymbol: 'DJ:DJI' },
  DAX: { symbol: 'DAX', name: 'DAX 40', category: 'indices', tradingviewSymbol: 'XETR:DAX' },
  FTSE: { symbol: 'FTSE', name: 'FTSE 100', category: 'indices', tradingviewSymbol: 'FTSE:UKX' },
  N225: { symbol: 'N225', name: 'Nikkei 225', category: 'indices', tradingviewSymbol: 'TVC:NI225' },
  HSI: { symbol: 'HSI', name: 'Hang Seng', category: 'indices', tradingviewSymbol: 'HSI:HSI' },
  
  // Commodities
  XAUUSD: { symbol: 'XAUUSD', name: 'Oro/USD', category: 'commodities', tradingviewSymbol: 'TVC:GOLD' },
  XAGUSD: { symbol: 'XAGUSD', name: 'Plata/USD', category: 'commodities', tradingviewSymbol: 'TVC:SILVER' },
  WTIUSD: { symbol: 'WTIUSD', name: 'Petróleo WTI', category: 'commodities', tradingviewSymbol: 'TVC:USOIL' },
  BRENTUSD: { symbol: 'BRENTUSD', name: 'Petróleo Brent', category: 'commodities', tradingviewSymbol: 'TVC:UKOIL' },
  NATGAS: { symbol: 'NATGAS', name: 'Gas Natural', category: 'commodities', tradingviewSymbol: 'TVC:NATGAS' },
  COPPER: { symbol: 'COPPER', name: 'Cobre', category: 'commodities', tradingviewSymbol: 'TVC:COPPER' },
  
  // Futures
  ES: { symbol: 'ES', name: 'E-mini S&P 500', category: 'futures', tradingviewSymbol: 'CME:ES1!' },
  NQ: { symbol: 'NQ', name: 'E-mini Nasdaq', category: 'futures', tradingviewSymbol: 'CME:NQ1!' },
  CL: { symbol: 'CL', name: 'Crude Oil Futures', category: 'futures', tradingviewSymbol: 'NYMEX:CL1!' },
  GC: { symbol: 'GC', name: 'Gold Futures', category: 'futures', tradingviewSymbol: 'COMEX:GC1!' },
  SI: { symbol: 'SI', name: 'Silver Futures', category: 'futures', tradingviewSymbol: 'COMEX:SI1!' },
};

// Obtener activos por categoría
export const getAssetsByCategory = (category) => {
  return Object.values(ALL_ASSETS).filter(asset => asset.category === category);
};

// Store para activos seleccionados por el usuario
export const useAssetsStore = create(
  persist(
    (set, get) => ({
      // Activos favoritos del usuario
      favorites: ['BTC', 'ETH', 'EURUSD', 'XAUUSD', 'SPX'],
      
      // Activo actualmente seleccionado
      selectedAsset: 'BTC',
      
      // Categoría actualmente seleccionada
      selectedCategory: 'crypto',
      
      addFavorite: (symbol) => {
        const favorites = get().favorites;
        if (!favorites.includes(symbol)) {
          set({ favorites: [...favorites, symbol] });
        }
      },
      
      removeFavorite: (symbol) => {
        set({ favorites: get().favorites.filter(s => s !== symbol) });
      },
      
      setSelectedAsset: (symbol) => {
        set({ selectedAsset: symbol });
      },
      
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },
      
      getAsset: () => {
        return ALL_ASSETS[get().selectedAsset];
      },
      
      getFavoriteAssets: () => {
        return get().favorites.map(symbol => ALL_ASSETS[symbol]).filter(Boolean);
      }
    }),
    { name: 'trading-assets-storage' }
  )
);

// Datos de precios en tiempo real
export const usePricesStore = create((set, get) => ({
  prices: {},
  isLoading: false,
  lastUpdate: null,
  
  updatePrice: (symbol, priceData) => {
    set(state => ({
      prices: {
        ...state.prices,
        [symbol]: {
          ...priceData,
          lastUpdate: Date.now()
        }
      }
    }));
  },
  
  updatePrices: (pricesData) => {
    set({
      prices: {
        ...get().prices,
        ...pricesData
      },
      lastUpdate: Date.now()
    });
  },
  
  getPrice: (symbol) => {
    return get().prices[symbol] || null;
  },
  
  setLoading: (isLoading) => {
    set({ isLoading });
  }
}));

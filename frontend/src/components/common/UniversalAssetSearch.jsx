import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Clock, Flame, ArrowUpRight, ArrowDownRight,
  Bitcoin, Coins, DollarSign, LineChart, Layers,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { usePriceStore } from '@/lib/store';
import { CRYPTO_LIST, COMMODITIES } from '@/lib/constants';

// Curated list of popular forex pairs (used by LotSizeCalculator).
const FOREX_LIST = [
  { id: 'EURUSD', symbol: 'EURUSD', name: 'EUR/USD' },
  { id: 'GBPUSD', symbol: 'GBPUSD', name: 'GBP/USD' },
  { id: 'USDJPY', symbol: 'USDJPY', name: 'USD/JPY' },
  { id: 'USDCHF', symbol: 'USDCHF', name: 'USD/CHF' },
  { id: 'AUDUSD', symbol: 'AUDUSD', name: 'AUD/USD' },
  { id: 'USDCAD', symbol: 'USDCAD', name: 'USD/CAD' },
  { id: 'NZDUSD', symbol: 'NZDUSD', name: 'NZD/USD' },
  { id: 'EURGBP', symbol: 'EURGBP', name: 'EUR/GBP' },
  { id: 'EURJPY', symbol: 'EURJPY', name: 'EUR/JPY' },
  { id: 'GBPJPY', symbol: 'GBPJPY', name: 'GBP/JPY' },
];

// Curated list of popular stocks for offline search (extended set covered by backend).
const STOCKS_LIST = [
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft' },
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon' },
  { id: 'META', symbol: 'META', name: 'Meta' },
  { id: 'GOOG', symbol: 'GOOG', name: 'Alphabet' },
  { id: 'SPY',  symbol: 'SPY',  name: 'S&P 500 ETF' },
  { id: 'QQQ',  symbol: 'QQQ',  name: 'Nasdaq-100 ETF' },
  { id: 'COIN', symbol: 'COIN', name: 'Coinbase' },
  { id: 'MSTR', symbol: 'MSTR', name: 'MicroStrategy' },
  { id: 'AMD',  symbol: 'AMD',  name: 'AMD' },
];

const CATEGORY_META = {
  crypto:      { icon: Bitcoin,    label: 'Crypto',      color: 'text-[#f7931a]' },
  stocks:      { icon: LineChart,  label: 'Stocks',      color: 'text-[#3b82f6]' },
  forex:       { icon: DollarSign, label: 'Forex',       color: 'text-[#22c55e]' },
  commodities: { icon: Coins,      label: 'Commodities', color: 'text-[#eab308]' },
};

const RECENTS_KEY = 'universal_asset_recents';
const TRENDING = ['bitcoin', 'ethereum', 'solana', 'AAPL', 'NVDA', 'TSLA', 'EURUSD', 'gold'];

const buildAssetIndex = (categories) => {
  const idx = [];
  if (categories.includes('crypto')) {
    CRYPTO_LIST.forEach((c) => idx.push({ ...c, category: 'crypto' }));
  }
  if (categories.includes('commodities')) {
    COMMODITIES.forEach((c) => idx.push({ ...c, category: 'commodities' }));
  }
  if (categories.includes('forex')) {
    FOREX_LIST.forEach((c) => idx.push({ ...c, category: 'forex' }));
  }
  if (categories.includes('stocks')) {
    STOCKS_LIST.forEach((c) => idx.push({ ...c, category: 'stocks' }));
  }
  return idx;
};

const highlightMatch = (text, query) => {
  if (!query || !text) return text;
  const idx = text.toUpperCase().indexOf(query.toUpperCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
};

/**
 * UniversalAssetSearch — professional asset selector usable across all calculators.
 *
 * @param {string}   value          - current asset id (e.g. "bitcoin", "EURUSD", "AAPL")
 * @param {function} onChange       - called with the full asset object {id, symbol, name, category, price?}
 * @param {string[]} [categories]   - which asset classes to include. Defaults to all.
 * @param {boolean}  [showCategories=true] - whether to render category filter chips
 * @param {string}   [placeholder]  - input placeholder
 * @param {string}   [testId]       - data-testid for the trigger
 */
const UniversalAssetSearch = ({
  value,
  onChange,
  categories = ['crypto', 'stocks', 'forex', 'commodities'],
  showCategories = true,
  placeholder,
  testId = 'universal-asset-search',
}) => {
  const { t } = useTranslation();
  const { prices } = usePriceStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); } catch { return []; }
  });

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const fullIndex = useMemo(() => buildAssetIndex(categories), [categories]);

  // Find the currently selected asset to render in the trigger.
  const selected = useMemo(
    () => fullIndex.find((a) => a.id === value || a.symbol === value),
    [fullIndex, value]
  );

  const getPrice = useCallback((asset) => {
    if (!asset) return null;
    if (asset.category === 'crypto' && prices?.[asset.id]?.usd) {
      return prices[asset.id].usd;
    }
    return null;
  }, [prices]);

  const getChangePct = useCallback((asset) => {
    if (!asset) return null;
    if (asset.category === 'crypto' && prices?.[asset.id]?.usd_24h_change != null) {
      return prices[asset.id].usd_24h_change;
    }
    return null;
  }, [prices]);

  // Filter assets by query + active category.
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    let pool = fullIndex;
    if (activeCategory !== 'all') pool = pool.filter((a) => a.category === activeCategory);
    if (!q) return pool;
    return pool.filter(
      (a) => a.symbol.toUpperCase().includes(q) || (a.name || '').toUpperCase().includes(q)
    );
  }, [fullIndex, query, activeCategory]);

  // Group by category for display.
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((a) => {
      const k = a.category;
      if (!g[k]) g[k] = [];
      g[k].push(a);
    });
    return g;
  }, [filtered]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset highlight when filtered list changes.
  useEffect(() => {
    setActiveIdx(filtered.length > 0 ? 0 : -1);
  }, [filtered.length, query, activeCategory]);

  const addRecent = useCallback((id) => {
    setRecents((prev) => {
      const next = [id, ...prev.filter((s) => s !== id)].slice(0, 6);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* no-op */ }
      return next;
    });
  }, []);

  const handleSelect = useCallback((asset) => {
    if (!asset) return;
    addRecent(asset.id);
    onChange?.(asset);
    setOpen(false);
    setQuery('');
  }, [onChange, addRecent]);

  const handleKeyDown = (e) => {
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIdx]) handleSelect(filtered[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Trigger button — closed state.
  if (!open) {
    const SelMeta = selected ? CATEGORY_META[selected.category] : null;
    const SelIcon = SelMeta?.icon || Search;
    const selPrice = getPrice(selected);
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 30);
        }}
        className="w-full flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2 text-sm hover:border-primary/40 transition-colors"
        data-testid={testId}
      >
        <SelIcon className={`w-4 h-4 flex-shrink-0 ${SelMeta?.color || 'text-muted-foreground'}`} />
        <div className="flex-1 text-left min-w-0">
          {selected ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-foreground">{selected.symbol}</span>
              <span className="text-[11px] text-muted-foreground truncate">{selected.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder || t('asset')}</span>
          )}
        </div>
        {selPrice != null && (
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
            ${selPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </span>
        )}
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  }

  // Open dropdown
  const showRecents = !query.trim() && recents.length > 0 && activeCategory === 'all';
  const showTrending = !query.trim() && activeCategory === 'all';
  const recentAssets = recents
    .map((id) => fullIndex.find((a) => a.id === id))
    .filter(Boolean);
  const trendingAssets = TRENDING
    .map((id) => fullIndex.find((a) => a.id === id || a.symbol === id))
    .filter(Boolean);

  return (
    <div ref={containerRef} className="relative w-full" data-testid={`${testId}-open`}>
      {/* Search input */}
      <div className="relative flex items-center bg-muted border border-primary/60 ring-2 ring-primary/15 rounded-md px-3 py-2">
        <Search className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Buscar ticker o nombre...'}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="p-0.5 rounded hover:bg-border"
            aria-label="Clear"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-lg shadow-xl shadow-black/50 z-50 max-h-[420px] flex flex-col overflow-hidden">
        {/* Category tabs */}
        {showCategories && categories.length > 1 && (
          <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeCategory === 'all'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="uas-tab-all"
            >
              <Layers className="w-3 h-3 inline mr-1" />
              {t('uasAll') === 'uasAll' ? 'Todos' : t('uasAll')}
            </button>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              if (!meta) return null;
              const Ic = meta.icon;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                    activeCategory === cat
                      ? 'bg-primary/15 text-primary'
                      : `text-muted-foreground hover:text-foreground`
                  }`}
                  data-testid={`uas-tab-${cat}`}
                >
                  <Ic className={`w-3 h-3 ${activeCategory === cat ? 'text-primary' : meta.color}`} />
                  {t(`uasCat_${cat}`) === `uasCat_${cat}` ? meta.label : t(`uasCat_${cat}`)}
                </button>
              );
            })}
          </div>
        )}

        {/* Recents */}
        {showRecents && (
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {t('uasRecent') === 'uasRecent' ? 'Recientes' : t('uasRecent')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentAssets.map((a) => (
                <button
                  key={`recent-${a.id}`}
                  type="button"
                  onClick={() => handleSelect(a)}
                  className="px-2 py-0.5 bg-muted border border-border rounded text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {a.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending */}
        {showTrending && trendingAssets.length > 0 && (
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Flame className="w-3 h-3 text-[#f59e0b]" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {t('uasTrending') === 'uasTrending' ? 'Trending' : t('uasTrending')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingAssets.map((a) => (
                <button
                  key={`trend-${a.id}`}
                  type="button"
                  onClick={() => handleSelect(a)}
                  className="px-2 py-0.5 bg-muted border border-border rounded text-[11px] font-bold text-foreground hover:border-[#f59e0b]/40 transition-colors"
                >
                  {a.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results list */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([cat, items]) => {
            const meta = CATEGORY_META[cat];
            const Ic = meta?.icon || Search;
            return (
              <div key={`group-${cat}`}>
                <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
                  <Ic className={`w-3 h-3 ${meta?.color}`} />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                    {t(`uasCat_${cat}`) === `uasCat_${cat}` ? (meta?.label || cat) : t(`uasCat_${cat}`)}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                {items.map((a) => {
                  const globalIdx = filtered.indexOf(a);
                  const isActive = globalIdx === activeIdx;
                  const p = getPrice(a);
                  const ch = getChangePct(a);
                  return (
                    <button
                      key={`opt-${a.id}`}
                      type="button"
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      onClick={() => handleSelect(a)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 transition-colors text-left ${
                        isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                      data-testid={`uas-option-${a.id}`}
                    >
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {a.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-xs">
                          {highlightMatch(a.symbol, query)}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {highlightMatch(a.name || '', query)}
                        </div>
                      </div>
                      {p != null && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-[11px] font-mono font-bold text-foreground">
                            ${p.toLocaleString('en-US', { maximumFractionDigits: p < 1 ? 4 : 2 })}
                          </div>
                          {ch != null && (
                            <div className={`text-[9px] font-semibold flex items-center justify-end gap-0.5 ${
                              ch >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                            }`}>
                              {ch >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                              {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                {(t('uasNoResults') === 'uasNoResults' ? 'Sin resultados para' : t('uasNoResults'))} "<span className="text-foreground font-bold">{query}</span>"
              </p>
            </div>
          )}
        </div>

        {/* Keyboard hint footer */}
        <div className="px-3 py-1.5 border-t border-border flex items-center gap-3 text-[9px] text-muted-foreground">
          <span><kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> {t('uasNavigate') === 'uasNavigate' ? 'Navegar' : t('uasNavigate')}</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> {t('uasSelect') === 'uasSelect' ? 'Seleccionar' : t('uasSelect')}</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> {t('uasClose') === 'uasClose' ? 'Cerrar' : t('uasClose')}</span>
        </div>
      </div>
    </div>
  );
};

export default UniversalAssetSearch;

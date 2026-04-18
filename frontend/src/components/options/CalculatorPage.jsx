import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { STRATEGIES, STRATEGY_CATEGORIES } from '../../data/mockData';
import { calculateStrategyPayoff, findBreakEvenPoints, calculateStrategyGreeks, probabilityOfProfit, riskRewardRatio } from '../../utils/blackScholes';
import { fetchStock, fetchOptionsChain, fetchExpirations } from '../../services/optionsApi';
import PayoffChart from './PayoffChart';
import StrategyBar from './StrategyBar';
import GreeksDisplay from './GreeksDisplay';
import OptionsChainView from './OptionsChainView';
import IVSurfaceView from './IVSurfaceView';
import EducationTab from './EducationTab';
import GuideModal from './GuideModal';
import SearchBar from './SearchBar';
import LegEditor from './LegEditor';
import KellyPanel from './KellyPanel';
import GreeksTimeChart from './GreeksTimeChart';
import OptimizeView from './OptimizeView';
import { TrendingUp, TrendingDown, Activity, Clock, Minus, Plus, Target, DollarSign, ArrowUpRight, ArrowDownRight, BarChart2, LayoutGrid, Loader2, BookOpen, HelpCircle, Percent, Scale, Wrench, Layers, Wallet, GitCompare, Trophy, Calculator } from 'lucide-react';

const CalculatorPage = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [stock, setStock] = useState(null);
  const [expirations, setExpirations] = useState([]);
  const [chain, setChain] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
  const [selectedExpIdx, setSelectedExpIdx] = useState(3);
  const [selectedStrikeIdx, setSelectedStrikeIdx] = useState(15);
  const [contracts, setContracts] = useState(1);
  const [timeSlider, setTimeSlider] = useState(100);
  const [activeTab, setActiveTab] = useState('calculator');
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [builderMode, setBuilderMode] = useState('preset'); // 'preset' | 'custom'
  const [customLegs, setCustomLegs] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedStrategyB, setSelectedStrategyB] = useState(STRATEGIES.find((s) => s.id === 'short_put') || STRATEGIES[1]);
  const [showKelly, setShowKelly] = useState(false);
  const [showGreeks, setShowGreeks] = useState(false);
  const [accountBalance, setAccountBalance] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('options_account_balance') : null;
      return saved ? parseFloat(saved) : 10000;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Options] localStorage read failed:', err);
      }
      return 10000;
    }
  });

  // Persist account balance
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('options_account_balance', String(accountBalance));
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Options] localStorage write failed:', err);
      }
    }
  }, [accountBalance]);

  // Load stock data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [stockData, expData] = await Promise.all([
          fetchStock(ticker),
          fetchExpirations(ticker),
        ]);
        if (stockData) setStock(stockData);
        if (expData?.expirations) setExpirations(expData.expirations);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Options] error loading initial stock/expirations:', e);
        }
      }
      setLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  // Load options chain when expiration changes
  useEffect(() => {
    const loadChain = async () => {
      if (!ticker) return;
      try {
        const data = await fetchOptionsChain(ticker, selectedExpIdx);
        if (data?.chain) {
          setChain(data.chain);
          if (data.chain.length > 0 && data.stock) {
            const closestIdx = data.chain.reduce((best, s, idx) =>
              Math.abs(s.strike - data.stock.price) < Math.abs(data.chain[best].strike - data.stock.price) ? idx : best, 0);
            setSelectedStrikeIdx(closestIdx);
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Options] error loading options chain:', e);
        }
      }
    };
    loadChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, selectedExpIdx]);

  // Search tickers - handled by SearchBar component now
  const handleTickerSelect = useCallback((symbol) => {
    setTicker(typeof symbol === 'string' ? symbol.toUpperCase() : symbol);
  }, [setTicker]);

  const currentExp = useMemo(() => expirations[selectedExpIdx] || expirations[3] || { daysToExpiry: 30 }, [expirations, selectedExpIdx]);
  const selectedStrike = chain[selectedStrikeIdx];

  // Build legs from strategy + selected strike (PRESET mode)
  const presetLegs = useMemo(() => {
    if (!selectedStrike || !currentExp || chain.length === 0 || !stock) return [];
    return selectedStrategy.legs.map((legDef) => {
      if (legDef.type === 'stock') {
        return { type: 'stock', action: legDef.action, quantity: legDef.qty, strike: stock.price };
      }
      const idx = Math.max(0, Math.min(chain.length - 1, selectedStrikeIdx + (legDef.offset || 0)));
      const strikeData = chain[idx];
      const opt = strikeData?.[legDef.type];
      return {
        type: legDef.type,
        action: legDef.action,
        quantity: legDef.qty * contracts,
        strike: strikeData?.strike || 0,
        premium: opt?.mid || 0,
        iv: opt?.iv || 0.3,
        daysToExpiry: currentExp.daysToExpiry,
      };
    });
  }, [selectedStrategy, selectedStrikeIdx, chain, currentExp, stock, contracts, selectedStrike]);

  // Custom legs (CUSTOM mode)
  const customBuiltLegs = useMemo(() => {
    if (!currentExp || chain.length === 0 || !stock) return [];
    return customLegs.filter(l => l.enabled).map(l => ({
      type: l.type,
      action: l.action,
      quantity: l.quantity,
      strike: l.strike,
      premium: l.premium,
      iv: l.iv,
      daysToExpiry: currentExp.daysToExpiry,
    }));
  }, [customLegs, currentExp, chain, stock]);

  // Active legs based on mode
  const legs = builderMode === 'custom' ? customBuiltLegs : presetLegs;

  // Strategy B (for comparison mode) — uses same chain/strike/contracts/expiration
  const legsB = useMemo(() => {
    if (!compareMode || !selectedStrike || !currentExp || chain.length === 0 || !stock) return [];
    return selectedStrategyB.legs.map((legDef) => {
      if (legDef.type === 'stock') {
        return { type: 'stock', action: legDef.action, quantity: legDef.qty * contracts, strike: stock.price };
      }
      const idx = Math.max(0, Math.min(chain.length - 1, selectedStrikeIdx + (legDef.offset || 0)));
      const strikeData = chain[idx];
      const opt = strikeData?.[legDef.type];
      return {
        type: legDef.type,
        action: legDef.action,
        quantity: legDef.qty * contracts,
        strike: strikeData?.strike || 0,
        premium: opt?.mid || 0,
        iv: opt?.iv || 0.3,
        daysToExpiry: currentExp.daysToExpiry,
      };
    });
  }, [compareMode, selectedStrategyB, selectedStrikeIdx, chain, currentExp, stock, contracts, selectedStrike]);

  const daysForChart = useMemo(() => {
    return Math.max(0, Math.round((currentExp?.daysToExpiry || 30) * (timeSlider / 100)));
  }, [currentExp, timeSlider]);

  const payoffData = useMemo(() => {
    if (!stock || legs.length === 0) return [];
    return calculateStrategyPayoff(legs, stock.price, 0.35, daysForChart);
  }, [legs, stock, daysForChart]);

  const payoffDataB = useMemo(() => {
    if (!compareMode || !stock || legsB.length === 0) return [];
    return calculateStrategyPayoff(legsB, stock.price, 0.35, daysForChart);
  }, [compareMode, legsB, stock, daysForChart]);

  const breakEvens = useMemo(() => findBreakEvenPoints(payoffData), [payoffData]);
  const greeks = useMemo(() => {
    if (!stock || legs.length === 0) return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    return calculateStrategyGreeks(legs, stock.price);
  }, [legs, stock]);

  // Probability of Profit & Risk/Reward
  const pop = useMemo(() => {
    if (!stock || legs.length === 0) return 0;
    return probabilityOfProfit(legs, stock.price);
  }, [legs, stock]);

  const stats = useMemo(() => {
    if (payoffData.length === 0) {
      return {
        maxProfit: '0',
        maxLoss: '0',
        premium: '0',
        breakEvens: [],
        roi: '0.0',
        rr: '—',
        isMaxProfitUnlimited: false,
        pop: '0.0',
        capitalRequired: '0',
        isMaxLossUnlimited: false,
      };
    }
    const expPnls = payoffData.map((p) => p.pnlAtExpiry);
    const maxProfit = Math.max(...expPnls);
    const maxLoss = Math.min(...expPnls);
    let premium = 0;
    legs.forEach((l) => {
      if (l.type !== 'stock') {
        premium += l.premium * (l.action === 'buy' ? -1 : 1) * (l.quantity || 1) * 100;
      }
    });
    const roi = premium !== 0 ? ((maxProfit / Math.abs(premium)) * 100) : 0;
    const rr = riskRewardRatio(maxProfit, maxLoss);

    // Capital required (Reg-T approximation)
    // - Defined-risk strategies: capital = |max loss|
    // - Undefined risk (naked shorts): use Reg-T per-leg estimate
    const isMaxLossUnlimited = maxLoss < -5000000;
    let capitalRequired;
    if (isMaxLossUnlimited && stock?.price) {
      let naked = 0;
      legs.forEach((l) => {
        if (l.type === 'stock') return;
        if (l.action !== 'sell') return;
        const S = stock.price;
        const K = l.strike || S;
        const qty = l.quantity || 1;
        const premRecv = (l.premium || 0) * 100;
        if (l.type === 'call') {
          const otm = Math.max(0, K - S);
          const margin = Math.max(0.2 * S - otm, 0.1 * S) * 100;
          naked += (margin + premRecv) * qty;
        } else {
          const otm = Math.max(0, S - K);
          const margin = Math.max(0.2 * S - otm, 0.1 * K) * 100;
          naked += (margin + premRecv) * qty;
        }
      });
      capitalRequired = naked > 0 ? naked : Math.abs(premium);
    } else {
      // For debit (negative premium = we paid) use |premium|; for credit use |maxLoss|
      capitalRequired = Math.max(Math.abs(maxLoss), premium < 0 ? Math.abs(premium) : 0);
    }

    return {
      maxProfit: maxProfit > 5000000 ? 'Unlimited' : maxProfit.toFixed(0),
      maxLoss: maxLoss.toFixed(0),
      premium: premium.toFixed(0),
      breakEvens,
      roi: roi.toFixed(1),
      rr: rr > 100 ? '∞' : rr.toFixed(2),
      isMaxProfitUnlimited: maxProfit > 5000000,
      isMaxLossUnlimited,
      pop: pop.toFixed(1),
      capitalRequired: capitalRequired.toFixed(0),
    };
  }, [payoffData, legs, breakEvens, pop, stock]);

  // Stats for Strategy B (comparison mode)
  const breakEvensB = useMemo(() => findBreakEvenPoints(payoffDataB), [payoffDataB]);
  const popB = useMemo(() => {
    if (!compareMode || !stock || legsB.length === 0) return 0;
    return probabilityOfProfit(legsB, stock.price);
  }, [compareMode, legsB, stock]);
  const statsB = useMemo(() => {
    if (!compareMode || payoffDataB.length === 0) {
      return { maxProfit: '0', maxLoss: '0', premium: '0', roi: '0.0', rr: '—', isMaxProfitUnlimited: false, isMaxLossUnlimited: false, pop: '0.0', capitalRequired: '0' };
    }
    const expPnls = payoffDataB.map((p) => p.pnlAtExpiry);
    const maxProfit = Math.max(...expPnls);
    const maxLoss = Math.min(...expPnls);
    let premium = 0;
    legsB.forEach((l) => {
      if (l.type !== 'stock') premium += l.premium * (l.action === 'buy' ? -1 : 1) * (l.quantity || 1) * 100;
    });
    const roi = premium !== 0 ? ((maxProfit / Math.abs(premium)) * 100) : 0;
    const rr = riskRewardRatio(maxProfit, maxLoss);
    const isMaxLossUnlimited = maxLoss < -5000000;
    let capitalRequired;
    if (isMaxLossUnlimited && stock?.price) {
      let naked = 0;
      legsB.forEach((l) => {
        if (l.type === 'stock' || l.action !== 'sell') return;
        const S = stock.price; const K = l.strike || S; const qty = l.quantity || 1;
        const premRecv = (l.premium || 0) * 100;
        if (l.type === 'call') {
          const otm = Math.max(0, K - S);
          naked += (Math.max(0.2 * S - otm, 0.1 * S) * 100 + premRecv) * qty;
        } else {
          const otm = Math.max(0, S - K);
          naked += (Math.max(0.2 * S - otm, 0.1 * K) * 100 + premRecv) * qty;
        }
      });
      capitalRequired = naked > 0 ? naked : Math.abs(premium);
    } else {
      capitalRequired = Math.max(Math.abs(maxLoss), premium < 0 ? Math.abs(premium) : 0);
    }
    return {
      maxProfit: maxProfit > 5000000 ? 'Unlimited' : maxProfit.toFixed(0),
      maxLoss: maxLoss.toFixed(0),
      premium: premium.toFixed(0),
      roi: roi.toFixed(1),
      rr: rr > 100 ? '∞' : rr.toFixed(2),
      isMaxProfitUnlimited: maxProfit > 5000000,
      isMaxLossUnlimited,
      pop: popB.toFixed(1),
      capitalRequired: capitalRequired.toFixed(0),
      breakEvens: breakEvensB,
    };
  }, [compareMode, payoffDataB, legsB, popB, stock, breakEvensB]);

  return (
    <div className="flex flex-col bg-background text-foreground" data-testid="options-calculator-root">
      {/* Top Sub-Header (under TCP main header) */}
      <header className="sticky top-16 h-14 min-h-[56px] bg-card border-b border-border flex items-center px-5 gap-4 z-30">
        {/* Ticker Search - Predictive Autocomplete */}
        <SearchBar currentTicker={ticker} stockData={stock} onSelect={handleTickerSelect} />

        {/* Stock Price */}
        {stock && (
          <div className="flex items-center gap-3 ml-2">
            {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            <span className="text-xl font-bold text-foreground font-mono">${stock.price.toFixed(2)}</span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
              stock.change >= 0 ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#ef4444]/10 text-[#ef4444]'
            }`}>
              {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stock.sector}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-muted rounded-lg border border-border overflow-hidden">
            <button onClick={() => setActiveTab('calculator')} className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${activeTab === 'calculator' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <BarChart2 className="w-3.5 h-3.5 inline mr-1" />Calculator
            </button>
            <button onClick={() => setActiveTab('optimize')} className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${activeTab === 'optimize' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="tab-optimize">
              <Target className="w-3.5 h-3.5 inline mr-1" />Optimizar
            </button>
            <button onClick={() => setActiveTab('chain')} className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${activeTab === 'chain' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />Chain
            </button>
            <button onClick={() => setActiveTab('iv-surface')} className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${activeTab === 'iv-surface' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Activity className="w-3.5 h-3.5 inline mr-1" />IV Surface
            </button>
            <button onClick={() => setActiveTab('education')} className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${activeTab === 'education' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />Academia
            </button>
          </div>
          <button onClick={() => setShowGuide(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Guía Rápida">
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-[#eab308]" />
          </button>
          <div className="flex items-center gap-1.5 text-xs ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
            <span className="text-[#22c55e]">LIVE</span>
          </div>
        </div>
      </header>

      {/* Guide Modal */}
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Tab Content */}
      {activeTab === 'education' && (
        <EducationTab onSwitchToCalc={() => setActiveTab('calculator')} />
      )}
      
      {activeTab === 'chain' && (
        <OptionsChainView 
          chain={chain} 
          stockPrice={stock?.price} 
          expiration={currentExp} 
          expirations={expirations} 
          selectedExpIdx={selectedExpIdx} 
          onExpChange={setSelectedExpIdx} 
        />
      )}
      
      {activeTab === 'iv-surface' && (
        <IVSurfaceView stock={stock} chain={chain} />
      )}

      {activeTab === 'optimize' && (
        <OptimizeView
          symbol={ticker}
          stock={stock}
          expirations={expirations}
          onOpenInCalculator={(result) => {
            // Load the result legs into custom builder mode
            const mappedLegs = (result.legs || []).map((leg) => ({
              id: `leg-${Math.random().toString(36).slice(2, 8)}`,
              type: leg.type,
              action: leg.action,
              quantity: leg.quantity || 1,
              strike: leg.strike,
              premium: leg.premium || 0,
              iv: 0.3,
              daysToExpiry: result.daysToExpiry || 30,
            }));
            setCustomLegs(mappedLegs);
            setBuilderMode('custom');
            setActiveTab('calculator');
          }}
        />
      )}
      
      {activeTab === 'calculator' && (
        <>
          {/* Mode Toggle + Strategy Bar / Custom Builder */}
          {builderMode === 'preset' ? (
            <div className="relative">
              <StrategyBar
                strategies={STRATEGIES}
                categories={STRATEGY_CATEGORIES}
                selected={selectedStrategy}
                onSelect={setSelectedStrategy}
              />
              <button
                onClick={() => setBuilderMode('custom')}
                className="absolute right-4 top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/25 text-[#fbbf24] text-[10px] font-bold hover:bg-[#f59e0b]/20 transition-all z-10"
              >
                <Wrench className="w-3 h-3" /> CONSTRUCTOR
              </button>
              <button
                onClick={() => setCompareMode((v) => !v)}
                className={`absolute right-[155px] top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all z-10 border ${
                  compareMode
                    ? 'bg-[#a855f7]/20 border-[#a855f7]/50 text-[#c084fc]'
                    : 'bg-[#a855f7]/10 border-[#a855f7]/25 text-[#c084fc] hover:bg-[#a855f7]/20'
                }`}
                data-testid="compare-toggle"
              >
                <GitCompare className="w-3 h-3" /> {compareMode ? 'COMPARANDO' : 'COMPARAR A vs B'}
              </button>
            </div>
          ) : (
            <div className="bg-card border-b border-border px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#f59e0b]" />
                  <h3 className="text-sm font-bold text-foreground">Constructor Multi-Leg</h3>
                </div>
                <span className="text-[10px] text-muted-foreground bg-[#f59e0b]/10 px-2 py-0.5 rounded-full text-[#fbbf24] font-semibold">
                  {customLegs.filter(l => l.enabled).length} patas
                </span>
              </div>
              <button
                onClick={() => setBuilderMode('preset')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
              >
                <Layers className="w-3 h-3" /> ESTRATEGIAS PRESET
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex">
            {/* Chart + Controls */}
            <div className="flex-1 flex flex-col p-3 gap-2.5 min-w-0">
              {/* Metrics Row - 5 primary KPIs (larger, breathable) */}
              <div className="grid grid-cols-5 gap-2">
                <StatCard icon={TrendingUp} label="Máx. Beneficio" value={stats.isMaxProfitUnlimited ? '∞' : `$${stats.maxProfit}`} color="text-[#22c55e]" />
                <StatCard icon={TrendingDown} label="Máx. Pérdida" value={stats.isMaxLossUnlimited ? '−∞' : `$${stats.maxLoss}`} color="text-[#ef4444]" />
                <StatCard icon={Wallet} label="Capital Req." value={stats.isMaxLossUnlimited ? `~$${stats.capitalRequired}` : `$${stats.capitalRequired}`} color="text-[#f59e0b]" title="Estimación Reg-T del capital/margen requerido" />
                <StatCard icon={Percent} label="Prob. Beneficio" value={`${stats.pop || 0}%`} color="text-primary" />
                <StatCard icon={ArrowUpRight} label="ROI" value={`${stats.roi}%`} color="text-primary" />
              </div>

              {/* Secondary info + Legs — condensed single line */}
              <div className="flex items-center gap-3 flex-wrap bg-card/50 border border-border/60 rounded-lg px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-[#eab308]" />
                  <span className="text-muted-foreground">R/R</span>
                  <span className="font-mono font-bold text-[#eab308]">{stats.rr || '—'}</span>
                </div>
                <span className="text-muted-foreground/40">·</span>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-[#a78bfa]" />
                  <span className="text-muted-foreground">Break-Even</span>
                  <span className="font-mono font-bold text-[#a78bfa]">{breakEvens.length > 0 ? `$${breakEvens[0]}` : '—'}</span>
                </div>
                <span className="text-muted-foreground/40">·</span>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Prima</span>
                  <span className={`font-mono font-bold ${parseFloat(stats.premium) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>${stats.premium}</span>
                </div>
                <span className="text-muted-foreground/40 hidden md:inline">·</span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                  {legs.map((leg, i) => (
                    <div key={`leg-${leg.type}-${leg.action}-${leg.strike}-${i}`} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      leg.action === 'buy'
                        ? 'bg-[#22c55e]/8 border-[#22c55e]/25 text-[#4ade80]'
                        : 'bg-[#ef4444]/8 border-[#ef4444]/25 text-[#f87171]'
                    }`}>
                      <span className="font-bold uppercase">{leg.action === 'buy' ? 'BUY' : 'SELL'}</span>
                      <span>{leg.quantity}x</span>
                      {leg.type === 'stock' ? (
                        <span>{ticker}</span>
                      ) : (
                        <>
                          <span className="font-mono">${leg.strike}</span>
                          <span className="uppercase">{leg.type}</span>
                          <span className="text-muted-foreground">@${leg.premium?.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground/60 ml-auto text-[10px] whitespace-nowrap">
                  {currentExp?.fullLabel} · {currentExp?.daysToExpiry}d
                </span>
              </div>

              {/* Strategy B picker + Comparison Table (compare mode) */}
              {compareMode && builderMode === 'preset' && (
                <div className="bg-gradient-to-r from-[#a855f7]/5 to-transparent border border-[#a855f7]/30 rounded-xl p-3" data-testid="compare-panel">
                  <div className="flex items-center gap-3 mb-2">
                    <GitCompare className="w-4 h-4 text-[#c084fc]" />
                    <span className="text-xs font-bold text-[#c084fc] uppercase tracking-wider">Comparando</span>
                    <span className="text-[11px] text-muted-foreground">
                      <span className="text-[#4ade80] font-bold">A:</span> {selectedStrategy.name}
                      <span className="mx-2 text-muted-foreground/50">vs</span>
                      <span className="text-[#c084fc] font-bold">B:</span>
                    </span>
                    <select
                      value={selectedStrategyB.id}
                      onChange={(e) => {
                        const s = STRATEGIES.find((x) => x.id === e.target.value);
                        if (s) setSelectedStrategyB(s);
                      }}
                      className="bg-muted border border-[#a855f7]/40 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-[#a855f7]"
                      data-testid="strategy-b-select"
                    >
                      {STRATEGY_CATEGORIES.map((cat) => (
                        <optgroup key={cat} label={cat}>
                          {STRATEGIES.filter((s) => s.category === cat).map((s) => (
                            <option key={s.id} value={s.id} disabled={s.id === selectedStrategy.id}>
                              {s.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  {/* Comparison metrics table */}
                  <div className="grid grid-cols-7 gap-1.5 mt-2 text-[11px] font-mono">
                    <CompareCell label="Métrica" headers />
                    <CompareCell label="Máx. Beneficio" a={stats.isMaxProfitUnlimited ? '∞' : `$${stats.maxProfit}`} b={statsB.isMaxProfitUnlimited ? '∞' : `$${statsB.maxProfit}`} winner={compareNumeric(stats.maxProfit, statsB.maxProfit, 'higher', stats.isMaxProfitUnlimited, statsB.isMaxProfitUnlimited)} />
                    <CompareCell label="Máx. Pérdida" a={stats.isMaxLossUnlimited ? '−∞' : `$${stats.maxLoss}`} b={statsB.isMaxLossUnlimited ? '−∞' : `$${statsB.maxLoss}`} winner={compareNumeric(stats.maxLoss, statsB.maxLoss, 'higher', stats.isMaxLossUnlimited, statsB.isMaxLossUnlimited)} />
                    <CompareCell label="Capital Req." a={`$${stats.capitalRequired}`} b={`$${statsB.capitalRequired}`} winner={compareNumeric(stats.capitalRequired, statsB.capitalRequired, 'lower')} />
                    <CompareCell label="POP %" a={`${stats.pop}%`} b={`${statsB.pop}%`} winner={compareNumeric(stats.pop, statsB.pop, 'higher')} />
                    <CompareCell label="R/R" a={stats.rr} b={statsB.rr} winner={compareNumeric(stats.rr, statsB.rr, 'higher')} />
                    <CompareCell label="ROI %" a={`${stats.roi}%`} b={`${statsB.roi}%`} winner={compareNumeric(stats.roi, statsB.roi, 'higher')} />
                  </div>
                </div>
              )}

              {/* Chart — fixed tall height for prominence */}
              <div className="bg-card rounded-xl border border-border p-4 h-[520px]">
                <PayoffChart
                  data={payoffData}
                  breakEvens={breakEvens}
                  stockPrice={stock?.price}
                  legs={legs}
                  dataB={compareMode ? payoffDataB : null}
                  labelA={selectedStrategy.name}
                  labelB={selectedStrategyB.name}
                  title={compareMode
                    ? `${selectedStrategy.name} vs ${selectedStrategyB.name} — ${ticker}`
                    : (builderMode === 'custom' ? `Custom — ${ticker}` : `${selectedStrategy.name} — ${ticker}`)}
                />
              </div>

              {/* Time Slider — slim */}
              <div className="flex items-center gap-3 bg-card/60 rounded-lg border border-border/60 px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Vencimiento</span>
                <div className="flex-1 relative">
                  <input type="range" min={0} max={100} value={timeSlider} onChange={(e) => setTimeSlider(parseInt(e.target.value))} className="w-full" />
                </div>
                <span className="text-xs font-mono font-bold text-foreground min-w-[44px] text-right">{daysForChart}d</span>
                <span className="text-[10px] text-muted-foreground">/ {currentExp?.daysToExpiry}d</span>
              </div>
            </div>

            {/* Right Panel — simplified to 3 core controls */}
            <aside className="w-[272px] min-w-[272px] bg-card border-l border-border flex flex-col">
              {/* Expiration - always shown */}
              <div className="p-4 border-b border-border">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5 block">Fecha de Expiración</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {expirations.slice(0, 9).map((exp, idx) => (
                    <button
                      key={exp.date}
                      onClick={() => setSelectedExpIdx(idx)}
                      className={`px-1.5 py-2 rounded-lg text-center transition-all text-[11px] ${
                        selectedExpIdx === idx
                          ? 'bg-primary/15 text-primary border border-primary/40 font-semibold'
                          : 'bg-muted text-muted-foreground border border-border hover:border-border hover:text-foreground'
                      }`}
                    >
                      <div className="font-medium">{exp.label}</div>
                      <div className="text-[9px] opacity-60 mt-0.5">{exp.daysToExpiry}d</div>
                    </button>
                  ))}
                </div>
              </div>

              {builderMode === 'custom' ? (
                /* Custom Leg Builder */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <LegEditor
                    legs={customLegs}
                    chain={chain}
                    stockPrice={stock?.price || 0}
                    onLegsChange={setCustomLegs}
                  />
                </div>
              ) : (
                /* Preset Controls */
                <>
                  {/* Strike Price — Configurable */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Precio Strike</label>
                      {selectedStrike && stock?.price && (
                        <span className={`text-[9px] font-mono font-semibold ${
                          selectedStrike.strike < stock.price ? 'text-[#4ade80]' : selectedStrike.strike > stock.price ? 'text-[#f87171]' : 'text-primary'
                        }`}>
                          {selectedStrike.strike === stock.price ? 'ATM' : `${((selectedStrike.strike - stock.price) / stock.price * 100).toFixed(1)}%`}
                        </span>
                      )}
                    </div>

                    {/* Editable strike input + steppers */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStrikeIdx(Math.max(0, selectedStrikeIdx - 1))}
                        className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all"
                        title="Strike anterior"
                        data-testid="strike-decrement"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none">$</span>
                        <input
                          type="number"
                          step="any"
                          value={selectedStrike?.strike ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (Number.isNaN(val) || chain.length === 0) return;
                            // Snap to closest strike in the chain
                            let bestIdx = 0;
                            let bestDiff = Infinity;
                            chain.forEach((s, idx) => {
                              const diff = Math.abs(s.strike - val);
                              if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
                            });
                            setSelectedStrikeIdx(bestIdx);
                          }}
                          className="w-full bg-muted border border-border rounded-lg pl-7 pr-3 py-2 text-center text-lg font-bold text-foreground font-mono focus:outline-none focus:border-primary transition-colors"
                          data-testid="strike-input"
                        />
                      </div>
                      <button
                        onClick={() => setSelectedStrikeIdx(Math.min(chain.length - 1, selectedStrikeIdx + 1))}
                        className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all"
                        title="Strike siguiente"
                        data-testid="strike-increment"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick moneyness shortcuts */}
                    <div className="grid grid-cols-5 gap-1 mt-2.5">
                      {[
                        { label: '-10%', mult: 0.9 },
                        { label: '-5%', mult: 0.95 },
                        { label: 'ATM', mult: 1.0 },
                        { label: '+5%', mult: 1.05 },
                        { label: '+10%', mult: 1.10 },
                      ].map(({ label, mult }) => (
                        <button
                          key={label}
                          onClick={() => {
                            if (!stock?.price || chain.length === 0) return;
                            const target = stock.price * mult;
                            let bestIdx = 0;
                            let bestDiff = Infinity;
                            chain.forEach((s, idx) => {
                              const diff = Math.abs(s.strike - target);
                              if (diff < bestDiff) { bestDiff = diff; bestIdx = idx; }
                            });
                            setSelectedStrikeIdx(bestIdx);
                          }}
                          className={`px-1 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            label === 'ATM'
                              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                              : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                          }`}
                          data-testid={`strike-quick-${label}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable strike chain list */}
                    <div className="mt-2.5 max-h-[140px] overflow-y-auto custom-scrollbar space-y-0.5 rounded-lg border border-border/50 p-1 bg-background/50">
                      {chain.map((s, idx) => {
                        const isITMCall = s.strike <= (stock?.price || 0);
                        return (
                          <button
                            key={s.strike}
                            onClick={() => setSelectedStrikeIdx(idx)}
                            className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                              selectedStrikeIdx === idx
                                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                : isITMCall
                                  ? 'text-[#4ade80]/80 hover:bg-muted'
                                  : 'text-[#f87171]/80 hover:bg-muted'
                            }`}
                            data-testid={`strike-option-${s.strike}`}
                          >
                            <span className="font-semibold">${s.strike}</span>
                            <div className="flex gap-3 text-muted-foreground">
                              <span>C ${s.call?.mid ?? '—'}</span>
                              <span>P ${s.put?.mid ?? '—'}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contracts — Whole numbers only (1 contract = 100 shares underlying) */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Contratos</label>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        = {(contracts * 100).toLocaleString()} acciones
                      </span>
                    </div>

                    {/* Editable integer input + steppers */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setContracts(Math.max(1, contracts - 1))}
                        className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all"
                        title="Restar 1 contrato"
                        data-testid="contracts-decrement"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        step={1}
                        min={1}
                        value={contracts}
                        onChange={(e) => {
                          // Whole contracts only — no fractional (options markets don't allow it)
                          const raw = e.target.value.replace(/[^\d]/g, '');
                          const parsed = parseInt(raw, 10);
                          if (!raw) { setContracts(1); return; }
                          if (Number.isNaN(parsed) || parsed < 1) { setContracts(1); return; }
                          setContracts(Math.min(10000, parsed));
                        }}
                        onKeyDown={(e) => {
                          // Block fractional input (. , e +/-)
                          if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                        }}
                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-center text-lg text-foreground font-bold font-mono focus:outline-none focus:border-primary transition-colors"
                        data-testid="contracts-input"
                      />
                      <button
                        onClick={() => setContracts(Math.min(10000, contracts + 1))}
                        className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all"
                        title="Sumar 1 contrato"
                        data-testid="contracts-increment"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick size shortcuts */}
                    <div className="grid grid-cols-5 gap-1 mt-2.5">
                      {[1, 5, 10, 25, 100].map((n) => (
                        <button
                          key={n}
                          onClick={() => setContracts(n)}
                          className={`px-1 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            contracts === n
                              ? 'bg-primary/15 text-primary border-primary/40'
                              : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                          }`}
                          data-testid={`contracts-quick-${n}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    {/* Info: contracts are integer-only per listed options rules */}
                    <p className="text-[9px] text-muted-foreground/70 mt-2 leading-snug">
                      Solo enteros — cada contrato controla 100 acciones. El mercado de opciones listadas no admite fracciones.
                    </p>
                  </div>
                </>
              )}
            </aside>
          </div>

          {/* Advanced sections below — collapsible, full-width, reduce sidebar pressure */}
          <div className="border-t border-border bg-background">
            <div className="px-3 py-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowKelly((v) => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  showKelly
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
                data-testid="toggle-kelly"
              >
                <Calculator className="w-3.5 h-3.5" />
                Kelly Criterion Sizing
                <span className="text-[10px] opacity-60">{showKelly ? '▲ ocultar' : '▼ mostrar'}</span>
              </button>
              <button
                onClick={() => setShowGreeks((v) => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  showGreeks
                    ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-[#3b82f6]/30'
                }`}
                data-testid="toggle-greeks"
              >
                <span className="font-serif italic font-bold text-sm">Δ</span>
                Greeks Detalladas
                <span className="text-[10px] opacity-60">{showGreeks ? '▲ ocultar' : '▼ mostrar'}</span>
              </button>
            </div>

            {showKelly && (
              <div className="bg-card border-t border-border">
                <KellyPanel
                  pop={parseFloat(stats.pop) || 0}
                  maxProfit={parseFloat(stats.maxProfit) || 0}
                  maxLoss={parseFloat(stats.maxLoss) || 0}
                  capitalPerContract={contracts > 0 ? (parseFloat(stats.capitalRequired) || 0) / contracts : parseFloat(stats.capitalRequired) || 0}
                  isMaxLossUnlimited={stats.isMaxLossUnlimited}
                  accountBalance={accountBalance}
                  onBalanceChange={setAccountBalance}
                />
              </div>
            )}

            {showGreeks && (
              <div className="bg-card border-t border-border p-4 space-y-4">
                <GreeksDisplay greeks={greeks} legs={legs} stock={stock} />
                <GreeksTimeChart legs={legs} stockPrice={stock?.price} daysToExpiry={currentExp?.daysToExpiry || 30} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, title }) => (
  <div className="bg-card rounded-xl border border-border px-4 py-3 hover:border-primary/30 transition-colors" title={title}>
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">{label}</span>
    </div>
    <span className={`text-lg font-bold font-mono ${color} block truncate`}>{value}</span>
  </div>
);

// --- Comparison helpers ---
const compareNumeric = (a, b, prefer, aUnlim = false, bUnlim = false) => {
  // Returns 'A', 'B', or 'tie'
  if (aUnlim && !bUnlim) return prefer === 'higher' ? 'A' : 'B';
  if (!aUnlim && bUnlim) return prefer === 'higher' ? 'B' : 'A';
  const na = parseFloat(String(a).replace(/[^\d.\-]/g, ''));
  const nb = parseFloat(String(b).replace(/[^\d.\-]/g, ''));
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return 'tie';
  if (Math.abs(na - nb) < 0.005) return 'tie';
  if (prefer === 'higher') return na > nb ? 'A' : 'B';
  return na < nb ? 'A' : 'B';
};

const CompareCell = ({ label, a, b, winner, headers }) => {
  if (headers) {
    return (
      <div className="col-span-1 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold pt-1">
        Métrica / Valor
      </div>
    );
  }
  return (
    <div className="col-span-1 bg-muted/40 rounded-md border border-border/50 p-1.5 min-w-0">
      <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 truncate">{label}</div>
      <div className="flex flex-col gap-0.5">
        <div className={`flex items-center justify-between gap-1 ${winner === 'A' ? 'text-[#4ade80]' : 'text-muted-foreground'}`}>
          <span className="text-[9px] font-bold">A</span>
          <span className="font-mono text-[10px] truncate">{a}</span>
          {winner === 'A' && <Trophy className="w-2.5 h-2.5 flex-shrink-0" />}
        </div>
        <div className={`flex items-center justify-between gap-1 ${winner === 'B' ? 'text-[#c084fc]' : 'text-muted-foreground'}`}>
          <span className="text-[9px] font-bold">B</span>
          <span className="font-mono text-[10px] truncate">{b}</span>
          {winner === 'B' && <Trophy className="w-2.5 h-2.5 flex-shrink-0" />}
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;

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
import { TrendingUp, TrendingDown, Activity, Clock, Minus, Plus, Target, DollarSign, ArrowUpRight, ArrowDownRight, BarChart2, LayoutGrid, Loader2, BookOpen, HelpCircle, Percent, Scale, Wrench, Layers } from 'lucide-react';

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
        // Error loading initial data - silent fail
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
        // Error loading options chain - silent fail
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

  const daysForChart = useMemo(() => {
    return Math.max(0, Math.round((currentExp?.daysToExpiry || 30) * (timeSlider / 100)));
  }, [currentExp, timeSlider]);

  const payoffData = useMemo(() => {
    if (!stock || legs.length === 0) return [];
    return calculateStrategyPayoff(legs, stock.price, 0.35, daysForChart);
  }, [legs, stock, daysForChart]);

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
    if (payoffData.length === 0) return {};
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
    return {
      maxProfit: maxProfit > 5000000 ? 'Unlimited' : maxProfit.toFixed(0),
      maxLoss: maxLoss.toFixed(0),
      premium: premium.toFixed(0),
      breakEvens,
      roi: roi.toFixed(1),
      rr: rr > 100 ? '∞' : rr.toFixed(2),
      isMaxProfitUnlimited: maxProfit > 5000000,
      pop: pop.toFixed(1),
    };
  }, [payoffData, legs, breakEvens, pop]);

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden" data-testid="options-calculator-root">
      {/* Top Sub-Header (under TCP main header) */}
      <header className="h-14 min-h-[56px] bg-card border-b border-border flex items-center px-5 gap-4 z-40">
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
          <div className="flex-1 flex overflow-hidden">
            {/* Chart + Controls */}
            <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
              {/* Metrics Row - 7 metrics */}
              <div className="grid grid-cols-7 gap-2">
                <StatCard icon={TrendingUp} label="Máx. Beneficio" value={stats.isMaxProfitUnlimited ? '∞' : `$${stats.maxProfit}`} color="text-[#22c55e]" />
                <StatCard icon={TrendingDown} label="Máx. Pérdida" value={`$${stats.maxLoss}`} color="text-[#ef4444]" />
                <StatCard icon={Scale} label="Risk / Reward" value={stats.rr || '—'} color="text-[#eab308]" />
                <StatCard icon={Target} label="Break-Even" value={breakEvens.length > 0 ? `$${breakEvens[0]}` : '—'} color="text-[#a78bfa]" />
                <StatCard icon={Percent} label="Prob. Beneficio" value={`${stats.pop || 0}%`} color="text-primary" />
                <StatCard icon={DollarSign} label="Prima Neta" value={`$${stats.premium}`} color={parseFloat(stats.premium) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
                <StatCard icon={ArrowUpRight} label="ROI" value={`${stats.roi}%`} color="text-primary" />
              </div>

              {/* Legs Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {legs.map((leg, i) => (
                  <div key={`leg-${leg.type}-${leg.action}-${leg.strike}-${i}`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    leg.action === 'buy'
                      ? 'bg-[#22c55e]/8 border-[#22c55e]/25 text-[#4ade80]'
                      : 'bg-[#ef4444]/8 border-[#ef4444]/25 text-[#f87171]'
                  }`}>
                    <span className="font-bold uppercase text-[10px]">{leg.action === 'buy' ? 'BUY' : 'SELL'}</span>
                    <span>{leg.quantity}x</span>
                    {leg.type === 'stock' ? (
                      <span>{ticker}</span>
                    ) : (
                      <>
                        <span className="font-mono">${leg.strike}</span>
                        <span className="uppercase">{leg.type}</span>
                        <span className="text-muted-foreground">@ ${leg.premium?.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground ml-2">
                  {currentExp?.fullLabel} · {currentExp?.daysToExpiry}d
                </div>
              </div>

              {/* Chart */}
              <div className="flex-1 bg-card rounded-xl border border-border p-4 min-h-0">
                <PayoffChart
                  data={payoffData}
                  breakEvens={breakEvens}
                  stockPrice={stock?.price}
                  title={builderMode === 'custom' ? `Custom — ${ticker}` : `${selectedStrategy.name} — ${ticker}`}
                />
              </div>

              {/* Time Slider */}
              <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-4 py-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Tiempo al Vencimiento</span>
                <div className="flex-1 relative">
                  <input type="range" min={0} max={100} value={timeSlider} onChange={(e) => setTimeSlider(parseInt(e.target.value))} className="w-full" />
                </div>
                <span className="text-sm font-mono font-bold text-foreground min-w-[50px] text-right">{daysForChart}d</span>
                <span className="text-[10px] text-muted-foreground">/ {currentExp?.daysToExpiry}d</span>
              </div>
            </div>

            {/* Right Panel */}
            <aside className="w-[300px] min-w-[300px] bg-card border-l border-border overflow-y-auto flex flex-col">
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
                  {/* Strike Price */}
                  <div className="p-4 border-b border-border">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5 block">Precio Strike</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedStrikeIdx(Math.max(0, selectedStrikeIdx - 1))} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-center">
                        <span className="text-lg font-bold text-foreground font-mono">${selectedStrike?.strike || '—'}</span>
                      </div>
                      <button onClick={() => setSelectedStrikeIdx(Math.min(chain.length - 1, selectedStrikeIdx + 1))} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 max-h-[120px] overflow-y-auto custom-scrollbar space-y-0.5 rounded-lg">
                      {chain.map((s, idx) => (
                        <button key={s.strike} onClick={() => setSelectedStrikeIdx(idx)}
                          className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                            selectedStrikeIdx === idx ? 'bg-primary/15 text-primary'
                            : s.strike <= (stock?.price || 0) ? 'text-[#4ade80]/70 hover:bg-muted'
                            : 'text-[#f87171]/70 hover:bg-muted'
                          }`}
                        >
                          <span>${s.strike}</span>
                          <div className="flex gap-3 text-muted-foreground">
                            <span>C ${s.call.mid}</span>
                            <span>P ${s.put.mid}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contracts */}
                  <div className="p-4 border-b border-border">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-2.5 block">Contratos</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setContracts(Math.max(1, contracts - 1))} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted transition-all">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number" value={contracts} min={1}
                        onChange={(e) => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-center text-foreground font-bold font-mono focus:outline-none focus:border-primary"
                      />
                      <button onClick={() => setContracts(contracts + 1)} className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted transition-all">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Greeks - always shown */}
              <div className="p-4 border-t border-border">
                <GreeksDisplay greeks={greeks} legs={legs} stock={stock} />
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-card rounded-lg border border-border px-2.5 py-2.5 hover:border-border transition-colors">
    <div className="flex items-center gap-1 mb-0.5">
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium truncate">{label}</span>
    </div>
    <span className={`text-sm font-bold font-mono ${color} block truncate`}>{value}</span>
  </div>
);

export default CalculatorPage;

import React, { useState } from 'react';

const ShapeSVG = ({ shape, color }) => {
  const paths = {
    call_buy: 'M5,28 L18,28 L30,8',
    put_buy: 'M5,8 L17,28 L30,28',
    call_sell: 'M5,8 L18,8 L30,28',
    put_sell: 'M5,28 L17,8 L30,8',
    covered_call: 'M5,28 L18,10 L30,10',
    bull_spread: 'M5,25 L13,25 L20,10 L30,10',
    bear_spread: 'M5,10 L13,10 L20,25 L30,25',
    iron_condor: 'M3,18 L8,25 L14,8 L20,8 L26,25 L31,18',
    straddle: 'M5,8 L17,28 L30,8',
    strangle: 'M3,8 L11,25 L22,25 L30,8',
    butterfly: 'M3,20 L10,20 L17,6 L24,20 L31,20',
    iron_butterfly: 'M3,18 L10,18 L17,5 L24,18 L31,18',
    jade_lizard: 'M3,20 L10,25 L17,10 L24,10 L31,20',
    call_ratio: 'M5,22 L13,28 L20,18 L30,5',
    put_ratio: 'M5,5 L13,18 L20,28 L30,22',
    collar: 'M3,25 L12,10 L22,10 L31,18',
    synthetic_long: 'M5,28 L17,17 L30,5',
    synthetic_short: 'M5,5 L17,17 L30,28',
    long_combo: 'M5,26 L12,20 L22,14 L30,5',
    short_combo: 'M5,5 L12,14 L22,20 L30,26',
    short_straddle: 'M5,28 L17,8 L30,28',
    short_strangle: 'M3,28 L11,10 L22,10 L30,28',
    ratio_spread: 'M5,20 L13,10 L20,10 L30,25',
    ratio_spread_put: 'M5,25 L13,10 L20,10 L30,20',
    broken_wing: 'M3,18 L10,18 L17,5 L24,18 L31,22',
    reverse_ic: 'M3,18 L8,10 L14,28 L20,28 L26,10 L31,18',
    reverse_ib: 'M3,18 L10,18 L17,30 L24,18 L31,18',
    long_guts: 'M5,6 L17,30 L30,6',
    strap: 'M5,6 L14,28 L22,22 L30,5',
    strip: 'M5,5 L12,22 L20,28 L30,6',
  };
  return (
    <svg viewBox="0 0 34 34" className="w-full h-full">
      <path d={paths[shape] || paths.call_buy} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="0" y1="20" x2="34" y2="20" stroke="#2a3446" strokeWidth="0.5" strokeDasharray="2 2" />
    </svg>
  );
};

const StrategyBar = ({ strategies, categories, selected, onSelect }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const filtered = activeCategory ? strategies.filter(s => s.category === activeCategory) : strategies;

  return (
    <div className="bg-card border-b border-border px-5 py-2.5">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
            !activeCategory ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-muted-foreground'
          }`}
        >Todas ({strategies.length})</button>
        {categories.map(cat => {
          const count = strategies.filter(s => s.category === cat).length;
          const catColors = {
            Bullish: 'text-[#22c55e]', Bearish: 'text-[#ef4444]',
            Neutral: 'text-primary', Volatile: 'text-[#eab308]',
          };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                activeCategory === cat
                  ? `bg-primary/15 ${catColors[cat] || 'text-primary'}`
                  : 'text-muted-foreground hover:text-muted-foreground'
              }`}
            >{cat} ({count})</button>
          );
        })}
      </div>
      {/* Strategy Cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filtered.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => onSelect(strategy)}
            className={`flex-shrink-0 flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-lg border transition-all ${
              selected.id === strategy.id
                ? 'bg-muted border-primary/50 shadow-lg shadow-primary/10'
                : 'bg-muted border-border hover:border-border hover:bg-[#1a2238]'
            }`}
          >
            <div className="w-9 h-7 flex-shrink-0">
              <ShapeSVG shape={strategy.shape} color={selected.id === strategy.id ? '#22c55e' : strategy.color} />
            </div>
            <div className="text-left">
              <div className={`text-xs font-semibold whitespace-nowrap ${selected.id === strategy.id ? 'text-foreground' : 'text-foreground'}`}>{strategy.name}</div>
              <div className="text-[9px] text-muted-foreground whitespace-nowrap">{strategy.risk} risk · {strategy.reward} reward</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StrategyBar;

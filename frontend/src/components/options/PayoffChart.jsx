import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  // Memoize filtered payload to avoid recalculating on every render
  const relevantData = payload.filter(e => e.dataKey === 'pnl' || e.dataKey === 'pnlAtExpiry');
  
  return (
    <div className="bg-[#1a2238] border border-[#253048] rounded-lg px-4 py-3 shadow-2xl shadow-black/40">
      <p className="text-[#6b7a94] text-[10px] uppercase tracking-wider mb-1">Stock Price</p>
      <p className="text-white font-bold text-base font-mono">${Number(label).toFixed(2)}</p>
      <div className="h-px bg-[#253048] my-2" />
      {relevantData.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: entry.stroke || entry.color }} />
            <span className="text-[10px] text-[#6b7a94]">{entry.dataKey === 'pnl' ? 'Current' : 'At Expiry'}</span>
          </div>
          <span className={`text-xs font-bold font-mono ${entry.value >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {entry.value >= 0 ? '+' : ''}${Number(entry.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

const PayoffChart = ({ data, breakEvens, stockPrice, title }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      ...d,
      profitArea: d.pnlAtExpiry >= 0 ? d.pnlAtExpiry : 0,
      lossArea: d.pnlAtExpiry < 0 ? d.pnlAtExpiry : 0,
    }));
  }, [data]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return [-100, 100];
    const vals = chartData.flatMap(d => [d.pnl, d.pnlAtExpiry]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(Math.abs(max - min) * 0.15, 20);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [chartData]);

  // Performance optimization: memoize inline objects
  const chartMargin = useMemo(() => ({ top: 10, right: 30, left: 10, bottom: 5 }), []);
  const xAxisTick = useMemo(() => ({ fill: '#4a5568', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }), []);
  const yAxisTick = useMemo(() => ({ fill: '#4a5568', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }), []);
  const refLineLabel = useMemo(() => ({
    value: `$${stockPrice}`,
    position: 'top',
    fill: '#f59e0b',
    fontSize: 10,
    fontFamily: 'JetBrains Mono'
  }), [stockPrice]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#4a5568] text-sm">Select a strategy to see the payoff diagram</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-5 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded bg-[#60a5fa]"></div>
            <span className="text-[#6b7a94]">Current P&L</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded bg-white opacity-50"></div>
            <span className="text-[#6b7a94]">At Expiry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#22c55e]/20"></div>
            <span className="text-[#6b7a94]">Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#ef4444]/20"></div>
            <span className="text-[#6b7a94]">Loss</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={chartMargin}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="lossFill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="currentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2238" vertical={false} />
            <XAxis
              dataKey="price" stroke="#253048"
              tick={xAxisTick}
              tickFormatter={(v) => `$${v}`}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              stroke="#253048" domain={yDomain}
              tick={yAxisTick}
              tickFormatter={(v) => `$${v}`}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#253048" strokeWidth={1.5} />
            <ReferenceLine
              x={stockPrice} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1}
              label={refLineLabel}
            />
            {breakEvens?.map((be, i) => (
              <ReferenceLine
                key={i} x={be} stroke="#a78bfa" strokeDasharray="4 4" strokeWidth={1}
                label={{ value: `BE $${be}`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              />
            ))}
            <Area type="monotone" dataKey="profitArea" stroke="none" fill="url(#profitFill)" isAnimationActive={false} baseValue={0} />
            <Area type="monotone" dataKey="lossArea" stroke="none" fill="url(#lossFill)" isAnimationActive={false} baseValue={0} />
            <Area type="monotone" dataKey="pnlAtExpiry" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.4} fill="none" dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="pnl" stroke="#60a5fa" strokeWidth={2.5} fill="url(#currentFill)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PayoffChart;

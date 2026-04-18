import React from 'react';
import { Activity, Zap, Timer, Wind, Compass } from 'lucide-react';

const GreeksDisplay = ({ greeks, legs, stock }) => {
  const items = [
    { key: 'delta', label: 'Delta (Δ)', value: greeks.delta, icon: Activity, color: greeks.delta >= 0 ? '#22c55e' : '#ef4444', desc: 'Price sensitivity per $1 move' },
    { key: 'gamma', label: 'Gamma (Γ)', value: greeks.gamma, icon: Zap, color: '#f59e0b', desc: 'Delta change rate' },
    { key: 'theta', label: 'Theta (Θ)', value: greeks.theta, icon: Timer, color: greeks.theta >= 0 ? '#22c55e' : '#ef4444', desc: 'Daily time decay' },
    { key: 'vega', label: 'Vega (ν)', value: greeks.vega, icon: Wind, color: '#3b82f6', desc: 'IV sensitivity per 1%' },
    { key: 'rho', label: 'Rho (ρ)', value: greeks.rho, icon: Compass, color: '#a78bfa', desc: 'Interest rate sensitivity' },
  ];

  const totalCost = legs.reduce((acc, leg) => {
    if (leg.type === 'stock') return acc + (leg.quantity || 100) * stock?.price;
    return acc + leg.premium * (leg.action === 'buy' ? 1 : -1) * (leg.quantity || 1) * 100;
  }, 0);

  return (
    <div>
      <h3 className="text-[10px] text-[#4a5568] font-semibold uppercase tracking-widest mb-3">Greeks</h3>
      <div className="space-y-1.5">
        {items.map(({ key, label, value, icon: Icon, color, desc }) => (
          <div key={key} className="bg-[#151c2c] rounded-lg border border-[#1e2536] p-2.5 hover:border-[#253048] transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[11px] text-[#6b7a94] font-medium">{label}</span>
              </div>
              <span className="text-sm font-bold font-mono" style={{ color }}>
                {value >= 0 ? '+' : ''}{value.toFixed(4)}
              </span>
            </div>
            <p className="text-[9px] text-[#3a4560] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{desc}</p>
          </div>
        ))}
      </div>

      {/* Position Cost */}
      <div className="mt-4">
        <h3 className="text-[10px] text-[#4a5568] font-semibold uppercase tracking-widest mb-2">Position</h3>
        <div className="bg-[#151c2c] rounded-lg border border-[#1e2536] p-3 space-y-2">
          {legs.map((leg, i) => (
            <div key={`${leg.type}-${leg.action}-${leg.strike}-${i}`} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-[10px] ${leg.action === 'buy' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {leg.action === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-[#8b9ab8]">
                  {leg.quantity}x {leg.type === 'stock' ? `${stock?.symbol}` : `$${leg.strike} ${leg.type.toUpperCase()}`}
                </span>
              </div>
              {leg.type !== 'stock' && (
                <span className="font-mono text-[#6b7a94]">${leg.premium?.toFixed(2)}</span>
              )}
            </div>
          ))}
          <div className="border-t border-[#1e2536] pt-2 flex justify-between">
            <span className="text-[10px] text-[#4a5568]">Net Debit/Credit</span>
            <span className={`text-xs font-bold font-mono ${totalCost > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
              {totalCost > 0 ? '-' : '+'}${Math.abs(totalCost).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Market Data */}
      {legs[0] && legs[0].type !== 'stock' && (
        <div className="mt-4">
          <h3 className="text-[10px] text-[#4a5568] font-semibold uppercase tracking-widest mb-2">Market Data</h3>
          <div className="bg-[#151c2c] rounded-lg border border-[#1e2536] p-3 space-y-1.5">
            <Row label="Implied Vol" value={`${(legs[0].iv * 100).toFixed(1)}%`} />
            <Row label="Days to Exp" value={`${legs[0].daysToExpiry}d`} />
            <Row label="Risk-Free Rate" value="5.25%" />
            <Row label="Model" value="Black-Scholes" />
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between text-[11px]">
    <span className="text-[#4a5568]">{label}</span>
    <span className="font-mono text-[#8b9ab8]">{value}</span>
  </div>
);

export default GreeksDisplay;

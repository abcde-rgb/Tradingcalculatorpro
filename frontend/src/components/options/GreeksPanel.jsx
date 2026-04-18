import React from 'react';
import { Activity, Zap, Timer, Wind, Compass, Info } from 'lucide-react';

const GreekCard = ({ label, value, icon: Icon, color, description }) => (
  <div className="bg-card rounded-lg border border-border p-3 hover:border-border transition-colors group">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
    <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
    <p className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{description}</p>
  </div>
);

const GreeksPanel = ({ greeks, legs, stock }) => {
  const greekItems = [
    {
      label: 'Delta',
      value: greeks.delta >= 0 ? `+${greeks.delta.toFixed(4)}` : greeks.delta.toFixed(4),
      icon: Activity,
      color: greeks.delta >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]',
      description: 'Rate of change in option price per $1 move in underlying',
    },
    {
      label: 'Gamma',
      value: greeks.gamma.toFixed(4),
      icon: Zap,
      color: 'text-[#f0883e]',
      description: 'Rate of change in delta per $1 move in underlying',
    },
    {
      label: 'Theta',
      value: greeks.theta >= 0 ? `+${greeks.theta.toFixed(4)}` : greeks.theta.toFixed(4),
      icon: Timer,
      color: greeks.theta >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]',
      description: 'Daily time decay — value lost per day',
    },
    {
      label: 'Vega',
      value: greeks.vega >= 0 ? `+${greeks.vega.toFixed(4)}` : greeks.vega.toFixed(4),
      icon: Wind,
      color: 'text-[#58a6ff]',
      description: 'Sensitivity to 1% change in implied volatility',
    },
    {
      label: 'Rho',
      value: greeks.rho >= 0 ? `+${greeks.rho.toFixed(4)}` : greeks.rho.toFixed(4),
      icon: Compass,
      color: 'text-[#d2a8ff]',
      description: 'Sensitivity to 1% change in interest rates',
    },
  ];

  const totalCost = legs.reduce((acc, leg) => {
    if (leg.type === 'stock') return acc;
    const mult = leg.action === 'buy' ? 1 : -1;
    return acc + leg.premium * mult * (leg.quantity || 1) * 100;
  }, 0);

  return (
    <div className="p-4">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Greeks</h3>
      <div className="space-y-2">
        {greekItems.map((g) => (
          <GreekCard key={g.label} {...g} />
        ))}
      </div>

      {/* Position Summary */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Position Summary</h3>
        <div className="bg-card rounded-lg border border-border p-3 space-y-3">
          {legs.map((leg, i) => (
            <div key={`${leg.type}-${leg.action}-${leg.strike}-${i}`} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${leg.action === 'buy' ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                  {leg.action === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-foreground">
                  {leg.type === 'stock' ? `${stock?.symbol} Stock` : `$${leg.strike} ${leg.type.toUpperCase()}`}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">
                {leg.type !== 'stock' ? `$${leg.premium?.toFixed(2)}` : ''}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Cost</span>
            <span className={`text-sm font-bold font-mono ${totalCost <= 0 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
              {totalCost <= 0 ? `-$${Math.abs(totalCost).toFixed(0)}` : `+$${totalCost.toFixed(0)}`}
            </span>
          </div>
        </div>
      </div>

      {/* IV & Time Info */}
      {legs[0] && legs[0].type !== 'stock' && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Market Data</h3>
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Implied Volatility</span>
              <span className="text-foreground font-mono">{(legs[0].iv * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Days to Expiry</span>
              <span className="text-foreground font-mono">{legs[0].daysToExpiry}d</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Risk-Free Rate</span>
              <span className="text-foreground font-mono">5.00%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreeksPanel;

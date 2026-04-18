import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const OptionsChainView = ({ chain, stockPrice, expiration, expirations, selectedExpIdx, onExpChange }) => {
  if (!chain || chain.length === 0) return <div className="flex-1 flex items-center justify-center text-muted-foreground">No options data</div>;

  const atmIdx = chain.reduce((best, s, idx) =>
    Math.abs(s.strike - stockPrice) < Math.abs(chain[best].strike - stockPrice) ? idx : best, 0
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Expiration Tabs */}
      <div className="bg-card border-b border-border px-5 py-2 flex items-center gap-1.5 overflow-x-auto">
        {expirations.map((exp, idx) => (
          <button
            key={exp.date}
            onClick={() => onExpChange(idx)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
              selectedExpIdx === idx
                ? 'bg-primary/15 text-primary border border-primary/40'
                : 'text-muted-foreground hover:text-muted-foreground border border-transparent'
            }`}
          >
            {exp.fullLabel} <span className="opacity-50">({exp.daysToExpiry}d)</span>
          </button>
        ))}
      </div>

      {/* Chain Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-card">
              <th colSpan="7" className="text-center py-2 text-[#22c55e] text-xs font-semibold border-b border-border">CALLS</th>
              <th className="py-2 px-3 text-center text-foreground font-bold border-b border-border bg-muted">Strike</th>
              <th colSpan="7" className="text-center py-2 text-[#ef4444] text-xs font-semibold border-b border-border">PUTS</th>
            </tr>
            <tr className="bg-background">
              {['Bid','Ask','Last','Vol','OI','IV','Delta'].map(h => (
                <th key={`c-${h}`} className="py-1.5 px-2 text-right text-muted-foreground font-medium border-b border-border">{h}</th>
              ))}
              <th className="py-1.5 px-3 text-center text-muted-foreground font-bold border-b border-border bg-muted">$</th>
              {['Delta','IV','OI','Vol','Last','Ask','Bid'].map(h => (
                <th key={`p-${h}`} className="py-1.5 px-2 text-left text-muted-foreground font-medium border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chain.map((row, idx) => {
              const isITMCall = row.strike < stockPrice;
              const isITMPut = row.strike > stockPrice;
              const isATM = idx === atmIdx;
              return (
                <tr key={row.strike} className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${
                  isATM ? 'bg-primary/5' : ''
                }`}>
                  {/* Calls */}
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call?.bid ?? '—'}</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call?.ask ?? '—'}</td>
                  <td className={`py-1.5 px-2 text-right font-mono text-foreground ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call?.last ?? '—'}</td>
                  <td className={`py-1.5 px-2 text-right font-mono text-muted-foreground ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{(row.call?.volume ?? 0).toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-right font-mono text-muted-foreground ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{(row.call?.openInterest ?? 0).toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{((row.call?.iv ?? 0) * 100).toFixed(1)}%</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5 text-[#4ade80]' : 'text-muted-foreground'}`}>{(row.call?.delta ?? 0).toFixed(3)}</td>
                  {/* Strike */}
                  <td className={`py-1.5 px-3 text-center font-mono font-bold bg-muted border-x border-border ${
                    isATM ? 'text-primary' : isITMCall ? 'text-[#4ade80]' : 'text-[#f87171]'
                  }`}>
                    ${row.strike}
                    {isATM && <span className="text-[8px] ml-1 text-primary opacity-70">ATM</span>}
                  </td>
                  {/* Puts */}
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5 text-[#f87171]' : 'text-muted-foreground'}`}>{(row.put?.delta ?? 0).toFixed(3)}</td>
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{((row.put?.iv ?? 0) * 100).toFixed(1)}%</td>
                  <td className={`py-1.5 px-2 text-left font-mono text-muted-foreground ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{(row.put?.openInterest ?? 0).toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-left font-mono text-muted-foreground ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{(row.put?.volume ?? 0).toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-left font-mono text-foreground ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put?.last ?? '—'}</td>
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put?.ask ?? '—'}</td>
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put?.bid ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsChainView;

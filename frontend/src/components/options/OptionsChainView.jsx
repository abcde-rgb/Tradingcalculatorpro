import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const OptionsChainView = ({ chain, stockPrice, expiration, expirations, selectedExpIdx, onExpChange }) => {
  if (!chain || chain.length === 0) return <div className="flex-1 flex items-center justify-center text-[#4a5568]">No options data</div>;

  const atmIdx = chain.reduce((best, s, idx) =>
    Math.abs(s.strike - stockPrice) < Math.abs(chain[best].strike - stockPrice) ? idx : best, 0
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Expiration Tabs */}
      <div className="bg-[#0f1420] border-b border-[#1e2536] px-5 py-2 flex items-center gap-1.5 overflow-x-auto">
        {expirations.map((exp, idx) => (
          <button
            key={exp.date}
            onClick={() => onExpChange(idx)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
              selectedExpIdx === idx
                ? 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/40'
                : 'text-[#4a5568] hover:text-[#8b9ab8] border border-transparent'
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
            <tr className="bg-[#0f1420]">
              <th colSpan="7" className="text-center py-2 text-[#22c55e] text-xs font-semibold border-b border-[#1e2536]">CALLS</th>
              <th className="py-2 px-3 text-center text-white font-bold border-b border-[#1e2536] bg-[#151c2c]">Strike</th>
              <th colSpan="7" className="text-center py-2 text-[#ef4444] text-xs font-semibold border-b border-[#1e2536]">PUTS</th>
            </tr>
            <tr className="bg-[#0a0e17]">
              {['Bid','Ask','Last','Vol','OI','IV','Delta'].map(h => (
                <th key={`c-${h}`} className="py-1.5 px-2 text-right text-[#4a5568] font-medium border-b border-[#1e2536]">{h}</th>
              ))}
              <th className="py-1.5 px-3 text-center text-[#6b7a94] font-bold border-b border-[#1e2536] bg-[#151c2c]">$</th>
              {['Delta','IV','OI','Vol','Last','Ask','Bid'].map(h => (
                <th key={`p-${h}`} className="py-1.5 px-2 text-left text-[#4a5568] font-medium border-b border-[#1e2536]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chain.map((row, idx) => {
              const isITMCall = row.strike < stockPrice;
              const isITMPut = row.strike > stockPrice;
              const isATM = idx === atmIdx;
              return (
                <tr key={row.strike} className={`border-b border-[#1e2536]/50 hover:bg-[#1e2740]/40 transition-colors ${
                  isATM ? 'bg-[#3b82f6]/5' : ''
                }`}>
                  {/* Calls */}
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call.bid}</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call.ask}</td>
                  <td className={`py-1.5 px-2 text-right font-mono text-white ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call.last}</td>
                  <td className={`py-1.5 px-2 text-right font-mono text-[#4a5568] ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call.volume.toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-right font-mono text-[#4a5568] ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{row.call.openInterest.toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5' : ''}`}>{(row.call.iv * 100).toFixed(1)}%</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${isITMCall ? 'bg-[#22c55e]/5 text-[#4ade80]' : 'text-[#6b7a94]'}`}>{row.call.delta.toFixed(3)}</td>
                  {/* Strike */}
                  <td className={`py-1.5 px-3 text-center font-mono font-bold bg-[#151c2c] border-x border-[#1e2536] ${
                    isATM ? 'text-[#60a5fa]' : isITMCall ? 'text-[#4ade80]' : 'text-[#f87171]'
                  }`}>
                    ${row.strike}
                    {isATM && <span className="text-[8px] ml-1 text-[#60a5fa] opacity-70">ATM</span>}
                  </td>
                  {/* Puts */}
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5 text-[#f87171]' : 'text-[#6b7a94]'}`}>{row.put.delta.toFixed(3)}</td>
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{(row.put.iv * 100).toFixed(1)}%</td>
                  <td className={`py-1.5 px-2 text-left font-mono text-[#4a5568] ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put.openInterest.toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-left font-mono text-[#4a5568] ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put.volume.toLocaleString()}</td>
                  <td className={`py-1.5 px-2 text-left font-mono text-white ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put.last}</td>
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put.ask}</td>
                  <td className={`py-1.5 px-2 text-left font-mono ${isITMPut ? 'bg-[#ef4444]/5' : ''}`}>{row.put.bid}</td>
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

import React, { useEffect, useState } from 'react';
import { Flame, Snowflake, Minus } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Compact IV Rank badge — shows current IV vs 52w range.
 * Color-coded: green (high → sell premium), red (low → buy premium), yellow (neutral).
 */
const IVRankBadge = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API}/api/options/iv-rank/${symbol}`);
        if (res.ok) {
          const d = await res.json();
          if (!cancelled) setData(d);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.warn('IV rank fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [symbol]);

  if (!data || !data.available) return null;

  const rank = data.ivRank;
  const isHigh = rank >= 60;
  const isLow = rank <= 30;
  const Icon = isHigh ? Flame : isLow ? Snowflake : Minus;
  const palette = isHigh
    ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#4ade80]'
    : isLow
      ? 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#f87171]'
      : 'bg-[#eab308]/15 border-[#eab308]/40 text-[#fbbf24]';

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${palette}`}
      title={`${data.recommendationLabel} · ${data.recommendationReason}\nIV actual: ${(data.ivCurrent * 100).toFixed(1)}%\nRango 52w: ${(data.ivLow52w * 100).toFixed(1)}% → ${(data.ivHigh52w * 100).toFixed(1)}%\nPercentil: ${data.ivPercentile}%`}
      data-testid="iv-rank-badge"
    >
      <Icon className="w-3 h-3" />
      <span>IV Rank</span>
      <span className="font-mono text-xs">{rank.toFixed(0)}%</span>
      <span className="hidden sm:inline text-[9px] opacity-80 uppercase">· {data.recommendationLabel}</span>
    </div>
  );
};

export default IVRankBadge;

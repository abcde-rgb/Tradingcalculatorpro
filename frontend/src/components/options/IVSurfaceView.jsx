import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Info } from 'lucide-react';

const IVSurfaceView = ({ stock, chain }) => {
  const [surfaceData, setSurfaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('avg'); // 'avg', 'calls', 'puts'
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    if (!stock?.symbol) return;

    const fetchIVSurface = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${API_URL}/api/options/iv-surface/${stock.symbol}?max_expirations=8`);
        const data = await res.json();
        setSurfaceData(data);
      } catch (error) {
        // Failed to load IV surface data - silent fail
        setSurfaceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchIVSurface();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock?.symbol]);

  // Calculate min/max IV for color scaling
  const { minIV, maxIV } = useMemo(() => {
    if (!surfaceData) return { minIV: 0, maxIV: 1 };

    let min = Infinity;
    let max = -Infinity;

    surfaceData.expirations.forEach(exp => {
      exp.ivData?.forEach(item => {
        const iv = viewMode === 'calls' ? item.call_iv : 
                   viewMode === 'puts' ? item.put_iv : item.avg_iv;
        if (iv > 0) {
          min = Math.min(min, iv);
          max = Math.max(max, iv);
        }
      });
    });

    return { minIV: min, maxIV: max };
  }, [surfaceData, viewMode]);

  // Get color for IV value
  const getIVColor = (iv) => {
    if (!iv || iv === 0) return 'rgb(20, 28, 44)'; // Dark background for no data

    // Normalize IV to 0-1 range
    const normalized = (iv - minIV) / (maxIV - minIV);

    // Blue (low) → Green → Yellow → Red (high)
    if (normalized < 0.33) {
      // Blue to Green
      const t = normalized / 0.33;
      return `rgb(${Math.round(59 * t)}, ${Math.round(130 + (185 - 130) * t)}, ${Math.round(246 - (246 - 80) * t)})`;
    } else if (normalized < 0.66) {
      // Green to Yellow
      const t = (normalized - 0.33) / 0.33;
      return `rgb(${Math.round(59 + (234 - 59) * t)}, ${Math.round(185 + (179 - 185) * t)}, ${Math.round(80 - (80 - 8) * t)})`;
    } else {
      // Yellow to Red
      const t = (normalized - 0.66) / 0.34;
      return `rgb(${Math.round(234 + (239 - 234) * t)}, ${Math.round(179 - (179 - 68) * t)}, ${Math.round(8 + (68 - 8) * t)})`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7a94] text-sm">Cargando superficie de IV...</div>
      </div>
    );
  }

  if (!surfaceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7a94] text-sm">No hay datos de IV disponibles</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2536]">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#60a5fa]" />
          <div>
            <h2 className="text-base font-bold text-white">Superficie de Volatilidad Implícita</h2>
            <p className="text-xs text-[#6b7a94] mt-0.5">
              {stock.symbol} @ ${stock.price} · {surfaceData.expirations.length} vencimientos
            </p>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calls')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'calls'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#151c2c] text-[#6b7a94] hover:text-white border border-[#1e2536]'
            }`}
          >
            Calls
          </button>
          <button
            onClick={() => setViewMode('avg')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'avg'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#151c2c] text-[#6b7a94] hover:text-white border border-[#1e2536]'
            }`}
          >
            Promedio
          </button>
          <button
            onClick={() => setViewMode('puts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'puts'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#151c2c] text-[#6b7a94] hover:text-white border border-[#1e2536]'
            }`}
          >
            Puts
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-[#0d1117] border-b border-[#1e2536] flex items-center gap-4">
        <span className="text-xs text-[#6b7a94] font-medium">Volatilidad:</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-12 h-3 rounded" style={{ background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(59, 185, 80), rgb(234, 179, 8), rgb(239, 68, 68))' }} />
            <span className="text-xs text-[#8b9ab8] ml-2">
              {(minIV * 100).toFixed(1)}% → {(maxIV * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-xs text-[#6b7a94]">
          <Info className="w-3.5 h-3.5" />
          <span>Hover para ver valores exactos</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#0d1117] px-3 py-2 text-left">
                  <span className="text-xs font-bold text-[#6b7a94] uppercase tracking-wider">Strike</span>
                </th>
                {surfaceData.expirations.map((exp) => (
                  <th key={exp.date} className="px-3 py-2 text-center border-l border-[#1e2536]">
                    <div className="text-xs font-bold text-white">{exp.label}</div>
                    <div className="text-[10px] text-[#6b7a94] mt-0.5">{exp.daysToExpiry}d</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {surfaceData.strikes.map((strike) => {
                const isATM = strike === surfaceData.atm_strike;
                return (
                  <tr key={strike} className={isATM ? 'bg-[#1e2536]/30' : ''}>
                    <td className={`sticky left-0 z-10 px-3 py-2 border-t border-[#1e2536] ${
                      isATM ? 'bg-[#1e2536]' : 'bg-[#0d1117]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${isATM ? 'text-[#60a5fa] font-bold' : 'text-white'}`}>
                          ${strike}
                        </span>
                        {isATM && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#60a5fa]/20 text-[#60a5fa] font-bold">
                            ATM
                          </span>
                        )}
                      </div>
                    </td>
                    {surfaceData.expirations.map((exp) => {
                      // Find the strike data in the ivData array
                      const strikeData = exp.ivData?.find(item => item.strike === strike);
                      
                      const iv = strikeData ? (
                        viewMode === 'calls' ? strikeData.call_iv :
                        viewMode === 'puts' ? strikeData.put_iv : 
                        strikeData.avg_iv
                      ) : 0;
                      
                      const cellKey = `${strike}-${exp.date}`;
                      const isHovered = hoveredCell === cellKey;

                      return (
                        <td
                          key={exp.date}
                          className="px-3 py-2 border-t border-l border-[#1e2536] text-center relative group cursor-pointer"
                          style={{ backgroundColor: getIVColor(iv) }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <span className={`text-xs font-mono font-medium ${
                            iv > (minIV + maxIV) / 2 ? 'text-white' : 'text-[#c9d4e3]'
                          }`}>
                            {iv > 0 ? `${(iv * 100).toFixed(1)}%` : '—'}
                          </span>

                          {/* Hover Tooltip */}
                          {isHovered && strikeData && (
                            <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-[#0d1117] border border-[#253048] rounded-lg shadow-xl whitespace-nowrap">
                              <div className="text-xs font-bold text-white mb-1">
                                ${strike} · {exp.label}
                              </div>
                              <div className="space-y-0.5 text-[10px]">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-[#6b7a94]">Call IV:</span>
                                  <span className="text-[#3b82f6] font-mono">{(strikeData.call_iv * 100).toFixed(2)}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-[#6b7a94]">Put IV:</span>
                                  <span className="text-[#8b5cf6] font-mono">{(strikeData.put_iv * 100).toFixed(2)}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#1e2536]">
                                  <span className="text-[#6b7a94]">Promedio:</span>
                                  <span className="text-white font-mono font-bold">{(strikeData.avg_iv * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#253048]" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="px-6 py-3 bg-[#0d1117] border-t border-[#1e2536]">
        <div className="flex items-start gap-2 text-xs text-[#6b7a94]">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold text-white">Interpretación:</span> La volatilidad implícita (IV) refleja las expectativas del mercado 
            sobre la futura volatilidad del activo. IV alta (rojo) indica mayor incertidumbre y primas más caras. 
            IV baja (azul) sugiere mercados tranquilos y opciones más baratas. El "skew" (asimetría) muestra diferencias 
            entre strikes ITM/ATM/OTM.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IVSurfaceView;

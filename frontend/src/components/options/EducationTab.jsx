import React, { useState } from 'react';
import { EDU_MODULES, STRATEGIES } from '../../data/mockData';
import { BookOpen, ChevronRight, Zap, ArrowRight } from 'lucide-react';

const BIAS_STYLES = {
  Bullish: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'ALCISTA' },
  Bearish: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'BAJISTA' },
  Neutral: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'NEUTRAL' },
  Volatile: { color: '#eab308', bg: 'rgba(234,179,8,0.08)', label: 'VOLÁTIL' },
};

const EducationTab = ({ onSwitchToCalc }) => {
  const [expandedModule, setExpandedModule] = useState(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-[#60a5fa]" />
            <h1 className="text-2xl font-bold text-white">Academia de Opciones</h1>
          </div>
          <p className="text-[#6b7a94] text-sm max-w-2xl">
            De cero a profesional. Domina los derivados financieros con la profundidad que los brokers no te enseñan.
          </p>
        </div>

        {/* Education Modules */}
        <div className="grid gap-3 mb-10">
          {EDU_MODULES.map((mod) => (
            <div
              key={mod.title}
              className={`bg-[#0f1420] rounded-xl border transition-all overflow-hidden ${
                expandedModule === mod.title ? 'border-[#253048]' : 'border-[#1e2536] hover:border-[#253048]'
              }`}
            >
              <button
                onClick={() => setExpandedModule(expandedModule === mod.title ? null : mod.title)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <span
                  className="text-2xl w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                >
                  {mod.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                  <p className="text-xs text-[#4a5568] mt-0.5 line-clamp-1">{mod.content}</p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#4a5568] transition-transform ${
                    expandedModule === mod.title ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {expandedModule === mod.title && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-[#8b9ab8] mb-4 leading-relaxed">{mod.content}</p>
                  <div className="space-y-2">
                    {mod.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2.5 text-xs bg-[#151c2c] rounded-lg px-4 py-3 border border-[#1e2536]"
                      >
                        <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: mod.color }} />
                        <span className="text-[#c9d4e3] leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Strategy Reference Table */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-[#60a5fa]">◆</span> Referencia de Estrategias
          </h2>
          <div className="bg-[#0f1420] rounded-xl border border-[#1e2536] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#151c2c]">
                  {['Estrategia', 'Bias', 'Máx. Profit', 'Máx. Loss', 'Cuándo usar'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[#4a5568] font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((s, i) => {
                  const bs = BIAS_STYLES[s.category] || BIAS_STYLES.Neutral;
                  return (
                    <tr key={s.id} className="border-t border-[#1e2536] hover:bg-[#151c2c]/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-white">{s.name}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: bs.bg, color: bs.color }}
                        >
                          {bs.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#4ade80]">{s.maxProfit || 'Variable'}</td>
                      <td className="px-4 py-2.5 text-[#f87171]">{s.maxLoss || 'Variable'}</td>
                      <td className="px-4 py-2.5 text-[#8b9ab8]">{s.whenToUse || 'Ver descripción'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#151c2c] to-[#0f1420] rounded-xl border border-[#253048] p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">¿Listo para operar?</h3>
          <p className="text-sm text-[#6b7a94] mb-4 max-w-lg mx-auto">
            Abre el simulador y prueba cómo el paso del tiempo (Theta) o un spike de volatilidad (Vega) afectan tu posición antes de arriesgar capital real.
          </p>
          <button
            onClick={onSwitchToCalc}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3b82f6]/15 border border-[#3b82f6]/40 text-[#60a5fa] rounded-lg text-sm font-semibold hover:bg-[#3b82f6]/25 transition-colors"
          >
            ABRIR SIMULADOR <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationTab;

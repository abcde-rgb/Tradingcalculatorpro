import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { EDU_MODULES, STRATEGIES } from '../../data/mockData';
import { BookOpen, ChevronRight, Zap, ArrowRight } from 'lucide-react';

const BIAS_STYLES = {
  Bullish: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', labelKey: 'alcista_8e20d3', label: 'ALCISTA' },
  Bearish: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', labelKey: 'bajista_ab69a0', label: 'BAJISTA' },
  Neutral: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', labelKey: 'neutral_9e8b6e', label: 'NEUTRAL' },
  Volatile: { color: '#eab308', bg: 'rgba(234,179,8,0.08)', labelKey: 'volTil_9eeb74' },
};

const EducationTab = ({ onSwitchToCalc }) => {
  const { t } = useTranslation();
  const [expandedModule, setExpandedModule] = useState(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t('academiaDeOpciones_930f18')}</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            {t('deCeroAProfesional_c32b2c')}
          </p>
        </div>

        {/* Education Modules */}
        <div className="grid gap-3 mb-10">
          {EDU_MODULES.map((mod) => (
            <div
              key={mod.title}
              className={`bg-card rounded-xl border transition-all overflow-hidden ${
                expandedModule === mod.title ? 'border-border' : 'border-border hover:border-border'
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
                  <h3 className="text-sm font-bold text-foreground">{t(mod.title)}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t(mod.content)}</p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedModule === mod.title ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {expandedModule === mod.title && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{t(mod.content)}</p>
                  <div className="space-y-2">
                    {mod.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2.5 text-xs bg-muted rounded-lg px-4 py-3 border border-border"
                      >
                        <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: mod.color }} />
                        <span className="text-foreground leading-relaxed">{t(item)}</span>
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
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-primary">◆</span> {t('referenciaDeEstrategias_ed001')}
          </h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  {[t('estrategia_ed002'), t('bias_ed003'), t('maxProfit_cd2e46'), t('maxLoss_11dd51'), t('cuandoUsar_299994')].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((s, i) => {
                  const bs = BIAS_STYLES[s.category] || BIAS_STYLES.Neutral;
                  return (
                    <tr key={s.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{t(s.name)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: bs.bg, color: bs.color }}
                        >
                          {t(bs.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#4ade80]">{s.maxProfit ? t(s.maxProfit) : 'Variable'}</td>
                      <td className="px-4 py-2.5 text-[#f87171]">{s.maxLoss ? t(s.maxLoss) : 'Variable'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.whenToUse ? t(s.whenToUse) : t('verDescripcion_8d4e1f')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-muted to-card rounded-xl border border-border p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">{t('listoParaOperar_98196f')}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
            {t('simuladorDesc_ed004')}
          </p>
          <button
            onClick={onSwitchToCalc}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary/15 border border-primary/40 text-primary rounded-lg text-sm font-semibold hover:bg-primary/25 transition-colors"
          >
            {t('abrirSimulador_ed005')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationTab;

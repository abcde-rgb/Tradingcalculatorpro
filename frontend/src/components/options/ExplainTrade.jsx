import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Lightbulb } from 'lucide-react';

/**
 * Auto-generated educational explanation of the current strategy.
 * Rules-based (no LLM) — deterministic bullets based on legs topology.
 */
const ExplainTrade = ({ legs, stock, breakEvens, stats }) => {
  const { t } = useTranslation();
  if (!legs || legs.length === 0 || !stock) return null;

  const bullets = [];
  const optionLegs = legs.filter((l) => l.type !== 'stock');
  const calls = optionLegs.filter((l) => l.type === 'call');
  const puts = optionLegs.filter((l) => l.type === 'put');
  const longs = optionLegs.filter((l) => l.action === 'buy');
  const shorts = optionLegs.filter((l) => l.action === 'sell');

  // 1) Direction narrative
  const netDelta = optionLegs.reduce((s, l) => {
    const mult = l.action === 'buy' ? 1 : -1;
    const dirDelta = l.type === 'call' ? 0.5 : -0.5; // rough proxy
    return s + mult * dirDelta * (l.quantity || 1);
  }, 0);
  if (netDelta > 0.3) {
    bullets.push({
      icon: '↑',
      text: `Sesgo ALCISTA: ganas si ${stock.symbol} sube. Break-even al vencimiento ~$${breakEvens?.[0] ?? stock.price.toFixed(2)}.`,
      color: 'text-[#4ade80]',
    });
  } else if (netDelta < -0.3) {
    bullets.push({
      icon: '↓',
      text: `Sesgo BAJISTA: ganas si ${stock.symbol} cae por debajo de $${breakEvens?.[0] ?? stock.price.toFixed(2)}.`,
      color: 'text-[#f87171]',
    });
  } else {
    bullets.push({
      icon: '→',
      text: `Sesgo NEUTRAL: ganas si ${stock.symbol} se mantiene en un rango. ${breakEvens?.length > 1 ? `Break-evens $${breakEvens[0]} y $${breakEvens[breakEvens.length - 1]}.` : ''}`,
      color: 'text-[#eab308]',
    });
  }

  // 2) Theta / time decay narrative
  const longsVsShorts = longs.length - shorts.length;
  if (longsVsShorts > 0) {
    bullets.push({
      icon: '⏰',
      text: `Theta NEGATIVO: pagas prima que decae cada día. Necesitas que el movimiento ocurra PRONTO antes de que el tiempo erosione el valor.`,
      color: 'text-[#f87171]',
    });
  } else if (longsVsShorts < 0) {
    bullets.push({
      icon: '⏰',
      text: `Theta POSITIVO: cobras prima. El TIEMPO JUEGA A TU FAVOR — si el precio no se mueve, ganas decay diario.`,
      color: 'text-[#4ade80]',
    });
  } else {
    bullets.push({
      icon: '⏰',
      text: `Theta NEUTRAL: largos y cortos compensan. El movimiento del precio importa más que el tiempo.`,
      color: 'text-[#eab308]',
    });
  }

  // 3) Max Loss / Risk narrative
  if (stats?.isMaxLossUnlimited) {
    bullets.push({
      icon: '⚠',
      text: `RIESGO ILIMITADO al ${calls.some((c) => c.action === 'sell' && !calls.some((cc) => cc.action === 'buy' && cc.strike > c.strike)) ? 'alza' : 'baja'}. Requiere margen alto y stop-loss disciplinado.`,
      color: 'text-[#ef4444]',
    });
  } else if (stats?.maxLoss) {
    const ml = parseFloat(stats.maxLoss);
    bullets.push({
      icon: '🛡',
      text: `Pérdida MÁXIMA definida: $${Math.abs(ml).toFixed(0)}. No puedes perder más de esa cantidad pase lo que pase.`,
      color: 'text-[#a78bfa]',
    });
  }

  // 4) Assignment risk (short options)
  if (shorts.length > 0) {
    const shortPut = puts.find((p) => p.action === 'sell');
    const shortCall = calls.find((c) => c.action === 'sell');
    if (shortPut) {
      bullets.push({
        icon: '📋',
        text: `Si ${stock.symbol} cae por debajo de $${shortPut.strike} y mantienes, te asignarán 100 acciones/contrato al precio del strike.`,
        color: 'text-muted-foreground',
      });
    } else if (shortCall) {
      bullets.push({
        icon: '📋',
        text: `Si ${stock.symbol} sube por encima de $${shortCall.strike} y mantienes, entregarás 100 acciones/contrato (si short call cubierta) o cubrirás con pérdida (si naked).`,
        color: 'text-muted-foreground',
      });
    }
  }

  // 5) IV context
  const avgIV = optionLegs.length ? optionLegs.reduce((s, l) => s + (l.iv || 0.3), 0) / optionLegs.length : 0;
  if (longsVsShorts > 0 && avgIV > 0.5) {
    bullets.push({
      icon: '⌬',
      text: `IV ELEVADA (${(avgIV * 100).toFixed(0)}%): pagas primas caras. Un crush post-earnings puede generar pérdida aunque aciertes la dirección.`,
      color: 'text-[#f87171]',
    });
  } else if (longsVsShorts < 0 && avgIV > 0.5) {
    bullets.push({
      icon: '⌬',
      text: `IV ELEVADA (${(avgIV * 100).toFixed(0)}%): cobras primas gordas. Setup favorable para vendedores de volatilidad.`,
      color: 'text-[#4ade80]',
    });
  }

  return (
    <div className="bg-card/60 border border-border/60 rounded-xl p-3.5" data-testid="explain-trade">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb className="w-3.5 h-3.5 text-[#fbbf24]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">{t('entiendeEstaOperacion_11df0f')}</span>
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={`${b.icon}-${i}`} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className={`${b.color} font-bold flex-shrink-0 w-4`}>{b.icon}</span>
            <span className="text-foreground/85">{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExplainTrade;

import React from 'react';
import { Calculator, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import GreeksDisplay from './GreeksDisplay';
import GreeksTimeChart from './GreeksTimeChart';
import KellyPanel from './KellyPanel';
import SavedPositionsPanel from './SavedPositionsPanel';
import PortfolioGreeks from './PortfolioGreeks';

const ToggleButton = ({ active, onClick, icon, label, accent, testid }) => {
  const { t } = useTranslation();
  const accentClasses = {
    primary: 'bg-primary/10 border-primary/40 text-primary',
    blue: 'bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]',
    purple: 'bg-[#a855f7]/10 border-[#a855f7]/40 text-[#c084fc]',
  };
  const accentHover = {
    primary: 'hover:border-primary/30',
    blue: 'hover:border-[#3b82f6]/30',
    purple: 'hover:border-[#a855f7]/30',
  };
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? accentClasses[accent]
          : `bg-card border-border text-muted-foreground hover:text-foreground ${accentHover[accent]}`
      }`}
    >
      {icon}
      {label}
      <span className="text-[10px] opacity-60">
        {active ? `▲ ${t('ocultar_91e0e3')}` : `▼ ${t('mostrar_91e0e2')}`}
      </span>
    </button>
  );
};

const AdvancedToggles = ({
  // toggles
  showKelly, onToggleKelly,
  showGreeks, onToggleGreeks,
  showPortfolio, onTogglePortfolio,
  // shared data
  greeks, legs, stock, currentExp, ticker,
  // kelly
  stats, contracts, accountBalance, onAccountBalanceChange,
  // portfolio
  onLoadPosition,
}) => {
  const { t } = useTranslation();
  const capPerContract = contracts > 0
    ? (parseFloat(stats.capitalRequired) || 0) / contracts
    : (parseFloat(stats.capitalRequired) || 0);

  return (
    <>
      <div className="px-3 py-3 flex items-center gap-2 flex-wrap">
        <ToggleButton
          active={showKelly}
          onClick={onToggleKelly}
          icon={<Calculator className="w-3.5 h-3.5" />}
          label="Kelly Criterion Sizing"
          accent="primary"
          testid="toggle-kelly"
        />
        <ToggleButton
          active={showGreeks}
          onClick={onToggleGreeks}
          icon={<span className="font-serif italic font-bold text-sm">Δ</span>}
          label={t('greeksDetalladas_91e0e4')}
          accent="blue"
          testid="toggle-greeks"
        />
        <ToggleButton
          active={showPortfolio}
          onClick={onTogglePortfolio}
          icon={<Layers className="w-3.5 h-3.5" />}
          label={t('miPortfolio_91e0e5')}
          accent="purple"
          testid="toggle-portfolio"
        />
      </div>

      {showPortfolio && (
        <div className="bg-card border-t border-border p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SavedPositionsPanel
            currentLegs={legs}
            currentSymbol={ticker}
            currentExpiration={currentExp?.fullLabel || currentExp?.date}
            onLoadPosition={onLoadPosition}
          />
          <PortfolioGreeks />
        </div>
      )}

      {showKelly && (
        <div className="bg-card border-t border-border">
          <KellyPanel
            pop={parseFloat(stats.pop) || 0}
            maxProfit={parseFloat(stats.maxProfit) || 0}
            maxLoss={parseFloat(stats.maxLoss) || 0}
            capitalPerContract={capPerContract}
            isMaxLossUnlimited={stats.isMaxLossUnlimited}
            accountBalance={accountBalance}
            onBalanceChange={onAccountBalanceChange}
          />
        </div>
      )}

      {showGreeks && (
        <div className="bg-card border-t border-border p-4 space-y-4">
          <GreeksDisplay greeks={greeks} legs={legs} stock={stock} />
          <GreeksTimeChart
            legs={legs}
            stockPrice={stock?.price}
            daysToExpiry={currentExp?.daysToExpiry || 30}
          />
        </div>
      )}
    </>
  );
};

export default AdvancedToggles;

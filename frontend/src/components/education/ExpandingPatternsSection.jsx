import React from 'react';
import { TrendingUp, TrendingDown, Repeat, ChevronRight, Target, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

/**
 * "Broadening" / Expanding patterns section.
 *
 * Each pattern uses an externally-hosted educational diagram (PNG uploaded
 * by the user) plus a structured trade plan: 2 entries, stop loss, 2 targets.
 * Bias categorisation drives the colour scheme of each card.
 */
const PATTERNS = [
  {
    id: 'asc-wedge',
    image: 'https://customer-assets.emergentagent.com/job_unified-site-1/artifacts/z7egei96_CU%C3%91A%20DE%20EXPANSION%20ASCENDENTE.png',
    nameKey: 'expandingPatternsAscWedgeName',
    descKey: 'expandingPatternsAscWedgeDesc',
    biasKey: 'reversalPatterns',
    direction: 'bearish',
  },
  {
    id: 'bull-cont',
    image: 'https://customer-assets.emergentagent.com/job_unified-site-1/artifacts/ozc52r6l_TRIANGULO%20SIMETRICO%20EXPANISVO%20ALCISTA%28CONTINUACCION%20ALCISTA%29.png',
    nameKey: 'expandingPatternsBullContName',
    descKey: 'expandingPatternsBullContDesc',
    biasKey: 'continuationPatterns',
    direction: 'bullish',
  },
  {
    id: 'bear-rev',
    image: 'https://customer-assets.emergentagent.com/job_unified-site-1/artifacts/ce7dvho5_TRIANGULO%20SIMETRICO%20EXPANSIVO%20BAJISTA%28CAMBIO%20ALCISTA%29.png',
    nameKey: 'expandingPatternsBearRevName',
    descKey: 'expandingPatternsBearRevDesc',
    biasKey: 'reversalPatterns',
    direction: 'bullish',
  },
  {
    id: 'bear-cont',
    image: 'https://customer-assets.emergentagent.com/job_unified-site-1/artifacts/jix471rb_TRIANGULO%20SIMETRICO%20EXPANSIVO%20BAJISTA%28CONTINUACION%20BAJISTA%29.png',
    nameKey: 'expandingPatternsBearContName',
    descKey: 'expandingPatternsBearContDesc',
    biasKey: 'continuationPatterns',
    direction: 'bearish',
  },
  {
    id: 'bear-rev-down',
    image: 'https://customer-assets.emergentagent.com/job_unified-site-1/artifacts/a7rj6hlx_TRIANGULO%20SIMETRICO%20EXPANSIVO%20BAJISTA%28CAMBIO%20BAJISTA%29.png',
    nameKey: 'expandingPatternsBearRevDownName',
    descKey: 'expandingPatternsBearRevDownDesc',
    biasKey: 'reversalPatterns',
    direction: 'bearish',
  },
];

const directionColor = {
  bullish: { text: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/30', Icon: TrendingUp },
  bearish: { text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30', Icon: TrendingDown },
};

const PatternCardExpanding = ({ pattern }) => {
  const { t } = useTranslation();
  const dir = directionColor[pattern.direction];
  const DirIcon = dir.Icon;

  return (
    <Card
      className={`bg-card/50 border ${dir.border} hover:border-primary/40 transition-colors overflow-hidden`}
      data-testid={`expanding-pattern-${pattern.id}`}
    >
      <div className="relative bg-white p-2">
        {/* Educational diagram (uploaded by user) */}
        <img
          src={pattern.image}
          alt={t(pattern.nameKey)}
          className="w-full h-44 object-contain"
          loading="lazy"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-bold leading-snug">{t(pattern.nameKey)}</CardTitle>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${dir.bg} ${dir.text} flex-shrink-0`}>
            <DirIcon className="w-3 h-3" />
            <span>{t(pattern.biasKey)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {t(pattern.descKey)}
        </p>

        {/* Trade plan checklist */}
        <div className="rounded-md bg-background/60 border border-border/50 px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <ChevronRight className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
              {t('expandingPatternsTradePlan')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px]">E1</span>
              <span className="text-muted-foreground">{t('breakout')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px]">E2</span>
              <span className="text-muted-foreground">Retest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#ef4444]" />
              <span className="text-muted-foreground">{t('stopLoss')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-[#22c55e]" />
              <span className="text-muted-foreground">T1 / T2</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ExpandingPatternsSection = () => {
  const { t } = useTranslation();

  return (
    <Card
      className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/30"
      data-testid="expanding-patterns-section"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-unbounded text-lg">
          <Repeat className="w-5 h-5 text-purple-500" />
          {t('expandingPatternsTitle')}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {t('expandingPatternsIntro')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PATTERNS.map((p) => (
            <PatternCardExpanding key={p.id} pattern={p} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpandingPatternsSection;

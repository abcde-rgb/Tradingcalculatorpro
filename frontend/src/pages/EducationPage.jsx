import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, TrendingUp, TrendingDown, Target, Shield, AlertTriangle, 
  ChevronRight, ChevronDown, Search, Filter, Star, Info,
  CandlestickChart, BarChart3, Scale, Brain, Lightbulb, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { getTradingRules, getRiskManagementConcepts, getChartPatterns, getCandlestickPatterns, getDowTheory, getTradingPsychology, getCapitalManagement, getTradingStrategies, getProbabilityStatistics } from '@/lib/tradingEducationContent';
import { useIsPremium } from '@/lib/premium';
import { useAuthStore } from '@/lib/store';
import { Link } from 'react-router-dom';
import ExpectancyMatrix from '@/components/education/ExpectancyMatrix';
import ExpectancyCalculator from '@/components/education/ExpectancyCalculator';
import CandleAnatomy from '@/components/education/CandleAnatomy';
import CandlePatternFigure from '@/components/education/CandlePatternFigure';
import LivePatternDetector from '@/components/education/LivePatternDetector';
import LeverageGuide from '@/components/education/LeverageGuide';
import TradingPillarsGuide from '@/components/education/TradingPillarsGuide';

const priorityColors = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
};

const patternTypeColors = {
  bullish: 'text-green-500',
  bearish: 'text-red-500',
  neutral: 'text-yellow-500'
};

// Motion variants extracted to module level to avoid inline-object re-renders
const MOTION_FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const MOTION_EXPAND = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};
const MOTION_FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const MOTION_SCALE_IN = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

function RuleCard({ rule, isExpanded, onToggle }) {
  const { t } = useTranslation();
  
  return (
    <motion.div
      layout
      {...MOTION_FADE_UP}
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-primary/50 ${
        isExpanded ? 'bg-primary/5 border-primary' : 'bg-card border-border'
      }`}
      onClick={onToggle}
      data-testid={`rule-${rule.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-primary">#{rule.id}</span>
            <Badge variant="outline" className={priorityColors[rule.priority]}>
              {t(rule.priority)}
            </Badge>
            <Badge variant="secondary">{t(rule.category)}</Badge>
          </div>
          <h3 className="font-semibold">{rule.rule}</h3>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            {...MOTION_EXPAND}
            className="mt-4 pt-4 border-t border-border"
          >
            <p className="text-muted-foreground text-sm leading-relaxed">
              {rule.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PatternCard({ pattern, onClick }) {
  const { t } = useTranslation();
  
  const getPatternTypeLabel = (type) => {
    if (type === 'bullish') return `↑ ${t('bullish')}`;
    if (type === 'bearish') return `↓ ${t('bearish')}`;
    return `↔ ${t('neutral')}`;
  };
  
  return (
    <Card 
      className="bg-card border-border hover:border-primary/50 cursor-pointer transition-all"
      onClick={() => onClick(pattern)}
      data-testid={`pattern-${pattern.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">{pattern.name}</h3>
            {pattern.type && (
              <span className={`text-xs font-medium ${patternTypeColors[pattern.type]}`}>
                {getPatternTypeLabel(pattern.type)}
              </span>
            )}
          </div>
          {/* Mini SVG illustration drawn from OHLC blueprints (24x80 px per candle) */}
          <CandlePatternFigure patternId={pattern.id} className="flex-shrink-0" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{pattern.description}</p>
        {pattern.reliability && (
          <div className="mt-3 flex items-center gap-2">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-muted-foreground">{t('reliability')}: {pattern.reliability}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PatternDetailModal({ pattern, onClose }) {
  const { t } = useTranslation();
  const [imageZoom, setImageZoom] = useState(false);
  
  if (!pattern) return null;
  
  const getPatternTypeLabel = (type) => {
    if (type === 'bullish') return t('bullishPattern');
    if (type === 'bearish') return t('bearishPattern');
    if (type === 'continuation') return t('continuationPattern');
    if (type === 'reversal') return t('reversalPattern');
    return t('neutralPattern');
  };
  
  return (
    <motion.div
      {...MOTION_FADE}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        {...MOTION_SCALE_IN}
        className="bg-card border border-border rounded-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="pattern-detail-modal"
      >
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between mb-5 sticky top-0 bg-card/95 backdrop-blur-sm pb-3 -mt-2 -mx-2 px-2 z-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">{pattern.name}</h2>
              {pattern.type && (
                <span className={`text-sm font-medium ${patternTypeColors[pattern.type]}`}>
                  {getPatternTypeLabel(pattern.type)}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="pattern-modal-close">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* LEFT column: image (large) */}
            {pattern.image ? (
              <div className="lg:sticky lg:top-20 self-start">
                <button
                  type="button"
                  onClick={() => setImageZoom(true)}
                  className="w-full rounded-lg overflow-hidden border border-border bg-white cursor-zoom-in hover:border-primary/50 transition-colors group relative"
                  data-testid="pattern-image-zoom-trigger"
                  aria-label="Click to zoom"
                >
                  <img 
                    src={pattern.image} 
                    alt={pattern.name}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    🔍 Zoom
                  </span>
                </button>
              </div>
            ) : null}

            {/* RIGHT column: textual content */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> {t('description')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{pattern.description}</p>
              </div>
              
              {pattern.howToTrade && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> {t('howToTrade')}
                  </h3>
                  <ol className="space-y-2.5">
                    {pattern.howToTrade.map((step, idx) => (
                      <li key={`${pattern.id}-step-${idx}`} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              {pattern.reliability && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('reliability')}</p>
                    <p className="font-semibold">{pattern.reliability}</p>
                  </div>
                  {pattern.timeframes && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('bestTimeframes')}</p>
                      <div className="flex gap-1">
                        {pattern.timeframes.map(tf => (
                          <Badge key={tf} variant="secondary" className="text-xs">{tf}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            
              {pattern.signal && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">{t('signal')}</p>
                  <p className="font-semibold text-primary">{pattern.signal}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image zoom lightbox */}
      {imageZoom && pattern.image && (
        <motion.div
          {...MOTION_FADE}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setImageZoom(false); }}
          data-testid="pattern-image-lightbox"
        >
          <Button
            variant="ghost" size="icon"
            onClick={(e) => { e.stopPropagation(); setImageZoom(false); }}
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={pattern.image}
            alt={pattern.name}
            className="max-w-[95vw] max-h-[92vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function EducationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRules, setExpandedRules] = useState(new Set([1, 2, 3]));
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [patternQuery, setPatternQuery] = useState('');
  const [patternTypeFilter, setPatternTypeFilter] = useState('all');
  const { t } = useTranslation();
  
  const isPremium = useIsPremium();
  const { isAuthenticated } = useAuthStore();
  
  // ✅ Get ALL translated content dynamically based on current language
  const TRADING_RULES = getTradingRules(t);
  const RISK_MANAGEMENT_CONCEPTS = getRiskManagementConcepts(t);
  const CHART_PATTERNS = getChartPatterns(t);
  const CANDLESTICK_PATTERNS = getCandlestickPatterns(t);
  const DOW_THEORY = getDowTheory(t);
  const TRADING_PSYCHOLOGY = getTradingPsychology(t);
  const CAPITAL_MANAGEMENT = getCapitalManagement(t);
  const TRADING_STRATEGIES = getTradingStrategies(t);
  const PROBABILITY_STATS = getProbabilityStatistics(t);

  // Premium Gate - Block non-authenticated OR non-premium users
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <BookOpen className="h-24 w-24 text-primary mx-auto relative" />
            </div>
            
            <h1 className="text-4xl font-bold">{t('educationGateTitle')}</h1>
            <p className="text-xl text-muted-foreground">
              {t('educationGateDescription')}
            </p>
            
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">{t('optionsGateIncludedTitle')}</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <li className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{t('eduFeatureRules')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>{t('eduFeatureRisk')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CandlestickChart className="h-5 w-5 text-primary" />
                  <span>{t('eduFeatureCandles')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>{t('eduFeatureDow')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>{t('eduFeaturePsychology')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>{t('eduFeatureStats')}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      {t('viewPremiumPlans')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/pricing">
                    <Button size="lg" className="w-full sm:w-auto">
                      {t('viewPremiumPlans')}
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      {t('backHome')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredRules = TRADING_RULES.filter(rule => {
    const matchesSearch = rule.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(TRADING_RULES.map(r => r.category))];

  const toggleRule = (id) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRules(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary">{t('educationCenter')}</span>
            </div>
            <h1 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">
              {t('educationCenter')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('tradingRules')}, {t('chartPatterns')}, {t('candlestickPatterns')} y {t('riskManagement')}.
            </p>
          </div>

          <Tabs defaultValue="rules" className="space-y-8">
            <TabsList className="bg-card border border-border p-1 h-auto flex-wrap justify-center gap-1">
              <TabsTrigger value="rules" className="gap-2" data-testid="tab-rules">
                <Brain className="w-4 h-4" /> {t('tradingRules')}
              </TabsTrigger>
              <TabsTrigger value="dow-theory" className="gap-2" data-testid="tab-dow-theory">
                <Lightbulb className="w-4 h-4" /> {t('dowTheoryTitle')}
              </TabsTrigger>
              <TabsTrigger value="psychology" className="gap-2" data-testid="tab-psychology">
                <Brain className="w-4 h-4" /> {t('tradingPsychologyTitle')}
              </TabsTrigger>
              <TabsTrigger value="capital" className="gap-2" data-testid="tab-capital">
                <Shield className="w-4 h-4" /> {t('capitalManagementTitle')}
              </TabsTrigger>
              <TabsTrigger value="strategies" className="gap-2" data-testid="tab-strategies">
                <Target className="w-4 h-4" /> {t('tradingStrategiesTitle')}
              </TabsTrigger>
              <TabsTrigger value="probability" className="gap-2" data-testid="tab-probability">
                <TrendingUp className="w-4 h-4" /> {t('probabilityStatsTitle')}
              </TabsTrigger>
              <TabsTrigger value="chart-patterns" className="gap-2" data-testid="tab-chart-patterns">
                <BarChart3 className="w-4 h-4" /> {t('chartPatterns')}
              </TabsTrigger>
              <TabsTrigger value="candlesticks" className="gap-2" data-testid="tab-candlesticks">
                <CandlestickChart className="w-4 h-4" /> {t('candlestickPatterns')}
              </TabsTrigger>
              <TabsTrigger value="risk" className="gap-2" data-testid="tab-risk">
                <Scale className="w-4 h-4" /> {t('riskManagement')}
              </TabsTrigger>
            </TabsList>

            {/* Trading Rules */}
            <TabsContent value="rules" className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchRules')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-rules"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'all' ? t('all') : cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Rules List */}
              <div className="grid gap-4">
                {filteredRules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isExpanded={expandedRules.has(rule.id)}
                    onToggle={() => toggleRule(rule.id)}
                  />
                ))}
              </div>
              
              {filteredRules.length === 0 && (
                <div className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('noRulesFound')}</p>
                </div>
              )}
            </TabsContent>

            {/* Dow Theory */}
            <TabsContent value="dow-theory" className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-unbounded text-2xl">
                    <Lightbulb className="w-6 h-6 text-primary" />
                    {DOW_THEORY.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {DOW_THEORY.intro}
                  </p>
                </CardContent>
              </Card>

              {/* Principles */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t('principles')}
                </h2>
                <div className="grid gap-4">
                  {DOW_THEORY.principles.map(principle => (
                    <Card key={principle.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {principle.id}
                          </div>
                          <span className="text-base">{principle.title}</span>
                          <Badge variant="outline" className={priorityColors[principle.importance]}>
                            {t(principle.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {principle.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Application */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-green-500" />
                    {DOW_THEORY.application.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DOW_THEORY.application.description}
                  </p>
                </CardContent>
              </Card>

              {/* Limitations */}
              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    {DOW_THEORY.limitations.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {DOW_THEORY.limitations.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trading Psychology */}
            <TabsContent value="psychology" className="space-y-6">
              {/* The 3 pillars of trading: 50/30/20 mental model */}
              <TradingPillarsGuide />

              <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/10 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-unbounded text-2xl">
                    <Brain className="w-6 h-6 text-blue-500" />
                    {TRADING_PSYCHOLOGY.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {TRADING_PSYCHOLOGY.intro}
                  </p>
                </CardContent>
              </Card>

              {/* Cognitive Biases */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  {TRADING_PSYCHOLOGY.cognitiveBiases.title}
                </h2>
                <div className="grid gap-4">
                  {TRADING_PSYCHOLOGY.cognitiveBiases.biases.map(bias => (
                    <Card key={bias.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{bias.title}</span>
                          <Badge variant="outline" className={priorityColors[bias.severity]}>
                            {t(bias.severity)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {bias.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Emotional Control */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  {TRADING_PSYCHOLOGY.emotionalControl.title}
                </h2>
                <div className="grid gap-4">
                  {TRADING_PSYCHOLOGY.emotionalControl.techniques.map(technique => (
                    <Card key={technique.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{technique.title}</span>
                          <Badge variant="outline" className={priorityColors[technique.importance]}>
                            {t(technique.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {technique.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Capital Management */}
            <TabsContent value="capital" className="space-y-6">
              <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/10 border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-unbounded text-2xl">
                    <Shield className="w-6 h-6 text-green-500" />
                    {CAPITAL_MANAGEMENT.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {CAPITAL_MANAGEMENT.intro}
                  </p>
                </CardContent>
              </Card>

              {/* Capital Rules */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {CAPITAL_MANAGEMENT.capitalRules.title}
                </h2>
                <div className="grid gap-4">
                  {CAPITAL_MANAGEMENT.capitalRules.rules.map(rule => (
                    <Card key={rule.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{rule.title}</span>
                          <Badge variant="outline" className={priorityColors[rule.importance]}>
                            {t(rule.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {rule.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Risk/Reward Ratios */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  {CAPITAL_MANAGEMENT.riskReward.title}
                </h2>
                <div className="grid gap-4">
                  {CAPITAL_MANAGEMENT.riskReward.concepts.map(concept => (
                    <Card key={concept.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Trading Strategies */}
            <TabsContent value="strategies" className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-unbounded text-2xl">
                    <Target className="w-6 h-6 text-purple-500" />
                    {TRADING_STRATEGIES.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {TRADING_STRATEGIES.intro}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                {TRADING_STRATEGIES.strategies.map((strategy, index) => (
                  <Card key={strategy.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg">{strategy.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{strategy.timeframe}</Badge>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                            {strategy.winRate}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          {t('setupLabel')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {strategy.setup}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-green-500" />
                          {t('entryLabel')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {strategy.entry}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-red-500" />
                          {t('exitLabel')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {strategy.exit}
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                          <Lightbulb className="w-4 h-4" />
                          {t('tipsLabel')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {strategy.tips}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Probability & Statistics */}
            <TabsContent value="probability" className="space-y-6">
              <Card className="bg-gradient-to-br from-orange-500/5 to-yellow-500/10 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-unbounded text-2xl">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                    {PROBABILITY_STATS.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {PROBABILITY_STATS.intro}
                  </p>
                </CardContent>
              </Card>

              {/* Mathematical Expectation */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  {PROBABILITY_STATS.sections.mathematicalExpectation.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.mathematicalExpectation.concepts.map(concept => (
                    <Card key={concept.id} className="bg-green-500/10 border-green-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Expectancy Matrix — interactive table derived from EV = (%A × R) − (%F × 1) */}
              <ExpectancyCalculator />
              <ExpectancyMatrix />

              {/* Law of Large Numbers */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  {PROBABILITY_STATS.sections.lawOfLargeNumbers.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.lawOfLargeNumbers.concepts.map(concept => (
                    <Card key={concept.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Results Distribution */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  {PROBABILITY_STATS.sections.resultsDistribution.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.resultsDistribution.concepts.map(concept => (
                    <Card key={concept.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Streaks Management */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  {PROBABILITY_STATS.sections.streaksManagement.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.streaksManagement.concepts.map(concept => (
                    <Card key={concept.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Variance & Std Dev */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-500" />
                  {PROBABILITY_STATS.sections.varianceStdDev.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.varianceStdDev.concepts.map(concept => (
                    <Card key={concept.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Correlation */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  {PROBABILITY_STATS.sections.correlation.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.correlation.concepts.map(concept => (
                    <Card key={concept.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {PROBABILITY_STATS.sections.keyMetrics.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.keyMetrics.metrics.map(metric => (
                    <Card key={metric.id} className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <span>{metric.title}</span>
                          <Badge variant="outline" className={priorityColors[metric.importance]}>
                            {t(metric.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {metric.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Backtesting Statistics */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  {PROBABILITY_STATS.sections.backtestingStats.title}
                </h2>
                <div className="grid gap-4">
                  {PROBABILITY_STATS.sections.backtestingStats.concepts.map(concept => (
                    <Card key={concept.id} className="bg-yellow-500/10 border-yellow-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-base">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span>{concept.title}</span>
                          <Badge variant="outline" className={priorityColors[concept.importance]}>
                            {t(concept.importance)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Chart Patterns */}
            <TabsContent value="chart-patterns" className="space-y-8">
              {/* Quick search + type filter */}
              {(() => {
                const q = patternQuery.trim().toLowerCase();
                const filterFn = (p) => {
                  if (patternTypeFilter !== 'all' && p.type !== patternTypeFilter) return false;
                  if (!q) return true;
                  return (
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q)
                  );
                };
                const reversal = CHART_PATTERNS.reversal.filter(filterFn);
                const continuation = CHART_PATTERNS.continuation.filter(filterFn);
                const totalShown = reversal.length + continuation.length;
                const totalAll = CHART_PATTERNS.reversal.length + CHART_PATTERNS.continuation.length;
                return (
                  <div className="bg-card border border-border rounded-lg p-4 space-y-3" data-testid="patterns-search-bar">
                    {/* Search input */}
                    <div className="relative flex items-center bg-muted border border-border rounded-md px-3 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                      <Search className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                      <input
                        type="text"
                        value={patternQuery}
                        onChange={(e) => setPatternQuery(e.target.value)}
                        placeholder={t('patternsSearchPlaceholder')}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                        autoComplete="off"
                        spellCheck={false}
                        data-testid="patterns-search-input"
                      />
                      {patternQuery && (
                        <button
                          type="button"
                          onClick={() => setPatternQuery('')}
                          className="p-0.5 rounded hover:bg-border transition-colors"
                          aria-label="Clear"
                          data-testid="patterns-search-clear"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    {/* Type filter chips */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                      {[
                        { id: 'all',     label: t('patternFilterAll'),     color: 'text-foreground' },
                        { id: 'bullish', label: t('patternFilterBullish'), color: 'text-[#22c55e]', icon: TrendingUp },
                        { id: 'bearish', label: t('patternFilterBearish'), color: 'text-[#ef4444]', icon: TrendingDown },
                        { id: 'neutral', label: t('patternFilterNeutral'), color: 'text-[#eab308]' },
                      ].map((opt) => {
                        const Ic = opt.icon;
                        const active = patternTypeFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPatternTypeFilter(opt.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                              active
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                            }`}
                            data-testid={`patterns-filter-${opt.id}`}
                          >
                            {Ic && <Ic className={`w-3 h-3 ${active ? 'text-primary' : opt.color}`} />}
                            {opt.label}
                          </button>
                        );
                      })}
                      <span className="ml-auto text-[11px] text-muted-foreground" data-testid="patterns-results-count">
                        {totalShown} / {totalAll} {totalShown === 1 ? t('patternsResultSingular') : t('patternsResultPlural')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Filtered patterns */}
              {(() => {
                const q = patternQuery.trim().toLowerCase();
                const filterFn = (p) => {
                  if (patternTypeFilter !== 'all' && p.type !== patternTypeFilter) return false;
                  if (!q) return true;
                  return (
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q)
                  );
                };
                const reversal = CHART_PATTERNS.reversal.filter(filterFn);
                const continuation = CHART_PATTERNS.continuation.filter(filterFn);
                if (reversal.length === 0 && continuation.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground" data-testid="patterns-empty">
                      <p className="text-sm">
                        {t('patternsNoResults')} {patternQuery && <>"<span className="text-foreground font-bold">{patternQuery}</span>"</>}
                      </p>
                    </div>
                  );
                }
                return (
                  <>
                    {/* Reversal Patterns */}
                    {reversal.length > 0 && (
                      <div>
                        <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-red-500" />
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          {t('reversalPatterns')}
                          <span className="text-xs text-muted-foreground font-normal ml-1">({reversal.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {reversal.map(pattern => (
                            <PatternCard
                              key={pattern.id}
                              pattern={pattern}
                              onClick={setSelectedPattern}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Continuation Patterns */}
                    {continuation.length > 0 && (
                      <div>
                        <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                          <ChevronRight className="w-5 h-5 text-blue-500" />
                          {t('continuationPatterns')}
                          <span className="text-xs text-muted-foreground font-normal ml-1">({continuation.length})</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {continuation.map(pattern => (
                            <PatternCard
                              key={pattern.id}
                              pattern={pattern}
                              onClick={setSelectedPattern}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* Candlestick Patterns */}
            <TabsContent value="candlesticks" className="space-y-8">
              {/* Anatomy primer with SVG candles */}
              <CandleAnatomy />

              {/* Live pattern detector — scans real Yahoo Finance OHLC */}
              <LivePatternDetector />

              {/* Bullish */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  {t('bullishPatterns')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CANDLESTICK_PATTERNS.bullish.map(pattern => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      onClick={setSelectedPattern}
                    />
                  ))}
                </div>
              </div>

              {/* Bearish */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  {t('bearishPatterns')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CANDLESTICK_PATTERNS.bearish.map(pattern => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      onClick={setSelectedPattern}
                    />
                  ))}
                </div>
              </div>

              {/* Neutral */}
              <div>
                <h2 className="font-unbounded text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  {t('indecisionPatterns')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CANDLESTICK_PATTERNS.neutral.map(pattern => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      onClick={setSelectedPattern}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Risk Management */}
            <TabsContent value="risk" className="space-y-6">
              {/* Leverage 0x-100x guide with mini calc + redirect to full Dashboard */}
              <LeverageGuide />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {RISK_MANAGEMENT_CONCEPTS.map(concept => (
                  <Card key={concept.id} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-primary" />
                        {concept.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-sm text-muted-foreground">
                          {concept.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Pattern Detail Modal */}
      <AnimatePresence>
        {selectedPattern && (
          <PatternDetailModal
            pattern={selectedPattern}
            onClose={() => setSelectedPattern(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

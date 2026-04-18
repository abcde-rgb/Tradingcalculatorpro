import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Calculator, Shield, Zap, Crown, ArrowRight, Check, 
  CandlestickChart, History, Bell, BookOpen, Wallet, Target, 
  Scale, FlaskConical, BarChart3, Globe, Moon, Sun, 
  LineChart, PieChart, DollarSign, Percent, Users, Award,
  ChevronRight, Play, Star, Briefcase, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { useThemeStore } from '@/lib/theme';

// Features will use t() in component  
const featuresData = [
  { icon: Calculator, key: 'professionalCalculators', color: 'bg-green-500/10 text-green-500' },
  { icon: CandlestickChart, key: 'tradingViewCharts', color: 'bg-blue-500/10 text-blue-500' },
  { icon: BookOpen, key: 'tradingJournal', color: 'bg-purple-500/10 text-purple-500' },
  { icon: PieChart, key: 'portfolioManagement', color: 'bg-yellow-500/10 text-yellow-500' },
  { icon: Bell, key: 'emailAlerts', color: 'bg-red-500/10 text-red-500' },
  { icon: FlaskConical, key: 'monteCarloSimulator', color: 'bg-cyan-500/10 text-cyan-500' },
];

// Asset types will use t() in component
const assetTypesData = [
  { icon: TrendingUp, key: 'crypto' },
  { icon: DollarSign, key: 'forex' },
  { icon: Briefcase, key: 'stocks' },
  { icon: BarChart3, key: 'indices' },
  { icon: Award, key: 'commodities' },
  { icon: LineChart, key: 'futures' },
];

// Calculators will use t() in component
const calculatorsData = [
  { key: 'lotSizeCalculator' },
  { key: 'leverageCalculator' },
  { key: 'positionSizeCalculator' },
  { key: 'fibonacciCalculator' },
  { key: 'targetPriceCalculator' },
  { key: 'percentRequiredCalculator' },
];

// Discipline features will use t() in component
const disciplineFeaturesData = [
  { icon: Target, key: 'advancedMetrics' },
  { icon: Shield, key: 'disciplineRules' },
  { icon: GraduationCap, key: 'professionalTrack' },
];

// Plans will use t() in component
const plansData = [
  { id: 'monthly' },
  { id: 'quarterly' },
  { id: 'annual', popular: true },
  { id: 'lifetime' },
];

// Stats data will use t() in component

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary font-medium">{t('tagline')}</span>
            </div>
            
            <h1 className="font-unbounded text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Trading Calculator<br />
              <span className="bg-gradient-to-r from-primary via-green-400 to-emerald-500 bg-clip-text text-transparent">PRO</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {t('heroDescription')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-lg h-14 px-8 shadow-lg shadow-primary/25" data-testid="hero-cta">
                  {isAuthenticated ? t('goToDashboard') : t('getStartedFree')}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="gap-2 text-lg h-14 px-8" data-testid="view-plans-btn">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  {t('viewPremiumPlans')}
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: '10K+', labelKey: 'activeTraders', delay: 0.2 },
                { value: '1M+', labelKey: 'calculationsPerformed', delay: 0.3 },
                { value: '50+', labelKey: 'supportedAssets', delay: 0.4 },
                { value: '99.9%', labelKey: 'uptime', delay: 0.5 }
              ].map((stat) => (
                <motion.div
                  key={stat.labelKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Asset Types Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('tradeAllMarkets')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('selectYourAssets')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {assetTypesData.map((asset) => (
              <motion.div
                key={asset.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all group text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <asset.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1">{t(`${asset.key}Name`)}</h3>
                <p className="text-xs text-muted-foreground">{t(`${asset.key}Examples`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('professionalTools')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('professionalToolsDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feature) => (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t(feature.key)}</h3>
                <p className="text-muted-foreground text-sm">{t(`${feature.key}Desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculators Grid */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('includedCalculators')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('calculatorsSuiteDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculatorsData.map((calc) => (
              <motion.div
                key={calc.key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t(calc.key)}</h3>
                  <p className="text-xs text-muted-foreground">{t(`${calc.key}Desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Discipline Features (Like Disciplined.me) */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('disciplinedTrading')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('disciplineDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {disciplineFeaturesData.map((feature) => (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-4">{t(feature.key)}</h3>
                <p className="text-sm text-muted-foreground">{t(`${feature.key}Items`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TradingView Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-card/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">
                {t('tradingViewSection')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('tradingViewSectionDesc')}
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{t('tradingViewFeature1')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{t('tradingViewFeature2')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{t('tradingViewFeature3')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{t('tradingViewFeature4')}</span>
                </li>
              </ul>
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button className="gap-2">
                  <Play className="w-4 h-4" /> {t('viewDemo')}
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-video rounded-xl bg-card border border-border overflow-hidden shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <CandlestickChart className="w-24 h-24 text-primary/50" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('premiumPlans')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('unlockPotentialDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plansData.map((plan) => {
              const planKey = plan.id.charAt(0).toUpperCase() + plan.id.slice(1);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-6 rounded-xl border relative flex flex-col ${
                    plan.popular 
                      ? 'bg-primary/5 border-primary/50 shadow-lg shadow-primary/10' 
                      : 'bg-card border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {t('mostPopular')}
                    </div>
                  )}
                  
                  <h3 className="font-bold text-xl mb-2">{t(plan.id + 'Plan')}</h3>
                  <div className="mb-1">
                    <span className="font-unbounded text-4xl font-bold">{t(plan.id + 'Price')}</span>
                    <span className="text-muted-foreground text-sm">{t(plan.id + 'Period')}</span>
                  </div>
                  
                  <ul className="space-y-2 mt-4 mb-6 flex-1">
                    {plan.id === 'monthly' && (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('allCalculators')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('proSimulator')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('emailSupport')}</span>
                        </li>
                      </>
                    )}
                    {plan.id === 'quarterly' && (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('everythingInMonthly')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('save12Percent')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('prioritySupport')}</span>
                        </li>
                      </>
                    )}
                    {plan.id === 'annual' && (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('earlyAccess')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('portfolioRebalancing')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('prioritySupport')}</span>
                        </li>
                      </>
                    )}
                    {plan.id === 'lifetime' && (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('permanentAccess')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('allFutureUpdates')}</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{t('noRecurringPayments')}</span>
                        </li>
                      </>
                    )}
                  </ul>
                  
                  <Link to={`/pricing?plan=${plan.id}`} className="mt-auto">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} 
                      variant={plan.popular ? 'default' : 'outline'}
                      data-testid={`plan-${plan.id}-btn`}
                    >
                      {t('selectPlan')}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Education Preview */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">{t('educationCenter')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('educationPreviewDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['reversalPatternsTitle', 'continuationPatternsTitle', 'candlestickPatternsTitle', 'tradingRulesTitle'].map((topicKey) => (
              <motion.div
                key={topicKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors text-center group"
              >
                <GraduationCap className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold">{t(topicKey)}</h3>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/education">
              <Button variant="outline" className="gap-2">
                {t('exploreLearningCenter')} <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 text-center"
          >
            <h2 className="font-unbounded text-3xl md:text-4xl font-bold mb-4">
              {t('readyToPro')}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('joinThousands')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-lg h-14 px-8">
                  {t('startNow')} <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 text-lg h-14 px-8">
                  {t('alreadyHaveAccount')}
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {t('demoAvailable')}: <code className="bg-muted px-2 py-1 rounded">demo@btccalc.pro</code> / <code className="bg-muted px-2 py-1 rounded">1234</code>
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span className="font-bold">{t('appName')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('tagline')}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">{t('product')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/dashboard" className="hover:text-primary">{t('dashboard')}</Link></li>
                <li><Link to="/pricing" className="hover:text-primary">{t('pricing')}</Link></li>
                <li><Link to="/education" className="hover:text-primary">{t('education')}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">{t('resources')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/education" className="hover:text-primary">{t('educationCenter')}</Link></li>
                <li><a href="#" className="hover:text-primary">{t('apiDocs')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('support')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">{t('legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">{t('terms')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('privacyPolicy')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('cookies')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <p className="text-muted-foreground text-sm">© 2024 {t('appName')}. {t('allRightsReserved')}.</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

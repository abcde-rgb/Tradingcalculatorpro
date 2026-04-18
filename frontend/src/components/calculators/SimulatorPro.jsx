import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FlaskConical, Play, TrendingUp, TrendingDown, Settings, 
  BarChart3, PieChart, Crown, RotateCcw, ChevronDown, ChevronUp,
  Layers, Target, DollarSign, Percent, Activity
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useIsPremium } from '@/lib/premium';
import { useTranslation } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Estrategias - se traducen dinámicamente en el componente
const STRATEGIES = [
  { id: 'scalping', nameKey: 'scalping' },
  { id: 'daytrading', nameKey: 'daytrading' },
  { id: 'swing', nameKey: 'swing' },
  { id: 'trend', nameKey: 'trendFollowing' },
  { id: 'breakout', nameKey: 'breakout' },
];

const DEFAULT_PHASES = [
  { numOps: 30, posSize: 100, tp: 2, sl: 1, winRate: 55, strategy: 'scalping' },
  { numOps: 30, posSize: 100, tp: 2, sl: 1, winRate: 55, strategy: 'daytrading' },
  { numOps: 30, posSize: 10, tp: 3, sl: 1.5, winRate: 52, strategy: 'daytrading' },
  { numOps: 30, posSize: 10, tp: 3, sl: 1.5, winRate: 50, strategy: 'swing' },
  { numOps: 30, posSize: 3, tp: 4, sl: 2, winRate: 48, strategy: 'swing' },
  { numOps: 30, posSize: 3, tp: 5, sl: 2.5, winRate: 45, strategy: 'trend' },
];

export function SimulatorPro() {
  const { user } = useAuthStore();
  const isPremium = useIsPremium();
  const { t } = useTranslation();
  
  // Global Config
  const [initialBalance, setInitialBalance] = useState(1000);
  const [totalPhases, setTotalPhases] = useState(6);
  const [tradingComm, setTradingComm] = useState(0.1);
  const [platformComm, setPlatformComm] = useState(0.05);
  const [riskRatio, setRiskRatio] = useState(1.5);
  const [compoundInterest, setCompoundInterest] = useState(true);
  const [capitalMode, setCapitalMode] = useState('compound'); // 'compound' or 'fixed'
  
  // Fixed Risk Config
  const [fixedCapitalPerOp, setFixedCapitalPerOp] = useState(100); // Capital fijo en USD por operación
  const [fixedTotalOps, setFixedTotalOps] = useState(100);
  const [fixedWinRate, setFixedWinRate] = useState(55);
  const [fixedTakeProfit, setFixedTakeProfit] = useState(2);
  const [fixedStopLoss, setFixedStopLoss] = useState(1);
  
  // Phase Configurations
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  
  // Results
  const [results, setResults] = useState(null);
  const [operations, setOperations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  // Update phases when totalPhases changes
  useEffect(() => {
    setPhases(prevPhases => {
      const newPhases = [];
      for (let i = 0; i < totalPhases; i++) {
        if (prevPhases[i]) {
          newPhases.push({ ...prevPhases[i], id: prevPhases[i].id || `phase-${i}-${Date.now()}` });
        } else {
          newPhases.push({
            id: `phase-${i}-${Date.now()}`,
            numOps: 30,
            posSize: i < 2 ? 100 : i < 4 ? 10 : 3,
            tp: 2 + i * 0.5,
            sl: 1 + i * 0.25,
            winRate: 55 - i * 2,
            strategy: STRATEGIES[Math.min(i, STRATEGIES.length - 1)].id
          });
        }
      }
      return newPhases;
    });
  }, [totalPhases]); // Fixed: removed phases to prevent infinite loop

  const updatePhase = (index, field, value) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const getOperationRange = (phaseIndex) => {
    let start = 1;
    for (let i = 0; i < phaseIndex; i++) {
      start += phases[i]?.numOps || 30;
    }
    const end = start + (phases[phaseIndex]?.numOps || 30) - 1;
    return { start, end };
  };

  const executeSimulation = () => {
    if (!isPremium) return;
    
    setIsLoading(true);
    
    const ops = [];
    let accountBalance = initialBalance; // Cuenta = almacén de dinero
    let totalWins = 0;
    let totalOps = 0;
    let peakBalance = accountBalance;
    let minBalance = accountBalance;
    let grossGain = 0;
    let grossLoss = 0;
    let totalCommission = 0;
    const totalCommRate = (tradingComm + platformComm) / 100;

    if (capitalMode === 'fixed') {
      // ============ FIXED RISK MODE ============
      // Siempre opera con el mismo capital fijo por operación
      const fixedCapital = fixedCapitalPerOp;
      const numOps = fixedTotalOps;
      const winRate = fixedWinRate / 100;
      const tp = fixedTakeProfit / 100;
      const sl = fixedStopLoss / 100;

      for (let op = 0; op < numOps; op++) {
        const isWin = Math.random() < winRate;
        let pnl, commission, netResult;

        if (isWin) {
          pnl = fixedCapital * tp;
          commission = Math.abs(pnl) * totalCommRate;
          netResult = pnl - commission;
          grossGain += pnl;
          totalWins++;
        } else {
          pnl = -(fixedCapital * sl);
          commission = Math.abs(pnl) * totalCommRate;
          netResult = pnl - commission;
          grossLoss += Math.abs(pnl);
        }

        totalCommission += commission;
        const balanceBefore = accountBalance;
        accountBalance += netResult; // Acumula en la cuenta (almacén)

        peakBalance = Math.max(peakBalance, accountBalance);
        minBalance = Math.min(minBalance, accountBalance);
        totalOps++;

        ops.push({
          num: totalOps,
          phase: 1,
          numOpsInPhase: numOps,
          capitalBefore: balanceBefore,
          capitalInOp: fixedCapital,
          pnl: netResult,
          commission,
          capitalAfter: accountBalance,
          isWin,
          roi: (netResult / fixedCapital) * 100
        });
      }
    } else {
      // ============ COMPOUND MODE (CON FASES) ============
      let capital = initialBalance;

      for (let phaseIdx = 0; phaseIdx < phases.length; phaseIdx++) {
        const phase = phases[phaseIdx];
        const numOps = phase.numOps || 30;
        const posSize = (phase.posSize || 5) / 100;
        const tp = (phase.tp || 2) / 100;
        const sl = (phase.sl || 1) / 100;
        const winRate = (phase.winRate || 50) / 100;

        for (let op = 0; op < numOps; op++) {
          const capitalInOp = capital * posSize;
          const isWin = Math.random() < winRate;
          let pnl, commission, netResult;

          if (isWin) {
            pnl = capitalInOp * tp;
            commission = Math.abs(pnl) * totalCommRate;
            netResult = pnl - commission;
            grossGain += pnl;
            totalWins++;
          } else {
            pnl = -(capitalInOp * sl);
            commission = Math.abs(pnl) * totalCommRate;
            netResult = pnl - commission;
            grossLoss += Math.abs(pnl);
          }

          totalCommission += commission;
          const capitalBefore = capital;
          
          if (compoundInterest) {
            capital += netResult;
          }

          peakBalance = Math.max(peakBalance, capital);
          minBalance = Math.min(minBalance, capital);
          totalOps++;

          ops.push({
            num: totalOps,
            phase: phaseIdx + 1,
            numOpsInPhase: numOps,
            capitalBefore,
            capitalInOp,
            pnl: netResult,
            commission,
            capitalAfter: capital,
            isWin,
            roi: (netResult / capitalInOp) * 100
          });
        }
      }
      
      accountBalance = capital;
    }

    // Calculate metrics
    const finalBalance = accountBalance;
    const netGain = finalBalance - initialBalance;
    const roi = (netGain / initialBalance) * 100;
    const winRatePercent = (totalWins / totalOps) * 100;
    const avgWin = totalWins > 0 ? grossGain / totalWins : 0;
    const avgLoss = (totalOps - totalWins) > 0 ? grossLoss / (totalOps - totalWins) : 0;
    const expectancy = (avgWin * (totalWins / totalOps)) - (avgLoss * ((totalOps - totalWins) / totalOps));
    const maxDrawdown = peakBalance > 0 ? ((peakBalance - minBalance) / peakBalance) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossGain / grossLoss : grossGain > 0 ? Infinity : 0;

    setResults({
      finalBalance,
      netGain,
      roi,
      winRate: winRatePercent,
      maxDrawdown,
      profitFactor,
      grossGain,
      grossLoss,
      totalCommission,
      expectancy,
      totalOps,
      totalWins,
      totalLosses: totalOps - totalWins
    });

    setOperations(ops);
    setShowConfig(false);
    setIsLoading(false);
  };

  const resetSimulation = () => {
    setResults(null);
    setOperations([]);
    setShowConfig(true);
  };

  // Calculate equity curve data
  const equityData = operations.map(op => op.capitalAfter);
  const drawdownData = operations.map((op, i) => {
    const peak = Math.max(...operations.slice(0, i + 1).map(o => o.capitalAfter));
    return peak > 0 ? ((peak - op.capitalAfter) / peak) * 100 : 0;
  });

  if (!isPremium) {
    return (
      <Card className="bg-card border-border" data-testid="simulator-pro-locked">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-cyan-500" />
            </div>
            {t('simulator')} Pro
            <Crown className="w-4 h-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Función Premium</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Simula operaciones en fases progresivas con configuración avanzada.
            </p>
            <Link to="/pricing">
              <Button className="gap-2">
                <Crown className="w-4 h-4" /> Desbloquear Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="simulator-pro">
      {/* Configuration Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-cyan-500" />
              </div>
              {t('simulator')} - {t('phaseConfig')}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {showConfig && (
          <CardContent className="space-y-6">
            {/* Info Box */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Activity className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t('simulatorDescription')}
              </p>
            </div>

            {/* Configuración General - Solo Saldo Inicial */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> {t('generalConfig')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t('initialBalance')} (USD)</Label>
                  <Input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                    min={1}
                    className="font-mono"
                    data-testid="initial-balance"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 {t('initialCapitalHint')}
                  </p>
                </div>
              </div>
            </div>

            {/* Capital Mode Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('capitalMode')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={capitalMode === 'compound' ? 'default' : 'outline'}
                  onClick={() => setCapitalMode('compound')}
                  className={`h-auto py-3 ${capitalMode === 'compound' ? 'bg-primary text-black' : ''}`}
                >
                  <div className="text-left w-full">
                    <p className="font-semibold text-sm">📈 {t('compoundMode')}</p>
                    <p className="text-xs opacity-80">{t('compoundModeDesc')}</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={capitalMode === 'fixed' ? 'default' : 'outline'}
                  onClick={() => {
                    setCapitalMode('fixed');
                    setCompoundInterest(false);
                  }}
                  className={`h-auto py-3 ${capitalMode === 'fixed' ? 'bg-accent text-white' : ''}`}
                >
                  <div className="text-left w-full">
                    <p className="font-semibold text-sm">🔒 {t('fixedRiskMode')}</p>
                    <p className="text-xs opacity-80">{t('fixedRiskModeDesc')}</p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Configuración Compuesto */}
            {capitalMode === 'compound' && (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> {t('compoundConfig')}
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('totalPhases')}</Label>
                    <Input
                      type="number"
                      value={totalPhases}
                      onChange={(e) => setTotalPhases(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
                      min={2}
                      max={10}
                      className="font-mono"
                      data-testid="total-phases"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('tradingCommission')} (%)</Label>
                    <Input
                      type="number"
                      value={tradingComm}
                      onChange={(e) => setTradingComm(parseFloat(e.target.value) || 0)}
                      step={0.01}
                      min={0}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('platformCommission')} (%)</Label>
                    <Input
                      type="number"
                      value={platformComm}
                      onChange={(e) => setPlatformComm(parseFloat(e.target.value) || 0)}
                      step={0.01}
                      min={0}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="compound"
                    checked={compoundInterest}
                    onCheckedChange={setCompoundInterest}
                  />
                  <Label htmlFor="compound" className="text-sm cursor-pointer">
                    💰 {t('compoundInterest')}
                  </Label>
                </div>
              </div>
            )}

            {/* Phase Configurations - Solo en modo Compuesto */}
            {capitalMode === 'compound' && (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> {t('phaseConfig')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phases.map((phase, idx) => {
                  const range = getOperationRange(idx);
                  const capitalPerOp = (initialBalance * (phase.posSize / 100)).toFixed(2);
                  
                  return (
                    <Card key={phase.id || `phase-${idx}`} className="bg-muted/30 border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-sm">{t('phase')} {idx + 1}</h5>
                        </div>
                        
                        <div className="text-xs px-2 py-1.5 rounded bg-primary/10 text-primary">
                          {t('operations')}: {range.start} {t('to')} {range.end}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">{t('operations')}</Label>
                            <Input
                              type="number"
                              value={phase.numOps}
                              onChange={(e) => updatePhase(idx, 'numOps', parseInt(e.target.value) || 30)}
                              min={1}
                              max={200}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">{t('positionSizePercent')}</Label>
                            <Input
                              type="number"
                              value={phase.posSize}
                              onChange={(e) => updatePhase(idx, 'posSize', parseFloat(e.target.value) || 5)}
                              step={0.5}
                              min={0.1}
                              max={100}
                              className="h-8 text-sm"
                            />
                            <span className="text-[10px] text-muted-foreground">${capitalPerOp}/op</span>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">{t('takeProfit')} %</Label>
                            <Input
                              type="number"
                              value={phase.tp}
                              onChange={(e) => updatePhase(idx, 'tp', parseFloat(e.target.value) || 2)}
                              step={0.1}
                              min={0.1}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">{t('stopLoss')} %</Label>
                            <Input
                              type="number"
                              value={phase.sl}
                              onChange={(e) => updatePhase(idx, 'sl', parseFloat(e.target.value) || 1)}
                              step={0.1}
                              min={0.1}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px]">{t('winRate')}</Label>
                            <span className="text-xs font-semibold text-primary">{phase.winRate}%</span>
                          </div>
                          <Slider
                            value={[phase.winRate]}
                            onValueChange={(v) => updatePhase(idx, 'winRate', v[0])}
                            min={1}
                            max={100}
                            step={1}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px]">{t('strategy')}</Label>
                          <Select
                            value={phase.strategy}
                            onValueChange={(v) => updatePhase(idx, 'strategy', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STRATEGIES.map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {t(s.nameKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            )}

            {/* Fixed Risk Configuration - Solo en modo Fixed */}
            {capitalMode === 'fixed' && (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent" /> {t('fixedRiskConfig')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('fixedCapitalPerOp')} (USD)</Label>
                    <Input
                      type="number"
                      value={fixedCapitalPerOp}
                      onChange={(e) => setFixedCapitalPerOp(parseFloat(e.target.value) || 100)}
                      min={1}
                      className="font-mono"
                      placeholder="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 {t('fixedCapitalHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('totalOperationsNumber')}</Label>
                    <Input
                      type="number"
                      value={fixedTotalOps}
                      onChange={(e) => setFixedTotalOps(parseInt(e.target.value) || 100)}
                      min={1}
                      max={1000}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('takeProfit')} (%)</Label>
                    <Input
                      type="number"
                      value={fixedTakeProfit}
                      onChange={(e) => setFixedTakeProfit(parseFloat(e.target.value) || 2)}
                      min={0.1}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('stopLoss')} (%)</Label>
                    <Input
                      type="number"
                      value={fixedStopLoss}
                      onChange={(e) => setFixedStopLoss(parseFloat(e.target.value) || 1)}
                      min={0.1}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">{t('winRate')}: {fixedWinRate}%</Label>
                    <Slider
                      value={[fixedWinRate]}
                      onValueChange={(val) => setFixedWinRate(val[0])}
                      min={1}
                      max={100}
                      step={1}
                      className="py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={executeSimulation} 
              className="w-full gap-2 h-12 text-lg"
              disabled={isLoading}
              data-testid="execute-simulation-btn"
            >
              <Play className="w-5 h-5" />
              {isLoading ? t('executing') : `▶ ${t('executeSimulation')}`}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Results Section */}
      {results && (
        <Card className="bg-card border-border" data-testid="simulation-results">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-green-500" />
              </div>
              {t('simulationResults')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Metrics */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> {t('mainMetrics')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('finalBalance')}</p>
                  <p className="text-xl font-bold text-primary" data-testid="final-balance">
                    ${results.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('netGain')}</p>
                  <p className={`text-xl font-bold ${results.netGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.netGain >= 0 ? '+' : ''}${results.netGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('totalRoi')}</p>
                  <p className={`text-xl font-bold ${results.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.roi >= 0 ? '+' : ''}{results.roi.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('winRate')}</p>
                  <p className="text-xl font-bold">{results.winRate.toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('maxDrawdown')}</p>
                  <p className="text-xl font-bold text-red-500">{results.maxDrawdown.toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('profitFactor')}</p>
                  <p className={`text-xl font-bold ${results.profitFactor >= 1.5 ? 'text-green-500' : results.profitFactor >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {results.profitFactor === Infinity ? '∞' : results.profitFactor.toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Metrics */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> {t('advancedMetrics')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('grossGain')}</p>
                  <p className="text-lg font-bold text-green-500">
                    ${results.grossGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('grossLoss')}</p>
                  <p className="text-lg font-bold text-red-500">
                    ${results.grossLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('totalCommissions')}</p>
                  <p className="text-lg font-bold">
                    ${results.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('expectancy')}</p>
                  <p className={`text-lg font-bold ${results.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.expectancy >= 0 ? '+' : ''}${results.expectancy.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('totalOperations')}</p>
                  <p className="text-lg font-bold">{results.totalOps}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('winnersLosers')}</p>
                  <p className="text-lg font-bold">
                    <span className="text-green-500">{results.totalWins}</span> / <span className="text-red-500">{results.totalLosses}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Charts */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> {t('visualAnalysis')}
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {/* Equity Curve - Line Chart */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-4">{t('equityCurve')}</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart
                      data={operations.map((op, idx) => ({
                        operacion: idx + 1,
                        balance: op.capitalAfter,
                        fase: op.phase
                      }))}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="operacion" 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                        label={{ value: t('operationNumber'), position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                        label={{ value: t('balanceLabel'), angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}
                        itemStyle={{ color: '#22c55e' }}
                        formatter={(value, name) => {
                          if (name === 'balance') return [`$${value.toFixed(2)}`, 'Balance'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `{t('operationHash')} #${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        fill="url(#colorBalance)"
                        dot={false}
                        activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Drawdown Chart - Line Chart */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-4">{t('drawdownChart')}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={operations.map((op, idx) => {
                        const peak = Math.max(...operations.slice(0, idx + 1).map(o => o.capitalAfter));
                        const dd = peak > 0 ? ((peak - op.capitalAfter) / peak) * 100 : 0;
                        return {
                          operacion: idx + 1,
                          drawdown: dd,
                          fase: op.phase
                        };
                      })}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="operacion" 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Número de Operación', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.7)' }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        label={{ value: 'Drawdown (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}
                        itemStyle={{ color: '#ef4444' }}
                        formatter={(value) => [`${value.toFixed(2)}%`, 'Drawdown']}
                        labelFormatter={(label) => `{t('operationHash')} #${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="drawdown" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        fill="url(#colorDD)"
                        dot={false}
                        activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Win Rate Distribution */}
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Distribución Win/Loss</p>
                    <div className="flex items-center justify-center gap-4 h-32">
                      <div className="text-center">
                        <div 
                          className="w-16 bg-green-500 rounded mx-auto mb-2"
                          style={{ height: `${(results.totalWins / results.totalOps) * 100}px` }}
                        />
                        <p className="text-xs text-muted-foreground">Wins</p>
                        <p className="font-bold text-green-500">{results.totalWins}</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-16 bg-red-500 rounded mx-auto mb-2"
                          style={{ height: `${(results.totalLosses / results.totalOps) * 100}px` }}
                        />
                        <p className="text-xs text-muted-foreground">Losses</p>
                        <p className="font-bold text-red-500">{results.totalLosses}</p>
                      </div>
                    </div>
                  </div>

                  {/* P&L Distribution */}
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Distribución P&L</p>
                    <div className="flex items-center justify-center h-32">
                      <div className="relative w-32 h-32">
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(#22c55e ${(results.grossGain / (results.grossGain + results.grossLoss)) * 360}deg, #ef4444 0deg)`
                          }}
                        />
                        <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {((results.grossGain / (results.grossGain + results.grossLoss)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operations Table */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Últimas 20 Operaciones
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-semibold text-muted-foreground">#</th>
                      <th className="text-left p-2 font-semibold text-muted-foreground">Fase</th>
                      <th className="text-left p-2 font-semibold text-muted-foreground">Capital</th>
                      <th className="text-left p-2 font-semibold text-muted-foreground">P&L</th>
                      <th className="text-left p-2 font-semibold text-muted-foreground">Comisión</th>
                      <th className="text-left p-2 font-semibold text-muted-foreground">Resultado</th>
                      <th className="text-left p-2 font-semibold text-muted-foreground">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.slice(-20).map((op) => (
                      <tr key={op.num} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-2">{op.num}</td>
                        <td className="p-2">{op.phase}</td>
                        <td className="p-2 font-mono">${op.capitalInOp.toFixed(2)}</td>
                        <td className={`p-2 font-mono ${op.isWin ? 'text-green-500' : 'text-red-500'}`}>
                          {op.pnl >= 0 ? '+' : ''}${op.pnl.toFixed(2)}
                        </td>
                        <td className="p-2 font-mono">${op.commission.toFixed(2)}</td>
                        <td className="p-2">
                          {op.isWin ? (
                            <span className="text-green-500">✓ WIN</span>
                          ) : (
                            <span className="text-red-500">✗ LOSS</span>
                          )}
                        </td>
                        <td className={`p-2 font-mono ${op.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {op.roi >= 0 ? '+' : ''}{op.roi.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button 
              onClick={resetSimulation} 
              variant="secondary"
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" /> {t('newSimulation')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

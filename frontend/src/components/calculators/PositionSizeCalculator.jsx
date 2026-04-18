import { useState, useEffect } from 'react';
import { Calculator, Save, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAuthStore, useCalculatorStore } from '@/lib/store';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { usePersistedState } from '@/hooks/usePersistedState';

export const PositionSizeCalculator = () => {
  const { isAuthenticated } = useAuthStore();
  const { saveCalculation } = useCalculatorStore();
  
  const [persistedData, setPersistedData, clearPersistedData, isLoading] = usePersistedState('position_size_calculator', {
    accountBalance: 10000,
    riskPercent: 2,
    entryPrice: 95000,
    stopLoss: 94000
  });
  
  const [accountBalance, setAccountBalance] = useState(persistedData.accountBalance);
  const [riskPercent, setRiskPercent] = useState([persistedData.riskPercent]);
  const [entryPrice, setEntryPrice] = useState(persistedData.entryPrice);
  const [stopLoss, setStopLoss] = useState(persistedData.stopLoss);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      setAccountBalance(persistedData.accountBalance);
      setRiskPercent([persistedData.riskPercent]);
      setEntryPrice(persistedData.entryPrice);
      setStopLoss(persistedData.stopLoss);
    }
  }, [persistedData, isLoading]);

  useEffect(() => {
    setPersistedData({ accountBalance, riskPercent: riskPercent[0], entryPrice, stopLoss });
  }, [accountBalance, riskPercent, entryPrice, stopLoss]);

  const calculate = () => {
    const balance = parseFloat(accountBalance);
    const risk = riskPercent[0];
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    
    // Calcular riesgo en dólares
    const riskAmount = balance * (risk / 100);
    
    // Calcular distancia al stop loss
    const slDistance = Math.abs(entry - sl);
    const slPercent = (slDistance / entry) * 100;
    
    // Calcular tamaño de posición
    // Posición = Riesgo en $ / Distancia SL en %
    const positionSize = riskAmount / (slPercent / 100);
    const positionInCoins = positionSize / entry;
    
    // Calcular apalancamiento necesario
    const leverageNeeded = positionSize / balance;
    
    const res = {
      riskAmount,
      slDistance,
      slPercent,
      positionSize,
      positionInCoins,
      leverageNeeded: Math.max(1, leverageNeeded)
    };
    
    setResult(res);
  };

  const handleSave = async () => {
    if (result && isAuthenticated) {
      await saveCalculation('position_size', { accountBalance, riskPercent: riskPercent[0], entryPrice, stopLoss }, result);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-500" />
          Calculadora de Tamaño de Posición
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Balance de Cuenta ($)</Label>
              <Input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                className="font-mono bg-muted border-border"
                data-testid="position-balance"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Riesgo por Operación</Label>
                <span className="font-mono text-lg font-bold text-blue-500">{riskPercent[0]}%</span>
              </div>
              <Slider
                value={riskPercent}
                onValueChange={setRiskPercent}
                min={0.5}
                max={10}
                step={0.5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5%</span>
                <span>2% (recomendado)</span>
                <span>10%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Precio Entrada ($)</Label>
                <Input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="font-mono bg-muted border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stop Loss ($)</Label>
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="font-mono bg-muted border-border"
                />
              </div>
            </div>
            
            <Button onClick={calculate} className="w-full bg-blue-500 text-white hover:bg-blue-400" data-testid="position-calculate-btn">
              Calcular Posición
            </Button>
          </div>
          
          <div className="space-y-4">
            {result && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs uppercase tracking-wider text-blue-500 mb-1">Tamaño de Posición Recomendado</p>
                  <p className="font-mono text-3xl font-bold text-blue-500">{formatCurrency(result.positionSize)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatNumber(result.positionInCoins, 6)} BTC
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Riesgo en $</p>
                    <p className="font-mono text-xl font-bold text-destructive">{formatCurrency(result.riskAmount)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Distancia SL</p>
                    <p className="font-mono text-xl font-bold">{formatNumber(result.slPercent)}%</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs uppercase tracking-wider text-yellow-500 mb-1">Apalancamiento Necesario</p>
                  <p className="font-mono text-xl font-bold text-yellow-500">{formatNumber(result.leverageNeeded, 1)}x</p>
                  {result.leverageNeeded > 20 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-yellow-500">
                      <AlertTriangle className="w-4 h-4" />
                      Alto apalancamiento - Mayor riesgo de liquidación
                    </div>
                  )}
                </div>
                
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs">
                  <p className="text-accent font-semibold">Gestión de Riesgo:</p>
                  <p className="text-muted-foreground mt-1">
                    Con un riesgo del {riskPercent[0]}%, si tu SL se activa perderás {formatCurrency(result.riskAmount)} 
                    ({riskPercent[0]}% de tu cuenta). Esto te permite sobrevivir a {Math.floor(100 / riskPercent[0])} pérdidas consecutivas.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={clearPersistedData} variant="outline" className="flex-1">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                  
                  {isAuthenticated && (
                    <Button onClick={handleSave} variant="outline" className="flex-1">
                      <Save className="w-4 h-4 mr-2" /> Guardar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

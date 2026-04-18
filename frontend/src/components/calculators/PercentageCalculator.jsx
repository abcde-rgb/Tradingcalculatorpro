import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore, useCalculatorStore, usePriceStore } from '@/lib/store';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { CRYPTO_LIST } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';
import { usePersistedState } from '@/hooks/usePersistedState';

export const PercentageCalculator = () => {
  const { prices } = usePriceStore();
  const { isAuthenticated } = useAuthStore();
  const { saveCalculation } = useCalculatorStore();
  const { t } = useTranslation();
  
  const [persistedData, setPersistedData, clearPersistedData, isLoading] = usePersistedState('percentage_calculator', {
    symbol: 'bitcoin',
    currentPrice: prices?.bitcoin?.usd || 95000,
    targetPrice: '',
    isLong: true
  });
  
  const [symbol, setSymbol] = useState(persistedData.symbol);
  const [currentPrice, setCurrentPrice] = useState(persistedData.currentPrice);
  const [targetPrice, setTargetPrice] = useState(persistedData.targetPrice);
  const [isLong, setIsLong] = useState(persistedData.isLong);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      setSymbol(persistedData.symbol);
      setCurrentPrice(persistedData.currentPrice);
      setTargetPrice(persistedData.targetPrice);
      setIsLong(persistedData.isLong);
    }
  }, [persistedData, isLoading]);

  useEffect(() => {
    setPersistedData({ symbol, currentPrice, targetPrice, isLong });
  }, [symbol, currentPrice, targetPrice, isLong]);

  // Actualizar precio cuando cambia el símbolo
  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    const price = prices?.[newSymbol]?.usd || 0;
    if (price > 0) setCurrentPrice(price);
  };

  const calculate = () => {
    if (!currentPrice || !targetPrice) return;
    
    const current = parseFloat(currentPrice);
    const target = parseFloat(targetPrice);
    const priceMovement = ((target - current) / current) * 100;
    
    // En LONG: ganas si precio sube, pierdes si baja
    // En SHORT: ganas si precio baja, pierdes si sube
    let isProfit;
    let effectiveMovement;
    
    if (isLong) {
      // LONG: ganancia = precio sube
      isProfit = target > current;
      effectiveMovement = priceMovement;
    } else {
      // SHORT: ganancia = precio baja (movimiento invertido)
      isProfit = target < current;
      effectiveMovement = -priceMovement; // Invertir para mostrar ganancia como positiva
    }
    
    const res = {
      priceMovement: priceMovement,
      effectiveMovement: effectiveMovement,
      direction: target > current ? 'ALCISTA' : 'BAJISTA',
      isProfit: isProfit,
      difference: target - current,
      position: isLong ? 'LONG' : 'SHORT'
    };
    
    setResult(res);
  };

  const handleSave = async () => {
    if (result && isAuthenticated) {
      await saveCalculation('percentage', { symbol, currentPrice, targetPrice, isLong }, result);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('percentageRequired')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('asset')}</Label>
              <Select value={symbol} onValueChange={handleSymbolChange}>
                <SelectTrigger className="bg-muted border-border" data-testid="symbol-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTO_LIST.map(crypto => (
                    <SelectItem key={crypto.id} value={crypto.id}>{crypto.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('currentPrice')} ($)</Label>
              <Input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="font-mono bg-muted border-border"
                data-testid="current-price-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('targetPrice')} ($)</Label>
              <Input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="font-mono bg-muted border-border"
                data-testid="target-price-input"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={isLong ? 'default' : 'outline'}
                onClick={() => setIsLong(true)}
                className={`flex-1 ${isLong ? 'bg-primary text-black' : ''}`}
                data-testid="long-btn"
              >
                <TrendingUp className="w-4 h-4 mr-2" /> {t('long')}
              </Button>
              <Button
                variant={!isLong ? 'default' : 'outline'}
                onClick={() => setIsLong(false)}
                className={`flex-1 ${!isLong ? 'bg-destructive text-white' : ''}`}
                data-testid="short-btn"
              >
                <TrendingDown className="w-4 h-4 mr-2" /> {t('short')}
              </Button>
            </div>
            
            <Button onClick={calculate} className="w-full bg-primary text-black hover:bg-primary/90" data-testid="calculate-btn">
              {t('calculate')}
            </Button>
          </div>
          
          <div className="space-y-4">
            {result && (
              <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-4">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('position')}: {result.position}</p>
                  <p className="text-xs text-muted-foreground mb-2">Movimiento del Precio: {result.direction}</p>
                  <p className={`font-mono text-4xl font-bold ${result.isProfit ? 'text-primary' : 'text-destructive'}`}>
                    {formatPercentage(result.effectiveMovement)}
                  </p>
                  <p className={`text-sm mt-2 ${result.isProfit ? 'text-primary' : 'text-destructive'}`}>
                    {result.isProfit ? `✓ ${t('profit').toUpperCase()}` : `✗ ${t('loss').toUpperCase()}`}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Diferencia $</p>
                    <p className={`font-mono text-lg ${result.difference >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {result.difference >= 0 ? '+' : ''}${formatNumber(result.difference)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mov. Precio</p>
                    <p className={`font-mono text-lg ${result.priceMovement >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatPercentage(result.priceMovement)}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs">
                  <p className="text-accent font-semibold">{t('description')}:</p>
                  <p className="text-muted-foreground mt-1">
                    {isLong 
                      ? `En LONG ganas si el precio SUBE. El precio ${result.priceMovement >= 0 ? 'sube' : 'baja'} ${formatNumber(Math.abs(result.priceMovement))}%, por lo tanto ${result.isProfit ? 'GANAS' : 'PIERDES'}.`
                      : `En SHORT ganas si el precio BAJA. El precio ${result.priceMovement >= 0 ? 'sube' : 'baja'} ${formatNumber(Math.abs(result.priceMovement))}%, por lo tanto ${result.isProfit ? 'GANAS' : 'PIERDES'}.`
                    }
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={clearPersistedData} variant="outline" className="flex-1">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                  
                  {isAuthenticated && (
                    <Button onClick={handleSave} variant="outline" className="flex-1" data-testid="save-calc-btn">
                      <Save className="w-4 h-4 mr-2" /> {t('save')}
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

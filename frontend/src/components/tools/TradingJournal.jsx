import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTradingJournalStore, useAuthStore } from '@/lib/store';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { CRYPTO_LIST } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';

export const TradingJournal = () => {
  const { isAuthenticated } = useAuthStore();
  const { trades, addTrade, updateTrade, deleteTrade, getStats } = useTradingJournalStore();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: 'BTC',
    direction: 'long',
    entryPrice: '',
    exitPrice: '',
    size: '',
    leverage: 1,
    status: 'open',
    notes: '',
    strategy: '',
    pnl: 0
  });

  const stats = getStats();

  const handleSubmit = () => {
    if (!newTrade.entryPrice || !newTrade.size) {
      toast.error(t('completeRequired'));
      return;
    }

    // Calcular PnL si hay precio de salida
    let pnl = 0;
    if (newTrade.exitPrice && newTrade.status === 'closed') {
      const entry = parseFloat(newTrade.entryPrice);
      const exit = parseFloat(newTrade.exitPrice);
      const size = parseFloat(newTrade.size);
      const movement = (exit - entry) / entry;
      
      if (newTrade.direction === 'long') {
        pnl = size * movement * newTrade.leverage;
      } else {
        pnl = size * (-movement) * newTrade.leverage;
      }
    }

    addTrade({ ...newTrade, pnl });
    setNewTrade({
      symbol: 'BTC',
      direction: 'long',
      entryPrice: '',
      exitPrice: '',
      size: '',
      leverage: 1,
      status: 'open',
      notes: '',
      strategy: '',
      pnl: 0
    });
    setShowForm(false);
    toast.success(t('tradeRegistered'));
  };

  const handleCloseTrade = (trade) => {
    const exitPrice = prompt(t('exitPricePrompt'));
    if (exitPrice) {
      const entry = parseFloat(trade.entryPrice);
      const exit = parseFloat(exitPrice);
      const size = parseFloat(trade.size);
      const movement = (exit - entry) / entry;
      
      let pnl;
      if (trade.direction === 'long') {
        pnl = size * movement * trade.leverage;
      } else {
        pnl = size * (-movement) * trade.leverage;
      }

      updateTrade(trade.id, { exitPrice, status: 'closed', pnl });
      toast.success(t('tradeClosed'));
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('loginToUseJournal')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          {t('tradingJournal')}
        </CardTitle>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-green-500 text-black hover:bg-green-400">
          <Plus className="w-4 h-4 mr-1" /> {t('addTrade')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground">{t('totalTrades')}</p>
            <p className="font-mono text-xl font-bold">{stats.totalTrades}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground">{t('winRate')}</p>
            <p className="font-mono text-xl font-bold text-primary">{formatNumber(stats.winRate)}%</p>
          </div>
          <div className={`p-3 rounded-xl ${stats.totalPnl >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            <p className="text-xs text-muted-foreground">{t('pnlTotal')}</p>
            <p className={`font-mono text-xl font-bold ${stats.totalPnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(stats.totalPnl)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground">{t('ratioWL')}</p>
            <p className="font-mono text-xl font-bold">{stats.wins}/{stats.losses}</p>
          </div>
        </div>

        {/* Formulario nueva operación */}
        {showForm && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">{t('symbolLabel')}</Label>
                <Select value={newTrade.symbol} onValueChange={(v) => setNewTrade({...newTrade, symbol: v})}>
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRYPTO_LIST.map(c => (
                      <SelectItem key={c.id} value={c.symbol}>{c.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('direction')}</Label>
                <Select value={newTrade.direction} onValueChange={(v) => setNewTrade({...newTrade, direction: v})}>
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">LONG</SelectItem>
                    <SelectItem value="short">SHORT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('entryPrice')}</Label>
                <Input
                  type="number"
                  value={newTrade.entryPrice}
                  onChange={(e) => setNewTrade({...newTrade, entryPrice: e.target.value})}
                  className="font-mono bg-black/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('sizeUsd')}</Label>
                <Input
                  type="number"
                  value={newTrade.size}
                  onChange={(e) => setNewTrade({...newTrade, size: e.target.value})}
                  className="font-mono bg-black/50 border-white/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">{t('leverageLabel')}</Label>
                <Input
                  type="number"
                  value={newTrade.leverage}
                  onChange={(e) => setNewTrade({...newTrade, leverage: parseInt(e.target.value) || 1})}
                  className="font-mono bg-black/50 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('strategy')}</Label>
                <Input
                  value={newTrade.strategy}
                  onChange={(e) => setNewTrade({...newTrade, strategy: e.target.value})}
                  placeholder={t('strategyPlaceholder')}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">{t('notes')}</Label>
                <Input
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                  placeholder={t('notesPlaceholder')}
                  className="bg-black/50 border-white/10"
                />
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full bg-green-500 text-black hover:bg-green-400">
              {t('registerTrade')}
            </Button>
          </div>
        )}

        {/* Lista de trades */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {trades.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('noTrades')}</p>
          ) : (
            trades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trade.direction === 'long' ? 'bg-primary/20' : 'bg-destructive/20'
                  }`}>
                    {trade.direction === 'long' 
                      ? <TrendingUp className="w-5 h-5 text-primary" />
                      : <TrendingDown className="w-5 h-5 text-destructive" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{trade.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        trade.status === 'open' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-muted-foreground'
                      }`}>
                        {trade.status === 'open' ? t('tradeStatusOpen') : t('tradeStatusClosed')}
                      </span>
                      {trade.leverage > 1 && (
                        <span className="text-xs text-yellow-500">{trade.leverage}x</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('entryLabel')}: ${formatNumber(trade.entryPrice)}
                      {trade.exitPrice && ` → ${t('exitLabel')}: $${formatNumber(trade.exitPrice)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {trade.status === 'closed' && (
                    <div className={`text-right ${trade.pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      <p className="font-mono font-bold">{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</p>
                    </div>
                  )}
                  {trade.status === 'open' && (
                    <Button size="sm" variant="outline" onClick={() => handleCloseTrade(trade)}>
                      {t('closeTrade')}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deleteTrade(trade.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

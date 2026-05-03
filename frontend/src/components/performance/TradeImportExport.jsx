import React, { useRef, useState } from 'react';
import { Download, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { parseCsv, toCsv, downloadFile } from '@/lib/csv';
import { bulkCreateTrades } from '@/services/performanceApi';

/**
 * CSV columns (canonical). Import looks them up case-insensitively and tolerates
 * common alternative names that brokers use (e.g. `side` vs `direction`).
 */
const EXPORT_COLUMNS = [
  'symbol', 'side', 'setup',
  'entry_price', 'exit_price', 'sl', 'tp',
  'quantity', 'account_balance', 'fees',
  'entry_date', 'exit_date', 'status',
  'pnl', 'pnl_pct', 'r_multiple',
  'emotion', 'notes',
];

const IMPORT_ALIASES = {
  symbol:          ['symbol', 'ticker', 'simbolo', 'símbolo', 'instrument'],
  side:            ['side', 'direction', 'direccion', 'dirección', 'type'],
  setup:           ['setup', 'strategy', 'estrategia'],
  entry_price:     ['entry_price', 'entry', 'open_price', 'precio_entrada'],
  exit_price:      ['exit_price', 'exit', 'close_price', 'precio_salida'],
  sl:              ['sl', 'stop_loss', 'stoploss'],
  tp:              ['tp', 'take_profit', 'takeprofit'],
  quantity:        ['quantity', 'qty', 'size', 'cantidad'],
  account_balance: ['account_balance', 'balance', 'capital'],
  fees:            ['fees', 'commission', 'comisiones'],
  entry_date:      ['entry_date', 'entry_time', 'date', 'fecha'],
  exit_date:       ['exit_date', 'exit_time', 'close_date'],
  status:          ['status', 'estado'],
  emotion:         ['emotion', 'emocion', 'emoción'],
  notes:           ['notes', 'note', 'notas', 'comment'],
};

function normalizeRow(row) {
  // Lower-case keys for lookup
  const lower = {};
  for (const [k, v] of Object.entries(row)) lower[k.toLowerCase()] = v;
  const out = {};
  for (const [canonical, aliases] of Object.entries(IMPORT_ALIASES)) {
    for (const alias of aliases) {
      if (lower[alias] !== undefined && lower[alias] !== '') {
        out[canonical] = lower[alias];
        break;
      }
    }
  }
  return out;
}

function coerceTradePayload(raw) {
  const num = (v) => {
    if (v === '' || v == null) return undefined;
    const n = Number(String(v).replace(',', '.').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  };
  const sideRaw = (raw.side || '').toString().toLowerCase();
  const side = ['short', 's', 'sell', 'bajista'].includes(sideRaw) ? 'short' : 'long';
  const payload = {
    symbol: (raw.symbol || '').toString().trim().toUpperCase(),
    side,
    setup: raw.setup || '',
    entry_price: num(raw.entry_price) ?? 0,
    exit_price: num(raw.exit_price) ?? null,
    sl: num(raw.sl) ?? null,
    tp: num(raw.tp) ?? null,
    quantity: num(raw.quantity) ?? 0,
    account_balance: num(raw.account_balance) ?? 0,
    fees: num(raw.fees) ?? 0,
    status: raw.status || undefined,
    entry_date: raw.entry_date || undefined,
    exit_date: raw.exit_date || undefined,
    emotion: num(raw.emotion) ?? null,
    notes: raw.notes || '',
  };
  return payload;
}

export default function TradeImportExport({ trades, onImported }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    if (!trades || trades.length === 0) {
      toast.warning(t('journalCsvNothingToExport'));
      return;
    }
    const rows = trades.map((tr) => {
      const row = {};
      EXPORT_COLUMNS.forEach((col) => { row[col] = tr[col] ?? ''; });
      return row;
    });
    const csv = toCsv(rows, { columns: EXPORT_COLUMNS });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`trade-journal-${stamp}.csv`, csv);
    toast.success(t('journalCsvExportSuccess', { n: trades.length }));
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';  // allow picking the same file again
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rawRows = parseCsv(text);
      if (!rawRows.length) {
        toast.error(t('journalCsvEmpty'));
        return;
      }
      const payloads = rawRows
        .map(normalizeRow)
        .map(coerceTradePayload)
        .filter((p) => p.symbol && p.entry_price > 0 && p.quantity > 0);
      if (!payloads.length) {
        toast.error(t('journalCsvNoValidRows'));
        return;
      }
      const res = await bulkCreateTrades(payloads);
      const imported = res?.imported ?? 0;
      const failed = res?.failed?.length ?? 0;
      if (imported > 0) {
        toast.success(t('journalCsvImportSuccess', { n: imported }));
      }
      if (failed > 0) {
        toast.warning(t('journalCsvImportPartial', { n: failed }));
      }
      onImported?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t('journalCsvImportError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2" data-testid="trade-import-export">
      <Button
        variant="outline" size="sm"
        onClick={handleExport}
        className="gap-2"
        data-testid="trade-journal-export"
      >
        <Download className="w-3.5 h-3.5" />
        {t('journalCsvExport')}
      </Button>
      <Button
        variant="outline" size="sm"
        onClick={handleImportClick}
        disabled={busy}
        className="gap-2"
        data-testid="trade-journal-import"
      >
        {busy ? <FileText className="w-3.5 h-3.5 animate-pulse" /> : <Upload className="w-3.5 h-3.5" />}
        {busy ? t('journalCsvImporting') : t('journalCsvImport')}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFilePicked}
        className="hidden"
        data-testid="trade-journal-file-input"
      />
    </div>
  );
}

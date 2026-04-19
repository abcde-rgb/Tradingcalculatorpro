# PRD — Trading Calculator PRO + Options (Fusión)

## Problem Statement (original)
"A CONTINUACCION VOY A FUSIONAR UNA WEB DENTRO DE OTRA" — fusionar **OPTIONS-main** dentro de **TradingCalculator.pro-main**, manteniendo TCP como web principal (contenedora) y con su diseño prevaleciendo siempre. Evolucionó a construir una suite profesional de Options comparable a OptionStrat/LiveVol/IBKR.

## Decisiones
- Contenedor: **Trading Calculator PRO** (branding, Space Grotesk, tema verde/oscuro, Header fijo, i18n, rutas)
- Integrado: **OPTIONS** como ruta `/options` con tabs (Calculator, Optimizer, Flow, Chain, IV Surface, Academia)
- Un solo backend FastAPI + un solo frontend React

## Arquitectura resultante
### Backend (`/app/backend`)
- `server.py` — FastAPI unificado TCP + Options
- `options_math.py` — Black-Scholes + Greeks + payoff
- `options_optimize.py` — OptionStrat-style strategy optimizer (ROI/POP ranking)
- `stock_data.py` — Yahoo Finance via yfinance
- Endpoints TCP: `/api/auth/*`, `/api/prices`, `/api/forex-prices`, `/api/indices-prices`, `/api/ohlc/*`, `/api/journal/*`, `/api/portfolio/*`, `/api/alerts/*`, `/api/monte-carlo`, `/api/backtest`, `/api/calculations`, `/api/plans`, `/api/checkout/*`, `/api/webhook/stripe`, `/api/subscriptions/*`, `/api/billing/*`, `/api/user-states/*`
- Endpoints OPTIONS: `/api/stock/{symbol}`, `/api/tickers/search`, `/api/options/expirations/*`, `/api/options/chain/*`, `/api/options/iv-surface/*`, `/api/calculate/payoff`, `/api/calculate/greeks`, `/api/optimize`, `/api/options/iv-rank`, `/api/options/unusual/*`, `/api/options/market-flow`, `/api/options/earnings/*`, `/api/options/positions/*`, `/api/options/ai-analyze`

### Frontend (`/app/frontend/src`)
- `pages/OptionsPage.jsx` — Wrapper con Header TCP + suite Options
- `components/options/` — CalculatorPage, OptimizeView, AITradeCoach, MarketFlow, UnusualActivity, PortfolioGreeks, SavedPositionsPanel, ExplainTrade, PayoffChart, GreeksTimeChart, KellyPanel, SearchBar, LegEditor, etc.
- `components/layout/Header.jsx` + `Footer.jsx` — universales

## Implementado
### Feb 2026 — Fusión inicial
- Merge completo OPTIONS → TCP sin romper rutas
- Yahoo Finance real-time, Black-Scholes, Greeks
- Deps: `yfinance`, `scipy`, `beautifulsoup4`, `curl_cffi`, `emergentintegrations`

### Feb 2026 — Features avanzadas (P0-P2)
- **P0**: Strike configurable, Capital Required (Reg-T), Kelly Sizing, Moneyness zones, Strategy Comparison (A vs B), Layout redesign, Greeks Time Chart, Footer global, OptionStrat-style Optimizer, Portfolio Greeks, Saved Positions, Explain Trade, Commissions Simulator
- **P1**: IV Rank Badge, Unusual Options Activity Scanner, Live price refresh (polling 15s)
- **P2**: AI Trade Coach (Claude Sonnet 4.5 vía Emergent LLM Key), Market-Wide Flow Scanner (24 tickers)

### Feb 2026 — Code Quality Refactor (P0)
- Backend lint clean (ruff): E741 `l`→`leg` en options_optimize y server; F841 unused vars removed; E712 en tests; E402 imports movidos al top
- Frontend: index-as-key reemplazado con keys compuestas estables en `UnusualActivity`, `MarketFlow`, `ExplainTrade`, `OptimizeView`, `PayoffChart`
- `random.random()` → `secrets.SystemRandom()` confirmado en server.py (Monte Carlo, Backtest)
- Hook dependencies ya corregidos en `usePersistedState`, `SubscriptionPage`, `PaymentPages`, `SearchBar` (session anterior)
- Smoke test verificado: `/api/stock/AAPL`, `/api/optimize`, `/api/options/unusual`, `/api/options/market-flow` ✅

### Feb 2026 — Optimización de código
- **Motion variants extraídos en `LandingPage.jsx`** a constantes de módulo (evita objetos inline en cada render)
- **Stats computation de options**: extraído a `utils/strategyStats.js` + `computeStrategyStats()`. CalculatorPage.jsx bajó de 1086 → 960 líneas. Elimina ~120 líneas de código duplicado entre stats A y stats B. Testeado: stats idénticos (Max Profit $8671, Max Loss $-716, ROI 1212.7%)
- **O(n²) → O(n) en SimulatorPro**: `drawdownData` ahora calcula running peak en single pass + `useMemo`. Para 180 ops: 32,400 array ops → 180 (180x faster)
- **`get_journal_stats()` backend**: merged 5 iteraciones separadas (wins/losses/pnl/consecutive/equity) en un single-pass loop. Para 1000 trades: 5x → 1x iteración. Testeado con 5 trades de prueba: winRate 40%, maxDrawdown 15, profitFactor 1.0 — todos coinciden con valores esperados.

### Feb 2026 — Cierre del epic i18n (zh, ja, ar + widgets) ✅
- **TradingView widget locale dinámico**: `src/components/charts/TradingViewChart.jsx` mapea `es→es, en→en, de→de_DE, fr→fr, ru→ru, zh→zh_CN, ja→ja, ar→ar_AE` y recarga el iframe cuando cambia el idioma. Antes estaba hardcoded a `locale=es`.
- **Backfill masivo de traducciones**: generadas vía Claude Sonnet 4.5 (EMERGENT LLM KEY) y inyectadas en `lib/i18n.js`:
  - en: +38 keys • de/fr/ru: +61 each • zh/ja: +186 each • ar: +268
  - Paridad alcanzada: todos los locales tienen 770 keys = master `es`
- **RTL fix en hidratación**: `useI18nStore` ahora aplica `<html dir="rtl" lang="ar">` en `onRehydrateStorage`, no solo al llamar `setLocale`. Antes el RTL solo se aplicaba al cambiar idioma manualmente, no en primer load.
- **Category keys i18n**: añadidas `categoryCrypto/Forex/Stocks/Indices/Commodities/Futures` en los 8 locales; el `TradingViewChart` ya no muestra "Criptomonedas" fijo en español.
- **Strings hardcoded del chart traducidos**: "Cargando gráfico…", "No se pudo cargar el gráfico", "Reintentar", "Limpiar configuración" → ahora vía `t()`.
- Verificación manual: Chinese (zh_CN), Japanese (ja), Arabic (ar_AE) screenshots confirman widget + UI traducidos + RTL funcionando.

### Feb 2026 — Fragmentos Trading Journal + Monte Carlo "Limpiar Datos" ✅

### Feb 2026 — Barrido automático completo i18n ✅

### Feb 2026 — Options strategy data i18n ✅ (mockData.js)

### Feb 2026 — ExplainTrade + AITradeCoach + chart labels ✅
- **25 template strings** (con placeholders `{symbol}`, `{be}`, `{amount}`, `{strike}`, `{iv}`, `{n}`, `{analyzeBold}`, `{berange}`) traducidos a 8 idiomas vía Claude 4.5.
- **`ExplainTrade.jsx`**: 12 narrative bullets ahora usan `t(key)` con `fmt()` helper para interpolar placeholders. Ejemplos visibles en alemán: "BULLISCHE Ausrichtung: Du gewinnst, wenn AAPL steigt", "NEGATIVES Theta: Du zahlst Prämie, die täglich verfällt", "MAXIMALER Verlust definiert: $716", etc.
- **`AITradeCoach.jsx`**: intro con bold inline usando split de `{analyzeBold}`, botón "Analizar/Analizando.../Re-analizar", disclaimer "Análisis generado por IA..." — todo i18n.
- **`CalculatorPage.jsx`**: "Vencimiento" (slider label), "Greeks Detalladas", "Mi Portfolio", "Kelly Criterion Sizing" toggles (`mostrar/ocultar`).
- **`LegEditor.jsx`**: "Cantidad" label del leg editor.
- **`GreeksTimeChart.jsx`**: ReferenceLine "Vencimiento" label.
- **`UnusualActivity.jsx`**: table headers "Tipo/Vencimiento/Prima" traducidos.
- Verificado con screenshot DE logged-in: todos los bullets del Explain Trade, AI Coach intro, toggles, vencimiento slider, leg editor — 100% alemán.
- **136 strings únicos** de STRATEGIES (name/description/risk/reward/maxProfit/maxLoss/whenToUse) traducidos a 8 idiomas vía Claude 4.5 (~1088 traducciones).
- **Transformación de datos**: mockData.js ahora almacena **translation keys** en lugar de strings españoles. Ejemplo: `name: 'mock_longCallBuy_780ea6ab'` en vez de `name: 'Long Call · BUY'`. **231 field values** reemplazados en el bloque STRATEGIES.
- **Render sites wrapped con `t()`**: `StrategyBar.jsx`, `EducationTab.jsx`, `CalculatorPage.jsx` (chart title, compare labels, select options), `SimulatorPro.jsx` (strategy select).
- **Traducción incremental** con guardado por locale (evita perder progreso si budget se agota) — resolvió el incidente "budget exceeded $1.01" recargando saldo mid-flight.
- **Extras añadidos**:
  - Compare cell labels: `Métrica/Máx. Beneficio/Máx. Pérdida/Capital Req.` → keys en 8 idiomas.
  - Earnings banner: `HOY/en 11d/dentro de tu vencimiento/Espera IV crush post-evento` → keys en 8 idiomas con placeholder `{n}` para días.
  - Label "Comparando" → `comparing_1f0e14`.
- **Verificación**: screenshots `/options` logged-in en alemán + chino. 33 strategy cards, chart, earnings banner, compare bar — todo traducido sin strings españoles detectables por assertion HTML.
- **Extracción automática**: 101 strings hardcoded identificados en 25 archivos JSX (jsx text, atributos `placeholder/title/aria-label`, toasts, prompts, alerts).
- **Traducción batch**: 808 traducciones (101 strings × 8 locales) vía Claude Sonnet 4.5 usando EMERGENT LLM KEY. Segundo pase añadió 17 strings más (JSX-expression context) + 6 greek sub-labels + 3 bias labels + 2 ternary auth strings = **129 nuevos keys** por locale.
- **Inyección automática**: script Python inyecta keys en `/lib/i18n.js` respetando el cierre de cada bloque locale, y añade automáticamente `import { useTranslation }` + `const { t } = useTranslation()` en componentes que lo necesitan.
- **Reemplazo masivo**: 107 replacements en 25 archivos (AuthPages +15, SubscriptionPage +14, LotSize/PositionSize/MonteCarlo +8 c/u, OptimizeView +6, PaymentPages +6, IVSurface +5, EducationTab +5, LeverageCalculator +3+4, SearchBar +3, KellyPanel +3+2, MarketFlow +3, UnusualActivity +3, PortfolioGreeks +2+2, AITradeCoach/ExplainTrade/CalculatorPage/LegEditor/GreeksTimeChart/GuideModal +1-4 c/u, etc.).
- **Bugs corregidos durante aplicación**:
  - Key `2Recomendado_867927` (prefijo numérico inválido en JS) → renombrado `_2Recomendado_867927` en i18n.js y PositionSizeCalculator.jsx.
  - `useTranslation()` inyectado en helper fn `highlightMatch` dentro de SearchBar.jsx → movido al componente correcto.
  - 3 runtime errors "t is not a function" por `t()` llamado a nivel de módulo (EducationTab `BIAS_STYLES`, GreeksTimeChart `AXIS_LABEL_X`, PortfolioGreeks `GREEK_ROWS`) → cambiados a `labelKey`/`subKey` strings con lookup dentro del componente.
- Verificación: `/options` y `/dashboard` en chino y alemán renderizados sin Spanish fragments visibles, sin runtime errors, lint limpio.
- **Pendiente (datos vs UI)**: `lib/tradingEducation.js` (~400 entradas educativas) y `lib/constants.js` (~320 entradas de patrones gráficos) siguen en español. Son datos long-form didácticos, mejor traducir manualmente por capítulo si el usuario lo pide.
- **TradingJournal.jsx** completamente traducido: título ("Diario de Trading" → `tradingJournal`), botón "Nueva Operación" → `addTrade`, stats labels (Total Trades/Win Rate/P&L Total/Ratio W/L → `totalTrades`/`winRate`/`pnlTotal`/`ratioWL`), empty state "No hay operaciones registradas" → `noTrades`, form labels (Símbolo/Dirección/Precio Entrada/Tamaño/Apalancamiento/Estrategia/Notas), placeholders, toasts, prompt, status badges (Abierta/Cerrada → `tradeStatusOpen`/`tradeStatusClosed`), botón Cerrar → `closeTrade`.
- **JournalStats.jsx**: 6 stat labels ahora traducidos (Win Rate, P&L Total, Profit Factor, Expectancy, Max Drawdown, Total Trades).
- **4 calculadoras**: "Limpiar Datos" hardcoded → `t('clearData')` en MonteCarloSimulator, FibonacciCalculator, PatternTradingCalculator, LotSizeCalculator (con `useTranslation` import agregado a LotSize).
- **21 keys nuevas añadidas** a los 8 locales vía LLM Claude 4.5: `clearData`, `pnlTotal`, `ratioWL`, `loginToUseJournal`, `registerTrade`, `tradeStatusOpen/Closed`, `entryLabel`, `exitLabel`, `closeTrade`, `tradeRegistered`, `tradeClosed`, `completeRequired`, `exitPricePrompt`, `symbolLabel`, `sizeUsd`, `strategyPlaceholder`, `notesPlaceholder`, `totalTrades` (era parcial, ahora completo).
- Verificación: screenshot en alemán muestra todo traducido ("Daten löschen", "Trading-Journal", "Neuer Trade", "Gesamte Trades", "Gewinnrate", "Gesamt-P&L", "W/L-Verhältnis", "Keine Trades aufgezeichnet"). Cero strings españoles detectados en el HTML.

## Backlog

### P1 (próximo)
- **Backtesting histórico de estrategias**: simular ROI de una estrategia mensual sobre N meses (ej: Long Call AAPL 12m)
- **Paper Trading**: trades virtuales con precios reales, PnL tracking, win-rate, Sharpe
- Split componentes grandes (`CalculatorPage.jsx` 1085l, `SimulatorPro.jsx` 973l, `EducationPage.jsx` 1105l) — diferido: lint limpio, alta regresión

### P2 (futuro)
- Live P/L streaming vía WebSocket (reemplazar polling 15s)
- Excel RTD Add-in / API pública B2B
- Gating premium por feature

## Credenciales
- Demo user TCP: `demo@btccalc.pro` / `1234` (lifetime premium)

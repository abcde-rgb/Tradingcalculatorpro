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

### Feb 2026 — Subtabs Options (Optimizar/Flow/IV Surface/Academia) ✅

### Feb 2026 — Fragmentos restantes Flow/IV/Calculator ✅

### Feb 2026 — Revisión final i18n Options en los 8 idiomas ✅

### Feb 2026 — Patrones de trading i18n ✅ (chart + candlestick patterns)

### Feb 2026 — Análisis y preparación para lanzamiento ✅ (P0 completo)

### Feb 2026 — Pro-grade options features (Fase 1) ✅
**Backend (`options_math.py` + `server.py`):**
- **Black-Scholes-Merton** con dividend yield `q` (continuous) — todos los Greeks (Δ Γ Θ ν ρ) actualizados con factor `e^(-qT)`. Backward compatible: q=0 default.
- **`calculate_payoff(..., fee_per_contract, q)`**: comisiones se restan de P&L en cada punto. Stats devuelven `totalFees` separado.
- **Endpoint `/api/calculate/pnl-attribution`** (POST): descompone P&L en delta_pnl, gamma_pnl, theta_pnl, vega_pnl + total_actual (full revaluation) + residual.
- **Endpoint `/api/calculate/assignment`** (POST): para cada leg ITM al vencimiento, devuelve outcome (exercise/assigned/expires_worthless), shares_delivered, cash_flow, net result.
- **`stock_data.py`**: extrae `dividendYield` real de Yahoo Finance (con normalización defensiva por si Yahoo devuelve % en vez de decimal).

**Frontend:**
- **`utils/blackScholes.js`**: BSM con `q` parameter en todas las funciones (callPrice/putPrice/optionPrice/delta/gamma/theta/vega/rho/calculateStrategyPayoff/calculateStrategyGreeks/legPnL).
- **`components/options/TradeAdvancedPanel.jsx`** (nuevo): 3 secciones colapsables expuestas:
  1. **Comisiones y Dividendos**: input fee/contract ($0.65 default Tastytrade), input dividend yield (auto-fetched de Yahoo).
  2. **P&L Attribution**: 3 sliders (price move, days passed, IV change), descomposición visual Δ/Γ/Θ/ν con colores + total revaluación + residual (error de orden superior).
  3. **Assignment Simulation**: slider de precio al vencimiento, lista de legs con ITM badges, shares delivered, cash flow + net result.
- **`CalculatorPage.jsx`**: panel integrado al final, dividend yield auto-aplicado a payoff/greeks reactivamente.

**i18n:** 24 keys nuevas × 8 locales = 192 traducciones (Comisiones y Dividendos, Atribución P&L, Asignación, etc.) vía Claude 4.5 con placeholders `{pct}` preservados. En alemán: "Gebühren und Dividenden", "P&L-Zuordnung", "Assignment-Simulation bei Verfall", "Nettoresultat" — verificado en screenshot.

**Verificación end-to-end:**
- Curl payoff: `feePerContract=0.65` → `totalFees: 0.65` y `maxLoss` -$500.65 (era -$500). ✅
- Curl pnl-attribution: dS=+5%, dT=5d, dIV=-2% → Δ +$268.56, Γ +$57.73, Θ -$32, ν -$22.78, total_actual +$276, residual +$4.6 (error 1.7%). ✅
- Curl assignment: Sell 2 puts $100 strike, expiry $95 → "assigned_receive_shares" +200 sh, cash -$20,000. ✅
- Screenshot UI alemán: 3 paneles colapsables, sliders interactivos, attribution muestra $+651.45 Δ + $+262.56 Γ + $-112.03 Θ. ✅

### Feb 2026 — Análisis y preparación para lanzamiento ✅ (P0 completo)

**Verificación matemática de calculadoras** (todas correctas):
- LeverageCalculator: PnL, ROI, precio liquidación ✓ (fórmulas estándar de futuros isolated margin)
- PositionSizeCalculator: position = riskAmount / (slPercent/100) ✓
- FibonacciCalculator: retracement + extension ✓
- LotSizeCalculator: $10/pip XXX/USD ✓ (válido para EUR/USD, GBP/USD, etc.)
- MonteCarloSimulator: percentiles p5/p50/p95, riskOfRuin, profitProbability ✓
- PercentageCalculator, SpotCalculator, TargetPriceCalculator: todos correctos ✓

**Edge case guards añadidos** (eliminan NaN/Infinity):
- LeverageCalculator: `lev/entry/exit/cap > 0`
- PositionSizeCalculator: `entry !== sl` + todos > 0
- SpotCalculator: `buy > 0`
- PercentageCalculator: `current > 0`
- TargetPriceCalculator: `current > 0` + `!isNaN(pct)`
- LotSizeCalculator: `balance/risk/slPips > 0`

**Hardcoded Spanish strings traducidos a 8 locales** (~40 strings nuevas):
- LeverageCalculator: "Simular", "Posición", "Mov. Precio", "Capital Final", explicaciones LONG/SHORT con placeholders, "A {pct}% del precio de entrada", "Limpiar", "Guardar".
- PositionSizeCalculator: "Calcular Posición", "Distancia SL", "Alto apalancamiento - Mayor riesgo", explicación con placeholders {risk}/{sl}/{amount}.
- MonteCarloSimulator: "Peor 5%", "Mediana (50%)", "Drawdown Promedio", "Riesgo de ruina elevado".
- PercentageCalculator: "Movimiento del Precio:", "Diferencia $", "ALCISTA"/"BAJISTA", "GANAS"/"PIERDES", explicaciones LONG/SHORT.
- LotSize/PositionSize titles, Spot/Target "Limpiar".

**Landing Page mejorada** (P1 launch readiness):
- **Sección Testimonios**: 3 cards con star ratings, quotes profesionales, names + roles. Datos de testimoniales en 8 idiomas.
- **Sección FAQ**: 5 preguntas con accordion expand/collapse (uso experto, cancelación, activos soportados, AI Coach gratis, mobile). Datos en 8 idiomas.
- **Auto-detect idioma del navegador**: `useI18nStore.detectBrowserLanguage()` lee `navigator.language`, mapea a uno de 8 locales soportados, aplica solo en primera visita (flag `autoDetected`). Llamado desde `useEffect` en LandingPage.

**Limpieza de dead code** (-790 líneas):
- Eliminado `lib/tradingEducation.js` (dead code, 696 líneas).
- Eliminado `components/calculators/SimulatorPro_BACKUP.txt`.
- Eliminado `TRADING_PATTERNS` de `constants.js` (no importado en ningún lugar; constants.js: 799→35 líneas).

**Testing agent results** (iteration_1): ✅ Testimonials, FAQ, auto-detect, RTL, edge guards — todos verificados sin NaN/Infinity. Confirmó matemática del LeverageCalculator correcta.
- **`tradingEducationContent.js`**: 94 strings únicos hardcoded en español de los `howToTrade` steps (chart patterns + candlestick patterns) traducidos a 8 idiomas vía Claude 4.5 (**752 traducciones**).
- **Reemplazo automático**: 106 ocurrencias reemplazadas con `t(key)` calls en el file (manteniendo los t() existentes intactos).
- **Missing keys fix**: `bullishPattern`, `bearishPattern`, `neutralPattern`, `continuationPattern`, `reversalPattern` — 5 × 8 locales inyectados (antes renderizaban como raw key literal).
- **EducationPage.jsx**: `getPatternTypeLabel` ahora maneja también `continuation` y `reversal` types (antes solo bullish/bearish/neutral).
- **`lib/tradingEducation.js`** identificado como **dead code** (no importado en ningún lugar del codebase) — marcado para limpieza futura.
- Verificación visual: modal Kopf-Schulter-Formation en alemán renderiza Beschreibung + los 5 Wie-Handeln steps nativos ("Vorherigen Aufwärtstrend identifizieren", "Vollständige Musterbildung abwarten", "Einstieg beim Bruch der Neckline", "Stop Loss oberhalb der rechten Schulter", "Ziel: Abstand Kopf zur Neckline nach unten projiziert") + pattern cards grid (Doppelboden, Aufsteigendes/Absteigendes/Symmetrisches Dreieck, Bullische Flagge). HTML assertion sobre 10 fragmentos españoles → 0 leaks.
- **EDU_MODULES completado en ru/zh/ja/ar**: 57 strings (previously fallback ES) ahora traducidos nativamente via Claude 4.5. `edu_fixup.py` reemplazó valores en i18n.js con traducciones reales.
- **Normalización de indentación**: 1 key (`edu_fundamentosComprarVsVende_6227e3cc`) tenía indent de 6 spaces por artefacto del primer inject; normalizado a 4.
- **IV Rank Badge backend → frontend i18n**: antes `server.py` devolvía labels españoles hardcoded (`VENDE PRIMA`, `COMPRA PRIMA`, `NEUTRAL`) con razones. Ahora el frontend (`IVRankBadge.jsx`) mapea el `recommendation` key (`sell_premium/buy_premium/neutral`) a 6 translation keys (label + reason) y ya no lee los campos `recommendationLabel/Reason` del backend. **48 traducciones nuevas** (6 × 8 locales).
- **Paridad final verificada**: los 8 locales tienen exactamente **1174 keys** cada uno (`extract_missing.py` confirma 0 missing).
- **Verificación visual**:
  - **Japonés** `/options` + Academia expanded: 50+ textos técnicos renderizan en japonés nativo (強気バイアス, プレミアム, 満期, 現在の出来高..., アカデミー tab, etc.). Zero Spanish leaks.
  - **Árabe** `/options`: `<html dir="rtl">` aplicado, 33 strategy cards (`محدود (العلاوة المدفوعة)`), nav header (التعليم/الأسعار/الخيارات/لوحة التحكم), Earnings banner, filter tabs (الكل/صاعد/هابط/محايد). Zero Spanish leaks.
  - **Ruso** `/options`: header (Панель/Опционы/Цены/Обучение), IV Rank (ПРОДАВАЙ ПРЕМИЮ), Earnings, 33 strategy cards con risk/reward en ruso, Multi-Leg Конструктор + Leg Editor (Количество/ПРЕМИЯ), todas las 6 tabs. Zero Spanish leaks.
- HTML assertion batch sobre 16 fragmentos españoles clave → todos ausentes en los 4 locales testados.
- **MarketFlow.jsx**: intro "Pulsa Escanear para detectar unusual activity en SPY, QQQ, TSLA... y 18 tickers más" → `flowIntroDesc_mf001` con placeholder `{scan}` + `escanear_mf002` inline bold. "Escaneando 24 tickers..." → `scanning24_mf003`. "Sin actividad inusual detectada con ratio ≥ {ratio}x" → `noUnusualActivity_mf004` con placeholder.
- **IVSurfaceView.jsx**: footer "Interpretation: La volatilidad implícita (IV) refleja... IV alta (rojo) indica mayor incertidumbre... skew (asimetría) muestra diferencias entre strikes ITM/ATM/OTM" — párrafo completo extraído a `ivInterpretationDesc_sf001`.
- **LegEditor.jsx**: label "Prima" del leg editor → `t('prima_ua002')` (reutilizando key existente).
- **5 nuevas keys añadidas en los 8 locales vía LLM** (30 traducciones).
- Verificación: screenshots Flow + IV-Fläche en alemán muestran narrativa completa traducida: "Scannt die 5 nächsten Verfallstermine", "Die implied volatility (IV) spiegelt die Markterwartungen...". HTML assertion negativa sobre 9 strings españoles clave.
- **Optimizar (OptimizeView.jsx)**: SENTIMIENTO, PRESUPUESTO, Muy Bajista/Bajista/Neutral/Alcista/Muy Alcista, Max Retorno/Max Probabilidad, OPTIMIZAR AHORA, Top {n} estrategias, Profit máx, Capital, Abrir en Calculator, mensaje vacío — todos con `t()`.
- **Flow (UnusualActivity.jsx)**: Refrescar, descripción "Strikes con volumen...", filtros Todos/Calls/Puts, tabla headers (Tipo, Prima, Vencimiento) — todos con `t()`.
- **IV Surface (IVSurfaceView.jsx + IVRankBadge.jsx)**: `vencimientos`, `Promedio` tab, `Volatilidad:` label, tooltip del badge (`IV actual/Rango 52w/Percentil`) — todos con `t()`.
- **Academia (EducationTab.jsx + GuideModal.jsx)**: subtítulo "De cero a profesional...", `Referencia de Estrategias`, `Estrategia/Bias` headers, `ABRIR SIMULADOR`, `ENTENDIDO`, BIAS_STYLES `VOLÁTIL` → labelKey pattern.
- **EDU_MODULES (5 módulos) + GUIDE_ITEMS (6 items) en mockData.js** — 57 strings únicos (titles/content/items/t/d) convertidos a keys. **mockData.js: 57 field values reemplazados**. EducationTab y GuideModal ahora wrap `t(mod.title)`, `t(mod.content)`, `t(item)`, `t(item.t)`, `t(item.d)`.
- **Traducciones LLM**: 30 keys del subtab UI (sub_translations) + 57 keys del Academia (edu_translations) — **en/de/fr** completos; **ru/zh/ja/ar** con fallback español por budget exceeded $2.01 → pendiente de recarga.
- Verificado visual: Academia en alemán renderiza los 5 módulos expandidos con todo el contenido técnico en alemán nativo (Grundlagen: Optionen kaufen vs. verkaufen, Die Griechen, Moneyness: ITM/ATM/OTM (erklärt), Implizite Volatilität (IV), So liest man das Payoff-Diagramm).
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

### Feb 2026 — Code Quality P1 + Component Split ✅
**Backend (`server.py`):**
- **`get_ohlc_data()` refactor**: extraído en 4 helpers (`_COINGECKO_COIN_MAP`, `_pick_ohlc_interval_ms`, `_candle_from_bucket`, `_group_prices_into_ohlc`), cada uno <20 líneas con type hints. Cyclomatic complexity caída drásticamente.
- **Type hints añadidos a `tests/test_stripe_payments.py` y `tests/test_trading_calculator.py`**: todos los `def test_*` con `-> None`, fixtures con `-> str` / `-> Dict[str, str]`, helper `_login_demo_token() -> str` extraído. `pytest --collect-only` recoge 28 tests sin TypeError.
- **typing imports** ampliados: `from typing import Any, Dict, List, Optional`.

**Frontend split de `CalculatorPage.jsx` (819 → 577 líneas, -29%):**
- **`OptionsSubHeader.jsx`** (88l) — sticky sub-header con ticker search, live price, IV rank badge, 6 tabs (calculator/optimize/flow/chain/iv-surface/education), guide button, LIVE indicator.
- **`StatsKPIBar.jsx`** (147l) — 5 StatCards primarios (MaxProfit/MaxLoss/CapitalReq/POP/ROI) + secondary KPI row (R:R, BreakEven, Premium, Commission input, Leg pills).
- **`CompareBar.jsx`** (136l) — strategy B picker + 6 métricas comparadas con winner indicator (incluye `compareNumeric` y `CompareCell` helpers).
- **`EarningsBanner.jsx`** (36l) — warning IV crush si earnings dentro del expiration.
- **`AdvancedToggles.jsx`** (127l) — botones Kelly/Greeks/Portfolio + paneles colapsables.

**Verificación end-to-end (testing_agent_v3_fork iteration_2):**
- Backend: 8/8 tests P1 OK. Math endpoints sin regresión (Long Call $150/$5: maxProfit=$4749.35, maxLoss=$-500.65, totalFees=$0.65 idénticos pre/post-refactor). OHLC BTC 7d→168 candles, ETH 30d→4h interval, UNKNOWN→200 con fallback bitcoin sin crash.
- Frontend: 12/12 testids visibles, las 6 tabs clickables, compare-panel toggleable, EarningsBanner sin null-crash, advanced toggles drive sus paneles correctamente.
- Lint: ruff + eslint clean en todos los archivos tocados.
- 1 regresión menor detectada y auto-corregida por testing agent: 4 de 6 tabs perdieron `data-testid` durante extracción a `OptionsSubHeader.jsx` → ahora restaurados (calculator/chain/iv-surface/education).

**Issues pre-existentes detectadas (NO regresiones):**
- `LegEditor.jsx`: `<span>` dentro de `<option>` triggers React hydration warning (HTML inválido).
- Recharts cold-mount warning: `width(-1)/height(-1)` antes de que el container se dimensione.


### Feb 2026 — Code Quality P2 (post Code-Review report del usuario) ✅
**Reporte recibido con 11 hallazgos. Análisis técnico:**
- **5 falsos positivos del analizador** (rebatidos con evidencia y línea por línea): "undefined vars en options_math.py 433-434" (if/elif/elif/else exhaustivo), "65 hook deps faltantes" (refs/módulo-const/vars locales async no van en deps), "localStorage sensitive data" (almacena commission $0.65 + accountBalance, no credenciales), "is vs ==" (todas las hits son `is None`, idioma PEP 8 correcto), "random.random() inseguro" (líneas marcadas usan `secure_random.random()` con `secure_random = secrets.SystemRandom()` ya declarado).
- **6 issues reales arreglados**:

**Frontend:**
- `LandingPage.jsx:520` — Star key `i` → `star-${authorKey}-${i}`.
- `TradeAdvancedPanel.jsx:275` — assignment row key `i` → `${a.leg}-${a.strike}`.
- `PayoffChart.jsx` — `optionStrikes.labelObj` precomputado en useMemo + `breakEvenLabels` array memoizado. Elimina recreación de objetos inline.
- `GreeksTimeChart.jsx` — `xDomain`/`xAxisLabel`/`expirationLineLabel` movidos a `useMemo`.

**Backend (`server.py`) — 5 funciones complejas refactorizadas:**
- `get_journal_stats` → 3 helpers: `_empty_journal_stats`, `_aggregate_journal_trades` (single-pass), `_journal_stats_from_aggregate`. Endpoint = 8 líneas.
- `run_monte_carlo` → 2 helpers: `_simulate_one_mc_path`, `_summarize_mc_runs`.
- `run_backtest` → helper `_simulate_backtest_trades`.
- `opt_calculate_payoff/greeks/pnl-attribution/assignment` → 2 helpers compartidos `_legs_to_dicts` (elimina 4× duplicación) y `_payoff_summary`.
- `get_iv_rank` → 3 helpers: `_compute_realized_vol_series`, `_fetch_atm_iv_proxy`, `_iv_rank_recommendation`. Removidos `recommendationLabel/recommendationReason` (frontend ya migró a i18n).

**Verificación** (testing_agent_v3_fork iteration_3, 10/10 backend + frontend OK):
- Math spec-exact: Long Call $150/$5 → maxProfit=$4749.35, maxLoss=$-500.65, totalFees=$0.65, BE=[155.0]. Sell 2 puts $100 (expiry $95) → net_shares=200, net_cash=$-20,000. **Idéntico pre/post-refactor.**
- Schemas inalterados: journal/stats (11 campos), monte-carlo (statistics block), backtest (todos los campos).
- Frontend sin warnings duplicate-key, charts memoizados sin errors, toggle-greeks renderiza 6 SVGs limpios.
- Lint: ruff + eslint clean.
- **No tocados intencionalmente** (riesgo > beneficio): `create_checkout`/`stripe_webhook` (pagos críticos), split de `SimulatorPro`/`EducationPage`/`LandingPage` (deferred al backlog P1).


### Feb 2026 — Code Quality P3 (3er reporte) ✅
**Reporte recibido (3ª iteración) con varios items repetidos. Análisis:**

**Falsos positivos rebatidos por 3ª vez** (mismas evidencias previas): localStorage "sensitive" (UI prefs), `options_math.py:433-434` undefined vars (if/elif/elif/else exhaustivo), 66 hook deps faltantes en `usePersistedState/SubscriptionPage/PaymentPages/SearchBar` (refs no van en deps, vars locales async no son closures, consts de módulo no van en deps), `is None` flagged como `is constants` (PEP 8), `random.random()` flagged ya usa `secure_random` con `SystemRandom`.

**Cosmético arreglado**: `tests/test_refactor_p2.py:17` — `DEMO_PASSWORD` movido a `os.environ.get("DEMO_USER_PASSWORD", "1234")` con `# nosec B105` para silenciar el analizador (fixture pública documentada en `test_credentials.md`, no es secreto real).

**6 refactors backend reales arreglados (los pendientes que diferí en P2):**
- `create_checkout()` → 3 helpers: `_PAYMENT_METHODS_MAP` (const), `_build_pending_transaction(user, plan_id, plan, payment_method)`, `_create_stripe_session(plan, payment_method, success_url, cancel_url, metadata, origin_url)`. Endpoint reducido a 25 líneas.
- `stripe_webhook()` → 2 helpers: `_stripe_session_ids(session_id)` (with safe fallback) y `_activate_paid_subscription(user_id, plan_id, plan, transaction_id, session_id)`. Early return cuando `payment_status != "paid"`. De 63 a 22 líneas.
- `get_unusual_options()` y `market_wide_flow()` → 5 helpers compartidos: `_build_unusual_row`, `_scan_chain_for_unusual`, `_build_market_flow_row`, `_scan_chain_for_flow`, `_scan_ticker_flow`. Elimina anidación 5-deep en ambos.
- `ai_analyze_trade()` → 2 helpers: `_format_legs_for_prompt(legs)`, `_build_ai_trade_prompt(req)` (puro/sin side-effects, fácil unit-testable). Endpoint reducido a 20 líneas.
- `get_stock_data()` (en `stock_data.py`) → 3 helpers: `_get_cached_stock(symbol)`, `_normalize_dividend_yield(raw)`, `_build_stock_dict(symbol, hist, info)`. De 76 a ~20 líneas.

**Bug real encontrado por agente principal y arreglado:**
- `PaymentCancelPage` (`/payment/cancel`) usaba `t()` sin importar `useTranslation` → ReferenceError al renderizar. Agregado `useTranslation` import + restablecidos los strings hardcoded `"Pago Cancelado"` y `"Ver Planes"` (los keys `paymentCancelledTitle_pc01`/`viewPlans_pc02` no existen en `i18n.js` y el patrón `t() || fallback` no funciona porque `t()` devuelve la key como truthy string).

**Verificación testing_agent_v3_fork iteration_4 (52/52 backend ✅):**
- Math regression spec-exact: Long Call $150/$5 fee=0.65 → maxProfit=$4749.35, maxLoss=$-500.65, totalFees=$0.65, BE=[155.0]. **Idéntico pre/post-refactor en 4 rondas.**
- Stripe pipeline 100%: 4 plans × 4 payment methods + invalid_plan→400 + auth gate + status flow + webhook reachable. transaction_id/checkout_url/session_id correctos.
- AI analyze: response markdown con `✅⚠️💡📊` sections, model=`claude-sonnet-4-5`.
- Stock cache hit verificado (2ª llamada <5s, precio idéntico).
- Market flow: scannedTickers=24 (matches `MARKET_FLOW_TICKERS`), filtros respetados.
- Frontend `/payment/cancel`: 0 console errors, 0 raw key leaks (post-fix).
- Lint: ruff + eslint clean.

**Pre-existentes (NO regresiones)**:
- `LegEditor.jsx`: `<span>` dentro de `<option>` → hydration warning (pre-3 rounds).


### Feb 2026 — Matriz de Esperanza Matemática (Education) ✅
**Feature solicitada por el usuario** (con imagen de referencia: tabla "Esperanza Matemática" con %A/%F columns × R columns 0.25–4):
- Nuevo componente `/app/frontend/src/components/education/ExpectancyMatrix.jsx` (~165 líneas).
- Tabla 9×10 derivada de la fórmula `EV = (%A × R) − (%F × 1)` — sin valores hardcoded; coincide exacto con la imagen (10%/0.25=-0.88, 50%/2=+0.50, 50%/1=0.00, 90%/4=+3.50, 30%/2.5=+0.05).
- Headers rojos, filas alternas, celdas rojas para EV negativo y verdes para EV positivo.
- **Interactivo**: hover en celda → highlight con ring + barra superior muestra fórmula expandida (ej: `50% × 2 − 50% × 1 = 0.50 R`).
- Leyenda + interpretación final con tip accionable.
- Inyectado en `EducationPage.jsx` tab "probability" justo después del bloque "Mathematical Expectation".
- **8 idiomas completos**: 8 keys × 8 lenguas = 64 strings añadidos a `/app/frontend/src/lib/i18n.js`.
- Verificación visual: screenshot EN + ES renderizan idénticos a la imagen de referencia con math bit-exact.
- Premium-gated (la página `/education` ya requiere `is_premium`).
- Lint clean.


- **Backtesting histórico de estrategias**: simular ROI de una estrategia mensual sobre N meses (ej: Long Call AAPL 12m)
- **American-style binomial pricing**: premium por ejercicio anticipado, especialmente puts ITM con dividendos
- **Paper Trading**: trades virtuales con precios reales, PnL tracking, win-rate, Sharpe
- ~~Split `CalculatorPage.jsx`~~ **HECHO Feb 2026** (819→577 líneas, 5 sub-componentes)
- Split pendiente: `SimulatorPro.jsx` (973l) y `EducationPage.jsx` (1105l)
- Limpiar HTML inválido en `LegEditor.jsx` (`<span>` dentro de `<option>`) — pre-existente, hydration warning
- Hook deps en `SubscriptionPage`, `PaymentPages`, `DashboardPage` (P2 originalmente, diferido)

### P2 (futuro)
- Live P/L streaming vía WebSocket (reemplazar polling 15s)
- Excel RTD Add-in / API pública B2B
- Gating premium por feature

## Credenciales
- Demo user TCP: `demo@btccalc.pro` / `1234` (lifetime premium)

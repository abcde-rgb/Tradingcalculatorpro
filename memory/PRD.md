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

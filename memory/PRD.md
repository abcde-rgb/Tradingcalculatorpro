# PRD — Trading Calculator PRO + Options (Fusión)

## Problem Statement (original)
"A CONTINUACCION VOY A FUSIONAR UNA WEB DENTRO DE OTRA" — fusionar **OPTIONS-main** dentro de **TradingCalculator.pro-main**, manteniendo TCP como web principal (contenedora) y con su diseño prevaleciendo siempre.

## Decisiones
- Contenedor: **Trading Calculator PRO** (branding, fuentes Space Grotesk, tema verde/oscuro, Header fijo, i18n, rutas)
- Integrado: **OPTIONS Calculator** como ruta interna `/options` accesible desde el nav
- Un solo backend FastAPI (el de TCP) al que se le añadieron los endpoints de OPTIONS
- Un solo frontend React con componentes de OPTIONS bajo `src/components/options/`

## Arquitectura resultante
### Backend (`/app/backend`)
- `server.py` — FastAPI TCP + endpoints OPTIONS mergeados
- `options_math.py` — Black-Scholes + Greeks + payoff (copiado de OPTIONS)
- `stock_data.py` — Yahoo Finance via yfinance (copiado de OPTIONS)
- Endpoints TCP: `/api/auth/*`, `/api/prices`, `/api/forex-prices`, `/api/indices-prices`, `/api/ohlc/{symbol}`, `/api/journal/*`, `/api/portfolio/*`, `/api/alerts/*`, `/api/monte-carlo`, `/api/backtest`, `/api/calculations`, `/api/plans`, `/api/checkout/*`, `/api/webhook/stripe`, `/api/subscriptions/*`, `/api/billing/*`, `/api/user-states/*`
- Endpoints OPTIONS añadidos: `/api/stock/{symbol}`, `/api/tickers/search`, `/api/options/expirations/{symbol}`, `/api/options/chain/{symbol}`, `/api/options/iv-surface/{symbol}`, `/api/calculate/payoff`, `/api/calculate/greeks`

### Frontend (`/app/frontend/src`)
- `App.js` — Router con rutas TCP + nueva ruta `/options`
- `pages/` — páginas TCP (Landing, Dashboard, Pricing, Education, Settings, Auth, Payment, Subscription) + **`OptionsPage.jsx`** (wrapper con Header TCP + Options CalculatorPage)
- `components/layout/Header.jsx` — actualizado: nuevo link "Opciones" en nav
- `components/calculators/` — calculadoras originales TCP
- **`components/options/`** — 11 componentes del calculator de OPTIONS (CalculatorPage, PayoffChart, StrategyBar, GreeksDisplay, GreeksPanel, OptionsChainView, IVSurfaceView, EducationTab, GuideModal, SearchBar, LegEditor)
- `data/mockData.js`, `utils/blackScholes.js`, `utils/constants.js` — utilities OPTIONS
- `services/optionsApi.js` — cliente API OPTIONS (usa `REACT_APP_BACKEND_URL`)

## Implementado (Feb 2026)
- Base TCP copiada 100% (incluyendo i18n, zustand stores, Stripe, PayPal, TradingView charts)
- Endpoints OPTIONS integrados al server unificado sin romper rutas TCP
- Dependencias añadidas: `yfinance`, `scipy`, `beautifulsoup4`, `curl_cffi`, `peewee`, `multitasking`, `frozendict`
- Verificado: `/api/health` ✅, `/api/stock/AAPL` ✅ (Yahoo Finance real), `/api/options/expirations/AAPL` ✅, `/api/options/chain/AAPL` ✅, `/api/calculate/payoff` ✅, `/api/plans` ✅, `/api/prices` ✅ (CoinGecko)
- Frontend screenshot: home TCP intacta ✅, `/options` renderiza OptionsPro dentro del header TCP ✅

## Backlog / P1
- Sub-domain theming: opcionalmente forzar dark mode solo en `/options` para consistencia
- Traducir nav "Opciones" usando i18n (`t('options')`) cuando se añada la key
- Añadir entrada destacada a OPTIONS en la LandingPage (card + CTA)
- Gating premium: considerar si IV Surface / multi-leg builder deben requerir plan premium

## Credenciales
- Demo user TCP: `demo@btccalc.pro` / `1234` (acceso lifetime premium)

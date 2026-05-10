# Auditoria profesional TradingCalculator.pro - 2026-05-10

## Alcance

Analisis desde cero del repositorio `abcde-rgb/Tradingcalculatorpro`: frontend React, backend FastAPI, Netlify, Stripe, Google, persistencia, datos de mercado, calculadoras, admin, autenticacion, seguridad y puntos de conexion.

Fuentes externas consultadas:

- Stripe Payment Links: https://docs.stripe.com/payment-links/customize
- Google Identity Services, verificacion de ID token: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- Netlify file-based configuration: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify build software / Node: https://docs.netlify.com/build/configure-builds/available-software-at-build-time/
- MongoDB case-insensitive indexes: https://www.mongodb.com/docs/v8.0/core/index-case-insensitive/
- Google Cloud Secret Manager best practices: https://docs.cloud.google.com/secret-manager/docs/best-practices

## Cambios aplicados en esta revision

1. React/Netlify:
   - `frontend/package.json`: React y React DOM pasan a React 18 para satisfacer `react-day-picker@8.10.1`.
   - `frontend/package-lock.json`: lockfile regenerado con React 18.
   - `netlify.toml`: eliminado `NPM_FLAGS = "--legacy-peer-deps"` para no ocultar conflictos reales.
   - `netlify.toml`: `publish` corregido a `build` porque Netlify resuelve ese path relativo a `base = "frontend"`.
   - `netlify.toml`: agregados headers basicos `nosniff`, `DENY`, `strict-origin-when-cross-origin` y `Permissions-Policy`.

2. URLs de API en frontend:
   - Todos los modulos que usaban `process.env.REACT_APP_BACKEND_URL` directamente ahora pasan por `frontend/src/lib/api.js`.
   - Esto evita URLs rotas tipo `undefined/api/...` y permite fallback a `/api` cuando no hay backend externo configurado.

3. Emails y duplicados:
   - `backend/server.py`: normalizacion de email con `strip().lower()` en registro, login, Google OAuth y admin.
   - Indices MongoDB: `email` unico, `google_sub` unico/sparse e indice `email + auth_provider`.
   - Nuevo endpoint admin: `GET /api/admin/users/duplicate-emails`, para detectar duplicados historicos por email normalizado.

4. Stripe y planes:
   - `SUBSCRIPTION_PLANS` actualizado a CHF para coincidir con los productos/precios reales de Stripe.
   - Se agregan `stripe_price_id` y `payment_link` a cada plan.
   - MRR admin ajustado a CHF y se conserva `mrr_usd` como clave legacy.
   - Eliminado codigo duplicado inalcanzable en `_create_stripe_session`.

5. Google/public settings:
   - `/api/public/settings` ahora devuelve valores publicos desde DB o variables de entorno, sin exponer secretos.

## Estado estructural

### Frontend

Stack:

- React + CRACO + Tailwind/Radix/lucide.
- Routing principal en `frontend/src/App.js`.
- Estado: Zustand + localStorage + backend persistence via `/api/user-states/*`.
- i18n: 8 idiomas (`es`, `en`, `de`, `fr`, `ja`, `ru`, `zh`, `ar`).
- Netlify despliega solo el build estatico del frontend.

Paginas principales:

- `/`: landing, precios, valor de producto, TradingView, demo visible.
- `/dashboard`: panel premium con chart, alerts, journal, calculadoras.
- `/pricing`: checkout Stripe Payment Links.
- `/settings`: perfil/subscripcion.
- `/education`: educacion, patrones, detector.
- `/options`: calculadora avanzada de opciones.
- `/performance`: journal/analytics de trading.
- `/admin`: usuarios, metricas, integraciones, secretos enmascarados, audit log.
- `/login`, `/register`, `/payment/success`, `/payment/cancel`.

### Backend

Stack:

- FastAPI, Motor/MongoDB, JWT, bcrypt, slowapi, httpx, yfinance, Stripe SDK.
- Rutas bajo prefijo `/api`.
- CORS configurado por `CORS_ORIGINS`, con fallback actual `*`.

Familias de rutas:

- Auth: `/auth/register`, `/auth/login`, `/auth/google`, `/auth/me`, `/auth/logout`.
- Precios/datos: `/prices`, `/forex-prices`, `/indices-prices`, `/ohlc/{symbol}`, `/stock/{symbol}`, `/tickers/*`.
- Calculadoras: `/monte-carlo`, `/backtest`, `/calculate/payoff`, `/calculate/greeks`, `/calculate/pnl-attribution`, `/calculate/assignment`.
- Opciones: `/options/expirations`, `/options/chain`, `/options/iv-surface`, `/options/iv-rank`, `/options/unusual`, `/options/market-flow`, `/options/positions/*`, `/optimize`, `/options/ai-analyze`.
- Persistencia: `/calculations`, `/user-states/*`, journal, portfolio, alerts, performance trades.
- Billing: `/plans`, `/checkout/create`, `/checkout/status/{session_id}`, `/webhook/stripe`, `/subscriptions/*`, `/billing/*`.
- Admin: `/admin/users`, `/admin/users.csv`, `/admin/metrics`, `/admin/promote`, `/admin/users/*`, `/admin/settings`, `/admin/audit-log`, `/admin/users/duplicate-emails`.

## Inventario calculadora por calculadora

1. PercentageCalculator
   - Persistencia: `percentage_calculator`.
   - Sin API directa.
   - Correcto para calculo local, pero depende de que el estado remoto funcione si el usuario esta logueado.

2. TargetPriceCalculator
   - Persistencia: `target_price_calculator`.
   - Sin API directa.
   - Logica local sencilla.

3. PositionSizeCalculator
   - Persistencia: `position_size_calculator`.
   - Sin API directa.
   - Riesgo: requiere validaciones fuertes de cero/negativos para no producir tamanos absurdos.

4. SpotCalculator
   - Persistencia: `spot_calculator`.
   - Sin API directa.
   - Bien para calculo local; falta capa central de moneda.

5. LeverageCalculator
   - Persistencia: `leverage_calculator`.
   - Sin API directa.
   - Correcto como calculadora local.

6. LotSizeCalculator
   - Persistencia: `lot_size_calculator`.
   - Sin API directa.
   - Riesgo de precision: forex real exige pip value por par/divisa y conversion de moneda.

7. FibonacciCalculator
   - Persistencia: `fibonacci_calculator`.
   - Sin API directa.
   - Correcto como herramienta local.

8. PatternTradingCalculator
   - Persistencia: `pattern_trading_calculator`.
   - Sin API directa.
   - El detector real esta en educacion, no en esta calculadora.

9. MonteCarloSimulator
   - Persistencia: `montecarlo_simulator`.
   - Usa `/api/monte-carlo`.
   - Premium gate correcto en frontend, pero el backend tambien debe ser la autoridad.

10. SimulatorPro
   - No usa `usePersistedState`.
   - Debe revisarse si se espera que no borre datos.

11. Options Calculator
   - Usa yfinance para stock, expirations y chain.
   - Calcula Greeks, payoff, IV surface, unusual flow, market flow, optimizer, AI coach y saved positions.
   - Bien planteado, pero varios endpoints hacen trabajo pesado sin cache persistente ni cuotas.

## Datos de mercado e instrumentos

Actual:

- Crypto: CoinGecko para `/prices` y OHLC.
- Acciones/ETF/indices/forex/commodities/options: yfinance.
- TradingView: iframe/widget para chart visual.
- Forex/indices en `/forex-prices` y `/indices-prices`: siguen teniendo datos simulados en `server.py`.
- `backend/fixes.py` contiene integraciones Finnhub/Metals API, pero no esta conectado realmente a `server.py`.

Problemas:

- No hay proveedor unico de mercado con contrato claro.
- Si yfinance falla, `stock_data.py` devuelve datos aleatorios simulados; eso es peligroso para una herramienta financiera.
- No hay marca visible/estructurada `is_simulated` en todos los fallbacks.
- No hay capa de conversion de moneda centralizada.
- Precios, planes y UI mezclaban EUR/USD/CHF; ya se corrigio la fuente backend de planes a CHF.
- No hay control de cuotas, retry/backoff ni cache persistente para llamadas caras.

Recomendacion:

- Crear `market_data_provider.py` con contrato unico:
  - `get_quote(symbol, asset_class, currency)`
  - `get_fx_rate(base, quote)`
  - `get_options_chain(symbol, expiration)`
  - `is_delayed`, `provider`, `timestamp`, `is_simulated`
- Usar proveedores reales configurables por env/secret:
  - Crypto: CoinGecko o CoinMarketCap.
  - Stocks/options: Polygon, Tradier, Finnhub, Twelve Data o proveedor licenciado.
  - FX: ExchangeRate.host/Fixer/Finnhub/OANDA segun licencia.
  - Commodities: Metals API o proveedor de commodities.

## Seguridad y autenticacion

Lo que esta bien:

- Password hashing con bcrypt.
- JWT con `jti`, blacklist de tokens y revocacion por cambio de password.
- `require_user` y `require_admin` en backend.
- Rate limit en register/login/Google login.
- Audit log admin con IP, user-agent, accion y target.
- Google OAuth verifica ID token con libreria oficial.
- Se enmascaran secretos al devolver `/admin/settings`.

Riesgos y fallos:

1. Critico: demo admin publico.
   - El frontend muestra `demo@btccalc.pro / 1234`.
   - El backend crea ese usuario como admin y premium lifetime.
   - En produccion esto equivale a credencial admin publica si el backend esta expuesto.
   - Requiere decision de producto: eliminarlo, limitarlo a entorno demo aislado o hacerlo no-admin por defecto.

2. Alto: CORS demasiado abierto.
   - `allow_credentials=True` con origen fallback `*` es mala configuracion para un API con JWT y admin.
   - Debe fijarse a dominios concretos: Netlify production, deploy previews autorizados y backend admin.

3. Alto: secretos guardados en MongoDB.
   - El panel admin permite guardar secretos Stripe/PayPal/SendGrid en `app_settings`.
   - La UI los enmascara, pero siguen en claro en DB.
   - Google Cloud recomienda Secret Manager/IAM/rotacion para secretos de produccion.

4. Alto: falta 2FA/RBAC granular para admin.
   - Solo existe `is_admin`.
   - No hay `admin:read`, `admin:write`, `billing:write`, `settings:write`.

5. Alto: Google OAuth y email.
   - Se usa `verify_oauth2_token`, correcto.
   - Google advierte que `email` puede no ser autoridad para cuentas que no son Gmail ni Workspace.
   - Ya se guarda `google_sub`; debe usarse como identidad primaria para cuentas Google y fusionar emails con cuidado.

6. Medio: contrasenas minimas de 4 caracteres.
   - Registro/admin reset aceptan passwords demasiado cortas.
   - Recomendado: minimo 10-12, blacklist de passwords comunes, rate limit y opcion 2FA.

7. Medio: Webhook Stripe devuelve `{"status":"error"}` sin HTTP error.
   - Puede ocultar fallos de firma/procesamiento.
   - Debe validar firma con `STRIPE_WEBHOOK_SECRET`, devolver 400 en firma invalida, usar idempotencia por event id.

8. Medio: tests de backend apuntan a preview externo por defecto.
   - Prueban un entorno remoto y no necesariamente este commit.

## Stripe

Lo que esta bien:

- Payment Links reales para los cuatro planes.
- `prefilled_email`, `client_reference_id` y UTM desde el frontend.
- Los productos/precios reales estan ya documentados en codigo backend.
- Frontend no contiene secret keys.

Problemas:

- Payment Links no activan premium dentro de la app por si solos.
- Stripe documenta que el email prellenado puede ser editable; para usuario logueado conviene `locked_prefilled_email`.
- El backend tiene flujo `/checkout/create` basado en `emergentintegrations`, pero esa dependencia no aparece en `backend/requirements.txt`.
- Los endpoints de suscripcion presuponen `stripe_customer_id`/`stripe_subscription_id`, que solo se guardan si el webhook/backend funciona.
- `change-plan` aun responde "cancela y compra de nuevo"; falta modificar subscription item real con Price IDs.

Prioridad Stripe:

1. Desplegar backend real.
2. Crear endpoint webhook publico HTTPS.
3. Configurar Stripe webhook `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated/deleted`.
4. Usar event id para idempotencia.
5. Mapear `client_reference_id` o `customer_email` normalizado a usuario.
6. Bloquear email en Payment Links para usuarios logueados cuando aplique.
7. Activar Customer Portal para cambios/cancelaciones reales.

## Netlify y despliegue

Lo que esta bien:

- `netlify.toml` define `base = "frontend"`, build y publish.
- Node 18 esta fijado y es soportado por Netlify.
- React 18 elimina el conflicto con `react-day-picker`.

Problema principal:

- Netlify esta desplegando un SPA estatico. El backend FastAPI no esta desplegado como Netlify Function ni proxyado a un servicio real.
- Por eso las rutas `/api/*` del frontend dependen de `REACT_APP_BACKEND_URL` o de un proxy externo.
- Sin backend desplegado: login, admin, persisted state, mercado real, Stripe entitlement y Google settings fallan aunque el build pase.

Recomendacion:

- Opcion A: desplegar backend en Cloud Run/Railway/Fly/Render y configurar `REACT_APP_BACKEND_URL`.
- Opcion B: migrar endpoints criticos a Netlify Functions.
- Opcion C: agregar redirect proxy `/api/*` hacia backend estable, pero el destino debe venir de un valor no secreto gestionado correctamente.

## Google e integraciones

Actual:

- Google OAuth frontend via `@react-oauth/google`.
- Backend verifica ID token.
- Admin permite configurar Google Client ID/Secret, GA4, GTM, Search Console, AdSense, Bing, Clarity.
- GoogleIntegrations carga GA4/GTM/AdSense/Search Console/Bing desde `/api/public/settings` o env.

Problemas:

- `GoogleOAuthProvider` en `App.js` solo usa `REACT_APP_GOOGLE_CLIENT_ID`; no consume dinamicamente `/api/public/settings`.
- No existe integracion directa con Google Cloud Secret Manager.
- No existe Google Drive/Sheets/Calendar/Cloud Storage real en la app.
- No hay Service Account ni IAM documentado.
- Secrets en MongoDB no cumplen el nivel recomendado para produccion.

Recomendacion Google:

1. Mantener OAuth Client ID en variable publica de build.
2. Mover secretos a Google Secret Manager o Secret Manager equivalente del hosting.
3. Usar Secret Manager desde backend en startup, cacheando valores y rotando con version.
4. Agregar Google Drive/Sheets solo si hay caso de uso claro:
   - exportar journal a Google Sheets.
   - importar operaciones desde Sheets.
   - backups en Drive/Cloud Storage.
5. No poner service account JSON en repo.

## Persistencia y "que los datos no se borren"

Actual:

- Auth/token y usuario se guardan en Zustand/localStorage.
- Varias calculadoras usan `usePersistedState` y guardan en `/api/user-states/save`.
- Trading journal local usa `trading-journal-storage`.
- Options usa localStorage para algunos numeros y recents.
- Backend `user_states` tiene TTL de 90 dias.

Problemas:

- Si el backend no esta conectado, la persistencia remota no funciona.
- TTL 90 dias contradice "que no se borren" si el usuario espera permanencia.
- Hay persistencia repartida entre DB y localStorage sin modelo unico.
- No hay export/import global de configuracion del usuario.

Recomendacion:

- Quitar TTL de `user_states` o ampliarlo segun plan.
- Persistir todas las calculadoras en DB por usuario con version de schema.
- Crear backup/export JSON y sync opcional a Google Drive/Sheets.
- Mostrar estado "guardado/sin conexion" en UI.

## Colores y UI

Puntos fuertes:

- Buen uso de Tailwind, Radix y lucide.
- UI completa: admin, pricing, options, performance, dashboard.
- i18n amplio.

Problemas:

- Paleta con muchos rojos/verdes/neones propios de trading, pero algunos apartados repiten estilos y pueden saturar.
- Textos demo/credenciales en landing y login dan aspecto no productivo.
- Admin tiene tablas densas pero falta paginacion real en UI.
- No hay revision visual mobile completa registrada.

## Partes incompletas, inutiles o duplicadas

1. `backend/admin_routes.py`
   - Tiene rutas admin alternativas pero no esta integrado en `server.py`.
   - Riesgo de divergencia con las rutas admin reales.

2. `backend/fixes.py`
   - Contiene mejoras para Finnhub, Metals, AI guard y Stripe plan change.
   - No esta conectado al servidor principal.

3. `backend/patches/server_fixes.patch`
   - Parche historico no aplicado de forma completa.

4. `AUDIT_REPORT_2026-05-09.md` y `ANALISIS_APIS_ADMIN_GOOGLE_2026-05-09.md`
   - Utiles como contexto, pero parte ya quedo obsoleta o parcialmente aplicada.

5. `emergentintegrations`
   - Importado en runtime, ausente de requirements.

6. Fallbacks simulados
   - Forex/indices/metales y fallback aleatorio de stock no son datos financieros confiables.

## Lista priorizada de problemas

Criticos:

1. Backend no esta desplegado/conectado a Netlify de forma garantizada.
2. Demo admin publico con password `1234`.
3. Stripe Payment Links no otorgan premium automaticamente sin webhook/backend real.
4. CORS wildcard con credenciales en API.

Altos:

5. Secrets administrativos guardados en MongoDB en claro.
6. Falta 2FA y RBAC granular para admin.
7. `emergentintegrations` importado pero no declarado.
8. Mercado real mezclado con simulaciones sin contrato uniforme.
9. `user_states` borra datos tras 90 dias.
10. Google OAuth depende de env de build y no del panel admin.
11. No hay capa real de conversion de moneda.
12. Tests backend apuntan a previews remotos.

Medios:

13. `admin_routes.py` y `fixes.py` duplican/contienen logica no conectada.
14. `change-plan` de Stripe no cambia plan real.
15. Webhook Stripe debe validar firma/idempotencia de forma explicita.
16. Contrasenas demasiado cortas.
17. Falta CSP completa en Netlify. Ya se agregaron headers basicos; CSP requiere pruebas porque puede romper Google/AdSense/TradingView/Stripe.
18. No hay observabilidad centralizada.
19. Cache de mercado en memoria no escala entre instancias.
20. Algunos textos i18n parecen auto-generados y deben revisarse por nativo.
21. `npm audit --omit=dev` reporta vulnerabilidades transitivas en la cadena CRA/react-scripts.

Bajos:

22. Algunos comentarios/docs historicos ya no reflejan el estado actual.
23. Falta documentacion de arquitectura y variables requeridas por entorno.
24. Falta matriz de proveedores de datos y licencias.

## Verificacion ejecutada

- `python -m py_compile backend/server.py backend/stock_data.py backend/options_math.py backend/options_optimize.py backend/performance.py backend/candle_patterns.py`: OK.
- `npm ls react react-dom react-day-picker --depth=0`: OK, React 18.3.1.
- `npm run build`: OK, con warnings de hooks en `TradingViewChart`, `KellyPanel` y `AdminPage`; bundle principal ~851 kB gzip.
- `npx netlify build --offline`: OK con la configuracion de `netlify.toml`.
- Browser smoke test sobre build local (`http://127.0.0.1:4173/`): landing renderiza, enlaces a pricing/login presentes, navegacion SPA a `/pricing` funciona y el boton/flujo de checkout aparece sin errores de consola capturados.
- `npm audit --omit=dev --json`: 28 vulnerabilidades transitivas (11 low, 3 moderate, 14 high), principalmente asociadas a CRA/react-scripts/tooling (`svgo`, `serialize-javascript`, `webpack-dev-server`, etc.). No se aplico `npm audit fix --force` porque propone cambios mayores/riesgosos; la solucion profesional es planificar migracion de CRA/CRACO a Vite o actualizar cadena de build con pruebas.
- `pip-audit`: no disponible en el entorno local.

## Cosas que estan bien

1. Arquitectura frontend/back separada y comprensible.
2. Rutas backend bien agrupadas bajo `/api`.
3. Uso de bcrypt para passwords.
4. JWT con `jti` y revocacion.
5. Rate limiting en rutas de auth.
6. Audit log admin.
7. Google ID token verificado con libreria oficial.
8. Buen inventario de calculadoras y herramientas.
9. Muchas calculadoras ya tienen persistencia.
10. Opciones avanzadas: payoff, Greeks, IV surface, unusual flow, optimizer, portfolio Greeks.
11. i18n en 8 idiomas.
12. Stripe Payment Links reales ya existen.
13. Netlify tiene config versionada.
14. React 18 corrige el fallo de dependency tree.
15. `getApiBaseUrl()` reduce errores de configuracion frontend.

## Prompt operativo para la siguiente fase

Usa este prompt para una fase de correccion completa y controlada:

```text
Actua como tech lead senior y security engineer. Trabaja sobre el repo TradingCalculatorpro. Objetivo: dejar la app lista para produccion con frontend Netlify, backend real, Stripe Billing, Google OAuth y datos de mercado confiables.

Prioridad 1 - Produccion y conexion:
1. Decidir y configurar hosting backend (Cloud Run/Railway/Fly/Render o Netlify Functions).
2. Configurar REACT_APP_BACKEND_URL en Netlify para production y deploy-preview.
3. Verificar con Browser que login, pricing, dashboard, options, performance y admin no generan llamadas rotas.

Prioridad 2 - Seguridad:
1. Eliminar demo admin publico o limitarlo a entorno demo aislado.
2. Cerrar CORS a dominios concretos.
3. Subir secretos a Secret Manager o equivalente; no guardarlos en MongoDB en claro.
4. Agregar 2FA/RBAC para admin.
5. Endurecer passwords y auth rate limits.
6. Agregar security headers/CSP en Netlify.

Prioridad 3 - Stripe:
1. Sustituir o completar emergentintegrations; declarar dependencia o usar Stripe SDK oficial.
2. Implementar webhook Stripe oficial con firma, idempotencia y eventos de subscription/invoice.
3. Mapear checkout.session.completed a usuario por client_reference_id/email normalizado.
4. Usar locked_prefilled_email para usuarios autenticados.
5. Implementar Customer Portal y change-plan real con price IDs.

Prioridad 4 - Datos de mercado:
1. Crear market_data_provider.py con proveedor, timestamp, is_delayed, is_simulated y cache.
2. Conectar Finnhub/Polygon/Tradier/TwelveData/OANDA segun licencia.
3. Eliminar datos aleatorios como fallback financiero; devolver unavailable con mensaje claro.
4. Crear capa FX/currency conversion central.

Prioridad 5 - Persistencia:
1. Quitar TTL de user_states o hacerlo configurable por plan.
2. Persistir todos los formularios/calculadoras por usuario.
3. Agregar export/import JSON y opcion Google Sheets/Drive.

Prioridad 6 - QA:
1. Reescribir tests para apuntar a entorno local/CI.
2. Agregar e2e Playwright para rutas publicas, auth, pricing, admin y options.
3. Ejecutar npm build, pytest y pruebas Browser antes de merge.

Entrega:
- PR con commits pequenos.
- Reporte de seguridad con hallazgos y mitigaciones.
- Preview Netlify funcionando.
- Lista de variables de entorno obligatorias por entorno.
```

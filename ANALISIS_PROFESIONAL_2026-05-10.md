# Análisis profesional estructural (2026-05-10)

## 1) Alcance auditado
- Backend FastAPI (`backend/server.py`) y módulos funcionales.
- Frontend React + Zustand (`frontend/src/**`).
- Pruebas automatizadas existentes (`backend/tests/**`).
- Integraciones de terceros detectadas: Google OAuth, Stripe, MongoDB, SendGrid, proveedores de mercado.

## 2) Inventario de APIs e integraciones (estado actual)

### 2.1 Autenticación y seguridad
- Registro/login por email/password implementado.
- OAuth de Google implementado con verificación de token (`google.oauth2.id_token.verify_oauth2_token`).
- JWT con `jti` + revocación parcial implementada.
- Rate limiting con `slowapi` presente.

### 2.2 Pagos
- Stripe integrado en backend (checkout, webhooks, cancelación, cambios de plan, portal de facturación).

### 2.3 Datos de mercado e instrumentos
- Endpoints para precios, OHLC, forex/índices y opciones presentes.
- Cálculo de opciones/greeks/payoff y simulaciones en backend.

### 2.4 Persistencia
- MongoDB como datastore principal.
- Frontend utiliza `zustand/persist` para sesión y journal (evita pérdidas por refresh en esas áreas).

### 2.5 Google
- Google OAuth en frontend y backend.
- Componente de integraciones Google existe, pero no hay evidencia de integración productiva completa con Google Cloud (BigQuery/Firestore/PubSub) para datos de negocio críticos.

## 3) Hallazgos críticos (prioridad alta)

1. **Clave Stripe por defecto insegura**
   - Se usa fallback `sk_test_emergent` si no existe variable de entorno.
   - Riesgo: despliegues con clave incorrecta o insegura.

2. **Dependencia de secretos con defaults en runtime**
   - `JWT_SECRET` se autogenera si no existe; útil en dev pero peligroso en producción (invalidación de sesiones tras reinicio e inconsistencia operativa).

3. **Control de duplicados por email incompleto para caso “mismo email con distintos nombres” en federación**
   - Se valida unicidad en registro por email, pero falta política explícita y normalización/índices fuertes documentados para merges entre auth providers y cambios de perfil.
   - Recomendado: índice único case-insensitive y reglas de reconciliación por proveedor + auditoría.

4. **Testing E2E acoplado a URL remota y no determinista**
   - Los tests dependen de `BASE_URL` externa, fallando por proxy/403 en entorno actual.
   - Falta suite local aislada con `TestClient` + fixtures de DB mock.

5. **Integración “real-time/production grade” de mercado incompleta**
   - Existe capa de datos, pero no se observa contrato robusto de calidad (latencia, TTL, circuit breakers, fallback por proveedor, versionado de payload).

## 4) Hallazgos importantes (prioridad media)

1. **Persistencia de datos de usuario desigual**
   - Auth y journal persisten en localStorage, pero no todos los formularios/calculadoras garantizan recuperación de estado tras refresh o cierre inesperado.

2. **Internacionalización parcial**
   - Existe base i18n, pero no se ve una estrategia completa de locale/currency integrada end-to-end (frontend, backend, facturación, reportes, formato numérico y timezone).

3. **Observabilidad insuficiente para producción**
   - No se aprecia estandarización completa de tracing, métricas SLO (p95/p99), dashboards de errores por endpoint ni alerting centralizado.

4. **Hardening de seguridad mejorable**
   - Faltan evidencias de políticas CSP, rotación automática de secretos, gestión KMS centralizada, detección de abuso por fingerprint, y controles anti-automatización en registro/login.

## 5) Hallazgos menores / deuda técnica

- Código grande en `backend/server.py` (alto acoplamiento; conviene modularizar por dominios).
- Potenciales funciones utilitarias infrautilizadas dispersas en frontend y backend (recomendado barrido con cobertura + dead code detection).
- Documentación técnica inconsistente entre reportes previos y estado real ejecutable.

## 6) Análisis por capa

### 6.1 Backend
- Fortalezas: autenticación variada, Stripe avanzado, revocación JWT, rate limiting.
- Debilidades: defaults inseguros, acoplamiento monolítico, testing dependiente de red externa.

### 6.2 Frontend
- Fortalezas: arquitectura por páginas/componentes, persistencia parcial, Google OAuth provider.
- Debilidades: persistencia no homogénea por herramienta/calculadora, i18n/currency incompleto, QA visual/funcional no sistemático por sección.

### 6.3 Admin
- Hay rutas y capacidades de administración, pero se recomienda reforzar:
  - RBAC granular por acción.
  - auditoría inmutable y exportable.
  - flujos de aprobación para cambios críticos (planes, claves, permisos).

### 6.4 APIs externas
- Stripe y Google están conectadas.
- Falta un framework de “health contractual” por proveedor (estado, retries, degradación controlada, colas de reintento, alarma automática).

## 7) Integración Google Cloud (propuesta profesional)

1. **Identidad y secretos**: Secret Manager + IAM mínimo privilegio.
2. **Persistencia de datos introducidos**: Firestore/Cloud SQL + colas Pub/Sub para eventos críticos.
3. **Analytics**: export de eventos a BigQuery para métricas de negocio y QA.
4. **Observabilidad**: Cloud Logging + Error Reporting + Monitoring.
5. **API segura**: Cloud Armor + rate limits + WAF + reCAPTCHA enterprise (si aplica).

## 8) Verificación de no pérdida de datos

- Implementar autosave por formulario/calculadora con versionado y checksum.
- Estrategia “local-first + sync”:
  - localStorage/IndexedDB temporal
  - sync transaccional al backend
  - recuperación ante cierre abrupto
- UX: indicador visual de guardado y reintento.

## 9) Plan de remediación por fases

### Fase 1 (48-72h)
- Eliminar defaults inseguros de secretos/keys en producción.
- Índice único robusto para email y normalización.
- Estabilizar tests locales sin red externa.

### Fase 2 (1-2 semanas)
- Modularizar backend por dominios (auth, billing, market-data, admin).
- Persistencia uniforme de formularios/calculadoras.
- i18n + currency conversion end-to-end.

### Fase 3 (2-4 semanas)
- Integración Google Cloud productiva.
- Observabilidad completa + SLO + alertas.
- Hardening de seguridad y pentest.

## 10) Estado de “preview Netlify” y GitHub
- En este entorno no hay sesión autenticada de Netlify ni credenciales Git remotas del usuario para publicar preview o push real.
- Sí se deja análisis y prompt de ejecución para que lo uses en CI/CD con tus credenciales.


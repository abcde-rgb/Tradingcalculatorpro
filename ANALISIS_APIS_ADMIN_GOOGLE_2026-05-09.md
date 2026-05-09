# Análisis técnico: APIs faltantes, herramientas Google y perfil Admin

## 1) APIs faltantes / recomendadas (prioridad alta)

1. `GET /api/admin/audit-log`
   - Falta trazabilidad de acciones administrativas (promociones, cambios de plan, exportaciones CSV).
   - Riesgo actual: no hay registro central para forense y cumplimiento.

2. `POST /api/admin/revoke-sessions`
   - Para invalidar sesiones/tokens de un usuario comprometido.
   - Hoy no existe una revocación explícita de JWT por usuario.

3. `GET /api/admin/user/{id}/activity`
   - Vista de actividad de seguridad por usuario (último login, IP, proveedor auth, cambios de rol/plan).

4. `POST /api/admin/set-premium-expiry`
   - Existe cambio de plan, pero no una API explícita para ajustar vencimiento/auditar excepción comercial.

5. `POST /api/admin/feature-flags`
   - Activar/desactivar features por segmento para pruebas controladas.

6. `POST /api/auth/2fa/enroll` + `POST /api/auth/2fa/verify`
   - No hay 2FA para usuarios admin.

## 2) Herramientas Google que ya están y las que faltan

### Ya presentes
- Google OAuth login (`/api/auth/google`).
- Integración cliente para GA4, GTM, Search Console verification y AdSense (por variables de entorno).

### Faltantes recomendadas
1. Google reCAPTCHA Enterprise / v3 en login y register.
2. Google Cloud Secret Manager para secretos de producción (JWT/Stripe/OAuth).
3. Google Cloud Logging + Error Reporting + Cloud Trace (observabilidad).
4. Google BigQuery export de eventos para analytics de producto y fraude.
5. Google Identity-Aware Proxy / BeyondCorp para panel admin interno (si aplica).
6. Google Workspace SMTP/OAuth o API Gmail para alertas transaccionales auditables.

## 3) Perfil Admin: estado y poderes actuales

## ¿Está 100% bien?
No, funcionalmente está bastante completo para operación básica, pero **no está 100% robusto** para seguridad enterprise.

### Poderes actuales del admin (confirmados)
- Ver métricas globales (`/admin/metrics`).
- Listar usuarios con filtros y paginación (`/admin/users`).
- Exportar usuarios a CSV (`/admin/users.csv`).
- Promover/degradar admins (`/admin/promote`).
- Ajustar plan de suscripción de usuarios (`/admin/set-plan` en router modular).

### Controles existentes
- `require_admin` valida `is_admin=True` en backend.
- Protección para evitar auto-democión en `admin_routes.py` (router modular).

### Riesgos detectados en permisos
1. No hay RBAC granular (solo `is_admin` booleano).
2. No hay auditoría fuerte de acciones admin persistida en colección dedicada.
3. No hay 2FA obligatorio para admin.
4. Potencial inconsistencia: existen endpoints admin duplicados entre `server.py` y `admin_routes.py`, con reglas no necesariamente idénticas.
5. Export CSV de usuarios puede ser sensible si no hay rate limit, watermarking o motivo de exportación.

## 4) Recomendación inmediata (orden de ejecución)
1. Unificar en una sola implementación de endpoints admin (evitar duplicidad).
2. Añadir `audit_log` + correlación por `request_id` para toda acción admin.
3. Implementar RBAC por scopes (`admin:read`, `admin:write`, `admin:billing`).
4. Exigir 2FA a cuentas admin.
5. Añadir reCAPTCHA y rate-limit estricto a auth/admin endpoints.

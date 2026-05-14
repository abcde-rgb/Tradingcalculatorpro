# Prompt maestro (para ejecutar corrección integral)

Actúa como **arquitecto principal + staff engineer + security engineer + QA lead** y corrige de forma profesional todo el proyecto TradingCalculatorPro.

## Objetivo
Entregar una versión producción-ready del sistema completo (frontend, backend, admin, APIs externas) con foco en:
- seguridad,
- estabilidad,
- integridad de datos,
- no duplicidad de cuentas por email con distintos nombres,
- persistencia de datos introducidos,
- integración real con proveedores de mercado, Stripe, Google, Google Cloud,
- soporte multi-moneda y multi-idioma,
- testing integral automatizado.

## Instrucciones obligatorias
1. Audita **herramienta por herramienta** y **calculadora por calculadora**.
2. Lista y valida **todas las APIs** (auth, market data, billing, admin, alerts, analytics).
3. Detecta y corrige:
   - código incompleto,
   - funciones inútiles/no usadas,
   - rutas sin protección,
   - errores de validación,
   - defaults inseguros de secretos.
4. Implementa anti-duplicidad de usuario:
   - normalización de email (lowercase + trim),
   - índice único case-insensitive en DB,
   - política de merge/reconciliación entre login clásico y Google OAuth,
   - auditoría de conflictos.
5. Asegura persistencia de datos introducidos por el usuario:
   - autosave por formulario/calculadora,
   - recuperación tras refresh/cierre,
   - sincronización backend confiable con retries.
6. Integra Google Cloud de forma real:
   - Secret Manager,
   - Firestore o Cloud SQL,
   - BigQuery para analytics,
   - Cloud Logging/Monitoring.
7. Revisa colores, consistencia visual, accesibilidad (WCAG), estados de carga/error y UX.
8. Ejecuta testing total:
   - unit, integration, e2e,
   - pruebas por sección (landing, auth, dashboard, pricing, subscription, options, performance, admin),
   - pruebas de conectividad API y degradación por proveedor caído.
9. Entrega reporte final profesional con:
   - ✅ Lo que está bien,
   - ❌ problemas críticos,
   - ⚠️ riesgos medios,
   - plan de acción priorizado por fases.
10. Genera:
   - commits atómicos,
   - PR técnico detallado,
   - checklist de despliegue,
   - guía para preview en Netlify.

## Criterios de aceptación
- No secretos hardcodeados.
- No cuentas duplicadas por email.
- Datos de formularios no se pierden.
- Suite de tests estable sin depender de URLs externas frágiles.
- Integración API con fallback y observabilidad.
- Admin seguro con auditoría.
- Multi-idioma y multi-moneda funcional end-to-end.


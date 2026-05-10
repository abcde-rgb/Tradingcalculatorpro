"""
admin_routes.py — Endpoints del panel de administración
=========================================================
Todos los endpoints requieren `require_admin` (is_admin=True en MongoDB).

Endpoints:
  GET  /admin/metrics                     — métricas globales
  GET  /admin/users                       — lista paginada/filtrable de usuarios
  GET  /admin/users.csv                   — exportación CSV
  POST /admin/promote                     — dar/quitar rol admin
  POST /admin/set-plan                    — asignar plan premium
  POST /admin/users/{user_id}             — editar usuario (nombre, email, plan, admin)
  POST /admin/users/{user_id}/reset-password — resetear contraseña
  GET  /admin/settings                    — ver todos los conectores/APIs (secretos enmascarados)
  POST /admin/settings                    — guardar/actualizar conectores y APIs
  GET  /public/settings                   — claves públicas sin autenticación
  GET  /admin/connectors/status           — health check en vivo de cada API
  GET  /admin/audit-log                   — log de acciones admin paginado
"""

import csv
import io
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Definición completa de todos los conectores / APIs del sistema
# ---------------------------------------------------------------------------

# Claves que se muestran tal cual (no son secretos)
PUBLIC_SETTING_KEYS = {
    # Google tracking / SEO
    "ga4_measurement_id",
    "gtm_container_id",
    "gsc_verification_code",
    "adsense_publisher_id",
    "bing_verification_code",
    "clarity_project_id",
    # Google OAuth (client_id es público por diseño)
    "google_client_id",
    # Stripe (publishable key es pública)
    "stripe_publishable_key",
    # Social / reviews
    "trustpilot_business_unit_id",
    # App config
    "site_name",
    "support_email",
    "default_currency",
    "default_locale",
    "maintenance_mode",
    "user_state_ttl_days",
}

# Claves que son secretas: se enmascaran con *** en GET
SECRET_SETTING_KEYS = {
    "stripe_secret_key",
    "stripe_webhook_secret",
    "sendgrid_api_key",
    "google_client_secret",
    "finnhub_api_key",
    "alpha_vantage_api_key",
    "coingecko_api_key",
    "emergent_llm_key",
    "paypal_client_id",
    "paypal_client_secret",
    "coinbase_api_key",
    "coinbase_api_secret",
    "sendgrid_sender_email",
}

# Todos los conectores con metadatos para la UI
ALL_CONNECTORS: List[Dict[str, Any]] = [
    # ---- PAGOS ----
    {
        "group": "payments",
        "label": "Stripe",
        "description": "Pasarela de pagos principal (suscripciones y checkout)",
        "keys": [
            {"key": "stripe_publishable_key", "label": "Publishable Key", "secret": False, "placeholder": "pk_live_..."},
            {"key": "stripe_secret_key",      "label": "Secret Key",      "secret": True,  "placeholder": "sk_live_..."},
            {"key": "stripe_webhook_secret",  "label": "Webhook Secret",  "secret": True,  "placeholder": "whsec_..."},
        ],
    },
    {
        "group": "payments",
        "label": "PayPal",
        "description": "Pagos alternativos vía PayPal (opcional)",
        "keys": [
            {"key": "paypal_client_id",     "label": "Client ID",     "secret": True, "placeholder": "AX..."},
            {"key": "paypal_client_secret", "label": "Client Secret", "secret": True, "placeholder": "..."},
        ],
    },
    {
        "group": "payments",
        "label": "Coinbase Commerce",
        "description": "Pagos en criptomonedas (opcional)",
        "keys": [
            {"key": "coinbase_api_key",    "label": "API Key",    "secret": True, "placeholder": "..."},
            {"key": "coinbase_api_secret", "label": "API Secret", "secret": True, "placeholder": "..."},
        ],
    },
    # ---- AUTH ----
    {
        "group": "auth",
        "label": "Google OAuth",
        "description": "Login con Google (OAuth 2.0 / OpenID Connect)",
        "keys": [
            {"key": "google_client_id",     "label": "Client ID",     "secret": False, "placeholder": "123456789.apps.googleusercontent.com"},
            {"key": "google_client_secret", "label": "Client Secret", "secret": True,  "placeholder": "GOCSPX-..."},
        ],
    },
    # ---- EMAIL ----
    {
        "group": "email",
        "label": "SendGrid",
        "description": "Envío de emails: alertas de precio, reset de contraseña, notificaciones",
        "keys": [
            {"key": "sendgrid_api_key",      "label": "API Key",      "secret": True,  "placeholder": "SG.xxx..."},
            {"key": "sendgrid_sender_email", "label": "Sender Email", "secret": False, "placeholder": "alerts@tudominio.com"},
        ],
    },
    # ---- DATOS DE MERCADO ----
    {
        "group": "market_data",
        "label": "CoinGecko",
        "description": "Precios de criptomonedas en tiempo real (el plan gratuito no necesita clave)",
        "keys": [
            {"key": "coingecko_api_key", "label": "API Key (Pro)", "secret": True, "placeholder": "CG-..."},
        ],
    },
    {
        "group": "market_data",
        "label": "Finnhub",
        "description": "Precios de Forex e índices en tiempo real (reemplaza datos simulados)",
        "keys": [
            {"key": "finnhub_api_key", "label": "API Key", "secret": True, "placeholder": "cu..."},
        ],
    },
    {
        "group": "market_data",
        "label": "Alpha Vantage",
        "description": "Alternativa a Finnhub para Forex, acciones e indicadores económicos",
        "keys": [
            {"key": "alpha_vantage_api_key", "label": "API Key", "secret": True, "placeholder": "XXXXXXXXXXXXXXXX"},
        ],
    },
    # ---- AI ----
    {
        "group": "ai",
        "label": "Emergent LLM (AI Coach)",
        "description": "Clave para el análisis de operaciones con IA (Claude Sonnet)",
        "keys": [
            {"key": "emergent_llm_key", "label": "LLM API Key", "secret": True, "placeholder": "em-..."},
        ],
    },
    # ---- ANALYTICS & SEO ----
    {
        "group": "analytics",
        "label": "Google Analytics 4 (GA4)",
        "description": "Seguimiento de visitas y eventos",
        "keys": [
            {"key": "ga4_measurement_id", "label": "Measurement ID", "secret": False, "placeholder": "G-XXXXXXXXXX"},
        ],
    },
    {
        "group": "analytics",
        "label": "Google Tag Manager (GTM)",
        "description": "Gestión centralizada de tags y scripts",
        "keys": [
            {"key": "gtm_container_id", "label": "Container ID", "secret": False, "placeholder": "GTM-XXXXXXX"},
        ],
    },
    {
        "group": "analytics",
        "label": "Google Search Console (GSC)",
        "description": "Verificación de propiedad para SEO",
        "keys": [
            {"key": "gsc_verification_code", "label": "Verification Code", "secret": False, "placeholder": "google-site-verification=..."},
        ],
    },
    {
        "group": "analytics",
        "label": "Google AdSense",
        "description": "Monetización con anuncios",
        "keys": [
            {"key": "adsense_publisher_id", "label": "Publisher ID", "secret": False, "placeholder": "ca-pub-XXXXXXXXXX"},
        ],
    },
    {
        "group": "analytics",
        "label": "Microsoft Bing Webmaster",
        "description": "Verificación de propiedad para Bing",
        "keys": [
            {"key": "bing_verification_code", "label": "Verification Code", "secret": False, "placeholder": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"},
        ],
    },
    {
        "group": "analytics",
        "label": "Microsoft Clarity",
        "description": "Heatmaps y grabaciones de sesión",
        "keys": [
            {"key": "clarity_project_id", "label": "Project ID", "secret": False, "placeholder": "xxxxxxxxxx"},
        ],
    },
    # ---- SOCIAL ----
    {
        "group": "social",
        "label": "Trustpilot",
        "description": "Widget de reviews y prueba social",
        "keys": [
            {"key": "trustpilot_business_unit_id", "label": "Business Unit ID", "secret": False, "placeholder": "..."},
        ],
    },
    # ---- APP CONFIG ----
    {
        "group": "app_config",
        "label": "Configuración de la App",
        "description": "Parámetros generales de la aplicación",
        "keys": [
            {"key": "site_name",         "label": "Nombre del sitio",       "secret": False, "placeholder": "Trading Calculator PRO"},
            {"key": "support_email",     "label": "Email de soporte",       "secret": False, "placeholder": "support@tradingcalculator.pro"},
            {"key": "default_currency",  "label": "Moneda por defecto",     "secret": False, "placeholder": "EUR"},
            {"key": "default_locale",    "label": "Idioma por defecto",     "secret": False, "placeholder": "es"},
            {"key": "maintenance_mode",  "label": "Modo mantenimiento",     "secret": False, "placeholder": "false"},
            {"key": "user_state_ttl_days","label": "TTL estados (días)",   "secret": False, "placeholder": "90"},
        ],
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mask(value: Optional[str]) -> str:
    """Return *** if value exists, empty string otherwise."""
    return "***" if value else ""


async def _get_all_settings(db) -> Dict[str, str]:
    """Load all rows from app_settings collection as key->value dict."""
    docs = await db.app_settings.find({}, {"_id": 0, "key": 1, "value": 1}).to_list(1000)
    return {d["key"]: d.get("value", "") for d in docs}


async def _upsert_setting(db, key: str, value: str) -> None:
    await db.app_settings.update_one(
        {"key": key},
        {"$set": {"key": key, "value": value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )


async def _delete_setting(db, key: str) -> None:
    await db.app_settings.delete_one({"key": key})


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class PromoteRequest(BaseModel):
    email: EmailStr
    is_admin: bool


class SetPlanRequest(BaseModel):
    email: EmailStr
    plan_id: str
    days: Optional[int] = None


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None
    subscription_plan: Optional[str] = None
    subscription_end: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def build_admin_router(
    db,
    require_admin_dep,
    subscription_plans: dict,
    log_admin_action_fn=None,
) -> APIRouter:
    """
    Crea y devuelve el router de admin con todos los conectores.
    `log_admin_action_fn` es la función `log_admin_action` de server.py (opcional).
    """
    router = APIRouter()

    async def _audit(admin, action, **kwargs):
        if log_admin_action_fn:
            try:
                await log_admin_action_fn(admin=admin, action=action, **kwargs)
            except Exception as exc:
                logger.warning(f"audit log failed: {exc}")

    # =========================================================================
    # GET /admin/metrics
    # =========================================================================

    @router.get("/metrics")
    async def get_metrics(_admin: dict = Depends(require_admin_dep)) -> Dict[str, Any]:
        """Métricas globales: totales, premium, nuevos, MRR, locale breakdown."""
        now = datetime.now(timezone.utc)
        cutoff_30d = (now - timedelta(days=30)).isoformat()
        all_users: List[dict] = await db.users.find({}, {"_id": 0}).to_list(10000)
        total_users = len(all_users)
        premium_users = sum(1 for u in all_users if u.get("is_premium"))
        admin_users = sum(1 for u in all_users if u.get("is_admin"))
        new_30d = sum(1 for u in all_users if (u.get("created_at") or "") >= cutoff_30d)
        plan_price_monthly = {
            "monthly":   subscription_plans.get("monthly",   {}).get("price", 17),
            "quarterly": round(subscription_plans.get("quarterly", {}).get("price", 45) / 3, 2),
            "annual":    round(subscription_plans.get("annual",    {}).get("price", 200) / 12, 2),
            "lifetime":  0,
        }
        mrr_usd = sum(
            plan_price_monthly.get(u.get("subscription_plan", ""), 0)
            for u in all_users if u.get("is_premium")
        )
        plan_counts: Dict[str, int] = {}
        provider_counts: Dict[str, int] = {}
        locale_counts: Dict[str, int] = {}
        for u in all_users:
            p = u.get("subscription_plan") or "free"
            plan_counts[p] = plan_counts.get(p, 0) + 1
            pv = u.get("auth_provider") or "password"
            provider_counts[pv] = provider_counts.get(pv, 0) + 1
            locale = u.get("locale") or "unknown"
            locale_counts[locale] = locale_counts.get(locale, 0) + 1
        return {
            "total_users":   total_users,
            "premium_users": premium_users,
            "admin_users":   admin_users,
            "new_users_30d": new_30d,
            "mrr_usd":       round(mrr_usd, 2),
            "by_plan":       plan_counts,
            "by_provider":   provider_counts,
            "by_locale":     [{"locale": k, "count": v} for k, v in locale_counts.items()],
        }

    # =========================================================================
    # GET /admin/users
    # =========================================================================

    @router.get("/users")
    async def list_users(
        q:        Optional[str]  = Query(None),
        plan:     Optional[str]  = Query(None),
        provider: Optional[str]  = Query(None),
        locale:   Optional[str]  = Query(None),
        is_admin: Optional[bool] = Query(None),
        limit:    int            = Query(500, ge=1, le=2000),
        skip:     int            = Query(0, ge=0),
        _admin: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        filt: Dict[str, Any] = {}
        if q:
            pattern = re.compile(re.escape(q), re.IGNORECASE)
            filt["$or"] = [{"email": {"$regex": pattern}}, {"name": {"$regex": pattern}}]
        if plan and plan != "all":
            filt["subscription_plan"] = None if plan == "none" else plan
        if provider and provider != "all":
            filt["auth_provider"] = provider
        if locale and locale != "all":
            filt["locale"] = locale
        if is_admin is not None:
            filt["is_admin"] = is_admin
        total = await db.users.count_documents(filt)
        users_raw = await db.users.find(
            filt, {"_id": 0, "password": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        now = datetime.now(timezone.utc)
        users_out = []
        for u in users_raw:
            sub_end = u.get("subscription_end")
            if sub_end:
                try:
                    end_dt = datetime.fromisoformat(sub_end.replace("Z", "+00:00"))
                    u["is_premium"] = end_dt > now or u.get("subscription_plan") == "lifetime"
                    u["subscription_status"] = "active" if u["is_premium"] else "expired"
                except Exception:
                    pass
            users_out.append(u)
        return {"users": users_out, "total": total, "skip": skip, "limit": limit}

    # =========================================================================
    # GET /admin/users.csv
    # =========================================================================

    @router.get("/users.csv")
    async def export_users_csv(_admin: dict = Depends(require_admin_dep)) -> StreamingResponse:
        users_raw = await db.users.find(
            {}, {"_id": 0, "password": 0}
        ).sort("created_at", -1).to_list(10000)
        fieldnames = ["id", "email", "name", "auth_provider",
                      "subscription_plan", "subscription_end", "is_premium", "is_admin", "created_at"]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        for u in users_raw:
            writer.writerow({f: u.get(f, "") for f in fieldnames})
        output.seek(0)
        filename = f"tcp-users-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # =========================================================================
    # POST /admin/promote
    # =========================================================================

    @router.post("/promote")
    async def promote_user(
        body: PromoteRequest,
        request: Request,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        if body.email.lower() == admin_user["email"].lower() and not body.is_admin:
            raise HTTPException(status_code=400, detail="No puedes quitarte el rol de admin a ti mismo.")
        target = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail=f"Usuario '{body.email}' no encontrado.")
        await db.users.update_one({"email": body.email.lower()}, {"$set": {"is_admin": body.is_admin}})
        action = "promoted_admin" if body.is_admin else "demoted_admin"
        await _audit(admin_user, action, target_email=body.email, request=request)
        return {"success": True, "email": body.email, "is_admin": body.is_admin}

    # =========================================================================
    # POST /admin/set-plan
    # =========================================================================

    @router.post("/set-plan")
    async def admin_set_plan(
        body: SetPlanRequest,
        request: Request,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        if body.plan_id not in subscription_plans and body.plan_id != "free":
            raise HTTPException(status_code=400, detail=f"Plan '{body.plan_id}' no válido.")
        target = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail=f"Usuario '{body.email}' no encontrado.")
        if body.plan_id == "free":
            update = {"subscription_plan": None, "subscription_end": None, "is_premium": False}
        else:
            plan = subscription_plans[body.plan_id]
            days = body.days or plan.get("days", 30)
            end = datetime.now(timezone.utc) + timedelta(days=days)
            update = {"subscription_plan": body.plan_id, "subscription_end": end.isoformat(), "is_premium": True}
        await db.users.update_one({"email": body.email.lower()}, {"$set": update})
        await _audit(admin_user, "set_plan", target_email=body.email,
                     details={"plan": body.plan_id}, request=request)
        return {"success": True, "email": body.email, "plan_id": body.plan_id,
                "subscription_end": update.get("subscription_end")}

    # =========================================================================
    # POST /admin/users/{user_id}  — editar usuario
    # =========================================================================

    @router.post("/users/{user_id}")
    async def update_user(
        user_id: str,
        body: UpdateUserRequest,
        request: Request,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """Editar nombre, email, plan, admin flag de un usuario."""
        target = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        patch: Dict[str, Any] = {}
        if body.name is not None:
            patch["name"] = body.name
        if body.email is not None:
            new_email = body.email.lower()
            # Check uniqueness
            conflict = await db.users.find_one({"email": new_email, "id": {"$ne": user_id}}, {"_id": 1})
            if conflict:
                raise HTTPException(status_code=400, detail="Ese email ya está en uso por otro usuario")
            patch["email"] = new_email
        if body.is_admin is not None:
            # Prevent admin removing their own admin rights
            if user_id == admin_user.get("id") and not body.is_admin:
                raise HTTPException(status_code=400, detail="No puedes quitarte el rol de admin a ti mismo")
            patch["is_admin"] = body.is_admin
        if body.subscription_plan is not None:
            patch["subscription_plan"] = body.subscription_plan
            patch["is_premium"] = body.subscription_plan in subscription_plans
        if body.subscription_end is not None:
            patch["subscription_end"] = body.subscription_end

        if not patch:
            return {"success": True, "message": "Nada que actualizar"}

        await db.users.update_one({"id": user_id}, {"$set": patch})
        await _audit(admin_user, "update_user", target_id=user_id,
                     target_email=target.get("email", ""), details=patch, request=request)
        return {"success": True, "updated_fields": list(patch.keys())}

    # =========================================================================
    # POST /admin/users/{user_id}/reset-password
    # =========================================================================

    @router.post("/users/{user_id}/reset-password")
    async def admin_reset_password(
        user_id: str,
        body: ResetPasswordRequest,
        request: Request,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """Reset de contraseña por admin. Revoca todas las sesiones activas del usuario."""
        import bcrypt
        target = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        hashed = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
        await db.users.update_one({"id": user_id}, {"$set": {"password": hashed}})
        # Revoke all active sessions
        await db.user_revocations.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "revoked_after": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=25),
            }},
            upsert=True,
        )
        await _audit(admin_user, "reset_password", target_id=user_id,
                     target_email=target.get("email", ""), request=request)
        return {"success": True, "message": "Contraseña actualizada y sesiones revocadas"}

    # =========================================================================
    # GET /admin/settings  — todos los conectores (secretos enmascarados)
    # =========================================================================

    @router.get("/settings")
    async def get_settings(_admin: dict = Depends(require_admin_dep)) -> Dict[str, Any]:
        """
        Devuelve todos los conectores con sus valores actuales.
        Los campos marcados como `secret=True` se devuelven como '***' si tienen valor,
        o '' si están vacíos. Nunca devuelve el valor real de un secreto.
        """
        raw = await _get_all_settings(db)
        connectors_out = []
        for connector in ALL_CONNECTORS:
            keys_out = []
            for k in connector["keys"]:
                current_val = raw.get(k["key"], "")
                keys_out.append({
                    **k,
                    "value": _mask(current_val) if k["secret"] else current_val,
                    "is_configured": bool(current_val),
                })
            connectors_out.append({**connector, "keys": keys_out})
        return {
            "connectors": connectors_out,
            "all_keys": list(PUBLIC_SETTING_KEYS | SECRET_SETTING_KEYS),
        }

    # =========================================================================
    # POST /admin/settings  — guardar/actualizar claves de conectores
    # =========================================================================

    @router.post("/settings")
    async def update_settings(
        body: Dict[str, Any],
        request: Request,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """
        Guarda o actualiza claves de conectores.
        Acepta un dict plano { key: value, ... }.
        - Si value == '__CLEAR__' → elimina la clave.
        - Si value == '' → ignora (no sobreescribe con vacío accidentalmente).
        - Solo acepta claves conocidas (PUBLIC_SETTING_KEYS | SECRET_SETTING_KEYS).
        """
        allowed = PUBLIC_SETTING_KEYS | SECRET_SETTING_KEYS
        saved = []
        cleared = []
        rejected = []
        for key, value in body.items():
            if key not in allowed:
                rejected.append(key)
                continue
            if value == "__CLEAR__":
                await _delete_setting(db, key)
                cleared.append(key)
            elif value and str(value).strip() and str(value).strip() != "***":
                await _upsert_setting(db, key, str(value).strip())
                saved.append(key)
        await _audit(
            admin_user, "update_settings",
            details={"saved": saved, "cleared": cleared, "rejected": rejected},
            request=request,
        )
        return {
            "success": True,
            "saved": saved,
            "cleared": cleared,
            "rejected": rejected,
            "message": f"{len(saved)} clave(s) guardada(s), {len(cleared)} eliminada(s)",
        }

    # =========================================================================
    # GET /admin/connectors/status  — health check en vivo
    # =========================================================================

    @router.get("/connectors/status")
    async def connectors_status(_admin: dict = Depends(require_admin_dep)) -> Dict[str, Any]:
        """
        Comprueba en tiempo real si cada conector clave está configurado y responde.
        No hace llamadas costosas; solo verifica que la clave existe y hace un ping
        mínimo donde sea posible.
        """
        import httpx
        raw = await _get_all_settings(db)

        results: List[Dict[str, Any]] = []

        # -- Stripe --
        stripe_key = raw.get("stripe_secret_key", "")
        if stripe_key:
            try:
                async with httpx.AsyncClient(timeout=5) as c:
                    r = await c.get("https://api.stripe.com/v1/balance",
                                    headers={"Authorization": f"Bearer {stripe_key}"})
                results.append({"connector": "Stripe", "status": "ok" if r.status_code == 200 else "error",
                                 "http_code": r.status_code, "configured": True})
            except Exception as e:
                results.append({"connector": "Stripe", "status": "error", "error": str(e), "configured": True})
        else:
            results.append({"connector": "Stripe", "status": "not_configured", "configured": False})

        # -- SendGrid --
        sg_key = raw.get("sendgrid_api_key", "")
        results.append({"connector": "SendGrid", "status": "configured" if sg_key else "not_configured",
                        "configured": bool(sg_key)})

        # -- Google OAuth --
        g_client = raw.get("google_client_id", "")
        results.append({"connector": "Google OAuth", "status": "configured" if g_client else "not_configured",
                        "configured": bool(g_client)})

        # -- CoinGecko --
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get("https://api.coingecko.com/api/v3/ping")
            results.append({"connector": "CoinGecko", "status": "ok" if r.status_code == 200 else "error",
                             "http_code": r.status_code, "configured": True})
        except Exception as e:
            results.append({"connector": "CoinGecko", "status": "error", "error": str(e), "configured": True})

        # -- Finnhub --
        fh_key = raw.get("finnhub_api_key", "")
        if fh_key:
            try:
                async with httpx.AsyncClient(timeout=5) as c:
                    r = await c.get(f"https://finnhub.io/api/v1/quote?symbol=AAPL&token={fh_key}")
                results.append({"connector": "Finnhub", "status": "ok" if r.status_code == 200 else "error",
                                 "http_code": r.status_code, "configured": True})
            except Exception as e:
                results.append({"connector": "Finnhub", "status": "error", "error": str(e), "configured": True})
        else:
            results.append({"connector": "Finnhub", "status": "not_configured", "configured": False})

        # -- Alpha Vantage --
        av_key = raw.get("alpha_vantage_api_key", "")
        results.append({"connector": "Alpha Vantage", "status": "configured" if av_key else "not_configured",
                        "configured": bool(av_key)})

        # -- Emergent LLM --
        llm_key = raw.get("emergent_llm_key", "")
        results.append({"connector": "Emergent LLM", "status": "configured" if llm_key else "not_configured",
                        "configured": bool(llm_key)})

        # -- MongoDB --
        try:
            await db.command("ping")
            results.append({"connector": "MongoDB", "status": "ok", "configured": True})
        except Exception as e:
            results.append({"connector": "MongoDB", "status": "error", "error": str(e), "configured": True})

        return {
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "results": results,
            "summary": {
                "ok": sum(1 for r in results if r["status"] == "ok"),
                "configured": sum(1 for r in results if r.get("configured")),
                "not_configured": sum(1 for r in results if r["status"] == "not_configured"),
                "errors": sum(1 for r in results if r["status"] == "error"),
            },
        }

    # =========================================================================
    # GET /admin/audit-log
    # =========================================================================

    @router.get("/audit-log")
    async def get_audit_log(
        limit: int = Query(50, ge=1, le=500),
        skip:  int = Query(0, ge=0),
        admin_email: Optional[str] = Query(None),
        action:      Optional[str] = Query(None),
        _admin: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """Log paginado de todas las acciones de administrador."""
        filt: Dict[str, Any] = {}
        if admin_email:
            filt["admin_email"] = {"$regex": re.compile(re.escape(admin_email), re.IGNORECASE)}
        if action:
            filt["action"] = action
        total = await db.admin_audit_log.count_documents(filt)
        logs = await db.admin_audit_log.find(
            filt, {"_id": 0}
        ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
        # Convert datetime to isoformat for JSON
        for log in logs:
            if isinstance(log.get("timestamp"), datetime):
                log["timestamp"] = log["timestamp"].isoformat()
        return {"logs": logs, "total": total, "skip": skip, "limit": limit}

    return router


# ---------------------------------------------------------------------------
# Public settings route (no auth required) — register separately in server.py
# ---------------------------------------------------------------------------

def build_public_settings_router(db) -> APIRouter:
    """
    Crea el router público para /public/settings.
    No requiere autenticación. Solo devuelve claves públicas.

    Registrar en server.py:
        from admin_routes import build_public_settings_router
        api_router.include_router(build_public_settings_router(db))
    """
    router = APIRouter()

    @router.get("/public/settings")
    async def public_settings() -> Dict[str, Any]:
        """
        Devuelve solo las claves públicas (no secretas) para que el frontend
        pueda inyectar scripts de analytics, tracking, etc. sin rebuilds.
        """
        docs = await db.app_settings.find(
            {"key": {"$in": list(PUBLIC_SETTING_KEYS)}},
            {"_id": 0, "key": 1, "value": 1},
        ).to_list(200)
        return {d["key"]: d.get("value", "") for d in docs}

    return router

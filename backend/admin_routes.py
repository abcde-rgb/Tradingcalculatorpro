"""
admin_routes.py — Endpoints del panel de administración
=========================================================
Todos los endpoints requieren `require_admin` (is_admin=True en MongoDB).

Endpoints:
  GET  /admin/metrics          — métricas globales de la app
  GET  /admin/users            — lista paginada/filtrable de usuarios
  GET  /admin/users.csv        — exportación CSV de todos los usuarios
  POST /admin/promote          — dar/quitar rol admin a un usuario
  POST /admin/set-plan         — asignar plan premium manualmente

Integrar en server.py:
    from admin_routes import admin_router
    app.include_router(admin_router)

O si usas api_router con prefix /api:
    from admin_routes import build_admin_router
    api_router.include_router(build_admin_router(db, require_admin, SUBSCRIPTION_PLANS))
"""

import csv
import io
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)


# ───────────────────────────────────────────────
# Models
# ───────────────────────────────────────────────

class PromoteRequest(BaseModel):
    email: EmailStr
    is_admin: bool

class SetPlanRequest(BaseModel):
    email: EmailStr
    plan_id: str
    days: Optional[int] = None  # override days, useful for custom periods


# ───────────────────────────────────────────────
# Builder (injects db, auth-dep, plans at startup)
# ───────────────────────────────────────────────

def build_admin_router(
    db,
    require_admin_dep,
    subscription_plans: dict,
) -> APIRouter:
    """
    Crea y devuelve el router de admin.
    Llama desde server.py una vez que `db` y `require_admin` estén definidos.

    Ejemplo en server.py (al final, antes de app.include_router):
        from admin_routes import build_admin_router
        api_router.include_router(
            build_admin_router(db, require_admin, SUBSCRIPTION_PLANS),
            prefix="/admin",
            tags=["admin"],
        )
    """
    router = APIRouter()

    # ───────────────────────────────────────────────
    # GET /admin/metrics
    # ───────────────────────────────────────────────

    @router.get("/metrics")
    async def get_metrics(_admin: dict = Depends(require_admin_dep)) -> Dict[str, Any]:
        """Métricas globales: totales, premium, nuevos, MRR, locale breakdown."""
        now = datetime.now(timezone.utc)
        cutoff_30d = (now - timedelta(days=30)).isoformat()

        all_users: List[dict] = await db.users.find({}, {"_id": 0}).to_list(10000)

        total_users = len(all_users)
        premium_users = sum(1 for u in all_users if u.get("is_premium"))
        admin_users = sum(1 for u in all_users if u.get("is_admin"))
        new_30d = sum(
            1 for u in all_users
            if (u.get("created_at") or "") >= cutoff_30d
        )

        # MRR simple: suma de precios de planes activos con intervalo mensual-izado
        plan_price_monthly = {
            "monthly":   subscription_plans.get("monthly",   {}).get("price", 17),
            "quarterly": round(subscription_plans.get("quarterly", {}).get("price", 45) / 3, 2),
            "annual":    round(subscription_plans.get("annual",    {}).get("price", 200) / 12, 2),
            "lifetime":  0,  # no MRR for lifetime
        }
        mrr_usd = 0.0
        for u in all_users:
            if u.get("is_premium") and u.get("subscription_plan") in plan_price_monthly:
                mrr_usd += plan_price_monthly[u["subscription_plan"]]

        # Plan breakdown
        plan_counts: Dict[str, int] = {}
        for u in all_users:
            p = u.get("subscription_plan") or "free"
            plan_counts[p] = plan_counts.get(p, 0) + 1

        # Provider breakdown
        provider_counts: Dict[str, int] = {}
        for u in all_users:
            pv = u.get("auth_provider") or "password"
            provider_counts[pv] = provider_counts.get(pv, 0) + 1

        # Locale breakdown (by email domain as proxy if no locale field)
        locale_counts: Dict[str, int] = {}
        for u in all_users:
            locale = u.get("locale") or "unknown"
            locale_counts[locale] = locale_counts.get(locale, 0) + 1
        by_locale = [{"locale": k, "count": v} for k, v in locale_counts.items()]

        return {
            "total_users":   total_users,
            "premium_users": premium_users,
            "admin_users":   admin_users,
            "new_users_30d": new_30d,
            "mrr_usd":       round(mrr_usd, 2),
            "by_plan":       plan_counts,
            "by_provider":   provider_counts,
            "by_locale":     by_locale,
        }

    # ───────────────────────────────────────────────
    # GET /admin/users
    # ───────────────────────────────────────────────

    @router.get("/users")
    async def list_users(
        q:        Optional[str] = Query(None, description="Buscar por email o nombre"),
        plan:     Optional[str] = Query(None, description="Filtrar por plan: monthly|quarterly|annual|lifetime|none"),
        provider: Optional[str] = Query(None, description="Filtrar por auth_provider: password|google"),
        locale:   Optional[str] = Query(None, description="Filtrar por locale"),
        is_admin: Optional[bool] = Query(None, description="Filtrar solo admins"),
        limit:    int            = Query(500, ge=1, le=2000),
        skip:     int            = Query(0, ge=0),
        _admin: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """Lista paginada y filtrable de todos los usuarios."""
        filt: Dict[str, Any] = {}

        # Texto libre: busca en email y name (case-insensitive)
        if q:
            import re
            pattern = re.compile(re.escape(q), re.IGNORECASE)
            filt["$or"] = [
                {"email": {"$regex": pattern}},
                {"name":  {"$regex": pattern}},
            ]

        # Plan
        if plan and plan != "all":
            if plan == "none":
                filt["subscription_plan"] = None
            else:
                filt["subscription_plan"] = plan

        # Auth provider
        if provider and provider != "all":
            filt["auth_provider"] = provider

        # Locale
        if locale and locale != "all":
            filt["locale"] = locale

        # Admin flag
        if is_admin is not None:
            filt["is_admin"] = is_admin

        total = await db.users.count_documents(filt)
        users_raw: List[dict] = await db.users.find(
            filt,
            {"_id": 0, "password": 0},  # NUNCA devolver password hash
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

        # Enriquecer con campo is_premium calculado en tiempo real
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

    # ───────────────────────────────────────────────
    # GET /admin/users.csv
    # ───────────────────────────────────────────────

    @router.get("/users.csv")
    async def export_users_csv(
        _admin: dict = Depends(require_admin_dep),
    ) -> StreamingResponse:
        """Descarga todos los usuarios como archivo CSV (sin passwords)."""
        users_raw: List[dict] = await db.users.find(
            {},
            {"_id": 0, "password": 0},
        ).sort("created_at", -1).to_list(10000)

        fieldnames = [
            "id", "email", "name", "auth_provider",
            "subscription_plan", "subscription_end", "is_premium",
            "is_admin", "created_at",
        ]

        output = io.StringIO()
        writer = csv.DictWriter(
            output, fieldnames=fieldnames, extrasaction="ignore",
            lineterminator="\n",
        )
        writer.writeheader()
        for u in users_raw:
            # Asegura que solo van los campos del CSV
            row = {f: u.get(f, "") for f in fieldnames}
            writer.writerow(row)

        output.seek(0)
        filename = f"tcp-users-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # ───────────────────────────────────────────────
    # POST /admin/promote  ← EL ENDPOINT QUE FALTABA
    # ───────────────────────────────────────────────

    @router.post("/promote")
    async def promote_user(
        body: PromoteRequest,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """
        Dar o quitar rol de admin a un usuario por su email.

        Protección: un admin no puede quitarse el rol a sí mismo.
        """
        if body.email.lower() == admin_user["email"].lower() and not body.is_admin:
            raise HTTPException(
                status_code=400,
                detail="No puedes quitarte el rol de admin a ti mismo.",
            )

        target = await db.users.find_one(
            {"email": body.email.lower()},
            {"_id": 0, "id": 1, "email": 1, "name": 1, "is_admin": 1},
        )
        if not target:
            raise HTTPException(status_code=404, detail=f"Usuario '{body.email}' no encontrado.")

        await db.users.update_one(
            {"email": body.email.lower()},
            {"$set": {"is_admin": body.is_admin}},
        )

        action = "promovido a admin" if body.is_admin else "degradado (sin admin)"
        logger.info(
            f"Admin '{admin_user['email']}' ha {action} a '{body.email}'"
        )

        return {
            "success": True,
            "email": body.email,
            "is_admin": body.is_admin,
            "message": f"Usuario '{body.email}' {action} correctamente.",
        }

    # ───────────────────────────────────────────────
    # POST /admin/set-plan
    # ───────────────────────────────────────────────

    @router.post("/set-plan")
    async def admin_set_plan(
        body: SetPlanRequest,
        admin_user: dict = Depends(require_admin_dep),
    ) -> Dict[str, Any]:
        """
        Asignar manualmente un plan premium a cualquier usuario.
        Útil para dar acceso de prueba, resolver incidencias, etc.
        """
        if body.plan_id not in subscription_plans and body.plan_id != "free":
            raise HTTPException(status_code=400, detail=f"Plan '{body.plan_id}' no válido.")

        target = await db.users.find_one(
            {"email": body.email.lower()},
            {"_id": 0, "id": 1, "email": 1},
        )
        if not target:
            raise HTTPException(status_code=404, detail=f"Usuario '{body.email}' no encontrado.")

        if body.plan_id == "free":
            update = {
                "subscription_plan": None,
                "subscription_end":  None,
                "is_premium":        False,
            }
        else:
            plan = subscription_plans[body.plan_id]
            days = body.days if body.days else plan.get("days", 30)
            end = datetime.now(timezone.utc) + timedelta(days=days)
            update = {
                "subscription_plan": body.plan_id,
                "subscription_end":  end.isoformat(),
                "is_premium":        True,
            }

        await db.users.update_one({"email": body.email.lower()}, {"$set": update})
        logger.info(
            f"Admin '{admin_user['email']}' asignó plan '{body.plan_id}' a '{body.email}'"
        )

        return {
            "success": True,
            "email": body.email,
            "plan_id": body.plan_id,
            "subscription_end": update.get("subscription_end"),
            "message": f"Plan '{body.plan_id}' asignado correctamente a '{body.email}'.",
        }

    return router

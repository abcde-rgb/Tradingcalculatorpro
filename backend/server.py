from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import json
import hashlib
import hmac
import secrets  # ✅ SECURITY FIX: Added secure random for sensitive operations
import math
import stripe  # Stripe SDK for advanced subscription management

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'trading_calculator_pro')]

# JWT Configuration
# 🔒 SECURITY: JWT_SECRET must be set via environment variable
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    # Generate a secure random secret for development (should be set in production)
    import secrets as sec
    JWT_SECRET = sec.token_urlsafe(32)
    print("⚠️  WARNING: Using auto-generated JWT_SECRET. Set JWT_SECRET env variable for production!")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
stripe.api_key = STRIPE_API_KEY  # Initialize Stripe SDK

# SendGrid Configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'alerts@tradingcalculator.pro')

# Demo User (siempre tiene acceso PRO completo)
DEMO_EMAIL = os.environ.get('DEMO_EMAIL', "demo@btccalc.pro")
DEMO_PASSWORD = os.environ.get('DEMO_PASSWORD', "1234")

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "monthly": {"name": "Mensual", "price": 17.00, "currency": "EUR", "interval": "month", "days": 30},
    "quarterly": {"name": "Trimestral", "price": 45.00, "currency": "EUR", "interval": "quarter", "days": 90},
    "annual": {"name": "Anual", "price": 200.00, "currency": "EUR", "interval": "year", "days": 365},
    "lifetime": {"name": "De Por Vida", "price": 500.00, "currency": "USD", "interval": "lifetime", "days": 36500}
}

app = FastAPI(title="Trading Calculator PRO API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ============= MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TradeEntry(BaseModel):
    symbol: str
    direction: str  # "long" or "short"
    entryPrice: float
    exitPrice: Optional[float] = None
    quantity: float
    leverage: float = 1.0
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []
    status: str = "open"  # "open" or "closed"

class PortfolioAsset(BaseModel):
    symbol: str
    quantity: float
    avgPrice: float
    targetAllocation: Optional[float] = None

class PriceAlert(BaseModel):
    symbol: str
    targetPrice: float
    condition: str  # "above" or "below"
    notifyEmail: bool = True

class ChangePlanRequest(BaseModel):
    new_plan_id: str

class CancelSubscriptionRequest(BaseModel):
    immediate: bool = False  # If True, cancel immediately. If False, cancel at period end

class EmailAlertRequest(BaseModel):
    email: str
    symbol: str
    currentPrice: float
    targetPrice: float
    condition: str

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except Exception:
        return None

async def require_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

def check_premium(user: dict) -> bool:
    """Check if user has premium access. Demo user always has premium."""
    if not user:
        return False
    # Demo user always has full PRO access
    if user.get("email") == DEMO_EMAIL:
        return True
    if user.get("subscription_plan") == "lifetime":
        return True
    if user.get("subscription_end"):
        end_date = datetime.fromisoformat(user["subscription_end"].replace('Z', '+00:00'))
        return end_date > datetime.now(timezone.utc)
    return False

# ============= STARTUP - Create Demo User =============

@app.on_event("startup")
async def startup_event():
    """Create demo user on startup if it doesn't exist"""
    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if not existing:
        demo_user = {
            "id": "demo-user-001",
            "email": DEMO_EMAIL,
            "password": hash_password(DEMO_PASSWORD),
            "name": "Demo Trader",
            "subscription_plan": "lifetime",
            "subscription_end": None,
            "is_premium": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(demo_user)
        logging.info("Demo user created: demo@btccalc.pro / 1234")

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "subscription_plan": None,
        "subscription_end": None,
        "is_premium": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id, user_data.email)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "subscription_plan": None,
            "subscription_end": None,
            "is_premium": False
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"], user["email"])
    is_premium = check_premium(user)
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "subscription_plan": user.get("subscription_plan"),
            "subscription_end": user.get("subscription_end"),
            "is_premium": is_premium
        }
    }

@api_router.get("/auth/me", response_model=dict)
async def get_me(user: dict = Depends(require_user)):
    is_premium = check_premium(user)
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "subscription_plan": user.get("subscription_plan"),
        "subscription_end": user.get("subscription_end"),
        "is_premium": is_premium
    }

# ============= PRICES - Real-time Data =============

@api_router.get("/prices")
async def get_prices():
    """Get real-time crypto prices from CoinGecko"""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,chainlink,litecoin",
                    "vs_currencies": "usd,eur",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true"
                },
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                # Add commodities (simulated for now - would need different API)
                data["gold"] = {"usd": 2680, "eur": 2450, "usd_24h_change": 0.5}
                data["silver"] = {"usd": 31.50, "eur": 28.80, "usd_24h_change": 0.8}
                return data
    except Exception as e:
        logging.error(f"Error fetching prices: {e}")
    
    # Fallback prices
    return {
        "bitcoin": {"usd": 97000, "eur": 89000, "usd_24h_change": 2.1},
        "ethereum": {"usd": 3600, "eur": 3300, "usd_24h_change": 1.5},
        "solana": {"usd": 195, "eur": 178, "usd_24h_change": 3.2},
        "binancecoin": {"usd": 680, "eur": 620, "usd_24h_change": 1.1},
        "ripple": {"usd": 0.62, "eur": 0.57, "usd_24h_change": 0.8},
        "cardano": {"usd": 0.48, "eur": 0.44, "usd_24h_change": -0.5},
        "dogecoin": {"usd": 0.14, "eur": 0.13, "usd_24h_change": 4.2},
        "avalanche-2": {"usd": 38, "eur": 35, "usd_24h_change": 2.1},
        "polkadot": {"usd": 7.8, "eur": 7.1, "usd_24h_change": 1.3},
        "chainlink": {"usd": 16, "eur": 14.5, "usd_24h_change": 0.7},
        "litecoin": {"usd": 88, "eur": 80, "usd_24h_change": 1.2},
        "gold": {"usd": 2680, "eur": 2450, "usd_24h_change": 0.5},
        "silver": {"usd": 31.50, "eur": 28.80, "usd_24h_change": 0.8}
    }

@api_router.get("/forex-prices")
async def get_forex_prices():
    """Get forex prices - simulated for demo (would need Finnhub API for real data)"""
    # In production, integrate Finnhub or similar
    return {
        "EURUSD": {"price": 1.0856, "change": 0.12},
        "GBPUSD": {"price": 1.2734, "change": -0.08},
        "USDJPY": {"price": 149.85, "change": 0.25},
        "USDCHF": {"price": 0.8812, "change": -0.05},
        "AUDUSD": {"price": 0.6542, "change": 0.18},
        "USDCAD": {"price": 1.3564, "change": 0.03},
        "NZDUSD": {"price": 0.5987, "change": 0.22},
        "EURGBP": {"price": 0.8525, "change": 0.15},
        "EURJPY": {"price": 162.68, "change": 0.38},
        "GBPJPY": {"price": 190.78, "change": 0.17}
    }

@api_router.get("/indices-prices")
async def get_indices_prices():
    """Get indices prices - simulated for demo"""
    return {
        "SPX": {"price": 5998.50, "change": 0.45},
        "NDX": {"price": 21245.80, "change": 0.68},
        "DJI": {"price": 44235.20, "change": 0.32},
        "DAX": {"price": 19785.60, "change": 0.28},
        "FTSE": {"price": 8265.40, "change": 0.15},
        "N225": {"price": 38542.80, "change": 0.52},
        "HSI": {"price": 19876.30, "change": -0.25}
    }

@api_router.get("/ohlc/{symbol}")
async def get_ohlc_data(symbol: str, days: int = 30):
    """Get OHLC data for candlestick charts"""
    try:
        coin_map = {
            "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana", "BNB": "binancecoin",
            "XRP": "ripple", "ADA": "cardano", "DOGE": "dogecoin", "AVAX": "avalanche-2",
            "DOT": "polkadot", "LINK": "chainlink", "LTC": "litecoin"
        }
        coin_id = coin_map.get(symbol.upper(), "bitcoin")
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart",
                params={"vs_currency": "usd", "days": days},
                timeout=15.0
            )
            if response.status_code == 200:
                data = response.json()
                prices = data.get("prices", [])
                
                if not prices:
                    return {"ohlc": [], "symbol": symbol.upper()}
                
                # Group prices into intervals
                if days <= 7:
                    interval_ms = 3600 * 1000  # 1 hour
                elif days <= 30:
                    interval_ms = 4 * 3600 * 1000  # 4 hours
                else:
                    interval_ms = 24 * 3600 * 1000  # 1 day
                
                ohlc = []
                current_interval = None
                interval_prices = []
                
                for timestamp, price in prices:
                    interval_start = (timestamp // interval_ms) * interval_ms
                    
                    if current_interval is None:
                        current_interval = interval_start
                        interval_prices = [price]
                    elif interval_start == current_interval:
                        interval_prices.append(price)
                    else:
                        if interval_prices:
                            ohlc.append({
                                "time": current_interval // 1000,
                                "open": interval_prices[0],
                                "high": max(interval_prices),
                                "low": min(interval_prices),
                                "close": interval_prices[-1]
                            })
                        current_interval = interval_start
                        interval_prices = [price]
                
                if interval_prices:
                    ohlc.append({
                        "time": current_interval // 1000,
                        "open": interval_prices[0],
                        "high": max(interval_prices),
                        "low": min(interval_prices),
                        "close": interval_prices[-1]
                    })
                
                return {"ohlc": ohlc, "symbol": symbol.upper()}
    except Exception as e:
        logging.error(f"Error fetching OHLC data: {e}")
    
    return {"ohlc": [], "symbol": symbol.upper()}

# ============= TRADING JOURNAL =============

@api_router.post("/journal/trades")
async def create_trade(trade: TradeEntry, user: dict = Depends(require_user)):
    trade_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **trade.dict(),
        "pnl": None,
        "roe": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate P&L if trade is closed
    if trade.status == "closed" and trade.exitPrice:
        if trade.direction == "long":
            pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity * trade.leverage
            roe = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * trade.leverage
        else:
            pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity * trade.leverage
            roe = ((trade.entryPrice - trade.exitPrice) / trade.entryPrice) * 100 * trade.leverage
        trade_doc["pnl"] = round(pnl, 2)
        trade_doc["roe"] = round(roe, 2)
    
    await db.trades.insert_one(trade_doc)
    trade_doc.pop("_id", None)
    return trade_doc

@api_router.get("/journal/trades")
async def get_trades(user: dict = Depends(require_user), limit: int = 100):
    trades = await db.trades.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return trades

@api_router.put("/journal/trades/{trade_id}")
async def update_trade(trade_id: str, updates: dict, user: dict = Depends(require_user)):
    trade = await db.trades.find_one({"id": trade_id, "user_id": user["id"]})
    if not trade:
        raise HTTPException(status_code=404, detail="Trade no encontrado")
    
    # Recalculate P&L if closing
    if updates.get("status") == "closed" and updates.get("exitPrice"):
        direction = trade.get("direction", updates.get("direction"))
        entry = trade.get("entryPrice", updates.get("entryPrice"))
        exit_price = updates.get("exitPrice")
        quantity = trade.get("quantity", updates.get("quantity", 1))
        leverage = trade.get("leverage", updates.get("leverage", 1))
        
        if direction == "long":
            pnl = (exit_price - entry) * quantity * leverage
            roe = ((exit_price - entry) / entry) * 100 * leverage
        else:
            pnl = (entry - exit_price) * quantity * leverage
            roe = ((entry - exit_price) / entry) * 100 * leverage
        
        updates["pnl"] = round(pnl, 2)
        updates["roe"] = round(roe, 2)
    
    await db.trades.update_one(
        {"id": trade_id, "user_id": user["id"]},
        {"$set": updates}
    )
    return {"message": "Trade actualizado"}

@api_router.delete("/journal/trades/{trade_id}")
async def delete_trade(trade_id: str, user: dict = Depends(require_user)):
    result = await db.trades.delete_one({"id": trade_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trade no encontrado")
    return {"message": "Trade eliminado"}

@api_router.get("/journal/stats")
async def get_journal_stats(user: dict = Depends(require_user)):
    """Get trading statistics from journal"""
    trades = await db.trades.find(
        {"user_id": user["id"], "status": "closed"},
        {"_id": 0}
    ).to_list(1000)
    
    if not trades:
        return {
            "totalTrades": 0,
            "wins": 0,
            "losses": 0,
            "winRate": 0,
            "totalPnl": 0,
            "avgWin": 0,
            "avgLoss": 0,
            "profitFactor": 0,
            "expectancy": 0,
            "maxDrawdown": 0,
            "consecutiveLosses": 0
        }
    
    wins = [t for t in trades if t.get("pnl", 0) > 0]
    losses = [t for t in trades if t.get("pnl", 0) <= 0]
    
    total_pnl = sum(t.get("pnl", 0) for t in trades)
    avg_win = sum(t.get("pnl", 0) for t in wins) / len(wins) if wins else 0
    avg_loss = sum(t.get("pnl", 0) for t in losses) / len(losses) if losses else 0
    
    gross_profit = sum(t.get("pnl", 0) for t in wins)
    gross_loss = abs(sum(t.get("pnl", 0) for t in losses))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
    
    win_rate = (len(wins) / len(trades)) * 100 if trades else 0
    expectancy = (win_rate / 100 * avg_win) + ((100 - win_rate) / 100 * avg_loss)
    
    # Calculate max consecutive losses
    max_consecutive = 0
    current_consecutive = 0
    for t in trades:
        if t.get("pnl", 0) <= 0:
            current_consecutive += 1
            max_consecutive = max(max_consecutive, current_consecutive)
        else:
            current_consecutive = 0
    
    # Calculate max drawdown
    equity = [0]
    for t in trades:
        equity.append(equity[-1] + t.get("pnl", 0))
    
    max_drawdown = 0
    peak = 0
    for e in equity:
        peak = max(peak, e)
        drawdown = peak - e
        max_drawdown = max(max_drawdown, drawdown)
    
    return {
        "totalTrades": len(trades),
        "wins": len(wins),
        "losses": len(losses),
        "winRate": round(win_rate, 2),
        "totalPnl": round(total_pnl, 2),
        "avgWin": round(avg_win, 2),
        "avgLoss": round(avg_loss, 2),
        "profitFactor": round(profit_factor, 2),
        "expectancy": round(expectancy, 2),
        "maxDrawdown": round(max_drawdown, 2),
        "consecutiveLosses": max_consecutive
    }

# ============= PORTFOLIO =============

@api_router.get("/portfolio")
async def get_portfolio(user: dict = Depends(require_user)):
    portfolio = await db.portfolio.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    return portfolio

@api_router.post("/portfolio")
async def add_portfolio_asset(asset: PortfolioAsset, user: dict = Depends(require_user)):
    asset_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **asset.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.portfolio.insert_one(asset_doc)
    return {"id": asset_doc["id"], "message": "Activo añadido al portfolio"}

@api_router.put("/portfolio/{asset_id}")
async def update_portfolio_asset(asset_id: str, updates: dict, user: dict = Depends(require_user)):
    result = await db.portfolio.update_one(
        {"id": asset_id, "user_id": user["id"]},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return {"message": "Activo actualizado"}

@api_router.delete("/portfolio/{asset_id}")
async def delete_portfolio_asset(asset_id: str, user: dict = Depends(require_user)):
    result = await db.portfolio.delete_one({"id": asset_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return {"message": "Activo eliminado"}

@api_router.get("/portfolio/rebalance")
async def get_rebalance_suggestions(user: dict = Depends(require_user)):
    """Get portfolio rebalancing suggestions based on trading journal performance"""
    portfolio = await db.portfolio.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    trades = await db.trades.find(
        {"user_id": user["id"], "status": "closed"},
        {"_id": 0}
    ).to_list(1000)
    
    if not portfolio:
        return {"suggestions": [], "message": "Portfolio vacío"}
    
    # Analyze performance by symbol
    symbol_performance = {}
    for trade in trades:
        symbol = trade.get("symbol", "UNKNOWN")
        if symbol not in symbol_performance:
            symbol_performance[symbol] = {"pnl": 0, "trades": 0, "wins": 0}
        symbol_performance[symbol]["pnl"] += trade.get("pnl", 0)
        symbol_performance[symbol]["trades"] += 1
        if trade.get("pnl", 0) > 0:
            symbol_performance[symbol]["wins"] += 1
    
    suggestions = []
    for asset in portfolio:
        symbol = asset.get("symbol")
        perf = symbol_performance.get(symbol, {"pnl": 0, "trades": 0, "wins": 0})
        win_rate = (perf["wins"] / perf["trades"] * 100) if perf["trades"] > 0 else 50
        
        current_allocation = asset.get("targetAllocation", 0)
        
        # Suggest increasing allocation for high performers
        if win_rate > 60 and perf["pnl"] > 0:
            suggested = min(current_allocation * 1.2, 40)  # Cap at 40%
            action = "increase"
        elif win_rate < 40 or perf["pnl"] < 0:
            suggested = max(current_allocation * 0.8, 5)  # Min 5%
            action = "decrease"
        else:
            suggested = current_allocation
            action = "maintain"
        
        suggestions.append({
            "symbol": symbol,
            "currentAllocation": current_allocation,
            "suggestedAllocation": round(suggested, 2),
            "action": action,
            "reason": f"Win rate: {round(win_rate, 1)}%, P&L: ${round(perf['pnl'], 2)}"
        })
    
    return {"suggestions": suggestions}

# ============= PRICE ALERTS =============

@api_router.post("/alerts")
async def create_alert(alert: PriceAlert, user: dict = Depends(require_user)):
    alert_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        **alert.dict(),
        "is_active": True,
        "triggered": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.alerts.insert_one(alert_doc)
    return {"id": alert_doc["id"], "message": "Alerta creada"}

@api_router.get("/alerts")
async def get_alerts(user: dict = Depends(require_user)):
    alerts = await db.alerts.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    return alerts

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, user: dict = Depends(require_user)):
    result = await db.alerts.delete_one({"id": alert_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return {"message": "Alerta eliminada"}

@api_router.post("/alerts/send-email")
async def send_alert_email(request: EmailAlertRequest):
    """Send email notification for triggered alert"""
    if not SENDGRID_API_KEY:
        return {"status": "skipped", "message": "SendGrid not configured"}
    
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=request.email,
            subject=f"🚨 Alerta de Precio: {request.symbol}",
            html_content=f"""
            <html>
            <body style="font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #2a2a2a; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #00E676;">Trading Calculator PRO</h1>
                    <h2>⚡ Alerta de Precio Activada</h2>
                    <div style="background: #333; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Símbolo:</strong> {request.symbol}</p>
                        <p><strong>Precio Actual:</strong> ${request.currentPrice:,.2f}</p>
                        <p><strong>Precio Objetivo:</strong> ${request.targetPrice:,.2f}</p>
                        <p><strong>Condición:</strong> {request.condition}</p>
                    </div>
                    <p style="color: #888;">Esta alerta fue configurada en Trading Calculator PRO</p>
                </div>
            </body>
            </html>
            """
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return {"status": "sent", "code": response.status_code}
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return {"status": "error", "message": str(e)}

# ============= MONTE CARLO SIMULATION =============

@api_router.post("/monte-carlo")
async def run_monte_carlo(request: dict, user: dict = Depends(require_user)):
    """Run Monte Carlo simulation based on trading statistics"""
    if not check_premium(user):
        raise HTTPException(status_code=403, detail="Función premium requerida")
    
    win_rate = request.get("winRate", 50) / 100
    avg_win = request.get("avgWin", 100)
    avg_loss = request.get("avgLoss", -50)
    initial_capital = request.get("initialCapital", 10000)
    num_trades = request.get("numTrades", 100)
    num_simulations = request.get("numSimulations", 1000)
    
    simulations = []
    final_balances = []
    max_drawdowns = []
    
    # ✅ SECURITY FIX: Using secrets for cryptographically secure random
    secure_random = secrets.SystemRandom()
    
    for _ in range(num_simulations):
        balance = initial_capital
        equity_curve = [balance]
        peak = balance
        max_dd = 0
        
        for _ in range(num_trades):
            if secure_random.random() < win_rate:
                balance += avg_win
            else:
                balance += avg_loss
            
            equity_curve.append(balance)
            peak = max(peak, balance)
            dd = (peak - balance) / peak if peak > 0 else 0
            max_dd = max(max_dd, dd)
        
        final_balances.append(balance)
        max_drawdowns.append(max_dd * 100)
        
        if len(simulations) < 100:  # Keep first 100 for visualization
            simulations.append(equity_curve)
    
    # Calculate statistics
    final_balances.sort()
    percentile_5 = final_balances[int(len(final_balances) * 0.05)]
    percentile_50 = final_balances[int(len(final_balances) * 0.50)]
    percentile_95 = final_balances[int(len(final_balances) * 0.95)]
    
    risk_of_ruin = len([b for b in final_balances if b <= 0]) / len(final_balances) * 100
    avg_max_drawdown = sum(max_drawdowns) / len(max_drawdowns)
    
    return {
        "simulations": simulations[:50],  # Return subset for charting
        "statistics": {
            "initialCapital": initial_capital,
            "avgFinalBalance": round(sum(final_balances) / len(final_balances), 2),
            "percentile5": round(percentile_5, 2),
            "percentile50": round(percentile_50, 2),
            "percentile95": round(percentile_95, 2),
            "riskOfRuin": round(risk_of_ruin, 2),
            "avgMaxDrawdown": round(avg_max_drawdown, 2),
            "profitProbability": round(len([b for b in final_balances if b > initial_capital]) / len(final_balances) * 100, 2)
        }
    }

# ============= BACKTESTING =============

@api_router.post("/backtest")
async def run_backtest(request: dict, user: dict = Depends(require_user)):
    if not check_premium(user):
        raise HTTPException(status_code=403, detail="Función premium requerida")
    
    strategy = request.get("strategy", "SMA Crossover")
    initial_capital = request.get("initial_capital", 10000)
    take_profit = request.get("take_profit", 5)
    stop_loss = request.get("stop_loss", 2)
    leverage = request.get("leverage", 1)
    
    # Simulated backtest
    trades = []
    balance = initial_capital
    wins = 0
    losses = 0
    max_drawdown = 0
    peak_balance = balance
    
    # ✅ SECURITY FIX: Using secrets for secure random generation
    secure_random = secrets.SystemRandom()
    num_trades = secure_random.randint(50, 150)
    win_rate = secure_random.uniform(0.45, 0.65)
    
    for i in range(num_trades):
        is_win = secure_random.random() < win_rate
        if is_win:
            wins += 1
            pnl = balance * (take_profit / 100) * leverage
        else:
            losses += 1
            pnl = -balance * (stop_loss / 100) * leverage
        
        balance += pnl
        peak_balance = max(peak_balance, balance)
        drawdown = (peak_balance - balance) / peak_balance * 100
        max_drawdown = max(max_drawdown, drawdown)
        
        trades.append({
            "trade_num": i + 1,
            "type": "LONG" if secure_random.random() > 0.5 else "SHORT",
            "result": "WIN" if is_win else "LOSS",
            "pnl": round(pnl, 2),
            "balance": round(balance, 2)
        })
    
    roi = ((balance - initial_capital) / initial_capital) * 100
    
    result = {
        "id": str(uuid.uuid4()),
        "strategy": strategy,
        "initial_capital": initial_capital,
        "final_balance": round(balance, 2),
        "total_trades": num_trades,
        "wins": wins,
        "losses": losses,
        "win_rate": round(wins / num_trades * 100, 2),
        "roi": round(roi, 2),
        "max_drawdown": round(max_drawdown, 2),
        "profit_factor": round((wins * take_profit) / (losses * stop_loss) if losses > 0 else 0, 2),
        "trades": trades[-20:],
        "equity_curve": [t["balance"] for t in trades]
    }
    
    return result

# ============= CALCULATIONS =============

@api_router.post("/calculations")
async def save_calculation(calc: dict, user: dict = Depends(require_user)):
    calculation = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "calculator_type": calc.get("calculator_type"),
        "inputs": calc.get("inputs", {}),
        "results": calc.get("results", {}),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.calculations.insert_one(calculation)
    return {"id": calculation["id"], "message": "Cálculo guardado"}

@api_router.get("/calculations")
async def get_calculations(user: dict = Depends(require_user), limit: int = 50):
    calculations = await db.calculations.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return calculations

@api_router.delete("/calculations/{calc_id}")
async def delete_calculation(calc_id: str, user: dict = Depends(require_user)):
    result = await db.calculations.delete_one({"id": calc_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cálculo no encontrado")
    return {"message": "Cálculo eliminado correctamente"}

# ============= PAYMENT ROUTES =============

@api_router.get("/plans")
async def get_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/checkout/create")
async def create_checkout(request: dict, user: dict = Depends(require_user)):
    plan_id = request.get("plan_id")
    payment_method = request.get("payment_method", "stripe")
    origin_url = request.get("origin_url", "")
    
    plan = SUBSCRIPTION_PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Plan no válido")
    
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment/cancel"
    
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "plan_id": plan_id,
        "amount": plan["price"],
        "currency": plan["currency"],
        "payment_method": payment_method,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if payment_method in ["stripe", "card", "sepa", "klarna"]:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Map payment methods
        payment_methods_map = {
            "stripe": ["card"],
            "card": ["card"],
            "sepa": ["sepa_debit"],
            "klarna": ["klarna"]
        }
        
        checkout_request = CheckoutSessionRequest(
            amount=float(plan["price"]),
            currency=plan["currency"].lower(),
            success_url=success_url,
            cancel_url=cancel_url,
            payment_methods=payment_methods_map.get(payment_method, ["card"]),
            metadata={
                "user_id": user["id"],
                "plan_id": plan_id,
                "transaction_id": transaction["id"]
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        transaction["session_id"] = session.session_id
        transaction["checkout_url"] = session.url
    
    await db.payment_transactions.insert_one(transaction)
    
    return {
        "transaction_id": transaction["id"],
        "checkout_url": transaction.get("checkout_url"),
        "session_id": transaction.get("session_id")
    }

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, user: dict = Depends(require_user)):
    """
    Obtiene el estado de una sesión de pago de Stripe
    """
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    return {
        "transaction_id": transaction.get("id"),
        "payment_status": transaction.get("status", "pending"),
        "plan_id": transaction.get("plan_id"),
        "amount": transaction.get("amount"),
        "currency": transaction.get("currency"),
        "created_at": transaction.get("created_at")
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            metadata = webhook_response.metadata
            user_id = metadata.get("user_id")
            plan_id = metadata.get("plan_id")
            transaction_id = metadata.get("transaction_id")
            
            if user_id and plan_id:
                plan = SUBSCRIPTION_PLANS.get(plan_id)
                subscription_end = datetime.now(timezone.utc) + timedelta(days=plan["days"])
                
                # Get Stripe session to extract customer and subscription IDs
                try:
                    session = stripe.checkout.Session.retrieve(webhook_response.session_id)
                    stripe_customer_id = session.customer
                    stripe_subscription_id = session.subscription
                except Exception as e:
                    logging.error(f"Error retrieving Stripe session: {e}")
                    stripe_customer_id = None
                    stripe_subscription_id = None
                
                # Actualizar usuario a premium con IDs de Stripe
                update_data = {
                    "subscription_plan": plan_id,
                    "subscription_end": subscription_end.isoformat(),
                    "is_premium": True
                }
                
                if stripe_customer_id:
                    update_data["stripe_customer_id"] = stripe_customer_id
                if stripe_subscription_id:
                    update_data["stripe_subscription_id"] = stripe_subscription_id
                
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": update_data}
                )
                
                # Actualizar estado de la transacción
                if transaction_id:
                    await db.payment_transactions.update_one(
                        {"id": transaction_id},
                        {"$set": {
                            "status": "paid",
                            "paid_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        
        return {"status": "received"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============= SUBSCRIPTION MANAGEMENT ROUTES =============

@api_router.get("/subscriptions/current")
async def get_current_subscription(user: dict = Depends(require_user)):
    """Get current user's subscription details from Stripe"""
    try:
        # Get user's stripe_customer_id
        user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        
        if not user_doc or not user_doc.get("stripe_customer_id"):
            return {
                "has_subscription": False,
                "is_premium": user_doc.get("is_premium", False) if user_doc else False,
                "subscription_plan": user_doc.get("subscription_plan") if user_doc else None
            }
        
        # Get subscriptions from Stripe
        subscriptions = stripe.Subscription.list(
            customer=user_doc["stripe_customer_id"],
            status="all",
            limit=1
        )
        
        if not subscriptions.data:
            return {
                "has_subscription": False,
                "is_premium": user_doc.get("is_premium", False),
                "subscription_plan": user_doc.get("subscription_plan")
            }
        
        sub = subscriptions.data[0]
        
        return {
            "has_subscription": True,
            "subscription_id": sub.id,
            "status": sub.status,
            "plan_id": user_doc.get("subscription_plan"),
            "current_period_start": sub.current_period_start,
            "current_period_end": sub.current_period_end,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "canceled_at": sub.canceled_at,
            "trial_end": sub.trial_end,
            "is_premium": sub.status in ["active", "trialing"]
        }
    except Exception as e:
        logging.error(f"Error fetching subscription: {e}")
        return {
            "has_subscription": False,
            "is_premium": user.get("is_premium", False)
        }

@api_router.post("/subscriptions/cancel")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    user: dict = Depends(require_user)
):
    """Cancel user's subscription"""
    try:
        user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        
        if not user_doc or not user_doc.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No subscription found")
        
        # Get active subscription
        subscriptions = stripe.Subscription.list(
            customer=user_doc["stripe_customer_id"],
            status="active",
            limit=1
        )
        
        if not subscriptions.data:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        sub = subscriptions.data[0]
        
        if request.immediate:
            # Cancel immediately
            stripe.Subscription.delete(sub.id)
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"is_premium": False, "subscription_plan": None}}
            )
            return {"message": "Subscription canceled immediately", "canceled": True}
        else:
            # Cancel at period end
            stripe.Subscription.modify(
                sub.id,
                cancel_at_period_end=True
            )
            return {
                "message": "Subscription will be canceled at period end",
                "canceled": False,
                "cancel_at": sub.current_period_end
            }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail="Error canceling subscription")

@api_router.post("/subscriptions/resume")
async def resume_subscription(user: dict = Depends(require_user)):
    """Resume a canceled subscription"""
    try:
        user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        
        if not user_doc or not user_doc.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No subscription found")
        
        # Get subscription set to cancel
        subscriptions = stripe.Subscription.list(
            customer=user_doc["stripe_customer_id"],
            status="active",
            limit=1
        )
        
        if not subscriptions.data:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        sub = subscriptions.data[0]
        
        if not sub.cancel_at_period_end:
            return {"message": "Subscription is not set to cancel", "resumed": False}
        
        # Resume by removing cancel_at_period_end
        stripe.Subscription.modify(
            sub.id,
            cancel_at_period_end=False
        )
        
        return {"message": "Subscription resumed successfully", "resumed": True}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error resuming subscription: {e}")
        raise HTTPException(status_code=500, detail="Error resuming subscription")

@api_router.post("/subscriptions/change-plan")
async def change_plan(
    request: ChangePlanRequest,
    user: dict = Depends(require_user)
):
    """Upgrade/downgrade subscription plan"""
    try:
        # Validate new plan
        if request.new_plan_id not in SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        
        if not user_doc or not user_doc.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No subscription found")
        
        # Get active subscription
        subscriptions = stripe.Subscription.list(
            customer=user_doc["stripe_customer_id"],
            status="active",
            limit=1
        )
        
        if not subscriptions.data:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        sub = subscriptions.data[0]
        new_plan = SUBSCRIPTION_PLANS[request.new_plan_id]
        
        # For simplicity, we'll cancel current and create new
        # In production, you'd modify the subscription items
        return {
            "message": "To change plan, please cancel current subscription and purchase new one",
            "current_plan": user_doc.get("subscription_plan"),
            "requested_plan": request.new_plan_id
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error changing plan: {e}")
        raise HTTPException(status_code=500, detail="Error changing plan")

@api_router.post("/billing/create-portal-session")
async def create_portal_session(request: dict, user: dict = Depends(require_user)):
    """Create Stripe Customer Portal session"""
    try:
        return_url = request.get("return_url", "")
        
        user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        
        if not user_doc or not user_doc.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No Stripe customer found")
        
        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=user_doc["stripe_customer_id"],
            return_url=return_url
        )
        
        return {"url": session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error creating portal session: {e}")
        raise HTTPException(status_code=500, detail="Error creating portal session")

@api_router.get("/billing/history")
async def get_billing_history(user: dict = Depends(require_user)):
    """Get user's billing history/invoices"""
    try:
        user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        
        if not user_doc or not user_doc.get("stripe_customer_id"):
            return {"invoices": []}
        
        # Get invoices from Stripe
        invoices = stripe.Invoice.list(
            customer=user_doc["stripe_customer_id"],
            limit=10
        )
        
        return {
            "invoices": [
                {
                    "id": inv.id,
                    "amount": inv.amount_paid / 100,  # Convert from cents
                    "currency": inv.currency.upper(),
                    "status": inv.status,
                    "created": inv.created,
                    "invoice_pdf": inv.invoice_pdf,
                    "hosted_invoice_url": inv.hosted_invoice_url
                }
                for inv in invoices.data
            ]
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error fetching billing history: {e}")
        return {"invoices": []}

# ============= ROOT ROUTES =============

# ============= USER STATE PERSISTENCE ROUTES =============

@api_router.post("/user-states/save")
async def save_user_state(request: dict, user: dict = Depends(require_user)):
    """
    Save user state for calculators, charts, etc.
    Body: { "state_id": "percentage_calculator", "state": {...} }
    """
    try:
        state_id = request.get("state_id")
        state_data = request.get("state")
        
        if not state_id:
            raise HTTPException(status_code=400, detail="state_id is required")
        
        # Upsert the state
        await db.user_states.update_one(
            {"user_id": user["id"], "state_id": state_id},
            {"$set": {
                "user_id": user["id"],
                "state_id": state_id,
                "state": state_data,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        return {"success": True, "message": "State saved"}
    except Exception as e:
        logging.error(f"Error saving state: {e}")
        raise HTTPException(status_code=500, detail="Error saving state")

@api_router.get("/user-states/get/{state_id}")
async def get_user_state(state_id: str, user: dict = Depends(require_user)):
    """Get saved state for a specific calculator/component"""
    try:
        state_doc = await db.user_states.find_one(
            {"user_id": user["id"], "state_id": state_id},
            {"_id": 0}
        )
        
        if not state_doc:
            return {"state": None}
        
        return {"state": state_doc.get("state"), "last_updated": state_doc.get("last_updated")}
    except Exception as e:
        logging.error(f"Error getting state: {e}")
        return {"state": None}

@api_router.delete("/user-states/delete/{state_id}")
async def delete_user_state(state_id: str, user: dict = Depends(require_user)):
    """Delete a specific saved state"""
    try:
        result = await db.user_states.delete_one(
            {"user_id": user["id"], "state_id": state_id}
        )
        
        return {"success": True, "deleted": result.deleted_count > 0}
    except Exception as e:
        logging.error(f"Error deleting state: {e}")
        raise HTTPException(status_code=500, detail="Error deleting state")

@api_router.delete("/user-states/reset-all")
async def reset_all_user_states(user: dict = Depends(require_user)):
    """Delete ALL saved states for the user"""
    try:
        result = await db.user_states.delete_many({"user_id": user["id"]})
        
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        logging.error(f"Error resetting states: {e}")
        raise HTTPException(status_code=500, detail="Error resetting states")

@api_router.get("/user-states/list")
async def list_user_states(user: dict = Depends(require_user)):
    """List all saved states for debugging"""
    try:
        states = await db.user_states.find(
            {"user_id": user["id"]},
            {"_id": 0}
        ).to_list(100)
        
        return {"states": states}
    except Exception as e:
        logging.error(f"Error listing states: {e}")
        return {"states": []}


@api_router.get("/")
async def root():
    return {"message": "Trading Calculator PRO API", "version": "2.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# ============= OPTIONS CALCULATOR ROUTES (merged from OPTIONS app) =============
from options_math import (
    generate_options_chain,
    calculate_payoff,
    find_break_evens,
    calculate_greeks,
)
from stock_data import (
    get_stock_data,
    search_tickers,
    generate_expirations,
    get_options_chain_real,
    get_available_expirations,
)

class OptionLegInput(BaseModel):
    type: str  # "call", "put", "stock"
    action: str  # "buy", "sell"
    quantity: Optional[int] = Field(default=1, alias="qty")
    qty: Optional[int] = None
    strike: float
    premium: Optional[float] = 0
    iv: Optional[float] = 0.3
    daysToExpiry: Optional[int] = 30

    class Config:
        populate_by_name = True

    def get_qty(self):
        return self.quantity or self.qty or 1


class PayoffRequest(BaseModel):
    legs: List[OptionLegInput]
    stockPrice: float
    priceRange: Optional[float] = 0.35
    daysToChart: Optional[int] = 30


class GreeksRequest(BaseModel):
    legs: List[OptionLegInput]
    stockPrice: float


@api_router.get("/stock/{symbol}")
async def opt_get_stock(symbol: str):
    try:
        data = get_stock_data(symbol)
        await db.stock_cache.update_one(
            {"symbol": data["symbol"]},
            {"$set": {**data, "cached_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        return data
    except Exception as e:
        logging.error(f"Error getting stock data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/tickers/search")
async def opt_search_tickers(q: str = ""):
    results = search_tickers(q)
    return {
        "results": [
            {"symbol": sym, **get_stock_data(sym)}
            for sym in results[:15]
        ]
    }


@api_router.get("/options/expirations/{symbol}")
async def opt_get_expirations(symbol: str):
    stock = get_stock_data(symbol)
    expirations = get_available_expirations(symbol)
    if not expirations:
        expirations = generate_expirations()
    return {"stock": stock, "expirations": expirations}


@api_router.get("/options/chain/{symbol}")
async def opt_get_options_chain(symbol: str, expiration_idx: int = 3):
    stock = get_stock_data(symbol)
    expirations = get_available_expirations(symbol)
    if not expirations:
        expirations = generate_expirations()
    if expiration_idx >= len(expirations):
        expiration_idx = min(3, len(expirations) - 1)
    expiration = expirations[expiration_idx]
    chain = get_options_chain_real(symbol, expiration["date"])
    if not chain:
        chain = generate_options_chain(stock["price"], expiration["daysToExpiry"])
    else:
        # Enrich real chain from yfinance with computed Greeks (yfinance doesn't return them)
        from options_math import delta as _d, gamma_val as _g, theta_val as _th, vega_val as _v
        import math as _m
        T = max(expiration["daysToExpiry"], 1) / 365
        r = 0.0525
        for item in chain:
            K = item["strike"]
            for side in ("call", "put"):
                leg = item.get(side, {})
                iv = leg.get("iv") or 0.3
                if iv <= 0:
                    iv = 0.3
                try:
                    leg["delta"] = round(_d(stock["price"], K, T, r, iv, side), 4)
                    leg["gamma"] = round(_g(stock["price"], K, T, r, iv), 6)
                    leg["theta"] = round(_th(stock["price"], K, T, r, iv, side), 4)
                    leg["vega"] = round(_v(stock["price"], K, T, r, iv), 4)
                except (ValueError, ZeroDivisionError):
                    leg["delta"] = 0.0
                    leg["gamma"] = 0.0
                    leg["theta"] = 0.0
                    leg["vega"] = 0.0
                # Ensure mid is present
                if "mid" not in leg or leg.get("mid") is None:
                    leg["mid"] = round(((leg.get("bid") or 0) + (leg.get("ask") or 0)) / 2, 2)
    return {"stock": stock, "expiration": expiration, "chain": chain}


@api_router.get("/options/iv-surface/{symbol}")
async def opt_get_iv_surface(symbol: str, max_expirations: int = 8):
    stock = get_stock_data(symbol)
    expirations = get_available_expirations(symbol)
    if not expirations:
        expirations = generate_expirations()
    expirations = expirations[:max_expirations]
    surface_data = []
    all_strikes = set()
    for exp in expirations:
        chain = get_options_chain_real(symbol, exp["date"])
        if not chain:
            chain = generate_options_chain(stock["price"], exp["daysToExpiry"])
        exp_data = {
            "date": exp["date"],
            "label": exp["label"],
            "daysToExpiry": exp["daysToExpiry"],
            "ivData": []
        }
        for item in chain:
            strike = item["strike"]
            all_strikes.add(strike)
            exp_data["ivData"].append({
                "strike": float(strike),
                "call_iv": item["call"]["iv"],
                "put_iv": item["put"]["iv"],
                "avg_iv": (item["call"]["iv"] + item["put"]["iv"]) / 2,
            })
        surface_data.append(exp_data)
    sorted_strikes = sorted(list(all_strikes))
    atm_strike = min(sorted_strikes, key=lambda x: abs(x - stock["price"])) if sorted_strikes else 0
    return {
        "stock": stock,
        "strikes": sorted_strikes,
        "atm_strike": atm_strike,
        "expirations": surface_data,
    }


@api_router.post("/calculate/payoff")
async def opt_calculate_payoff(request: PayoffRequest):
    try:
        legs_dicts = []
        for leg in request.legs:
            legs_dicts.append({
                "type": leg.type,
                "action": leg.action,
                "quantity": leg.get_qty(),
                "qty": leg.get_qty(),
                "strike": leg.strike,
                "premium": leg.premium or 0,
                "iv": leg.iv or 0.3,
                "daysToExpiry": leg.daysToExpiry or 30,
            })
        points = calculate_payoff(
            legs_dicts,
            request.stockPrice,
            request.priceRange or 0.35,
            request.daysToChart or 30,
        )
        break_evens = find_break_evens(points)
        expiry_pnls = [p["pnlAtExpiry"] for p in points]
        max_profit = max(expiry_pnls)
        max_loss = min(expiry_pnls)
        net_premium = 0
        for leg in legs_dicts:
            if leg["type"] != "stock":
                mult = -1 if leg["action"] == "buy" else 1
                net_premium += (leg.get("premium", 0) * mult *
                                leg.get("quantity", leg.get("qty", 1)) * 100)
        roi = (max_profit / abs(net_premium) * 100) if net_premium != 0 else 0
        return {
            "points": points,
            "breakEvens": break_evens,
            "stats": {
                "maxProfit": round(max_profit, 2),
                "maxLoss": round(max_loss, 2),
                "netPremium": round(net_premium, 2),
                "roi": round(roi, 1),
                "isMaxProfitUnlimited": max_profit > 5000000,
            },
        }
    except Exception as e:
        logging.error(f"Payoff calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calculate/greeks")
async def opt_calculate_greeks(request: GreeksRequest):
    try:
        legs_dicts = []
        for leg in request.legs:
            legs_dicts.append({
                "type": leg.type,
                "action": leg.action,
                "quantity": leg.get_qty(),
                "qty": leg.get_qty(),
                "strike": leg.strike,
                "premium": leg.premium or 0,
                "iv": leg.iv or 0.3,
                "daysToExpiry": leg.daysToExpiry or 30,
            })
        greeks = calculate_greeks(legs_dicts, request.stockPrice)
        return greeks
    except Exception as e:
        logging.error(f"Greeks calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Strategy Optimizer ---
class OptimizeRequest(BaseModel):
    symbol: str
    sentiment: str  # very_bullish, bullish, neutral, bearish, very_bearish
    targetPrice: float
    budget: float = 10000
    expirationIdx: int = 3
    mode: str = "max_return"  # max_return | max_chance
    maxResults: int = 8


@api_router.post("/optimize")
async def optimize_options_strategy(req: OptimizeRequest):
    try:
        from options_optimize import optimize_strategies
        stock = get_stock_data(req.symbol)
        expirations = get_available_expirations(req.symbol) or generate_expirations()
        idx = max(0, min(req.expirationIdx, len(expirations) - 1))
        expiration = expirations[idx]
        chain = get_options_chain_real(req.symbol, expiration["date"])
        if not chain:
            chain = generate_options_chain(stock["price"], expiration["daysToExpiry"])

        results = optimize_strategies(
            symbol=req.symbol,
            sentiment=req.sentiment,
            target_price=req.targetPrice,
            budget=req.budget,
            chain=chain,
            spot=stock["price"],
            days_to_expiry=expiration["daysToExpiry"],
            expiration_label=expiration["fullLabel"],
            mode=req.mode,
            max_results=req.maxResults,
        )
        return {
            "stock": stock,
            "expiration": expiration,
            "target": {
                "price": req.targetPrice,
                "budget": req.budget,
                "sentiment": req.sentiment,
                "mode": req.mode,
            },
            "results": results,
        }
    except Exception as e:
        logging.error(f"Optimize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== P0 FEATURES: Earnings, Saved Positions, Portfolio Greeks ==========
@api_router.get("/options/earnings/{symbol}")
async def get_next_earnings(symbol: str):
    """Next earnings date from yfinance (used to warn about IV crush)."""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        cal = None
        try:
            cal = ticker.calendar
        except Exception:
            cal = None
        earnings_date = None
        if cal is not None:
            if hasattr(cal, "to_dict"):
                data = cal.to_dict()
                dates = data.get("Earnings Date", {}) if isinstance(data, dict) else {}
                if dates:
                    first = next(iter(dates.values()), None)
                    if first:
                        earnings_date = str(first)[:10]
            elif isinstance(cal, dict):
                ed = cal.get("Earnings Date")
                if ed:
                    earnings_date = str(ed[0] if isinstance(ed, list) else ed)[:10]
        return {"symbol": symbol.upper(), "nextEarnings": earnings_date}
    except Exception as e:
        logging.warning(f"earnings lookup failed for {symbol}: {e}")
        return {"symbol": symbol.upper(), "nextEarnings": None}


class SavedLeg(BaseModel):
    type: str
    action: str
    quantity: int = 1
    strike: float
    premium: float = 0
    iv: Optional[float] = 0.3
    daysToExpiry: Optional[int] = 30


class SavePositionRequest(BaseModel):
    name: str
    symbol: str
    legs: List[SavedLeg]
    expiration: Optional[str] = None
    notes: Optional[str] = ""


@api_router.post("/options/positions/save")
async def save_position(req: SavePositionRequest, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    position = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": req.name,
        "symbol": req.symbol.upper(),
        "legs": [leg.model_dump() for leg in req.legs],
        "expiration": req.expiration,
        "notes": req.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.saved_positions.insert_one(position)
    return {**{k: v for k, v in position.items() if k != "_id"}}


@api_router.get("/options/positions")
async def list_positions(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    cursor = db.saved_positions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    positions = await cursor.to_list(length=100)
    return {"positions": positions}


@api_router.delete("/options/positions/{position_id}")
async def delete_position(position_id: str, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    result = await db.saved_positions.delete_one({"id": position_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Position not found")
    return {"status": "deleted", "id": position_id}


@api_router.get("/options/positions/portfolio-greeks")
async def portfolio_greeks(user=Depends(get_current_user)):
    """Aggregate Greeks across ALL saved positions using current spot prices."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    cursor = db.saved_positions.find({"user_id": user["id"]}, {"_id": 0})
    positions = await cursor.to_list(length=100)
    agg = {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}
    count_by_symbol = {}
    enriched = []
    for pos in positions:
        try:
            stock = get_stock_data(pos["symbol"])
            legs_dicts = []
            for leg in pos.get("legs", []):
                legs_dicts.append({
                    "type": leg["type"],
                    "action": leg["action"],
                    "quantity": leg.get("quantity", 1),
                    "qty": leg.get("quantity", 1),
                    "strike": leg["strike"],
                    "premium": leg.get("premium", 0),
                    "iv": leg.get("iv", 0.3) or 0.3,
                    "daysToExpiry": leg.get("daysToExpiry", 30),
                })
            g = calculate_greeks(legs_dicts, stock["price"])
            for k in agg:
                agg[k] += float(g.get(k, 0) or 0)
            count_by_symbol[pos["symbol"]] = count_by_symbol.get(pos["symbol"], 0) + 1
            enriched.append({
                "id": pos["id"],
                "name": pos["name"],
                "symbol": pos["symbol"],
                "currentPrice": stock["price"],
                "greeks": g,
                "legsCount": len(legs_dicts),
                "expiration": pos.get("expiration"),
            })
        except Exception as e:
            logging.warning(f"skipping position {pos.get('id')} in aggregation: {e}")
    return {
        "aggregated": {k: round(v, 4) for k, v in agg.items()},
        "positionCount": len(positions),
        "symbols": count_by_symbol,
        "positions": enriched,
    }


# Include router and setup middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import secrets  # ✅ SECURITY FIX: Added secure random for sensitive operations
import stripe  # Stripe SDK for advanced subscription management

from options_math import (
    generate_options_chain,
    calculate_payoff,
    find_break_evens,
    calculate_greeks,
    calculate_pnl_attribution,
    simulate_assignment,
)
from stock_data import (
    get_stock_data,
    search_tickers,
    generate_expirations,
    get_options_chain_real,
    get_available_expirations,
)
from candle_patterns import detect_all_patterns, PATTERN_META
from performance import (
    compute_trade_pnl,
    detect_errors,
    compute_analytics,
    generate_insights,
    trades_for_user,
    make_trade_doc,
)

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

_COINGECKO_COIN_MAP: Dict[str, str] = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana", "BNB": "binancecoin",
    "XRP": "ripple", "ADA": "cardano", "DOGE": "dogecoin", "AVAX": "avalanche-2",
    "DOT": "polkadot", "LINK": "chainlink", "LTC": "litecoin",
}


def _pick_ohlc_interval_ms(days: int) -> int:
    """Pick aggregation bucket size (ms) based on the requested time range."""
    if days <= 7:
        return 3600 * 1000               # 1 hour
    if days <= 30:
        return 4 * 3600 * 1000           # 4 hours
    return 24 * 3600 * 1000              # 1 day


def _candle_from_bucket(bucket_start_ms: int, prices: List[float]) -> Dict[str, Any]:
    """Build an OHLC candle from the prices that fell into one time bucket."""
    return {
        "time": bucket_start_ms // 1000,
        "open": prices[0],
        "high": max(prices),
        "low": min(prices),
        "close": prices[-1],
    }


def _group_prices_into_ohlc(
    prices: List[List[float]], interval_ms: int
) -> List[Dict[str, Any]]:
    """Group raw [timestamp_ms, price] tuples into OHLC candles."""
    ohlc: List[Dict[str, Any]] = []
    bucket_start: Optional[int] = None
    bucket_prices: List[float] = []

    for timestamp, price in prices:
        interval_start = (int(timestamp) // interval_ms) * interval_ms
        if bucket_start is None or interval_start != bucket_start:
            if bucket_prices and bucket_start is not None:
                ohlc.append(_candle_from_bucket(bucket_start, bucket_prices))
            bucket_start = interval_start
            bucket_prices = [price]
        else:
            bucket_prices.append(price)

    if bucket_prices and bucket_start is not None:
        ohlc.append(_candle_from_bucket(bucket_start, bucket_prices))
    return ohlc


@api_router.get("/ohlc/{symbol}")
async def get_ohlc_data(symbol: str, days: int = 30) -> Dict[str, Any]:
    """Get OHLC data for candlestick charts."""
    empty: Dict[str, Any] = {"ohlc": [], "symbol": symbol.upper()}
    coin_id = _COINGECKO_COIN_MAP.get(symbol.upper(), "bitcoin")
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart",
                params={"vs_currency": "usd", "days": days},
                timeout=15.0,
            )
        if response.status_code != 200:
            return empty

        prices = response.json().get("prices", [])
        if not prices:
            return empty

        ohlc = _group_prices_into_ohlc(prices, _pick_ohlc_interval_ms(days))
        return {"ohlc": ohlc, "symbol": symbol.upper()}
    except Exception as e:
        logging.error(f"Error fetching OHLC data: {e}")
        return empty

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
async def journal_delete_trade(trade_id: str, user: dict = Depends(require_user)):
    result = await db.trades.delete_one({"id": trade_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trade no encontrado")
    return {"message": "Trade eliminado"}

def _empty_journal_stats() -> Dict[str, Any]:
    return {
        "totalTrades": 0, "wins": 0, "losses": 0, "winRate": 0,
        "totalPnl": 0, "avgWin": 0, "avgLoss": 0,
        "profitFactor": 0, "expectancy": 0,
        "maxDrawdown": 0, "consecutiveLosses": 0,
    }


def _aggregate_journal_trades(trades: List[Dict[str, Any]]) -> Dict[str, float]:
    """Single-pass aggregation over a list of closed trades."""
    agg = {
        "total_pnl": 0.0, "gross_profit": 0.0, "gross_loss": 0.0,
        "wins": 0, "losses": 0,
        "max_consecutive_losses": 0, "max_drawdown": 0.0,
    }
    current_streak = 0
    equity = 0.0
    peak = 0.0

    for trade in trades:
        pnl = trade.get("pnl", 0) or 0
        agg["total_pnl"] += pnl
        if pnl > 0:
            agg["wins"] += 1
            agg["gross_profit"] += pnl
            current_streak = 0
        else:
            agg["losses"] += 1
            agg["gross_loss"] += abs(pnl)
            current_streak += 1
            if current_streak > agg["max_consecutive_losses"]:
                agg["max_consecutive_losses"] = current_streak
        equity += pnl
        if equity > peak:
            peak = equity
        drawdown = peak - equity
        if drawdown > agg["max_drawdown"]:
            agg["max_drawdown"] = drawdown
    return agg


def _journal_stats_from_aggregate(agg: Dict[str, float], total: int) -> Dict[str, Any]:
    """Derive the public stats dict from the aggregate counters."""
    wins, losses = agg["wins"], agg["losses"]
    avg_win = agg["gross_profit"] / wins if wins else 0
    avg_loss = -agg["gross_loss"] / losses if losses else 0
    profit_factor = agg["gross_profit"] / agg["gross_loss"] if agg["gross_loss"] > 0 else 0
    win_rate = (wins / total) * 100 if total else 0
    expectancy = (win_rate / 100 * avg_win) + ((100 - win_rate) / 100 * avg_loss)
    return {
        "totalTrades": total,
        "wins": wins,
        "losses": losses,
        "winRate": round(win_rate, 2),
        "totalPnl": round(agg["total_pnl"], 2),
        "avgWin": round(avg_win, 2),
        "avgLoss": round(avg_loss, 2),
        "profitFactor": round(profit_factor, 2),
        "expectancy": round(expectancy, 2),
        "maxDrawdown": round(agg["max_drawdown"], 2),
        "consecutiveLosses": agg["max_consecutive_losses"],
    }


@api_router.get("/journal/stats")
async def get_journal_stats(user: dict = Depends(require_user)) -> Dict[str, Any]:
    """Get trading statistics from the user's closed trades."""
    trades = await db.trades.find(
        {"user_id": user["id"], "status": "closed"},
        {"_id": 0},
    ).to_list(1000)
    if not trades:
        return _empty_journal_stats()
    agg = _aggregate_journal_trades(trades)
    return _journal_stats_from_aggregate(agg, len(trades))

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

def _simulate_one_mc_path(
    initial: float, num_trades: int, win_rate: float,
    avg_win: float, avg_loss: float, rng: secrets.SystemRandom,
) -> Dict[str, Any]:
    """Simulate one full equity curve and its max drawdown."""
    balance = initial
    curve = [balance]
    peak = balance
    max_dd = 0.0
    for _ in range(num_trades):
        balance += avg_win if rng.random() < win_rate else avg_loss
        curve.append(balance)
        if balance > peak:
            peak = balance
        dd = (peak - balance) / peak if peak > 0 else 0
        if dd > max_dd:
            max_dd = dd
    return {"final": balance, "curve": curve, "max_dd_pct": max_dd * 100}


def _summarize_mc_runs(initial: float, finals: List[float], drawdowns: List[float]) -> Dict[str, Any]:
    """Compute percentile/risk-of-ruin statistics from a batch of MC final balances."""
    finals_sorted = sorted(finals)
    n = len(finals_sorted)
    return {
        "initialCapital": initial,
        "avgFinalBalance": round(sum(finals_sorted) / n, 2),
        "percentile5": round(finals_sorted[int(n * 0.05)], 2),
        "percentile50": round(finals_sorted[int(n * 0.50)], 2),
        "percentile95": round(finals_sorted[int(n * 0.95)], 2),
        "riskOfRuin": round(sum(1 for b in finals_sorted if b <= 0) / n * 100, 2),
        "avgMaxDrawdown": round(sum(drawdowns) / len(drawdowns), 2),
        "profitProbability": round(sum(1 for b in finals_sorted if b > initial) / n * 100, 2),
    }


@api_router.post("/monte-carlo")
async def run_monte_carlo(request: dict, user: dict = Depends(require_user)) -> Dict[str, Any]:
    """Run Monte Carlo simulation based on trading statistics."""
    if not check_premium(user):
        raise HTTPException(status_code=403, detail="Función premium requerida")

    win_rate = request.get("winRate", 50) / 100
    avg_win = request.get("avgWin", 100)
    avg_loss = request.get("avgLoss", -50)
    initial = request.get("initialCapital", 10000)
    num_trades = request.get("numTrades", 100)
    num_simulations = request.get("numSimulations", 1000)

    rng = secrets.SystemRandom()
    finals: List[float] = []
    drawdowns: List[float] = []
    curves: List[List[float]] = []
    for _ in range(num_simulations):
        path = _simulate_one_mc_path(initial, num_trades, win_rate, avg_win, avg_loss, rng)
        finals.append(path["final"])
        drawdowns.append(path["max_dd_pct"])
        if len(curves) < 100:  # keep first 100 paths for charting
            curves.append(path["curve"])

    return {"simulations": curves[:50], "statistics": _summarize_mc_runs(initial, finals, drawdowns)}

# ============= BACKTESTING =============

def _simulate_backtest_trades(
    n: int, initial_balance: float, win_rate: float,
    take_profit_pct: float, stop_loss_pct: float, leverage: float,
    rng: secrets.SystemRandom,
) -> Dict[str, Any]:
    """Run a single synthetic backtest pass, return trades list + summary fields."""
    trades: List[Dict[str, Any]] = []
    balance = initial_balance
    wins = 0
    losses = 0
    peak = balance
    max_drawdown = 0.0

    for i in range(n):
        is_win = rng.random() < win_rate
        if is_win:
            wins += 1
            pnl = balance * (take_profit_pct / 100) * leverage
        else:
            losses += 1
            pnl = -balance * (stop_loss_pct / 100) * leverage
        balance += pnl
        if balance > peak:
            peak = balance
        drawdown = (peak - balance) / peak * 100 if peak > 0 else 0
        if drawdown > max_drawdown:
            max_drawdown = drawdown
        trades.append({
            "trade_num": i + 1,
            "type": "LONG" if rng.random() > 0.5 else "SHORT",
            "result": "WIN" if is_win else "LOSS",
            "pnl": round(pnl, 2),
            "balance": round(balance, 2),
        })
    return {"trades": trades, "balance": balance, "wins": wins, "losses": losses,
            "max_drawdown": max_drawdown}


@api_router.post("/backtest")
async def run_backtest(request: dict, user: dict = Depends(require_user)) -> Dict[str, Any]:
    if not check_premium(user):
        raise HTTPException(status_code=403, detail="Función premium requerida")

    strategy = request.get("strategy", "SMA Crossover")
    initial_capital = request.get("initial_capital", 10000)
    take_profit = request.get("take_profit", 5)
    stop_loss = request.get("stop_loss", 2)
    leverage = request.get("leverage", 1)

    rng = secrets.SystemRandom()
    n = rng.randint(50, 150)
    win_rate = rng.uniform(0.45, 0.65)
    sim = _simulate_backtest_trades(n, initial_capital, win_rate, take_profit, stop_loss, leverage, rng)

    final = sim["balance"]
    wins, losses = sim["wins"], sim["losses"]
    roi = ((final - initial_capital) / initial_capital) * 100
    profit_factor = round((wins * take_profit) / (losses * stop_loss), 2) if losses > 0 else 0

    return {
        "id": str(uuid.uuid4()),
        "strategy": strategy,
        "initial_capital": initial_capital,
        "final_balance": round(final, 2),
        "total_trades": n,
        "wins": wins,
        "losses": losses,
        "win_rate": round(wins / n * 100, 2),
        "roi": round(roi, 2),
        "max_drawdown": round(sim["max_drawdown"], 2),
        "profit_factor": profit_factor,
        "trades": sim["trades"][-20:],
        "equity_curve": [t["balance"] for t in sim["trades"]],
    }

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

_PAYMENT_METHODS_MAP = {
    "stripe": ["card"],
    "card":   ["card"],
    "sepa":   ["sepa_debit"],
    "klarna": ["klarna"],
}


def _build_pending_transaction(
    user: dict, plan_id: str, plan: dict, payment_method: str
) -> Dict[str, Any]:
    """Build the pending payment_transactions document (no Stripe fields yet)."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "plan_id": plan_id,
        "amount": plan["price"],
        "currency": plan["currency"],
        "payment_method": payment_method,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def _create_stripe_session(
    plan: dict, payment_method: str, success_url: str, cancel_url: str,
    metadata: Dict[str, str], origin_url: str,
) -> Any:
    """Create a Stripe Checkout session via emergentintegrations and return it."""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    webhook_url = f"{origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    checkout_request = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency=plan["currency"].lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        payment_methods=_PAYMENT_METHODS_MAP.get(payment_method, ["card"]),
        metadata=metadata,
    )
    return await stripe_checkout.create_checkout_session(checkout_request)


@api_router.post("/checkout/create")
async def create_checkout(request: dict, user: dict = Depends(require_user)) -> Dict[str, Any]:
    plan_id = request.get("plan_id")
    payment_method = request.get("payment_method", "stripe")
    origin_url = request.get("origin_url", "")

    plan = SUBSCRIPTION_PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Plan no válido")

    transaction = _build_pending_transaction(user, plan_id, plan, payment_method)

    if payment_method in _PAYMENT_METHODS_MAP:
        session = await _create_stripe_session(
            plan,
            payment_method,
            success_url=f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin_url}/payment/cancel",
            metadata={
                "user_id": user["id"],
                "plan_id": plan_id,
                "transaction_id": transaction["id"],
            },
            origin_url=origin_url,
        )
        transaction["session_id"] = session.session_id
        transaction["checkout_url"] = session.url

    await db.payment_transactions.insert_one(transaction)

    return {
        "transaction_id": transaction["id"],
        "checkout_url": transaction.get("checkout_url"),
        "session_id": transaction.get("session_id"),
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

def _stripe_session_ids(session_id: str) -> Dict[str, Optional[str]]:
    """Retrieve Stripe customer & subscription IDs for a paid session, with safe fallback."""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return {"customer": session.customer, "subscription": session.subscription}
    except Exception as e:
        logging.error(f"Error retrieving Stripe session: {e}")
        return {"customer": None, "subscription": None}


async def _activate_paid_subscription(
    user_id: str, plan_id: str, plan: dict, transaction_id: Optional[str], session_id: str,
) -> None:
    """Mark user premium and the matching transaction as paid."""
    subscription_end = datetime.now(timezone.utc) + timedelta(days=plan["days"])
    update_data: Dict[str, Any] = {
        "subscription_plan": plan_id,
        "subscription_end": subscription_end.isoformat(),
        "is_premium": True,
    }
    ids = _stripe_session_ids(session_id)
    if ids["customer"]:
        update_data["stripe_customer_id"] = ids["customer"]
    if ids["subscription"]:
        update_data["stripe_subscription_id"] = ids["subscription"]
    await db.users.update_one({"id": user_id}, {"$set": update_data})

    if transaction_id:
        await db.payment_transactions.update_one(
            {"id": transaction_id},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request) -> Dict[str, str]:
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    host_url = str(request.base_url).rstrip("/")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}/api/webhook/stripe")

    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.payment_status != "paid":
            return {"status": "received"}

        meta = webhook_response.metadata or {}
        user_id = meta.get("user_id")
        plan_id = meta.get("plan_id")
        plan = SUBSCRIPTION_PLANS.get(plan_id) if plan_id else None
        if not (user_id and plan_id and plan):
            return {"status": "received"}

        await _activate_paid_subscription(
            user_id=user_id,
            plan_id=plan_id,
            plan=plan,
            transaction_id=meta.get("transaction_id"),
            session_id=webhook_response.session_id,
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
            "current_subscription_id": sub.id,
            "requested_plan": request.new_plan_id,
            "requested_plan_price": new_plan["price"],
            "requested_plan_currency": new_plan["currency"],
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
    feePerContract: Optional[float] = 0.0     # broker fee per option contract (e.g., 0.65)
    dividendYield: Optional[float] = 0.0      # continuous yield q (e.g., 0.005)


class GreeksRequest(BaseModel):
    legs: List[OptionLegInput]
    stockPrice: float
    dividendYield: Optional[float] = 0.0


class PnlAttributionRequest(BaseModel):
    legs: List[OptionLegInput]
    stockPriceInitial: float
    stockPriceFinal: float
    daysElapsed: int = 1
    ivChangeAbs: float = 0.0  # +0.05 = +5 IV points
    initialDaysToExpiry: int = 30
    dividendYield: Optional[float] = 0.0


class AssignmentRequest(BaseModel):
    legs: List[OptionLegInput]
    stockPriceAtExpiry: float


def _legs_to_dicts(legs: List[OptionLegInput]) -> List[Dict[str, Any]]:
    """Convert a list of OptionLegInput pydantic models into the dict shape
    consumed by options_math (calculate_payoff/greeks/etc).
    Centralised to avoid per-endpoint duplication.
    """
    out: List[Dict[str, Any]] = []
    for leg in legs:
        qty = leg.get_qty()
        out.append({
            "type": leg.type,
            "action": leg.action,
            "quantity": qty,
            "qty": qty,
            "strike": leg.strike,
            "premium": leg.premium or 0,
            "iv": leg.iv or 0.3,
            "daysToExpiry": leg.daysToExpiry or 30,
        })
    return out


def _payoff_summary(
    legs_dicts: List[Dict[str, Any]],
    points: List[Dict[str, float]],
    fee_per_contract: float,
) -> Dict[str, Any]:
    """Compute payoff summary stats from raw points + legs."""
    expiry_pnls = [p["pnlAtExpiry"] for p in points]
    max_profit = max(expiry_pnls)
    max_loss = min(expiry_pnls)
    net_premium = 0.0
    total_fees = 0.0
    for leg in legs_dicts:
        if leg["type"] == "stock":
            continue
        qty = leg.get("quantity", leg.get("qty", 1))
        mult = -1 if leg["action"] == "buy" else 1
        net_premium += leg.get("premium", 0) * mult * qty * 100
        total_fees += qty * fee_per_contract
    roi = (max_profit / abs(net_premium) * 100) if net_premium != 0 else 0
    return {
        "maxProfit": round(max_profit, 2),
        "maxLoss": round(max_loss, 2),
        "netPremium": round(net_premium, 2),
        "totalFees": round(total_fees, 2),
        "roi": round(roi, 1),
        "isMaxProfitUnlimited": max_profit > 5000000,
    }


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


def _classify_symbol(sym: str) -> dict:
    """Classify a yfinance symbol into a user-friendly category + clean label."""
    s = sym.upper()
    if s.startswith("^"):
        index_names = {
            "^GSPC": "S&P 500", "^DJI": "Dow Jones", "^IXIC": "Nasdaq Composite",
            "^RUT": "Russell 2000", "^VIX": "VIX Volatility", "^FTSE": "FTSE 100",
            "^GDAXI": "DAX", "^FCHI": "CAC 40", "^N225": "Nikkei 225",
            "^HSI": "Hang Seng", "^STOXX50E": "Euro Stoxx 50", "^STI": "STI Singapore",
        }
        return {"category": "indices", "name": index_names.get(s, s)}
    if s.endswith("=X"):
        return {"category": "forex", "name": s.replace("=X", "")}
    if s.endswith("=F"):
        comm_names = {
            "GC=F": "Gold", "SI=F": "Silver", "CL=F": "Crude Oil (WTI)",
            "BZ=F": "Brent Crude", "NG=F": "Natural Gas", "HG=F": "Copper",
            "PL=F": "Platinum", "PA=F": "Palladium", "ZC=F": "Corn",
            "ZW=F": "Wheat", "ZS=F": "Soybeans", "KC=F": "Coffee",
            "CC=F": "Cocoa", "SB=F": "Sugar", "CT=F": "Cotton",
        }
        return {"category": "commodities", "name": comm_names.get(s, s)}
    if s.endswith("-USD"):
        crypto_names = {
            "BTC-USD": "Bitcoin", "ETH-USD": "Ethereum", "SOL-USD": "Solana",
            "BNB-USD": "Binance Coin", "XRP-USD": "Ripple", "ADA-USD": "Cardano",
            "DOGE-USD": "Dogecoin", "AVAX-USD": "Avalanche", "DOT-USD": "Polkadot",
            "LINK-USD": "Chainlink", "LTC-USD": "Litecoin", "MATIC-USD": "Polygon",
            "TRX-USD": "TRON", "ATOM-USD": "Cosmos", "NEAR-USD": "NEAR",
            "APT-USD": "Aptos", "ARB-USD": "Arbitrum", "OP-USD": "Optimism",
            "INJ-USD": "Injective", "SUI-USD": "Sui", "TIA-USD": "Celestia",
        }
        return {"category": "crypto", "name": crypto_names.get(s, s.replace("-USD", ""))}
    etfs = {
        "SPY", "QQQ", "IWM", "DIA", "VOO", "VTI", "VT", "VEA", "VWO", "EFA",
        "EEM", "AGG", "BND", "TLT", "SHY", "IEF", "GLD", "SLV", "GDX", "GDXJ",
        "USO", "UNG", "DBC", "DBA", "URA", "REMX", "ARKK", "ARKG", "ARKF",
        "ARKW", "SOXL", "TQQQ", "SQQQ", "TMF", "TZA", "FAS", "FAZ", "UVXY",
        "VXX", "SVXY", "XLF", "XLK", "XLE", "XLV", "XLY", "XLP", "XLI", "XLB",
        "XLU", "XLRE", "XLC", "XBI", "SMH", "SOXX", "KWEB", "FXI", "EWZ", "EWJ",
        "INDA", "MCHI", "EWG", "EWQ", "EWU", "TAN", "ICLN", "LIT", "JETS",
        "HACK", "BOTZ", "CLOU", "FINX", "PAVE", "ITA", "XAR", "IBB", "IGV",
        "VNQ", "VUG", "VTV", "VIG", "DVY", "SCHD", "MOAT", "QUAL", "MTUM",
    }
    if s in etfs:
        return {"category": "etfs", "name": s}
    return {"category": "stocks", "name": s}


@api_router.get("/tickers/search")
async def opt_search_tickers(q: str = ""):
    results = search_tickers(q)
    return {
        "results": [
            {"symbol": sym, **get_stock_data(sym)}
            for sym in results[:15]
        ]
    }


@api_router.get("/tickers/universal-search")
async def universal_search_tickers(q: str = "", limit: int = 30):
    """Lightweight universal search — returns categorized symbols WITHOUT live prices.

    Used by the calculator UniversalAssetSearch component which has its own
    crypto price store. Avoids the 5–15s latency of fetching yfinance per ticker.
    """
    capped_limit = max(1, min(50, limit))
    results = search_tickers(q)[:capped_limit]
    return {
        "results": [
            {"symbol": sym, **_classify_symbol(sym)}
            for sym in results
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
async def opt_calculate_payoff(request: PayoffRequest) -> Dict[str, Any]:
    try:
        fee = request.feePerContract or 0.0
        legs_dicts = _legs_to_dicts(request.legs)
        points = calculate_payoff(
            legs_dicts,
            request.stockPrice,
            request.priceRange or 0.35,
            request.daysToChart or 30,
            fee_per_contract=fee,
            q=request.dividendYield or 0.0,
        )
        return {
            "points": points,
            "breakEvens": find_break_evens(points),
            "stats": _payoff_summary(legs_dicts, points, fee),
        }
    except Exception as e:
        logging.error(f"Payoff calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calculate/greeks")
async def opt_calculate_greeks(request: GreeksRequest) -> Dict[str, Any]:
    try:
        legs_dicts = _legs_to_dicts(request.legs)
        return calculate_greeks(legs_dicts, request.stockPrice, q=request.dividendYield or 0.0)
    except Exception as e:
        logging.error(f"Greeks calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calculate/pnl-attribution")
async def opt_pnl_attribution(request: PnlAttributionRequest) -> Dict[str, Any]:
    """Decompose post-trade P&L into Δ/Γ/Θ/ν contributions."""
    try:
        legs_dicts = _legs_to_dicts(request.legs)
        T0 = max(request.initialDaysToExpiry, 1) / 365
        T1 = max(request.initialDaysToExpiry - request.daysElapsed, 0) / 365
        return calculate_pnl_attribution(
            legs_dicts,
            S0=request.stockPriceInitial,
            S1=request.stockPriceFinal,
            T0=T0,
            T1=T1,
            IV_change=request.ivChangeAbs or 0.0,
            q=request.dividendYield or 0.0,
        )
    except Exception as e:
        logging.error(f"PnL attribution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/calculate/assignment")
async def opt_assignment(request: AssignmentRequest) -> Dict[str, Any]:
    """Simulate exercise/assignment at expiry given a final stock price."""
    try:
        legs_dicts = _legs_to_dicts(request.legs)
        return simulate_assignment(legs_dicts, request.stockPriceAtExpiry)
    except Exception as e:
        logging.error(f"Assignment simulation error: {e}")
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


# ========== P1 FEATURES: IV Rank & Unusual Options Activity ==========
def _compute_realized_vol_series(hist) -> Optional[Any]:
    """Return the rolling-20d annualised realised-vol series (or None if not enough data)."""
    import numpy as np
    closes = hist["Close"].dropna()
    log_returns = np.log(closes / closes.shift(1)).dropna()
    rolling_vol = log_returns.rolling(window=20).std() * np.sqrt(252)
    rolling_vol = rolling_vol.dropna()
    if len(rolling_vol) < 10:
        return None
    return rolling_vol


def _fetch_atm_iv_proxy(symbol: str, spot: float) -> Optional[float]:
    """Return current ATM IV (avg of call+put) from the 4th available expiration, if any."""
    try:
        exps = get_available_expirations(symbol)
        if not exps:
            return None
        chain = get_options_chain_real(symbol, exps[min(3, len(exps) - 1)]["date"])
        if not chain:
            return None
        atm = min(chain, key=lambda c: abs(c["strike"] - spot))
        ivs = [v for v in [atm.get("call", {}).get("iv"), atm.get("put", {}).get("iv")] if v and v > 0]
        return sum(ivs) / len(ivs) if ivs else None
    except Exception as e:
        logging.warning(f"IV rank ATM IV fetch failed: {e}")
        return None


def _iv_rank_recommendation(iv_rank: float) -> str:
    """Map an IV rank score to a semantic recommendation key."""
    if iv_rank >= 60:
        return "sell_premium"
    if iv_rank <= 30:
        return "buy_premium"
    return "neutral"


@api_router.get("/options/iv-rank/{symbol}")
async def get_iv_rank(symbol: str) -> Dict[str, Any]:
    """Compute IV Rank & Percentile from realized volatility (1y window)."""
    try:
        import yfinance as yf
        hist = yf.Ticker(symbol).history(period="1y")
        if hist.empty or len(hist) < 30:
            return {"symbol": symbol.upper(), "available": False}

        rolling_vol = _compute_realized_vol_series(hist)
        if rolling_vol is None:
            return {"symbol": symbol.upper(), "available": False}

        spot = float(hist["Close"].iloc[-1])
        current_iv = _fetch_atm_iv_proxy(symbol, spot)

        iv_high = float(rolling_vol.max())
        iv_low = float(rolling_vol.min())
        iv_now = current_iv if current_iv else float(rolling_vol.iloc[-1])

        iv_range = iv_high - iv_low
        iv_rank = ((iv_now - iv_low) / iv_range * 100) if iv_range > 0.001 else 50.0
        iv_rank = max(0, min(100, iv_rank))
        iv_percentile = float((rolling_vol < iv_now).sum() / len(rolling_vol) * 100)

        return {
            "symbol": symbol.upper(),
            "available": True,
            "ivCurrent": round(iv_now, 4),
            "ivHigh52w": round(iv_high, 4),
            "ivLow52w": round(iv_low, 4),
            "ivRank": round(iv_rank, 1),
            "ivPercentile": round(iv_percentile, 1),
            "recommendation": _iv_rank_recommendation(iv_rank),
        }
    except Exception as e:
        logging.error(f"IV rank error for {symbol}: {e}")
        return {"symbol": symbol.upper(), "available": False, "error": str(e)}


def _build_unusual_row(symbol: str, side: str, row: Dict[str, Any], opt: Dict[str, Any],
                       exp: Dict[str, Any], stock: Dict[str, Any], ratio: float) -> Dict[str, Any]:
    """Construct one normalized unusual-options row."""
    moneyness_pct = ((row["strike"] - stock["price"]) / stock["price"]) * 100
    is_itm = (side == "call" and row["strike"] < stock["price"]) or \
             (side == "put"  and row["strike"] > stock["price"])
    return {
        "symbol": symbol.upper(),
        "type": side,
        "strike": row["strike"],
        "expiration": exp["fullLabel"],
        "daysToExpiry": exp["daysToExpiry"],
        "volume": opt.get("volume", 0) or 0,
        "openInterest": opt.get("openInterest", 0) or 0,
        "ratio": round(ratio, 2),
        "iv": round(opt.get("iv", 0) or 0, 4),
        "premium": opt.get("mid", 0),
        "bid": opt.get("bid"),
        "ask": opt.get("ask"),
        "last": opt.get("last"),
        "moneynessPct": round(moneyness_pct, 2),
        "isITM": is_itm,
        "estNotional": round((opt.get("volume", 0) or 0) * (opt.get("mid", 0) or 0) * 100, 0),
    }


def _scan_chain_for_unusual(symbol: str, chain: List[Dict[str, Any]], exp: Dict[str, Any],
                            stock: Dict[str, Any], min_ratio: float, min_volume: int) -> List[Dict[str, Any]]:
    """Walk one chain (single expiry) and return the rows that pass the filters."""
    rows: List[Dict[str, Any]] = []
    for row in chain:
        for side in ("call", "put"):
            opt = row.get(side, {})
            vol = opt.get("volume", 0) or 0
            oi = opt.get("openInterest", 0) or 0
            if vol < min_volume:
                continue
            ratio = vol / max(oi, 1)
            if ratio < min_ratio:
                continue
            rows.append(_build_unusual_row(symbol, side, row, opt, exp, stock, ratio))
    return rows


@api_router.get("/options/unusual/{symbol}")
async def get_unusual_options(symbol: str, min_ratio: float = 2.0, min_volume: int = 100) -> Dict[str, Any]:
    """Detect unusual options activity (volume >> open interest) across the 5 nearest expiries."""
    try:
        stock = get_stock_data(symbol)
        expirations = get_available_expirations(symbol) or generate_expirations()

        all_unusual: List[Dict[str, Any]] = []
        for exp in expirations[:5]:
            chain = get_options_chain_real(symbol, exp["date"])
            if not chain:
                continue
            all_unusual.extend(_scan_chain_for_unusual(symbol, chain, exp, stock, min_ratio, min_volume))

        all_unusual.sort(key=lambda x: (x["ratio"], x["estNotional"]), reverse=True)
        return {
            "symbol": symbol.upper(),
            "stock": stock,
            "totalFound": len(all_unusual),
            "filters": {"minRatio": min_ratio, "minVolume": min_volume},
            "results": all_unusual[:50],
        }
    except Exception as e:
        logging.error(f"Unusual options error for {symbol}: {e}")
        return {"symbol": symbol.upper(), "error": str(e), "results": []}


# ========== P2 FEATURES: AI Trade Coach, Market-wide Flow ==========
class AITradeAnalysisRequest(BaseModel):
    symbol: str
    stockPrice: float
    legs: List[dict]
    stats: dict  # {maxProfit, maxLoss, pop, roi, rr, capitalRequired, isMaxLossUnlimited}
    greeks: Optional[dict] = None
    ivRank: Optional[float] = None
    daysToExpiry: Optional[int] = 30
    userBalance: Optional[float] = None


def _format_legs_for_prompt(legs: List[Dict[str, Any]]) -> List[str]:
    """Render a list of trade legs as human-readable bullet strings."""
    out: List[str] = []
    for leg in legs:
        if leg.get("type") == "stock":
            out.append(f"{leg['action'].upper()} {leg.get('quantity', 100)} acciones @ ${leg.get('strike')}")
        else:
            out.append(
                f"{leg['action'].upper()} {leg.get('quantity', 1)}x {leg['type'].upper()} Strike ${leg['strike']} "
                f"@ ${leg.get('premium', 0):.2f} (IV {(leg.get('iv', 0.3) * 100):.0f}%)"
            )
    return out


def _build_ai_trade_prompt(req: "AITradeAnalysisRequest") -> str:
    """Compose the markdown prompt sent to Claude. Pure / side-effect free."""
    legs_lines = _format_legs_for_prompt(req.legs)
    greeks_str = ""
    if req.greeks:
        greeks_str = (
            f"\nGreeks: Delta={req.greeks.get('delta', 0):.3f} Gamma={req.greeks.get('gamma', 0):.4f} "
            f"Theta={req.greeks.get('theta', 0):.3f} Vega={req.greeks.get('vega', 0):.3f}"
        )
    iv_str = f"\nIV Rank: {req.ivRank:.0f}%" if req.ivRank is not None else ""
    balance_str = f"\nCapital disponible del trader: ${req.userBalance}" if req.userBalance else ""

    max_profit_str = "Ilimitado" if req.stats.get("isMaxProfitUnlimited") else f"${req.stats.get('maxProfit', 0)}"
    max_loss_str = "Ilimitado" if req.stats.get("isMaxLossUnlimited") else f"${req.stats.get('maxLoss', 0)}"

    return f"""Actúa como un coach de trading de opciones experto y conciso. Analiza esta operación:

Subyacente: {req.symbol} @ ${req.stockPrice:.2f}
Vencimiento: {req.daysToExpiry}d

Legs:
{chr(10).join(['  - ' + leg for leg in legs_lines])}

Métricas:
- Máx. Beneficio: {max_profit_str}
- Máx. Pérdida: {max_loss_str}
- POP: {req.stats.get('pop', '—')}%
- ROI: {req.stats.get('roi', '—')}%
- R/R: {req.stats.get('rr', '—')}
- Capital requerido: ${req.stats.get('capitalRequired', 0)}{greeks_str}{iv_str}{balance_str}

Proporciona tu análisis en ESPAÑOL con EXACTAMENTE esta estructura (Markdown):

**✅ Puntos Fuertes**
- (2-3 bullets concretos)

**⚠️ Riesgos Principales**
- (2-3 bullets concretos)

**💡 Mejoras Sugeridas**
- (2-3 acciones accionables específicas: strikes distintos, ajustar contratos, hedge, rolar, etc.)

**📊 Veredicto**
Una frase final recomendando ENTRAR / AJUSTAR / EVITAR y por qué.

Sé directo, profesional y práctico. No repitas los números que ya tiene el trader — analiza el SIGNIFICADO. Máximo 250 palabras totales."""


@api_router.post("/options/ai-analyze")
async def ai_analyze_trade(req: AITradeAnalysisRequest) -> Dict[str, Any]:
    """AI-powered options trade coach using Claude Sonnet 4.5."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        key = os.environ.get("EMERGENT_LLM_KEY")
        if not key:
            raise HTTPException(status_code=500, detail="AI key not configured")

        chat = LlmChat(
            api_key=key,
            session_id=f"options-analysis-{req.symbol}",
            system_message=(
                "Eres un coach de trading de opciones experto con 15+ años de experiencia "
                "en volatility trading. Respondes en español, directo, profesional, y basado en datos."
            ),
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response = await chat.send_message(UserMessage(text=_build_ai_trade_prompt(req)))
        return {"analysis": response, "model": "claude-sonnet-4-5"}
    except Exception as e:
        logging.error(f"AI analyze error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {e}")


# Popular tickers scanned by Market-Wide Flow
MARKET_FLOW_TICKERS = [
    "SPY", "QQQ", "IWM", "DIA", "AAPL", "MSFT", "NVDA", "TSLA", "META",
    "AMZN", "GOOGL", "AMD", "COIN", "MARA", "PLTR", "NFLX", "BA", "JPM",
    "GME", "AMC", "SOFI", "RIVN", "F", "UBER",
]


def _build_market_flow_row(sym: str, side: str, row: Dict[str, Any], opt: Dict[str, Any],
                           exp: Dict[str, Any], stock: Dict[str, Any], ratio: float) -> Dict[str, Any]:
    """Slimmer flow row used by the market-wide scan (skips bid/ask/last)."""
    vol = opt.get("volume", 0) or 0
    return {
        "symbol": sym, "stockPrice": stock["price"],
        "type": side, "strike": row["strike"],
        "expiration": exp["fullLabel"], "daysToExpiry": exp["daysToExpiry"],
        "volume": vol, "openInterest": opt.get("openInterest", 0) or 0,
        "ratio": round(ratio, 2),
        "iv": round(opt.get("iv", 0) or 0, 4),
        "premium": opt.get("mid", 0),
        "estNotional": round(vol * (opt.get("mid", 0) or 0) * 100, 0),
        "moneynessPct": round(((row["strike"] - stock["price"]) / stock["price"]) * 100, 2),
    }


def _scan_chain_for_flow(sym: str, chain: List[Dict[str, Any]], exp: Dict[str, Any],
                         stock: Dict[str, Any], min_ratio: float, min_volume: int) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for row in chain:
        for side in ("call", "put"):
            opt = row.get(side, {})
            vol = opt.get("volume", 0) or 0
            oi = opt.get("openInterest", 0) or 0
            if vol < min_volume:
                continue
            ratio = vol / max(oi, 1)
            if ratio < min_ratio:
                continue
            rows.append(_build_market_flow_row(sym, side, row, opt, exp, stock, ratio))
    return rows


def _scan_ticker_flow(sym: str, min_ratio: float, min_volume: int) -> List[Dict[str, Any]]:
    """Scan one ticker's 2 nearest expiries; return any unusual flow rows or [] on error."""
    try:
        stock = get_stock_data(sym)
        expirations = get_available_expirations(sym) or []
        rows: List[Dict[str, Any]] = []
        for exp in expirations[:2]:  # 2 nearest expirations for speed
            chain = get_options_chain_real(sym, exp["date"])
            if not chain:
                continue
            rows.extend(_scan_chain_for_flow(sym, chain, exp, stock, min_ratio, min_volume))
        return rows
    except Exception as e:
        logging.warning(f"market-flow skipping {sym}: {e}")
        return []


@api_router.get("/options/market-flow")
async def market_wide_flow(min_ratio: float = 3.0, min_volume: int = 300, max_results: int = 30) -> Dict[str, Any]:
    """Scan popular tickers for unusual options activity (market-wide flow)."""
    try:
        all_flow: List[Dict[str, Any]] = []
        for sym in MARKET_FLOW_TICKERS:
            all_flow.extend(_scan_ticker_flow(sym, min_ratio, min_volume))
        all_flow.sort(key=lambda x: x["estNotional"], reverse=True)
        return {
            "scannedTickers": len(MARKET_FLOW_TICKERS),
            "totalFound": len(all_flow),
            "results": all_flow[:max_results],
        }
    except Exception as e:
        logging.error(f"Market flow error: {e}")
        return {"error": str(e), "results": []}


# ========== EDUCATION: Live Pattern Detector ==========
def _yfinance_to_ohlc_rows(symbol: str, period: str = "3mo", interval: str = "1d") -> List[Dict[str, Any]]:
    """Fetch historical OHLC from Yahoo Finance and shape it for the detector."""
    import yfinance as yf
    hist = yf.Ticker(symbol).history(period=period, interval=interval)
    if hist.empty:
        return []
    rows: List[Dict[str, Any]] = []
    for idx, row in hist.iterrows():
        rows.append({
            "date": idx.strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
        })
    return rows


@api_router.get("/education/pattern-scan/{symbol}")
async def education_pattern_scan(
    symbol: str, period: str = "3mo", interval: str = "1d", limit: int = 30,
) -> Dict[str, Any]:
    """Scan real OHLC for the given ticker and return canonical candlestick
    pattern detections (educational view)."""
    sym = symbol.upper().strip()
    try:
        rows = _yfinance_to_ohlc_rows(sym, period=period, interval=interval)
        if not rows:
            return {"symbol": sym, "rowsScanned": 0, "totalDetections": 0, "detections": []}
        detections = detect_all_patterns(rows)
        # Most recent first, capped at `limit`.
        detections.reverse()
        return {
            "symbol": sym,
            "period": period,
            "interval": interval,
            "rowsScanned": len(rows),
            "totalDetections": len(detections),
            "detections": detections[:limit],
        }
    except Exception as e:
        logging.error(f"Pattern scan error for {sym}: {e}")
        return {"symbol": sym, "error": str(e), "detections": []}


# ============================================================
# PERFORMANCE — Trade Journal & Analytics
# ============================================================

class TradeIn(BaseModel):
    """Payload for creating/updating a trade."""
    symbol: str
    side: str = Field(..., pattern="^(long|short)$")
    setup: Optional[str] = ""
    entry_price: float
    exit_price: Optional[float] = None
    sl: Optional[float] = None
    tp: Optional[float] = None
    quantity: float
    entry_date: Optional[str] = None
    exit_date: Optional[str] = None
    status: Optional[str] = None  # open | closed | sl_hit | tp_hit
    account_balance: Optional[float] = 0
    fees: Optional[float] = 0
    notes: Optional[str] = ""
    tags: Optional[List[str]] = []
    emotion: Optional[int] = None  # 1..5
    screenshot_urls: Optional[List[str]] = []


def _enrich_trade(trade: dict, prev_trades: Optional[List[dict]] = None) -> dict:
    """Compute pnl + errors. Output is JSON-safe (no _id)."""
    enriched = compute_trade_pnl(trade)
    enriched["errors"] = detect_errors(enriched, prev_trades=prev_trades)
    enriched.pop("_id", None)
    return enriched


@api_router.post("/performance/trades")
async def perf_create_trade(payload: TradeIn, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    user_id = user["id"]
    prev = await trades_for_user(db, user_id, limit=50)
    doc = make_trade_doc(payload.model_dump(), user_id)
    enriched = _enrich_trade(doc, prev_trades=prev)
    # Strip computed read-only fields before persisting (keep stored doc minimal)
    to_store = {k: v for k, v in enriched.items() if k not in ("_id",)}
    await db.trades.insert_one(to_store)
    return enriched


@api_router.get("/performance/trades")
async def perf_list_trades(
    user=Depends(get_current_user),
    limit: int = 100,
    status: Optional[str] = None,
    symbol: Optional[str] = None,
):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    query: Dict[str, Any] = {"user_id": user["id"]}
    if status:
        query["status"] = status
    if symbol:
        query["symbol"] = symbol.upper()
    cursor = db.trades.find(query, {"_id": 0}).sort("entry_date", -1).limit(limit)
    rows = await cursor.to_list(length=limit)
    # Re-enrich on each fetch so updates to detection rules apply retroactively
    enriched_rows = []
    seen: List[dict] = []
    for t in reversed(rows):  # chronological order for prev_trades context
        enriched_rows.append(_enrich_trade(t, prev_trades=list(seen)))
        seen.append(enriched_rows[-1])
    enriched_rows.reverse()
    return {"trades": enriched_rows, "count": len(enriched_rows)}


@api_router.get("/performance/trades/{trade_id}")
async def perf_get_trade(trade_id: str, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    t = await db.trades.find_one(
        {"id": trade_id, "user_id": user["id"]},
        {"_id": 0},
    )
    if not t:
        raise HTTPException(status_code=404, detail="Trade not found")
    prev = await trades_for_user(db, user["id"], limit=50)
    return _enrich_trade(t, prev_trades=prev)


@api_router.put("/performance/trades/{trade_id}")
async def perf_update_trade(trade_id: str, payload: TradeIn, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    existing = await db.trades.find_one(
        {"id": trade_id, "user_id": user["id"]},
        {"_id": 0},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Trade not found")

    updates = payload.model_dump(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    # If exit_price now set and status omitted, mark closed
    if updates.get("exit_price") is not None and not updates.get("status"):
        updates["status"] = "closed"

    merged = {**existing, **updates}
    prev = [t for t in await trades_for_user(db, user["id"], limit=50)
            if t.get("id") != trade_id]
    enriched = _enrich_trade(merged, prev_trades=prev)
    enriched.pop("_id", None)

    await db.trades.update_one(
        {"id": trade_id, "user_id": user["id"]},
        {"$set": enriched},
    )
    return enriched


@api_router.delete("/trades/{trade_id}")
async def delete_trade(trade_id: str, user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    res = await db.trades.delete_one({"id": trade_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trade not found")
    return {"ok": True}


@api_router.get("/performance/analytics")
async def performance_analytics(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    rows = await trades_for_user(db, user["id"], limit=1000)
    # Re-enrich to get fresh errors and pnl
    enriched: List[dict] = []
    seen: List[dict] = []
    for t in reversed(rows):
        e = _enrich_trade(t, prev_trades=list(seen))
        enriched.append(e)
        seen.append(e)
    enriched.reverse()
    analytics = compute_analytics(enriched)
    insights = generate_insights(analytics)
    return {"analytics": analytics, "insights": insights}


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

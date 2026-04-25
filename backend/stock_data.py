"""Stock data provider using Yahoo Finance (yfinance) for real market data"""
import yfinance as yf
import secrets
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Cache for ticker info to reduce API calls
_ticker_cache = {}
_cache_duration = 300  # 5 minutes cache

# Sector mapping for fallback
SECTOR_MAP = {
    "Technology": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOG", "GOOGL", "AMD", "INTC"],
    "Finance": ["JPM", "V", "MA", "GS", "MS", "BAC", "WFC", "C", "AXP"],
    "Healthcare": ["JNJ", "UNH", "ABBV", "PFE", "MRK", "LLY"],
    "Consumer": ["PG", "KO", "PEP", "NKE", "SBUX", "MCD"],
    "Energy": ["XOM", "CVX"],
    "ETF": ["SPY", "QQQ", "IWM", "GLD", "SLV", "TLT"],
}


def _get_sector(symbol: str) -> str:
    """Get sector for a given symbol."""
    for sector, tickers in SECTOR_MAP.items():
        if symbol.upper() in tickers:
            return sector
    return "Technology"  # Default fallback


def _get_cached_stock(symbol: str) -> Optional[dict]:
    """Return cached stock dict if still fresh, otherwise None."""
    cache_key = f"stock_{symbol}"
    if cache_key not in _ticker_cache:
        return None
    cached_data, cached_time = _ticker_cache[cache_key]
    if (datetime.now() - cached_time).total_seconds() < _cache_duration:
        logger.info(f"Using cached data for {symbol}")
        return cached_data
    return None


def _normalize_dividend_yield(raw: Optional[float]) -> float:
    """Yahoo sometimes returns dividendYield as decimal (0.005) and sometimes
    as percentage (0.5). Normalize defensively to a decimal in [0, 1)."""
    div = raw or 0.0
    if div > 1:
        div = div / 100.0
    return float(div)


def _build_stock_dict(symbol: str, hist, info: dict) -> dict:
    """Compose the public stock-data response from a yfinance hist DataFrame + info dict."""
    current_price = float(hist["Close"].iloc[-1])
    fallback_prev = hist["Close"].iloc[-2] if len(hist) > 1 else current_price
    previous_close = float(info.get("previousClose", fallback_prev))

    change = current_price - previous_close
    change_percent = (change / previous_close * 100) if previous_close > 0 else 0
    volume = info.get("volume", 0) or 0
    return {
        "symbol": symbol,
        "name": info.get("longName") or info.get("shortName") or f"{symbol} Corp.",
        "price": round(current_price, 2),
        "change": round(change, 2),
        "changePercent": round(change_percent, 2),
        "high52w": round(float(info.get("fiftyTwoWeekHigh", current_price * 1.3)), 2),
        "low52w":  round(float(info.get("fiftyTwoWeekLow",  current_price * 0.7)), 2),
        "volume": f"{volume / 1_000_000:.1f}M" if volume > 0 else "N/A",
        "sector": info.get("sector") or _get_sector(symbol),
        "dividendYield": round(_normalize_dividend_yield(info.get("dividendYield")), 6),
    }


def get_stock_data(symbol: str) -> dict:
    """Get real stock data from Yahoo Finance, caching for `_cache_duration` seconds."""
    symbol = symbol.upper().strip()

    cached = _get_cached_stock(symbol)
    if cached is not None:
        return cached

    try:
        logger.info(f"Fetching real data for {symbol} from Yahoo Finance")
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d")
        if hist.empty:
            raise ValueError(f"No data found for {symbol}")

        result = _build_stock_dict(symbol, hist, ticker.info)
        _ticker_cache[f"stock_{symbol}"] = (result, datetime.now())
        return result
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        return _get_fallback_stock_data(symbol)


def _get_fallback_stock_data(symbol: str) -> dict:
    """Fallback mock data when API fails."""
    logger.warning(f"Using fallback mock data for {symbol}")
    rng = secrets.SystemRandom()
    price = round(rng.random() * 400 + 10, 2)
    change = round((rng.random() - 0.5) * price * 0.03, 2)
    return {
        "symbol": symbol,
        "name": f"{symbol} Corp.",
        "price": price,
        "change": change,
        "changePercent": round((change / price) * 100, 2),
        "high52w": round(price * 1.3, 2),
        "low52w": round(price * 0.7, 2),
        "volume": f"{rng.random() * 50 + 1:.1f}M",
        "sector": _get_sector(symbol),
        "dividendYield": 0.0,
    }


def search_tickers(query: str) -> list:
    """Search tickers - for now returns known tickers that match query."""
    if not query:
        # Return popular tickers
        return ["AAPL", "TSLA", "MSFT", "SPY", "NVDA", "AMZN", "META", "GOOG", 
                "NFLX", "AMD", "INTC", "BA", "DIS", "JPM", "V", "MA", "WMT", 
                "COST", "HD", "QQQ"][:20]
    
    q = query.upper()
    all_tickers = [
        "AAPL", "TSLA", "MSFT", "SPY", "NVDA", "AMZN", "META", "GOOG", "GOOGL",
        "NFLX", "AMD", "INTC", "BA", "DIS", "JPM", "V", "MA", "WMT", "COST", "HD",
        "PG", "KO", "PEP", "JNJ", "UNH", "ABBV", "PFE", "MRK", "LLY", "XOM", "CVX",
        "QQQ", "IWM", "GLD", "SLV", "TLT", "COIN", "MSTR", "PLTR", "CRM", "ORCL",
        "UBER", "SNAP", "ROKU", "SQ", "PYPL", "RIVN", "LCID", "NIO", "BABA", "TSM",
        "AVGO", "MU", "SMCI", "ARM", "SHOP", "NET", "SNOW", "DDOG", "ZS", "CRWD",
        "PANW", "GS", "MS", "BAC", "WFC", "C", "F", "GM", "T", "VZ", "TMUS",
        "DELL", "IBM", "ADBE", "NOW", "INTU", "AXP", "BRK.B", "UPS", "FDX",
        "CAT", "DE", "RTX", "LMT", "GE", "ABNB", "BKNG", "MAR", "NKE", "SBUX",
        "MCD", "CMG", "LULU", "TGT", "LOW", "EL", "SPOT", "RBLX", "U", "AI",
        "SOFI", "HOOD",
    ]
    
    # Filter by query
    results = [t for t in all_tickers if q in t]
    return results[:20]


def generate_expirations():
    """Generate realistic expiration dates (weekly/monthly/LEAPS)."""
    today = datetime.now()
    days_options = [3, 7, 14, 21, 30, 45, 60, 90, 120, 150, 180, 270, 365, 540, 730]
    expirations = []

    for days in days_options:
        date = today + timedelta(days=days)
        # Find next Friday
        days_until_friday = (4 - date.weekday()) % 7
        if days_until_friday == 0 and days > 7:
            days_until_friday = 7
        date = date + timedelta(days=days_until_friday)
        actual_days = (date - today).days

        expirations.append({
            "date": date.strftime("%Y-%m-%d"),
            "daysToExpiry": actual_days,
            "label": date.strftime("%b %d"),
            "fullLabel": date.strftime("%b %d, %Y"),
            "isWeekly": days < 30,
            "isMonthly": 30 <= days < 100,
            "isLeaps": days >= 180,
        })

    return expirations


def get_options_chain_real(symbol: str, expiration_date: str) -> Optional[dict]:
    """Get real options chain from Yahoo Finance."""
    try:
        logger.info(f"Fetching options chain for {symbol} expiration {expiration_date}")
        ticker = yf.Ticker(symbol)
        
        # Get the options chain for specific expiration
        opt_chain = ticker.option_chain(expiration_date)
        
        calls = opt_chain.calls
        puts = opt_chain.puts
        
        if calls.empty and puts.empty:
            return None
        
        # Helper function to safely convert values, handling NaN
        def safe_float(val, default=0.0):
            try:
                if val is None or (hasattr(val, '__iter__') and len(val) == 0):
                    return default
                f = float(val)
                return default if (f != f) else f  # NaN check
            except (ValueError, TypeError):
                return default
        
        def safe_int(val, default=0):
            try:
                if val is None or (hasattr(val, '__iter__') and len(val) == 0):
                    return default
                f = float(val)
                if f != f:  # NaN check
                    return default
                return int(f)
            except (ValueError, TypeError):
                return default
        
        # Build chain data
        chain = []
        
        # Get all strikes (union of call and put strikes)
        call_strikes = set(calls['strike'].tolist()) if not calls.empty else set()
        put_strikes = set(puts['strike'].tolist()) if not puts.empty else set()
        all_strikes = sorted(call_strikes | put_strikes)
        
        for strike in all_strikes:
            call_row = calls[calls['strike'] == strike].iloc[0] if not calls.empty and strike in call_strikes else None
            put_row = puts[puts['strike'] == strike].iloc[0] if not puts.empty and strike in put_strikes else None
            
            chain_item = {"strike": float(strike)}
            
            # Add call data
            if call_row is not None:
                bid = safe_float(call_row.get('bid', 0))
                ask = safe_float(call_row.get('ask', 0))
                chain_item["call"] = {
                    "bid": bid,
                    "ask": ask,
                    "mid": (bid + ask) / 2,
                    "last": safe_float(call_row.get('lastPrice', 0)),
                    "volume": safe_int(call_row.get('volume', 0)),
                    "openInterest": safe_int(call_row.get('openInterest', 0)),
                    "iv": safe_float(call_row.get('impliedVolatility', 0.3), 0.3),
                }
            else:
                chain_item["call"] = {
                    "bid": 0, "ask": 0, "mid": 0, "last": 0, 
                    "volume": 0, "openInterest": 0, "iv": 0.3
                }
            
            # Add put data
            if put_row is not None:
                bid = safe_float(put_row.get('bid', 0))
                ask = safe_float(put_row.get('ask', 0))
                chain_item["put"] = {
                    "bid": bid,
                    "ask": ask,
                    "mid": (bid + ask) / 2,
                    "last": safe_float(put_row.get('lastPrice', 0)),
                    "volume": safe_int(put_row.get('volume', 0)),
                    "openInterest": safe_int(put_row.get('openInterest', 0)),
                    "iv": safe_float(put_row.get('impliedVolatility', 0.3), 0.3),
                }
            else:
                chain_item["put"] = {
                    "bid": 0, "ask": 0, "mid": 0, "last": 0,
                    "volume": 0, "openInterest": 0, "iv": 0.3
                }
            
            chain.append(chain_item)
        
        return chain
        
    except Exception as e:
        logger.error(f"Error fetching options chain for {symbol}: {str(e)}")
        return None


def get_available_expirations(symbol: str) -> Optional[list]:
    """Get available expiration dates from Yahoo Finance."""
    try:
        logger.info(f"Fetching available expirations for {symbol}")
        ticker = yf.Ticker(symbol)
        expirations = ticker.options  # Returns list of date strings
        
        if not expirations:
            return None
        
        today = datetime.now()
        result = []
        
        for exp_str in expirations[:15]:  # Limit to first 15 expirations
            exp_date = datetime.strptime(exp_str, "%Y-%m-%d")
            days_to_expiry = (exp_date - today).days
            
            result.append({
                "date": exp_str,
                "daysToExpiry": days_to_expiry,
                "label": exp_date.strftime("%b %d"),
                "fullLabel": exp_date.strftime("%b %d, %Y"),
                "isWeekly": days_to_expiry < 30,
                "isMonthly": 30 <= days_to_expiry < 100,
                "isLeaps": days_to_expiry >= 180,
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error fetching expirations for {symbol}: {str(e)}")
        return None

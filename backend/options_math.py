"""Black-Scholes Option Pricing and Greeks - Python Implementation"""
import math
from scipy.stats import norm


def call_price(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Calculate Black-Scholes call option price."""
    if T <= 0:
        return max(0, S - K)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    return S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)


def put_price(S: float, K: float, T: float, r: float, sigma: float) -> float:
    """Calculate Black-Scholes put option price."""
    if T <= 0:
        return max(0, K - S)
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)


def option_price(S, K, T, r, sigma, option_type):
    if option_type == "call":
        return call_price(S, K, T, r, sigma)
    return put_price(S, K, T, r, sigma)


def delta(S, K, T, r, sigma, option_type):
    if T <= 0:
        if option_type == "call":
            return 1.0 if S > K else 0.0
        return -1.0 if S < K else 0.0
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    if option_type == "call":
        return norm.cdf(d1)
    return norm.cdf(d1) - 1


def gamma_val(S, K, T, r, sigma):
    if T <= 0:
        return 0.0
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    return norm.pdf(d1) / (S * sigma * math.sqrt(T))


def theta_val(S, K, T, r, sigma, option_type):
    if T <= 0:
        return 0.0
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    term1 = -(S * norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
    if option_type == "call":
        return (term1 - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365
    return (term1 + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365


def vega_val(S, K, T, r, sigma):
    if T <= 0:
        return 0.0
    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    return (S * math.sqrt(T) * norm.pdf(d1)) / 100


def rho_val(S, K, T, r, sigma, option_type):
    if T <= 0:
        return 0.0
    d2 = (math.log(S / K) + (r - 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    if option_type == "call":
        return (K * T * math.exp(-r * T) * norm.cdf(d2)) / 100
    return -(K * T * math.exp(-r * T) * norm.cdf(-d2)) / 100


def generate_options_chain(current_price: float, days_to_expiry: int):
    """Generate a realistic options chain for a given price and expiry."""
    if current_price < 20:
        step = 0.5
    elif current_price < 50:
        step = 1
    elif current_price < 200:
        step = 2.5
    elif current_price < 500:
        step = 5
    else:
        step = 10

    base_strike = round(current_price / step) * step
    T = max(days_to_expiry / 365, 0.001)
    r = 0.0525
    base_iv = 0.30

    strikes = []
    for i in range(-15, 16):
        strike = round(base_strike + i * step, 2)
        if strike <= 0:
            continue

        # IV smile
        moneyness = math.log(current_price / strike) if strike > 0 else 0
        iv = base_iv + 0.05 * (moneyness**2) * 10
        iv = max(0.05, min(1.5, iv))

        c_price = call_price(current_price, strike, T, r, iv)
        p_price = put_price(current_price, strike, T, r, iv)
        c_delta = delta(current_price, strike, T, r, iv, "call")
        p_delta = delta(current_price, strike, T, r, iv, "put")
        g = gamma_val(current_price, strike, T, r, iv)
        c_theta = theta_val(current_price, strike, T, r, iv, "call")
        p_theta = theta_val(current_price, strike, T, r, iv, "put")
        v = vega_val(current_price, strike, T, r, iv)

        spread = max(0.01, c_price * 0.025)

        import secrets
        rng = secrets.SystemRandom()
        strikes.append({
            "strike": strike,
            "call": {
                "bid": round(max(0.01, c_price - spread), 2),
                "ask": round(c_price + spread, 2),
                "mid": round(c_price, 2),
                "last": round(c_price, 2),
                "volume": rng.randint(50, 8000),
                "openInterest": rng.randint(200, 30000),
                "iv": round(iv, 4),
                "delta": round(c_delta, 4),
                "gamma": round(g, 6),
                "theta": round(c_theta, 4),
                "vega": round(v, 4),
            },
            "put": {
                "bid": round(max(0.01, p_price - spread), 2),
                "ask": round(p_price + spread, 2),
                "mid": round(p_price, 2),
                "last": round(p_price, 2),
                "volume": rng.randint(50, 8000),
                "openInterest": rng.randint(200, 30000),
                "iv": round(iv, 4),
                "delta": round(p_delta, 4),
                "gamma": round(g, 6),
                "theta": round(p_theta, 4),
                "vega": round(v, 4),
            },
        })

    return strikes


def calculate_payoff(legs, stock_price, price_range=0.35, days_to_chart=30, r=0.0525):
    """Calculate strategy P&L across a price range."""
    min_price = stock_price * (1 - price_range)
    max_price = stock_price * (1 + price_range)
    n_points = 200
    step = (max_price - min_price) / n_points

    points = []
    for i in range(n_points + 1):
        price = min_price + i * step
        total_pnl = 0
        total_pnl_expiry = 0

        for leg in legs:
            multiplier = 1 if leg["action"] == "buy" else -1
            qty = leg.get("quantity", leg.get("qty", 1))

            if leg["type"] == "stock":
                pnl = (price - stock_price) * multiplier * qty
                total_pnl += pnl
                total_pnl_expiry += pnl
            else:
                T_current = max(0, days_to_chart / 365)
                premium = leg.get("premium", 0)
                iv = leg.get("iv", 0.3)
                strike = leg["strike"]

                current_val = option_price(price, strike, T_current, r, iv, leg["type"])
                expiry_val = option_price(price, strike, 0, r, iv, leg["type"])

                total_pnl += (current_val - premium) * multiplier * qty * 100
                total_pnl_expiry += (expiry_val - premium) * multiplier * qty * 100

        points.append({
            "price": round(price, 2),
            "pnl": round(total_pnl, 2),
            "pnlAtExpiry": round(total_pnl_expiry, 2),
        })

    return points


def find_break_evens(payoff_data):
    """Find break-even points where P&L crosses zero."""
    break_evens = []
    for i in range(1, len(payoff_data)):
        prev = payoff_data[i - 1]["pnlAtExpiry"]
        curr = payoff_data[i]["pnlAtExpiry"]
        if (prev <= 0 and curr >= 0) or (prev >= 0 and curr <= 0):
            ratio = abs(prev) / (abs(prev) + abs(curr)) if (abs(prev) + abs(curr)) > 0 else 0.5
            be_price = payoff_data[i - 1]["price"] + ratio * (payoff_data[i]["price"] - payoff_data[i - 1]["price"])
            break_evens.append(round(be_price, 2))
    return break_evens


def calculate_greeks(legs, stock_price, r=0.0525):
    """Calculate aggregate Greeks for a strategy."""
    total = {"delta": 0, "gamma": 0, "theta": 0, "vega": 0, "rho": 0}

    for leg in legs:
        multiplier = 1 if leg["action"] == "buy" else -1
        qty = leg.get("quantity", leg.get("qty", 1))

        if leg["type"] == "stock":
            total["delta"] += multiplier * qty / 100
            continue

        T = max(leg.get("daysToExpiry", 30), 1) / 365
        iv = leg.get("iv", 0.3)
        strike = leg["strike"]

        total["delta"] += delta(stock_price, strike, T, r, iv, leg["type"]) * multiplier * qty
        total["gamma"] += gamma_val(stock_price, strike, T, r, iv) * multiplier * qty
        total["theta"] += theta_val(stock_price, strike, T, r, iv, leg["type"]) * multiplier * qty
        total["vega"] += vega_val(stock_price, strike, T, r, iv) * multiplier * qty
        total["rho"] += rho_val(stock_price, strike, T, r, iv, leg["type"]) * multiplier * qty

    return {k: round(v, 4) for k, v in total.items()}

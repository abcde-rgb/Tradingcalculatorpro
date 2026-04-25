"""Black-Scholes-Merton Option Pricing and Greeks.

Supports continuous dividend yield q (BSM extension to handle dividend-paying stocks).
When q=0, this reduces to standard Black-Scholes. Default q=0 preserves backwards compat.
"""
import math
from scipy.stats import norm


def _d1_d2(S, K, T, r, sigma, q=0.0):
    """Compute d1 and d2 with continuous dividend yield q."""
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        return None, None
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    return d1, d2


def call_price(S, K, T, r, sigma, q=0.0):
    """Black-Scholes-Merton call price with continuous dividend yield q."""
    if T <= 0:
        return max(0, S - K)
    d1, d2 = _d1_d2(S, K, T, r, sigma, q)
    return S * math.exp(-q * T) * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)


def put_price(S, K, T, r, sigma, q=0.0):
    """Black-Scholes-Merton put price with continuous dividend yield q."""
    if T <= 0:
        return max(0, K - S)
    d1, d2 = _d1_d2(S, K, T, r, sigma, q)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S * math.exp(-q * T) * norm.cdf(-d1)


def option_price(S, K, T, r, sigma, option_type, q=0.0):
    if option_type == "call":
        return call_price(S, K, T, r, sigma, q)
    return put_price(S, K, T, r, sigma, q)


def delta(S, K, T, r, sigma, option_type, q=0.0):
    if T <= 0:
        if option_type == "call":
            return 1.0 if S > K else 0.0
        return -1.0 if S < K else 0.0
    d1, _ = _d1_d2(S, K, T, r, sigma, q)
    if option_type == "call":
        return math.exp(-q * T) * norm.cdf(d1)
    return math.exp(-q * T) * (norm.cdf(d1) - 1)


def gamma_val(S, K, T, r, sigma, q=0.0):
    if T <= 0:
        return 0.0
    d1, _ = _d1_d2(S, K, T, r, sigma, q)
    return math.exp(-q * T) * norm.pdf(d1) / (S * sigma * math.sqrt(T))


def theta_val(S, K, T, r, sigma, option_type, q=0.0):
    if T <= 0:
        return 0.0
    d1, d2 = _d1_d2(S, K, T, r, sigma, q)
    term1 = -(S * math.exp(-q * T) * norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
    if option_type == "call":
        return (term1 - r * K * math.exp(-r * T) * norm.cdf(d2) + q * S * math.exp(-q * T) * norm.cdf(d1)) / 365
    return (term1 + r * K * math.exp(-r * T) * norm.cdf(-d2) - q * S * math.exp(-q * T) * norm.cdf(-d1)) / 365


def vega_val(S, K, T, r, sigma, q=0.0):
    if T <= 0:
        return 0.0
    d1, _ = _d1_d2(S, K, T, r, sigma, q)
    return (S * math.exp(-q * T) * math.sqrt(T) * norm.pdf(d1)) / 100


def rho_val(S, K, T, r, sigma, option_type, q=0.0):
    if T <= 0:
        return 0.0
    _, d2 = _d1_d2(S, K, T, r, sigma, q)
    if option_type == "call":
        return (K * T * math.exp(-r * T) * norm.cdf(d2)) / 100
    return -(K * T * math.exp(-r * T) * norm.cdf(-d2)) / 100


def generate_options_chain(current_price: float, days_to_expiry: int, q: float = 0.0):
    """Generate a synthetic options chain when real data is unavailable.
    Now supports dividend yield q to keep parity with real-data path.
    """
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

        moneyness = math.log(current_price / strike) if strike > 0 else 0
        iv = base_iv + 0.05 * (moneyness**2) * 10
        iv = max(0.05, min(1.5, iv))

        c_price = call_price(current_price, strike, T, r, iv, q)
        p_price = put_price(current_price, strike, T, r, iv, q)
        c_delta = delta(current_price, strike, T, r, iv, "call", q)
        p_delta = delta(current_price, strike, T, r, iv, "put", q)
        g = gamma_val(current_price, strike, T, r, iv, q)
        c_theta = theta_val(current_price, strike, T, r, iv, "call", q)
        p_theta = theta_val(current_price, strike, T, r, iv, "put", q)
        v = vega_val(current_price, strike, T, r, iv, q)

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


def calculate_payoff(legs, stock_price, price_range=0.35, days_to_chart=30, r=0.0525,
                    fee_per_contract=0.0, q=0.0):
    """Calculate strategy P&L across a price range.

    fee_per_contract: brokerage commission per option contract per side
                     (e.g., $0.65 typical Tastytrade). Applied on entry only.
    q: continuous dividend yield (e.g., 0.005 for AAPL). Default 0.
    """
    min_price = stock_price * (1 - price_range)
    max_price = stock_price * (1 + price_range)
    n_points = 200
    step = (max_price - min_price) / n_points

    # Total fees on opening the position (sum of contract counts × fee)
    total_open_fees = sum(
        leg.get("quantity", leg.get("qty", 1)) * fee_per_contract
        for leg in legs
        if leg.get("type") != "stock"
    )

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

                current_val = option_price(price, strike, T_current, r, iv, leg["type"], q)
                expiry_val = option_price(price, strike, 0, r, iv, leg["type"], q)

                total_pnl += (current_val - premium) * multiplier * qty * 100
                total_pnl_expiry += (expiry_val - premium) * multiplier * qty * 100

        # Subtract fees from both current and at-expiry P&L (paid on entry, not recoverable)
        total_pnl -= total_open_fees
        total_pnl_expiry -= total_open_fees

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


def calculate_greeks(legs, stock_price, r=0.0525, q=0.0):
    """Calculate aggregate Greeks for a strategy. Now supports dividend yield."""
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

        total["delta"] += delta(stock_price, strike, T, r, iv, leg["type"], q) * multiplier * qty
        total["gamma"] += gamma_val(stock_price, strike, T, r, iv, q) * multiplier * qty
        total["theta"] += theta_val(stock_price, strike, T, r, iv, leg["type"], q) * multiplier * qty
        total["vega"] += vega_val(stock_price, strike, T, r, iv, q) * multiplier * qty
        total["rho"] += rho_val(stock_price, strike, T, r, iv, leg["type"], q) * multiplier * qty

    return {k: round(v, 4) for k, v in total.items()}


def calculate_pnl_attribution(legs, S0, S1, T0, T1, IV_change=0.0, r=0.0525, q=0.0):
    """P&L attribution: decompose total P&L into Greek contributions.

    Args:
      legs: list of strategy legs (entry premiums embedded)
      S0, S1: initial and final spot prices
      T0, T1: initial and final time to expiry (years)
      IV_change: absolute change in IV (e.g., 0.05 = +5 IV points)
      r: risk-free rate
      q: dividend yield

    Returns dict with:
      delta_pnl: P&L from price move (Δ contribution)
      gamma_pnl: P&L from convexity (½Γ·dS²)
      theta_pnl: P&L from time decay (Θ·dT)
      vega_pnl: P&L from IV change (ν·dIV)
      total_explained: sum of above
      total_actual: actual total P&L by full revaluation
      residual: total_actual - total_explained (model error)
    """
    dS = S1 - S0
    dT_days = (T0 - T1) * 365  # positive = time passed
    dIV = IV_change  # in absolute terms (0.05 = +5 IV points)

    delta_pnl = 0.0
    gamma_pnl = 0.0
    theta_pnl = 0.0
    vega_pnl = 0.0
    total_actual = 0.0

    for leg in legs:
        if leg.get("type") == "stock":
            qty = leg.get("quantity", leg.get("qty", 1))
            sign = 1 if leg["action"] == "buy" else -1
            delta_pnl += sign * qty * dS
            total_actual += sign * qty * dS
            continue

        K = leg["strike"]
        sigma0 = leg.get("iv", 0.3)
        sigma1 = max(0.01, sigma0 + dIV)
        opt_type = leg["type"]
        sign = 1 if leg["action"] == "buy" else -1
        qty = leg.get("quantity", leg.get("qty", 1)) * 100  # 100 shares per contract

        # Greeks at initial state
        d_ = delta(S0, K, T0, r, sigma0, opt_type, q)
        g_ = gamma_val(S0, K, T0, r, sigma0, q)
        # theta_val returns daily theta already (/365 baked in)
        th_ = theta_val(S0, K, T0, r, sigma0, opt_type, q)
        # vega_val returns per +1% IV
        v_ = vega_val(S0, K, T0, r, sigma0, q)

        # Per-leg attributions (× sign × qty)
        delta_pnl += sign * qty * d_ * dS
        gamma_pnl += sign * qty * 0.5 * g_ * dS * dS
        theta_pnl += sign * qty * th_ * dT_days
        vega_pnl += sign * qty * v_ * (dIV * 100)

        # Actual: full revaluation
        v0 = option_price(S0, K, T0, r, sigma0, opt_type, q) * qty * sign
        v1 = option_price(S1, K, T1, r, sigma1, opt_type, q) * qty * sign
        total_actual += (v1 - v0)
        # premium paid/received ALREADY adjusted into v0 entry; but here we only compare v1 vs v0 of the leg’s mark value

    total_explained = delta_pnl + gamma_pnl + theta_pnl + vega_pnl
    residual = total_actual - total_explained

    return {
        "delta_pnl": round(delta_pnl, 2),
        "gamma_pnl": round(gamma_pnl, 2),
        "theta_pnl": round(theta_pnl, 2),
        "vega_pnl": round(vega_pnl, 2),
        "total_explained": round(total_explained, 2),
        "total_actual": round(total_actual, 2),
        "residual": round(residual, 2),
        "dS": round(dS, 2),
        "dT_days": round(dT_days, 2),
        "dIV_pct": round(dIV * 100, 2),
    }


def simulate_assignment(legs, stock_price_at_expiry):
    """Simulate what happens at expiry if any leg is ITM.

    For each option leg, determines:
    - is_itm: in the money?
    - is_short: are we short (will be assigned)?
    - shares_delivered: 100 × qty if assigned (positive = received, negative = delivered)
    - cash_flow: cash impact from exercise/assignment
    - net_position: resulting share position after assignment
    """
    assignments = []
    total_shares = 0
    total_cash = 0.0

    for leg in legs:
        if leg.get("type") == "stock":
            qty = leg.get("quantity", leg.get("qty", 1))
            sign = 1 if leg["action"] == "buy" else -1
            total_shares += sign * qty
            continue

        K = leg["strike"]
        opt_type = leg["type"]
        action = leg["action"]
        qty = leg.get("quantity", leg.get("qty", 1))
        contracts = qty
        shares = qty * 100

        is_call = opt_type == "call"
        is_long = action == "buy"

        # ITM check
        if is_call:
            is_itm = stock_price_at_expiry > K
        else:
            is_itm = stock_price_at_expiry < K

        if not is_itm:
            assignments.append({
                "leg": f"{action.upper()} {qty} {opt_type.upper()} ${K}",
                "is_itm": False,
                "outcome": "expires_worthless",
                "shares_delivered": 0,
                "cash_flow": 0,
            })
            continue

        # ITM case
        if is_long:
            # We exercise: buy/sell shares at strike
            if is_call:
                # Long call ITM: exercise → buy 100 shares per contract at K
                cash = -K * shares
                share_change = +shares
                outcome = "exercised_buy_shares"
            else:
                # Long put ITM: exercise → sell 100 shares per contract at K
                cash = +K * shares
                share_change = -shares
                outcome = "exercised_sell_shares"
        else:
            # Short option ITM: assigned
            if is_call:
                # Short call assigned: deliver 100 shares per contract at K (sold at K)
                cash = +K * shares
                share_change = -shares
                outcome = "assigned_deliver_shares"
            else:
                # Short put assigned: receive 100 shares per contract at K (bought at K)
                cash = -K * shares
                share_change = +shares
                outcome = "assigned_receive_shares"

        total_shares += share_change
        total_cash += cash

        assignments.append({
            "leg": f"{action.upper()} {qty} {opt_type.upper()} ${K}",
            "is_itm": True,
            "outcome": outcome,
            "shares_delivered": share_change,
            "cash_flow": round(cash, 2),
            "strike": K,
            "contracts": contracts,
        })

    return {
        "stock_price_at_expiry": round(stock_price_at_expiry, 2),
        "assignments": assignments,
        "net_shares": total_shares,
        "net_cash_flow": round(total_cash, 2),
    }

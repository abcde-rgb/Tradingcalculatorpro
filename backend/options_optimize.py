"""
Options Strategy Optimizer.

Given a market thesis (sentiment + target price + budget + target date),
ranks all compatible strategies by ROI at target or Probability of Profit.
"""
import math
from typing import Optional
from options_math import option_price, calculate_payoff, find_break_evens

# Strategies compatible with each sentiment
SENTIMENT_STRATEGIES = {
    "very_bullish": ["long_call_atm", "long_call_otm", "bull_call_spread", "short_put_otm"],
    "bullish": ["long_call_atm", "bull_call_spread", "bull_put_spread_cred", "short_put_atm", "covered_call"],
    "neutral": ["iron_condor", "short_straddle", "short_strangle", "butterfly_call"],
    "bearish": ["long_put_atm", "bear_put_spread", "bear_call_spread_cred", "short_call_otm"],
    "very_bearish": ["long_put_atm", "long_put_otm", "bear_put_spread"],
}


def _get_strike_at_offset(chain: list, atm_idx: int, offset: int) -> Optional[dict]:
    """Return the chain entry at atm_idx + offset, or None if out of bounds."""
    idx = atm_idx + offset
    if 0 <= idx < len(chain):
        return chain[idx]
    return None


def _find_atm_index(chain: list, spot: float) -> int:
    """Return index of the strike closest to spot price."""
    if not chain:
        return 0
    return min(range(len(chain)), key=lambda i: abs(chain[i]["strike"] - spot))


def _build_legs_for_strategy(strategy_id: str, chain: list, atm_idx: int, days_to_expiry: int) -> Optional[list]:
    """Build leg definitions for a given strategy id. Returns None if strikes not available."""
    builders = {
        "long_call_atm": lambda: [("call", "buy", 0, "call")],
        "long_call_otm": lambda: [("call", "buy", 2, "call")],
        "long_put_atm": lambda: [("put", "buy", 0, "put")],
        "long_put_otm": lambda: [("put", "buy", -2, "put")],
        "bull_call_spread": lambda: [("call", "buy", 0, "call"), ("call", "sell", 2, "call")],
        "bear_put_spread": lambda: [("put", "buy", 0, "put"), ("put", "sell", -2, "put")],
        "bull_put_spread_cred": lambda: [("put", "sell", -1, "put"), ("put", "buy", -3, "put")],
        "bear_call_spread_cred": lambda: [("call", "sell", 1, "call"), ("call", "buy", 3, "call")],
        "short_put_atm": lambda: [("put", "sell", 0, "put")],
        "short_put_otm": lambda: [("put", "sell", -2, "put")],
        "short_call_otm": lambda: [("call", "sell", 2, "call")],
        "short_straddle": lambda: [("call", "sell", 0, "call"), ("put", "sell", 0, "put")],
        "short_strangle": lambda: [("call", "sell", 2, "call"), ("put", "sell", -2, "put")],
        "iron_condor": lambda: [
            ("put", "sell", -2, "put"), ("put", "buy", -4, "put"),
            ("call", "sell", 2, "call"), ("call", "buy", 4, "call"),
        ],
        "butterfly_call": lambda: [
            ("call", "buy", -2, "call"),
            ("call", "sell", 0, "call"), ("call", "sell", 0, "call"),
            ("call", "buy", 2, "call"),
        ],
        "covered_call": lambda: [("stock", "buy", 0, None), ("call", "sell", 2, "call")],
    }

    builder = builders.get(strategy_id)
    if not builder:
        return None

    legs = []
    for opt_type, action, offset, side in builder():
        if opt_type == "stock":
            legs.append({
                "type": "stock", "action": action, "quantity": 100,
                "qty": 100, "strike": chain[atm_idx]["strike"], "premium": 0,
                "iv": 0.3, "daysToExpiry": days_to_expiry,
            })
            continue
        strike_entry = _get_strike_at_offset(chain, atm_idx, offset)
        if not strike_entry or side not in strike_entry:
            return None
        opt_data = strike_entry[side]
        if not opt_data or opt_data.get("mid", 0) <= 0:
            return None
        legs.append({
            "type": opt_type,
            "action": action,
            "quantity": 1,
            "qty": 1,
            "strike": strike_entry["strike"],
            "premium": opt_data["mid"],
            "iv": opt_data.get("iv", 0.3) or 0.3,
            "daysToExpiry": days_to_expiry,
        })
    return legs


def _compute_pnl_at_price_and_time(legs: list, target_price: float, days_until: int, risk_free: float = 0.0525) -> float:
    """PnL (in $) if spot = target_price after days_until days have passed."""
    T_remaining = max(days_until / 365, 0.001)
    total_entry_cost = 0
    total_current_val = 0
    for leg in legs:
        qty = leg.get("quantity", leg.get("qty", 1))
        mult = 1 if leg["action"] == "buy" else -1
        if leg["type"] == "stock":
            entry = leg["strike"] * qty
            total_entry_cost += entry * mult
            total_current_val += target_price * qty * mult
        else:
            prem = leg.get("premium", 0)
            iv = leg.get("iv", 0.3) or 0.3
            total_entry_cost += prem * mult * qty * 100
            current_val = option_price(target_price, leg["strike"], T_remaining, risk_free, iv, leg["type"])
            total_current_val += current_val * mult * qty * 100
    return total_current_val - total_entry_cost


def _normal_cdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def _probability_of_profit(legs: list, spot: float, break_evens: list, expected_profit_at_target: float, target_price: float) -> float:
    """
    Approximate POP using log-normal terminal distribution.
    For simple long/short positions, calculates P(pnl > 0 at expiration) using break-evens.
    """
    if not legs:
        return 0.0
    # Use ATM IV as volatility proxy (average of option legs)
    ivs = [leg.get("iv", 0.3) for leg in legs if leg["type"] != "stock"]
    iv = sum(ivs) / len(ivs) if ivs else 0.3
    days = max(leg.get("daysToExpiry", 30) for leg in legs)
    T = max(days / 365, 0.003)
    sigma = iv * math.sqrt(T)

    if not break_evens:
        # Fallback: use sign of expected profit to estimate
        return 50.0 if expected_profit_at_target > 0 else 50.0

    # Is profit region to the upside, downside, between or outside break-evens?
    # Sample a few test prices to map P/L topology
    test_prices = [spot * 0.7, spot * 0.85, spot, spot * 1.15, spot * 1.3]
    profits = []
    for p in test_prices:
        pnl = _compute_pnl_at_price_and_time(legs, p, 0)  # at expiration
        profits.append(pnl)

    # Determine profit region by scanning break-even signs
    sorted_bes = sorted(break_evens)

    def in_profit(price):
        return _compute_pnl_at_price_and_time(legs, price, 0) > 0

    if len(sorted_bes) == 1:
        be = sorted_bes[0]
        if in_profit(spot * 1.5):  # profitable above break-even
            p = 1 - _normal_cdf((math.log(be / spot)) / sigma + sigma / 2)
        else:
            p = _normal_cdf((math.log(be / spot)) / sigma - sigma / 2)
        return max(1.0, min(99.0, p * 100))
    elif len(sorted_bes) >= 2:
        # Between 2 break-evens or outside them
        mid = (sorted_bes[0] + sorted_bes[-1]) / 2
        if in_profit(mid):
            # Profit BETWEEN break-evens (iron condor, short straddle)
            p_hi = 1 - _normal_cdf((math.log(sorted_bes[-1] / spot)) / sigma + sigma / 2)
            p_lo = _normal_cdf((math.log(sorted_bes[0] / spot)) / sigma - sigma / 2)
            p = 1 - p_hi - p_lo
        else:
            # Profit OUTSIDE break-evens (long straddle)
            p_hi = 1 - _normal_cdf((math.log(sorted_bes[-1] / spot)) / sigma + sigma / 2)
            p_lo = _normal_cdf((math.log(sorted_bes[0] / spot)) / sigma - sigma / 2)
            p = p_hi + p_lo
        return max(1.0, min(99.0, p * 100))
    return 50.0


def _compute_capital_required(legs: list, max_loss: float, spot: float) -> float:
    """Reg-T approximation for capital/margin required."""
    net_premium = 0
    for leg in legs:
        if leg["type"] != "stock":
            net_premium += leg.get("premium", 0) * (-1 if leg["action"] == "buy" else 1) * leg.get("quantity", 1) * 100

    is_unlimited = max_loss < -5_000_000
    if is_unlimited:
        # Sum Reg-T per naked short leg
        total = 0
        for leg in legs:
            if leg["type"] == "stock" or leg["action"] != "sell":
                continue
            K = leg.get("strike", spot)
            qty = leg.get("quantity", 1)
            prem_recv = leg.get("premium", 0) * 100
            if leg["type"] == "call":
                otm = max(0, K - spot)
                total += (max(0.2 * spot - otm, 0.1 * spot) * 100 + prem_recv) * qty
            else:
                otm = max(0, spot - K)
                total += (max(0.2 * spot - otm, 0.1 * K) * 100 + prem_recv) * qty
        if total > 0:
            return total
    # Covered call / cash-secured put / defined risk
    for leg in legs:
        if leg["type"] == "stock":
            return leg["strike"] * leg.get("quantity", 100)
    return max(abs(max_loss), abs(net_premium) if net_premium < 0 else 0)


def optimize_strategies(
    symbol: str,
    sentiment: str,
    target_price: float,
    budget: float,
    chain: list,
    spot: float,
    days_to_expiry: int,
    expiration_label: str,
    mode: str = "max_return",
    max_results: int = 8,
    days_until_target: Optional[int] = None,
) -> list:
    """Rank strategies matching the thesis by ROI-at-target or POP."""
    if not chain or spot <= 0 or budget <= 0 or days_to_expiry < 1:
        return []

    # Evaluate at the target date OR expiration — use expiration by default
    days_until_target = days_until_target if days_until_target is not None else days_to_expiry

    atm_idx = _find_atm_index(chain, spot)
    strategies_to_try = SENTIMENT_STRATEGIES.get(sentiment, SENTIMENT_STRATEGIES["bullish"])

    results = []
    for strat_id in strategies_to_try:
        legs = _build_legs_for_strategy(strat_id, chain, atm_idx, days_to_expiry)
        if not legs:
            continue

        # Full payoff for break-evens and max P/L
        payoff_points = calculate_payoff(legs, spot, 0.35, days_until_target)
        if not payoff_points:
            continue
        break_evens = find_break_evens(payoff_points)
        expiry_pnls = [p["pnlAtExpiry"] for p in payoff_points]
        max_profit = max(expiry_pnls)
        max_loss = min(expiry_pnls)

        capital_required = _compute_capital_required(legs, max_loss, spot)
        if capital_required > budget and budget > 0:
            continue  # skip strategies that exceed budget

        # PnL AT target price at the target date (may be before expiration)
        pnl_at_target = _compute_pnl_at_price_and_time(legs, target_price, days_until_target)
        pnl_at_target_expiry = _compute_pnl_at_price_and_time(legs, target_price, 0)

        risk = max(abs(max_loss), 0.01)
        roi_target = (pnl_at_target_expiry / risk) * 100 if risk > 0 else 0
        pop = _probability_of_profit(legs, spot, break_evens, pnl_at_target_expiry, target_price)

        results.append({
            "id": f"{strat_id}_{int(chain[atm_idx]['strike'])}",
            "strategyId": strat_id,
            "name": _friendly_name(strat_id, legs),
            "legs": [
                {
                    "type": leg["type"],
                    "action": leg["action"],
                    "quantity": leg.get("quantity", 1),
                    "strike": leg["strike"],
                    "premium": leg.get("premium", 0),
                }
                for leg in legs
            ],
            "roi": round(roi_target, 1),
            "pop": round(pop, 1),
            "profitAtTarget": round(pnl_at_target, 2),
            "profitAtTargetExpiry": round(pnl_at_target_expiry, 2),
            "maxProfit": round(max_profit, 2) if max_profit < 5_000_000 else None,
            "maxProfitUnlimited": max_profit >= 5_000_000,
            "maxLoss": round(max_loss, 2) if max_loss > -5_000_000 else None,
            "maxLossUnlimited": max_loss <= -5_000_000,
            "capitalRequired": round(capital_required, 2),
            "breakEvens": [round(b, 2) for b in break_evens],
            "payoffPoints": payoff_points,
            "expiration": expiration_label,
            "daysToExpiry": days_to_expiry,
        })

    # Rank
    if mode == "max_chance":
        results.sort(key=lambda r: r["pop"], reverse=True)
    else:
        results.sort(key=lambda r: r["roi"], reverse=True)

    return results[:max_results]


def _friendly_name(strat_id: str, legs: list) -> str:
    names = {
        "long_call_atm": "Long Call (ATM)",
        "long_call_otm": "Long Call (OTM)",
        "long_put_atm": "Long Put (ATM)",
        "long_put_otm": "Long Put (OTM)",
        "bull_call_spread": "Bull Call Spread",
        "bear_put_spread": "Bear Put Spread",
        "bull_put_spread_cred": "Bull Put Spread (credit)",
        "bear_call_spread_cred": "Bear Call Spread (credit)",
        "short_put_atm": "Short Put (ATM)",
        "short_put_otm": "Short Put (OTM / CSP)",
        "short_call_otm": "Short Call (OTM)",
        "short_straddle": "Short Straddle",
        "short_strangle": "Short Strangle",
        "iron_condor": "Iron Condor",
        "butterfly_call": "Butterfly (Call)",
        "covered_call": "Covered Call",
    }
    base = names.get(strat_id, strat_id)
    if len(legs) == 1 and legs[0]["type"] != "stock":
        return f"{base} ${int(legs[0]['strike'])}"
    if len(legs) == 2 and all(leg["type"] != "stock" for leg in legs):
        strikes = sorted([int(leg["strike"]) for leg in legs])
        return f"{base} ${strikes[0]}/${strikes[1]}"
    return base

"""
Options Strategy Optimizer.

Given a market thesis (sentiment + target price + budget + target date),
ranks all compatible strategies by ROI at target or Probability of Profit.

Refactored: filter / score / rank pipeline; per-strategy helpers;
type hints throughout.
"""
from __future__ import annotations
import math
from dataclasses import dataclass
from typing import Optional
from options_math import option_price, calculate_payoff, find_break_evens

DEFAULT_R: float = 0.0525
SHARES_PER_CONTRACT: int = 100

# Strategies compatible with each sentiment
SENTIMENT_STRATEGIES: dict[str, list[str]] = {
    "very_bullish": ["long_call_atm", "long_call_otm", "bull_call_spread", "short_put_otm"],
    "bullish": ["long_call_atm", "bull_call_spread", "bull_put_spread_cred", "short_put_atm", "covered_call"],
    "neutral": ["iron_condor", "short_straddle", "short_strangle", "butterfly_call"],
    "bearish": ["long_put_atm", "bear_put_spread", "bear_call_spread_cred", "short_call_otm"],
    "very_bearish": ["long_put_atm", "long_put_otm", "bear_put_spread"],
}

FRIENDLY_NAMES: dict[str, str] = {
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


@dataclass
class OptimizerContext:
    """Bundle of optimizer inputs to keep function signatures small."""
    chain: list[dict]
    spot: float
    days_to_expiry: int
    expiration_label: str
    target_price: float
    budget: float
    days_until_target: int


# ---------------------------------------------------------------------------
# Strike / leg helpers
# ---------------------------------------------------------------------------


def _get_strike_at_offset(chain: list[dict], atm_idx: int, offset: int) -> Optional[dict]:
    idx = atm_idx + offset
    if 0 <= idx < len(chain):
        return chain[idx]
    return None


def _find_atm_index(chain: list[dict], spot: float) -> int:
    if not chain:
        return 0
    return min(range(len(chain)), key=lambda i: abs(chain[i]["strike"] - spot))


_BUILDERS: dict[str, list[tuple[str, str, int, Optional[str]]]] = {
    "long_call_atm": [("call", "buy", 0, "call")],
    "long_call_otm": [("call", "buy", 2, "call")],
    "long_put_atm": [("put", "buy", 0, "put")],
    "long_put_otm": [("put", "buy", -2, "put")],
    "bull_call_spread": [("call", "buy", 0, "call"), ("call", "sell", 2, "call")],
    "bear_put_spread": [("put", "buy", 0, "put"), ("put", "sell", -2, "put")],
    "bull_put_spread_cred": [("put", "sell", -1, "put"), ("put", "buy", -3, "put")],
    "bear_call_spread_cred": [("call", "sell", 1, "call"), ("call", "buy", 3, "call")],
    "short_put_atm": [("put", "sell", 0, "put")],
    "short_put_otm": [("put", "sell", -2, "put")],
    "short_call_otm": [("call", "sell", 2, "call")],
    "short_straddle": [("call", "sell", 0, "call"), ("put", "sell", 0, "put")],
    "short_strangle": [("call", "sell", 2, "call"), ("put", "sell", -2, "put")],
    "iron_condor": [
        ("put", "sell", -2, "put"), ("put", "buy", -4, "put"),
        ("call", "sell", 2, "call"), ("call", "buy", 4, "call"),
    ],
    "butterfly_call": [
        ("call", "buy", -2, "call"),
        ("call", "sell", 0, "call"), ("call", "sell", 0, "call"),
        ("call", "buy", 2, "call"),
    ],
    "covered_call": [("stock", "buy", 0, None), ("call", "sell", 2, "call")],
}


def _build_legs_for_strategy(strategy_id: str, chain: list[dict], atm_idx: int,
                             days_to_expiry: int) -> Optional[list[dict]]:
    """Build leg definitions for a given strategy id. Returns None if strikes unavailable."""
    spec = _BUILDERS.get(strategy_id)
    if not spec:
        return None

    legs: list[dict] = []
    for opt_type, action, offset, side in spec:
        if opt_type == "stock":
            legs.append({
                "type": "stock", "action": action, "quantity": SHARES_PER_CONTRACT,
                "qty": SHARES_PER_CONTRACT, "strike": chain[atm_idx]["strike"],
                "premium": 0, "iv": 0.3, "daysToExpiry": days_to_expiry,
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


# ---------------------------------------------------------------------------
# Pricing helpers
# ---------------------------------------------------------------------------


def _compute_pnl_at_price_and_time(legs: list[dict], target_price: float,
                                   days_until: int,
                                   risk_free: float = DEFAULT_R) -> float:
    """PnL (in $) if spot = target_price after days_until days have passed."""
    T_remaining = max(days_until / 365, 0.001)
    total_entry = 0.0
    total_current = 0.0
    for leg in legs:
        qty = leg.get("quantity", leg.get("qty", 1))
        mult = 1 if leg["action"] == "buy" else -1
        if leg["type"] == "stock":
            total_entry += leg["strike"] * qty * mult
            total_current += target_price * qty * mult
        else:
            prem = leg.get("premium", 0)
            iv = leg.get("iv", 0.3) or 0.3
            total_entry += prem * mult * qty * SHARES_PER_CONTRACT
            cur = option_price(target_price, leg["strike"], T_remaining, risk_free, iv, leg["type"])
            total_current += cur * mult * qty * SHARES_PER_CONTRACT
    return total_current - total_entry


def _normal_cdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


# ---------------------------------------------------------------------------
# Probability of Profit (refactored into clear branches)
# ---------------------------------------------------------------------------


def _avg_iv(legs: list[dict]) -> float:
    ivs = [leg.get("iv", 0.3) for leg in legs if leg["type"] != "stock"]
    return sum(ivs) / len(ivs) if ivs else 0.3


def _terminal_sigma(legs: list[dict]) -> float:
    iv = _avg_iv(legs)
    days = max(leg.get("daysToExpiry", 30) for leg in legs)
    T = max(days / 365, 0.003)
    return iv * math.sqrt(T)


def _is_profit_at(legs: list[dict], price: float) -> bool:
    return _compute_pnl_at_price_and_time(legs, price, 0) > 0


def _pop_single_break_even(legs: list[dict], spot: float, be: float, sigma: float) -> float:
    """POP for strategies with a single break-even (long calls/puts, simple spreads)."""
    z = math.log(be / spot) / sigma
    if _is_profit_at(legs, spot * 1.5):
        p = 1 - _normal_cdf(z + sigma / 2)
    else:
        p = _normal_cdf(z - sigma / 2)
    return max(1.0, min(99.0, p * 100))


def _pop_multi_break_even(legs: list[dict], spot: float, bes: list[float],
                          sigma: float) -> float:
    """POP for strategies with 2+ break-evens (iron condors, straddles, butterflies)."""
    mid = (bes[0] + bes[-1]) / 2
    p_hi = 1 - _normal_cdf(math.log(bes[-1] / spot) / sigma + sigma / 2)
    p_lo = _normal_cdf(math.log(bes[0] / spot) / sigma - sigma / 2)
    if _is_profit_at(legs, mid):
        # Profit BETWEEN break-evens
        p = 1 - p_hi - p_lo
    else:
        # Profit OUTSIDE break-evens
        p = p_hi + p_lo
    return max(1.0, min(99.0, p * 100))


def _probability_of_profit(legs: list[dict], spot: float,
                          break_evens: list[float],
                          expected_profit_at_target: float,
                          target_price: float) -> float:
    """Approximate POP using log-normal terminal distribution."""
    if not legs:
        return 0.0
    if not break_evens:
        return 50.0
    sigma = _terminal_sigma(legs)
    sorted_bes = sorted(break_evens)
    if len(sorted_bes) == 1:
        return _pop_single_break_even(legs, spot, sorted_bes[0], sigma)
    return _pop_multi_break_even(legs, spot, sorted_bes, sigma)


# ---------------------------------------------------------------------------
# Capital requirement (refactored into per-strategy-type helpers)
# ---------------------------------------------------------------------------


def _net_premium(legs: list[dict]) -> float:
    """Net premium (negative = debit paid; positive = credit received)."""
    total = 0.0
    for leg in legs:
        if leg["type"] != "stock":
            sign = -1 if leg["action"] == "buy" else 1
            total += leg.get("premium", 0) * sign * leg.get("quantity", 1) * SHARES_PER_CONTRACT
    return total


def _reg_t_naked_short(leg: dict, spot: float) -> float:
    """Reg-T margin requirement for a single naked short option leg."""
    K = leg.get("strike", spot)
    qty = leg.get("quantity", 1)
    prem_recv = leg.get("premium", 0) * SHARES_PER_CONTRACT
    if leg["type"] == "call":
        otm = max(0, K - spot)
        return (max(0.2 * spot - otm, 0.1 * spot) * SHARES_PER_CONTRACT + prem_recv) * qty
    otm = max(0, spot - K)
    return (max(0.2 * spot - otm, 0.1 * K) * SHARES_PER_CONTRACT + prem_recv) * qty


def _capital_for_unlimited_risk(legs: list[dict], spot: float) -> float:
    """Sum Reg-T per naked short leg when strategy has unlimited risk."""
    total = 0.0
    for leg in legs:
        if leg["type"] == "stock" or leg["action"] != "sell":
            continue
        total += _reg_t_naked_short(leg, spot)
    return total


def _capital_for_stock_position(legs: list[dict]) -> Optional[float]:
    """Capital tied up by stock leg (covered call uses share value)."""
    for leg in legs:
        if leg["type"] == "stock":
            return leg["strike"] * leg.get("quantity", SHARES_PER_CONTRACT)
    return None


def _compute_capital_required(legs: list[dict], max_loss: float, spot: float) -> float:
    """Reg-T approximation for capital/margin required."""
    if max_loss < -5_000_000:  # unlimited risk
        cap = _capital_for_unlimited_risk(legs, spot)
        if cap > 0:
            return cap

    stock_cap = _capital_for_stock_position(legs)
    if stock_cap is not None:
        return stock_cap

    net_prem = _net_premium(legs)
    return max(abs(max_loss), abs(net_prem) if net_prem < 0 else 0)


def _friendly_name(strat_id: str, legs: list[dict]) -> str:
    base = FRIENDLY_NAMES.get(strat_id, strat_id)
    if len(legs) == 1 and legs[0]["type"] != "stock":
        return f"{base} ${int(legs[0]['strike'])}"
    if len(legs) == 2 and all(leg["type"] != "stock" for leg in legs):
        strikes = sorted([int(leg["strike"]) for leg in legs])
        return f"{base} ${strikes[0]}/${strikes[1]}"
    return base


# ---------------------------------------------------------------------------
# Optimizer pipeline: filter → score → rank
# ---------------------------------------------------------------------------


def _score_strategy(strat_id: str, legs: list[dict],
                    ctx: OptimizerContext) -> Optional[dict]:
    """Compute one candidate's metrics. Returns None if disqualified by budget."""
    payoff_points = calculate_payoff(legs, ctx.spot, 0.35, ctx.days_until_target)
    if not payoff_points:
        return None

    break_evens = find_break_evens(payoff_points)
    expiry_pnls = [p["pnlAtExpiry"] for p in payoff_points]
    max_profit = max(expiry_pnls)
    max_loss = min(expiry_pnls)

    capital_required = _compute_capital_required(legs, max_loss, ctx.spot)
    if capital_required > ctx.budget and ctx.budget > 0:
        return None

    pnl_at_target = _compute_pnl_at_price_and_time(legs, ctx.target_price, ctx.days_until_target)
    pnl_at_target_expiry = _compute_pnl_at_price_and_time(legs, ctx.target_price, 0)

    risk = max(abs(max_loss), 0.01)
    roi_target = (pnl_at_target_expiry / risk) * 100 if risk > 0 else 0
    pop = _probability_of_profit(legs, ctx.spot, break_evens, pnl_at_target_expiry, ctx.target_price)

    atm_idx = _find_atm_index(ctx.chain, ctx.spot)
    return {
        "id": f"{strat_id}_{int(ctx.chain[atm_idx]['strike'])}",
        "strategyId": strat_id,
        "name": _friendly_name(strat_id, legs),
        "legs": [{
            "type": leg["type"], "action": leg["action"],
            "quantity": leg.get("quantity", 1), "strike": leg["strike"],
            "premium": leg.get("premium", 0),
        } for leg in legs],
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
        "expiration": ctx.expiration_label,
        "daysToExpiry": ctx.days_to_expiry,
    }


def _filter_candidates(ctx: OptimizerContext, sentiment: str) -> list[tuple[str, list[dict]]]:
    """Return (strategy_id, legs) pairs for strategies that match sentiment & strikes."""
    atm_idx = _find_atm_index(ctx.chain, ctx.spot)
    ids = SENTIMENT_STRATEGIES.get(sentiment, SENTIMENT_STRATEGIES["bullish"])
    pairs: list[tuple[str, list[dict]]] = []
    for sid in ids:
        legs = _build_legs_for_strategy(sid, ctx.chain, atm_idx, ctx.days_to_expiry)
        if legs:
            pairs.append((sid, legs))
    return pairs


def _rank_results(results: list[dict], mode: str) -> list[dict]:
    key = "pop" if mode == "max_chance" else "roi"
    return sorted(results, key=lambda r: r[key], reverse=True)


def optimize_strategies(symbol: str, sentiment: str, target_price: float,
                       budget: float, chain: list[dict], spot: float,
                       days_to_expiry: int, expiration_label: str,
                       mode: str = "max_return", max_results: int = 8,
                       days_until_target: Optional[int] = None) -> list[dict]:
    """Rank strategies matching the thesis by ROI-at-target or POP.

    Pipeline: filter (sentiment + strikes available) → score (metrics + budget) → rank.
    """
    if not chain or spot <= 0 or budget <= 0 or days_to_expiry < 1:
        return []

    ctx = OptimizerContext(
        chain=chain, spot=spot, days_to_expiry=days_to_expiry,
        expiration_label=expiration_label, target_price=target_price, budget=budget,
        days_until_target=days_until_target if days_until_target is not None else days_to_expiry,
    )

    candidates = _filter_candidates(ctx, sentiment)
    scored = [r for r in (_score_strategy(sid, legs, ctx) for sid, legs in candidates) if r]
    ranked = _rank_results(scored, mode)
    return ranked[:max_results]

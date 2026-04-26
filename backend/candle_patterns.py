"""
Pure-math candle pattern detection. No ML, no AI — just the canonical
conditions from the standard Japanese candlestick literature.

Each detector receives normalised OHLC rows (list of dicts ordered by
date ascending) and returns the indices/metadata where the pattern fires.

Threshold tuning: kept slightly relaxed for educational visibility while
still avoiding obvious false positives.
"""
from __future__ import annotations

from typing import Any, Dict, List


def _candle_metrics(row: Dict[str, float]) -> Dict[str, float]:
    o, h, lo, c = row["open"], row["high"], row["low"], row["close"]
    body = abs(c - o)
    rng = max(h - lo, 1e-9)             # avoid div by zero
    upper = h - max(o, c)
    lower = min(o, c) - lo
    return {
        "body": body, "range": rng,
        "upper": upper, "lower": lower,
        "is_bull": c > o, "is_bear": c < o,
        "body_pct": body / rng,
    }


# ---------- Single-candle ----------
def _is_doji(m: Dict[str, float]) -> bool:
    return m["body_pct"] <= 0.07


def _is_dragonfly_doji(m: Dict[str, float]) -> bool:
    return m["body_pct"] <= 0.07 and m["upper"] <= 0.05 * m["range"] and m["lower"] >= 0.6 * m["range"]


def _is_gravestone_doji(m: Dict[str, float]) -> bool:
    return m["body_pct"] <= 0.07 and m["lower"] <= 0.05 * m["range"] and m["upper"] >= 0.6 * m["range"]


def _is_hammer(m: Dict[str, float]) -> bool:
    return (
        m["body"] > 0
        and m["lower"] >= 1.8 * m["body"]
        and m["upper"] <= 0.4 * m["body"]
        and m["body_pct"] >= 0.05  # avoid mis-classifying dojis
    )


def _is_shooting_star(m: Dict[str, float]) -> bool:
    return (
        m["body"] > 0
        and m["upper"] >= 1.8 * m["body"]
        and m["lower"] <= 0.4 * m["body"]
        and m["body_pct"] >= 0.05
    )


def _is_marubozu(m: Dict[str, float]) -> bool:
    return (
        m["body_pct"] >= 0.85
        and m["upper"] <= 0.05 * m["range"]
        and m["lower"] <= 0.05 * m["range"]
    )


def _is_spinning_top(m: Dict[str, float]) -> bool:
    return (
        0.10 < m["body_pct"] < 0.35
        and m["upper"] > m["body"]
        and m["lower"] > m["body"]
    )


# ---------- Two-candle ----------
def _is_bullish_engulfing(prev: Dict[str, float], curr: Dict[str, float]) -> bool:
    return (
        prev["close"] < prev["open"]                  # prev bearish
        and curr["close"] > curr["open"]              # curr bullish
        and curr["open"] <= prev["close"]
        and curr["close"] >= prev["open"]
        and abs(curr["close"] - curr["open"]) > abs(prev["close"] - prev["open"])
    )


def _is_bearish_engulfing(prev: Dict[str, float], curr: Dict[str, float]) -> bool:
    return (
        prev["close"] > prev["open"]                  # prev bullish
        and curr["close"] < curr["open"]              # curr bearish
        and curr["open"] >= prev["close"]
        and curr["close"] <= prev["open"]
        and abs(curr["close"] - curr["open"]) > abs(prev["close"] - prev["open"])
    )


# ---------- Three-candle ----------
def _is_morning_star(c1: Dict, c2: Dict, c3: Dict) -> bool:
    body1 = abs(c1["close"] - c1["open"])
    body2 = abs(c2["close"] - c2["open"])
    midpoint_1 = (c1["open"] + c1["close"]) / 2
    return (
        c1["close"] < c1["open"]                       # 1st bearish
        and body2 < 0.5 * body1                        # 2nd small
        and max(c2["open"], c2["close"]) < c1["close"] # 2nd below 1st body
        and c3["close"] > c3["open"]                   # 3rd bullish
        and c3["close"] > midpoint_1                   # closes above 1st midpoint
    )


def _is_evening_star(c1: Dict, c2: Dict, c3: Dict) -> bool:
    body1 = abs(c1["close"] - c1["open"])
    body2 = abs(c2["close"] - c2["open"])
    midpoint_1 = (c1["open"] + c1["close"]) / 2
    return (
        c1["close"] > c1["open"]
        and body2 < 0.5 * body1
        and min(c2["open"], c2["close"]) > c1["close"]
        and c3["close"] < c3["open"]
        and c3["close"] < midpoint_1
    )


def _is_three_white_soldiers(c1: Dict, c2: Dict, c3: Dict) -> bool:
    return (
        c1["close"] > c1["open"]
        and c2["close"] > c2["open"]
        and c3["close"] > c3["open"]
        and c2["close"] > c1["close"]
        and c3["close"] > c2["close"]
        and c2["open"] > c1["open"] and c2["open"] < c1["close"]
        and c3["open"] > c2["open"] and c3["open"] < c2["close"]
    )


def _is_three_black_crows(c1: Dict, c2: Dict, c3: Dict) -> bool:
    return (
        c1["close"] < c1["open"]
        and c2["close"] < c2["open"]
        and c3["close"] < c3["open"]
        and c2["close"] < c1["close"]
        and c3["close"] < c2["close"]
        and c2["open"] < c1["open"] and c2["open"] > c1["close"]
        and c3["open"] < c2["open"] and c3["open"] > c2["close"]
    )


# ---------- Pattern catalogue ----------
PATTERN_META: Dict[str, Dict[str, str]] = {
    "hammer":               {"type": "bullish",  "candles": 1},
    "shooting-star":        {"type": "bearish",  "candles": 1},
    "doji":                 {"type": "neutral",  "candles": 1},
    "dragonfly-doji":       {"type": "bullish",  "candles": 1},
    "gravestone-doji":      {"type": "bearish",  "candles": 1},
    "marubozu-bullish":     {"type": "bullish",  "candles": 1},
    "marubozu-bearish":     {"type": "bearish",  "candles": 1},
    "spinning-top":         {"type": "neutral",  "candles": 1},
    "bullish-engulfing":    {"type": "bullish",  "candles": 2},
    "bearish-engulfing":    {"type": "bearish",  "candles": 2},
    "morning-star":         {"type": "bullish",  "candles": 3},
    "evening-star":         {"type": "bearish",  "candles": 3},
    "three-white-soldiers": {"type": "bullish",  "candles": 3},
    "three-black-crows":    {"type": "bearish",  "candles": 3},
}


def _detect_at_index(rows: List[Dict[str, float]], i: int) -> List[str]:
    """Return list of pattern_ids that fire at index i."""
    hits: List[str] = []
    m = _candle_metrics(rows[i])
    if _is_dragonfly_doji(m):
        hits.append("dragonfly-doji")
    elif _is_gravestone_doji(m):
        hits.append("gravestone-doji")
    elif _is_doji(m):
        hits.append("doji")
    if _is_hammer(m):
        hits.append("hammer")
    if _is_shooting_star(m):
        hits.append("shooting-star")
    if _is_marubozu(m):
        hits.append("marubozu-bullish" if m["is_bull"] else "marubozu-bearish")
    if _is_spinning_top(m) and "doji" not in hits:
        hits.append("spinning-top")
    if i >= 1:
        prev = rows[i - 1]
        if _is_bullish_engulfing(prev, rows[i]):
            hits.append("bullish-engulfing")
        elif _is_bearish_engulfing(prev, rows[i]):
            hits.append("bearish-engulfing")
    if i >= 2:
        c1, c2, c3 = rows[i - 2], rows[i - 1], rows[i]
        if _is_morning_star(c1, c2, c3):
            hits.append("morning-star")
        elif _is_evening_star(c1, c2, c3):
            hits.append("evening-star")
        elif _is_three_white_soldiers(c1, c2, c3):
            hits.append("three-white-soldiers")
        elif _is_three_black_crows(c1, c2, c3):
            hits.append("three-black-crows")
    return hits


def detect_all_patterns(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Walk OHLC rows once and return [{date, pattern_id, type, ohlc, candle_count}]."""
    detections: List[Dict[str, Any]] = []
    for i, row in enumerate(rows):
        for pid in _detect_at_index(rows, i):
            meta = PATTERN_META[pid]
            detections.append({
                "date": row["date"],
                "pattern_id": pid,
                "type": meta["type"],
                "ohlc": {k: round(float(row[k]), 4) for k in ("open", "high", "low", "close")},
                "candle_count": meta["candles"],
            })
    return detections

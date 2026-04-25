"""P1 refactor regression tests: math endpoints, /api/optimize, refactored OHLC."""
import os
from typing import Any, Dict, List

import pytest
import requests

BASE_URL: str = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://unified-site-1.preview.emergentagent.com"
).rstrip("/")


# Sample long call payload reused across math endpoints
LONG_CALL_LEG: Dict[str, Any] = {
    "type": "call",
    "action": "buy",
    "strike": 150,
    "premium": 5,
    "qty": 1,
    "expiration": "2026-06-20",
}


# ---------- Math endpoints (refactor regression) ----------
class TestMathEndpoints:
    def test_payoff_long_call(self) -> None:
        body = {
            "legs": [LONG_CALL_LEG],
            "stockPrice": 150,
            "feePerContract": 0.65,
        }
        r = requests.post(f"{BASE_URL}/api/calculate/payoff", json=body, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        # stats block + breakEvens array
        assert "stats" in data and "breakEvens" in data
        stats = data["stats"]
        for k in ("maxProfit", "maxLoss", "totalFees"):
            assert k in stats, f"missing {k} in stats"
        # math sanity (matches main agent smoke-test)
        assert abs(stats["maxLoss"] - (-500.65)) < 1e-2
        assert abs(stats["maxProfit"] - 4749.35) < 1e-2
        assert abs(stats["totalFees"] - 0.65) < 1e-6
        assert data["breakEvens"] == [155.0]

    def test_greeks_long_call(self) -> None:
        body = {"legs": [LONG_CALL_LEG], "stockPrice": 150, "iv": 0.3, "rate": 0.05}
        r = requests.post(f"{BASE_URL}/api/calculate/greeks", json=body, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ("delta", "gamma", "theta", "vega", "rho"):
            assert k in data, f"missing {k}"
            assert isinstance(data[k], (int, float))
        # ATM long call delta should be roughly ~0.5 (positive)
        assert 0 < data["delta"] < 1

    def test_pnl_attribution(self) -> None:
        body = {
            "legs": [LONG_CALL_LEG],
            "stockPriceInitial": 150,
            "stockPriceFinal": 155,
            "ivStart": 0.3,
            "ivEnd": 0.32,
            "daysElapsed": 1,
        }
        r = requests.post(
            f"{BASE_URL}/api/calculate/pnl-attribution", json=body, timeout=20
        )
        assert r.status_code == 200, r.text
        data = r.json()
        for k in (
            "delta_pnl",
            "gamma_pnl",
            "theta_pnl",
            "vega_pnl",
            "total_explained",
            "total_actual",
            "residual",
        ):
            assert k in data, f"missing {k} in {data}"

    def test_assignment_itm_put(self) -> None:
        body = {
            "legs": [
                {
                    "type": "put",
                    "action": "sell",
                    "strike": 100,
                    "premium": 3,
                    "qty": 1,
                    "expiration": "2026-06-20",
                }
            ],
            "stockPriceAtExpiry": 90,
        }
        r = requests.post(
            f"{BASE_URL}/api/calculate/assignment", json=body, timeout=20
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "assignments" in data
        assignments: List[Dict[str, Any]] = data["assignments"]
        assert len(assignments) >= 1
        first = assignments[0]
        for k in ("outcome", "shares_delivered", "cash_flow"):
            assert k in first, f"missing {k} in {first}"


# ---------- Optimizer ----------
class TestOptimize:
    def test_optimize_aapl_bullish(self) -> None:
        body = {
            "symbol": "AAPL",
            "sentiment": "bullish",
            "targetPrice": 160,
            "budget": 1000,
            "expirationIdx": 3,
            "mode": "max_return",
        }
        r = requests.post(f"{BASE_URL}/api/optimize", json=body, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        # Response should contain ranked strategies (key may be 'strategies' or 'results')
        assert isinstance(data, dict)
        candidates = (
            data.get("strategies")
            or data.get("results")
            or data.get("ranked")
            or []
        )
        assert isinstance(candidates, list) and len(candidates) > 0, (
            f"No ranked strategies returned: {data}"
        )


# ---------- OHLC refactor ----------
class TestOHLCRefactor:
    def test_ohlc_btc_7d_hourly(self) -> None:
        # CoinGecko free tier rate-limits aggressively; retry once after pause
        ohlc: List[Dict[str, Any]] = []
        for _ in range(3):
            r = requests.get(f"{BASE_URL}/api/ohlc/BTC?days=7", timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["symbol"] == "BTC"
            ohlc = data["ohlc"]
            if ohlc:
                break
            import time
            time.sleep(15)
        if not ohlc:
            pytest.skip("CoinGecko rate-limited (429) — refactor verified earlier")
        # 7 days hourly ~ 168 candles
        assert 100 <= len(ohlc) <= 220, f"got {len(ohlc)} candles"
        for k in ("time", "open", "high", "low", "close"):
            assert k in ohlc[0]
        c = ohlc[0]
        assert c["high"] >= c["low"]
        assert c["high"] >= c["open"] and c["high"] >= c["close"]

    def test_ohlc_eth_30d_4h(self) -> None:
        ohlc: List[Dict[str, Any]] = []
        for _ in range(3):
            r = requests.get(f"{BASE_URL}/api/ohlc/ETH?days=30", timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["symbol"] == "ETH"
            ohlc = data["ohlc"]
            if ohlc:
                break
            import time
            time.sleep(15)
        if not ohlc:
            pytest.skip("CoinGecko rate-limited (429) — refactor verified earlier")
        assert 80 <= len(ohlc) <= 260, f"got {len(ohlc)} candles"

    def test_ohlc_unknown_symbol_fallback(self) -> None:
        r = requests.get(f"{BASE_URL}/api/ohlc/UNKNOWN?days=7", timeout=30)
        assert r.status_code == 200, r.text  # NO 500 (refactor must handle)
        data = r.json()
        # symbol echoed as UNKNOWN even though it falls back to bitcoin coin_id
        assert data["symbol"] == "UNKNOWN"
        assert isinstance(data.get("ohlc"), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

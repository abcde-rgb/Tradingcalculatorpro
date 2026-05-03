"""Iteration 7 regression tests:
- Auth login (demo user) returns a valid token
- POST /api/performance/trades/bulk imports N rows and cleans up
- GET /api/performance/trades reflects imports
- Options /api/calculate/payoff spec-exact (Long Call $150, premium $5, fee 0.65)
- /api/stock/AAPL still works (no regression)
"""
import os
from typing import Any, Dict, List

import pytest
import requests

BASE_URL: str = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

DEMO_EMAIL = "demo@btccalc.pro"
DEMO_PASSWORD = "1234"


# ============= Auth =============

@pytest.fixture(scope="module")
def auth_token() -> str:
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
        timeout=30,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
    assert data["user"]["email"] == DEMO_EMAIL
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {auth_token}"}


class TestAuth:
    def test_login_demo_returns_token_and_user(self, auth_token: str) -> None:
        assert isinstance(auth_token, str) and len(auth_token) > 10

    def test_auth_me_with_token(self, auth_headers: Dict[str, str]) -> None:
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == DEMO_EMAIL
        assert data.get("is_premium") is True, f"Demo user should be premium: {data}"


# ============= Performance Bulk Trades (P1 new feature) =============

class TestBulkTrades:
    """Covers POST /api/performance/trades/bulk for CSV import."""

    TEST_SETUP = "csv-test-imported"

    @pytest.fixture
    def imported_ids(
        self, auth_headers: Dict[str, str]
    ) -> List[str]:
        """Create 2 test trades via bulk; cleanup via delete after test."""
        payload = {
            "trades": [
                {
                    "symbol": "TEST_BULK1",
                    "side": "long",
                    "entry_price": 100.0,
                    "exit_price": 110.0,
                    "sl": 95.0,
                    "tp": 115.0,
                    "quantity": 10,
                    "account_balance": 10000.0,
                    "status": "closed",
                    "setup": self.TEST_SETUP,
                },
                {
                    "symbol": "TEST_BULK2",
                    "side": "short",
                    "entry_price": 200.0,
                    "exit_price": 195.0,
                    "sl": 210.0,
                    "tp": 180.0,
                    "quantity": 5,
                    "account_balance": 10000.0,
                    "status": "closed",
                    "setup": self.TEST_SETUP,
                },
            ]
        }
        r = requests.post(
            f"{BASE_URL}/api/performance/trades/bulk",
            json=payload,
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 200, f"Bulk import failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["imported"] == 2, f"Expected 2 imported, got {data}"
        assert data["failed"] == [], f"Unexpected failures: {data['failed']}"
        ids = [t["id"] for t in data["trades"]]
        assert len(ids) == 2
        yield ids
        # Cleanup
        for tid in ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/performance/trades/{tid}",
                    headers=auth_headers,
                    timeout=15,
                )
            except Exception:
                pass

    def test_bulk_creates_and_get_reflects(
        self, auth_headers: Dict[str, str], imported_ids: List[str]
    ) -> None:
        r = requests.get(
            f"{BASE_URL}/api/performance/trades",
            headers=auth_headers,
            params={"limit": 200},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        payload_list = r.json()
        # API returns {trades: [...], count: N}
        trades = payload_list.get("trades", payload_list) if isinstance(payload_list, dict) else payload_list
        ids_on_server = {t["id"] for t in trades}
        for tid in imported_ids:
            assert tid in ids_on_server, (
                f"Imported trade {tid} not persisted. Got {len(trades)} trades."
            )
        # Verify setup field preserved
        imported_docs = [t for t in trades if t["id"] in imported_ids]
        assert all(t.get("setup") == "csv-test-imported" for t in imported_docs), (
            f"setup field not preserved: {[t.get('setup') for t in imported_docs]}"
        )

    def test_bulk_rejects_without_auth(self) -> None:
        r = requests.post(
            f"{BASE_URL}/api/performance/trades/bulk",
            json={"trades": []},
            timeout=15,
        )
        assert r.status_code in (401, 403), f"Expected 401/403 no-auth, got {r.status_code}"

    def test_bulk_empty_array_returns_zero(
        self, auth_headers: Dict[str, str]
    ) -> None:
        r = requests.post(
            f"{BASE_URL}/api/performance/trades/bulk",
            json={"trades": []},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["imported"] == 0
        assert data["failed"] == []


# ============= Options Payoff Math Regression (MUST be bit-exact) =============

class TestOptionsPayoffRegression:
    """Long Call $150 strike, $5 premium, 1 contract, fee 0.65 per contract."""

    def test_long_call_spec_exact(self) -> None:
        body = {
            "legs": [
                {
                    "type": "call",
                    "action": "buy",
                    "quantity": 1,
                    "strike": 150.0,
                    "premium": 5.0,
                }
            ],
            "stockPrice": 150.0,
            "feePerContract": 0.65,
        }
        r = requests.post(
            f"{BASE_URL}/api/calculate/payoff", json=body, timeout=30
        )
        assert r.status_code == 200, r.text
        data = r.json()
        stats = data.get("stats", {})
        breakevens = data.get("breakEvens") or data.get("breakevens") or []
        # Spec-exact values from iteration history
        assert stats.get("maxProfit") == 4749.35, f"maxProfit: {stats.get('maxProfit')}"
        assert stats.get("maxLoss") == -500.65, f"maxLoss: {stats.get('maxLoss')}"
        assert stats.get("totalFees") == 0.65, f"totalFees: {stats.get('totalFees')}"
        assert 155.0 in breakevens, f"155.0 not in breakEvens: {breakevens}"


# ============= Stock Endpoint Regression =============

class TestStockRegression:
    def test_stock_aapl_returns_price(self) -> None:
        r = requests.get(f"{BASE_URL}/api/stock/AAPL", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("price"), (int, float)) and data["price"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

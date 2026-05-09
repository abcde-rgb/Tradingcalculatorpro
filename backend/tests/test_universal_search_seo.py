"""Tests for universal asset search endpoint, original ticker search, and SEO files (sitemap/robots)."""
import os
import pytest
import requests

def _read_frontend_env():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return None

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or _read_frontend_env() or 'https://unified-site-1.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Universal search endpoint ----------
class TestUniversalSearch:
    URL = f"{BASE_URL}/api/tickers/universal-search"

    def _get(self, client, params):
        return client.get(self.URL, params=params, timeout=30)

    def test_search_aapl_returns_stocks(self, api_client):
        r = self._get(api_client, {"q": "AAPL"})
        assert r.status_code == 200, r.text
        data = r.json()
        # Endpoint may return list directly or wrapped object
        items = data if isinstance(data, list) else data.get("results", [])
        assert isinstance(items, list)
        assert len(items) > 0
        symbols = [str(it.get("symbol", "")).upper() for it in items]
        assert "AAPL" in symbols, f"AAPL not in results: {symbols[:10]}"
        # find AAPL row and check category
        aapl = next((it for it in items if str(it.get("symbol", "")).upper() == "AAPL"), None)
        assert aapl is not None
        assert aapl.get("category") in ("stocks", "stock", "Acciones", "acciones"), aapl

    def test_search_spy_returns_etfs(self, api_client):
        r = self._get(api_client, {"q": "SPY"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        spy = next((it for it in items if str(it.get("symbol", "")).upper() == "SPY"), None)
        assert spy is not None, f"SPY not in results: {[i.get('symbol') for i in items[:10]]}"
        assert spy.get("category") in ("etfs", "etf", "ETFs"), spy

    def test_search_btc_returns_crypto(self, api_client):
        r = self._get(api_client, {"q": "BTC"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        btc = next((it for it in items if "BTC" in str(it.get("symbol", "")).upper()), None)
        assert btc is not None
        assert btc.get("category") in ("crypto", "Crypto"), btc

    def test_search_gspc_returns_indices(self, api_client):
        r = self._get(api_client, {"q": "GSPC"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        idx = next((it for it in items if "GSPC" in str(it.get("symbol", "")).upper()), None)
        assert idx is not None, f"^GSPC not in results: {[i.get('symbol') for i in items[:10]]}"
        assert idx.get("category") in ("indices", "index", "Índices"), idx

    def test_search_eur_returns_forex(self, api_client):
        r = self._get(api_client, {"q": "EUR"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        fx = next((it for it in items if "EURUSD" in str(it.get("symbol", "")).upper()), None)
        assert fx is not None, f"EURUSD not in results: {[i.get('symbol') for i in items[:10]]}"
        assert fx.get("category") in ("forex", "Forex"), fx

    def test_search_gc_returns_commodities(self, api_client):
        r = self._get(api_client, {"q": "GC"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        gc = next((it for it in items if "GC=F" in str(it.get("symbol", "")).upper()), None)
        assert gc is not None, f"GC=F not in results: {[i.get('symbol') for i in items[:10]]}"
        assert gc.get("category") in ("commodities", "Commodities"), gc

    def test_search_empty_returns_popular_30(self, api_client):
        r = self._get(api_client, {"q": ""})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        assert isinstance(items, list)
        # Spec says ~30 popular tickers
        assert len(items) >= 20, f"Expected ~30 popular tickers, got {len(items)}"

    def test_search_nonexistent_returns_empty(self, api_client):
        r = self._get(api_client, {"q": "ZZZNONE"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        assert isinstance(items, list)
        # Should be empty or very small (graceful)
        assert len(items) == 0 or all("ZZZNONE" not in str(it.get("symbol", "")).upper() for it in items)

    def test_search_with_limit(self, api_client):
        r = self._get(api_client, {"q": "ARK", "limit": 5})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        assert isinstance(items, list)
        assert len(items) <= 5, f"limit=5 not respected, got {len(items)}"

    def test_search_short_query_a(self, api_client):
        r = self._get(api_client, {"q": "a"})
        assert r.status_code == 200  # graceful, no 500
        # Should return list (possibly empty or small)
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        assert isinstance(items, list)

    def test_search_lowercase_aapl(self, api_client):
        r = self._get(api_client, {"q": "aapl"})
        assert r.status_code == 200
        items = r.json() if isinstance(r.json(), list) else r.json().get("results", [])
        symbols = [str(it.get("symbol", "")).upper() for it in items]
        assert "AAPL" in symbols, "case-insensitive search broken"

    def test_search_special_char_caret(self, api_client):
        r = self._get(api_client, {"q": "^GSPC"})
        assert r.status_code == 200  # graceful


# ---------- Original options endpoint ----------
class TestOriginalSearch:
    def test_search_aapl(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/tickers/search", params={"q": "AAPL"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        items = data if isinstance(data, list) else data.get("results", [])
        symbols = [str(it.get("symbol", "")).upper() for it in items]
        assert "AAPL" in symbols


# ---------- SEO files ----------
class TestSEOFiles:
    def test_sitemap_reachable_and_has_options(self, api_client):
        r = api_client.get(f"{BASE_URL}/sitemap.xml", timeout=20)
        assert r.status_code == 200
        text = r.text
        assert "<urlset" in text
        assert "/options" in text, "sitemap missing /options route"

    def test_robots_reachable_and_has_sitemap(self, api_client):
        r = api_client.get(f"{BASE_URL}/robots.txt", timeout=20)
        assert r.status_code == 200
        text = r.text
        assert "Sitemap:" in text
        assert "/options" in text, "robots.txt missing Allow: /options"

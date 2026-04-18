import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://transaction-hub-113.preview.emergentagent.com')

class TestHealthAndBasicAPIs:
    """Basic API health and functionality tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health endpoint working")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Trading Calculator PRO" in data.get("message", "")
        print("✅ Root endpoint working")
    
    def test_prices_endpoint(self):
        """Test crypto prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/prices")
        assert response.status_code == 200
        data = response.json()
        assert "bitcoin" in data
        assert "ethereum" in data
        assert "solana" in data
        print(f"✅ Prices endpoint working - BTC: ${data['bitcoin']['usd']}")
    
    def test_forex_prices_endpoint(self):
        """Test forex prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/forex-prices")
        assert response.status_code == 200
        data = response.json()
        assert "EURUSD" in data
        print(f"✅ Forex prices endpoint working - EURUSD: {data['EURUSD']['price']}")
    
    def test_indices_prices_endpoint(self):
        """Test indices prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/indices-prices")
        assert response.status_code == 200
        data = response.json()
        assert "SPX" in data
        print(f"✅ Indices prices endpoint working - SPX: {data['SPX']['price']}")
    
    def test_plans_endpoint(self):
        """Test subscription plans endpoint"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert "monthly" in data
        assert "quarterly" in data
        assert "annual" in data
        assert "lifetime" in data
        print(f"✅ Plans endpoint working - Monthly: €{data['monthly']['price']}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_demo_login(self):
        """Test demo user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@btccalc.pro",
            "password": "1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "demo@btccalc.pro"
        assert data["user"]["is_premium"]  # Direct boolean check
        print(f"✅ Demo login working - User: {data['user']['name']}, Premium: {data['user']['is_premium']}")
        return data["token"]
    
    def test_invalid_login(self):
        """Test invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid login correctly rejected")
    
    def test_get_me_authenticated(self):
        """Test /auth/me with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@btccalc.pro",
            "password": "1234"
        })
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "demo@btccalc.pro"
        assert data["is_premium"]  # Direct boolean check
        print(f"✅ Auth/me endpoint working - Premium status: {data['is_premium']}")
    
    def test_get_me_unauthenticated(self):
        """Test /auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✅ Auth/me correctly requires authentication")


class TestPremiumFeatures:
    """Premium feature tests (Monte Carlo, Backtest)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@btccalc.pro",
            "password": "1234"
        })
        return response.json()["token"]
    
    def test_monte_carlo_simulation(self, auth_token):
        """Test Monte Carlo simulation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/monte-carlo",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "winRate": 55,
                "avgWin": 100,
                "avgLoss": -50,
                "initialCapital": 10000,
                "numTrades": 100,
                "numSimulations": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "simulations" in data
        assert "statistics" in data
        assert "avgFinalBalance" in data["statistics"]
        print(f"✅ Monte Carlo working - Avg Balance: ${data['statistics']['avgFinalBalance']}")
    
    def test_backtest_simulation(self, auth_token):
        """Test backtest endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/backtest",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "strategy": "SMA Crossover",
                "initial_capital": 10000,
                "take_profit": 5,
                "stop_loss": 2,
                "leverage": 1
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "final_balance" in data
        assert "win_rate" in data
        assert "roi" in data
        print(f"✅ Backtest working - Final Balance: ${data['final_balance']}, Win Rate: {data['win_rate']}%")


class TestOHLCData:
    """OHLC data endpoint tests"""
    
    def test_ohlc_btc(self):
        """Test OHLC data for BTC"""
        response = requests.get(f"{BASE_URL}/api/ohlc/BTC?days=7")
        assert response.status_code == 200
        data = response.json()
        assert "ohlc" in data
        assert "symbol" in data
        assert data["symbol"] == "BTC"
        print(f"✅ OHLC BTC working - {len(data['ohlc'])} candles returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

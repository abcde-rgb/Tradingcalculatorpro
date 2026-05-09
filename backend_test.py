#!/usr/bin/env python3
"""
Backend API Testing Suite for Trading Calculator PRO
Tests auth endpoints and admin CRUD operations
"""

import requests
import json
import sys
from typing import Dict, Any, Optional, List

# Backend URL - use localhost for internal testing
BASE_URL = "http://localhost:8001/api"

# Test credentials from /app/memory/test_credentials.md
DEMO_EMAIL = "demo@btccalc.pro"
DEMO_PASSWORD = "1234"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

# Test results tracking
test_results: List[Dict[str, Any]] = []
created_user_ids: List[str] = []


def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    test_results.append({"name": name, "passed": passed, "details": details})


def log_info(message: str):
    """Log informational message"""
    print(f"{BLUE}ℹ️  {message}{RESET}")


def log_warning(message: str):
    """Log warning message"""
    print(f"{YELLOW}⚠️  {message}{RESET}")


def log_section(title: str):
    """Log section header"""
    print(f"\n{BLUE}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{RESET}\n")


# ============= TEST 1: AUTH ENDPOINTS =============

def test_auth_login_demo():
    """Test POST /api/auth/login with demo credentials"""
    log_section("TEST 1.1: Auth Login (Demo User)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "Demo login returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
        
        log_test("Demo login returns 200", True)
        
        data = response.json()
        
        # Check token exists
        has_token = "token" in data
        log_test("Response contains token", has_token, f"Token present: {has_token}")
        
        # Check user object
        has_user = "user" in data
        log_test("Response contains user object", has_user)
        
        if has_user:
            user = data["user"]
            
            # Check is_admin is true
            is_admin = user.get("is_admin") == True
            log_test(
                "User is_admin == true",
                is_admin,
                f"is_admin: {user.get('is_admin')}"
            )
            
            # Check email matches
            email_match = user.get("email") == DEMO_EMAIL
            log_test(
                "User email matches",
                email_match,
                f"Email: {user.get('email')}"
            )
            
            # Check subscription plan
            plan = user.get("subscription_plan")
            log_test(
                "User has lifetime plan",
                plan == "lifetime",
                f"Plan: {plan}"
            )
        
        return data.get("token")
        
    except Exception as e:
        log_test("Demo login", False, f"Exception: {str(e)}")
        return None


def test_auth_register_and_login():
    """Test POST /api/auth/register and subsequent login"""
    log_section("TEST 1.2: Auth Register + Login Round-trip")
    
    # Generate unique email
    import time
    test_email = f"testuser_{int(time.time())}@test.com"
    test_password = "testpass123"
    test_name = "Test User"
    
    try:
        # Register new user
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": test_email,
                "password": test_password,
                "name": test_name
            },
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "Register new user returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
        
        log_test("Register new user returns 200", True)
        
        data = response.json()
        
        # Check user is not admin
        user = data.get("user", {})
        is_not_admin = user.get("is_admin") == False
        log_test(
            "New user is_admin == false",
            is_not_admin,
            f"is_admin: {user.get('is_admin')}"
        )
        
        # Check auth_provider is password
        auth_provider = user.get("auth_provider")
        log_test(
            "New user auth_provider == 'password'",
            auth_provider == "password",
            f"auth_provider: {auth_provider}"
        )
        
        # Store user ID for cleanup
        user_id = user.get("id")
        if user_id:
            created_user_ids.append(user_id)
        
        # Now try to login with same credentials
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": test_email, "password": test_password},
            timeout=10
        )
        
        login_success = login_response.status_code == 200
        log_test(
            "Login with new user credentials returns 200",
            login_success,
            f"Status: {login_response.status_code}"
        )
        
        if login_success:
            login_data = login_response.json()
            has_token = "token" in login_data
            log_test("Login response contains token", has_token)
            return login_data.get("token"), user_id
        
        return None, user_id
        
    except Exception as e:
        log_test("Register and login", False, f"Exception: {str(e)}")
        return None, None


def test_auth_me(token: str):
    """Test GET /api/auth/me with demo token"""
    log_section("TEST 1.3: Auth Me Endpoint")
    
    if not token:
        log_test("Auth /me", False, "No token provided")
        return
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "GET /auth/me returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return
        
        log_test("GET /auth/me returns 200", True)
        
        data = response.json()
        
        # Check is_admin is true for demo user
        is_admin = data.get("is_admin") == True
        log_test(
            "User is_admin == true",
            is_admin,
            f"is_admin: {data.get('is_admin')}"
        )
        
    except Exception as e:
        log_test("GET /auth/me", False, f"Exception: {str(e)}")


# ============= TEST 2: ADMIN USER CRUD =============

def test_admin_create_user(admin_token: str):
    """Test POST /api/admin/users"""
    log_section("TEST 2.1: Admin Create User")
    
    if not admin_token:
        log_test("Admin create user", False, "No admin token provided")
        return None
    
    # Test 1: Create user with monthly plan
    import time
    test_email = f"admin_created_{int(time.time())}@test.com"
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "Admin Created User",
                "subscription_plan": "monthly",
                "is_premium": True
            },
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "Create user with monthly plan returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
        
        log_test("Create user with monthly plan returns 200", True)
        
        data = response.json()
        user = data.get("user", {})
        
        # Check subscription_plan
        plan = user.get("subscription_plan")
        log_test(
            "User subscription_plan == 'monthly'",
            plan == "monthly",
            f"Plan: {plan}"
        )
        
        # Check subscription_end is populated
        sub_end = user.get("subscription_end")
        has_sub_end = sub_end is not None and sub_end != ""
        log_test(
            "User subscription_end is populated",
            has_sub_end,
            f"subscription_end: {sub_end}"
        )
        
        # Check subscription_status
        status = user.get("subscription_status")
        log_test(
            "User subscription_status == 'active'",
            status == "active",
            f"Status: {status}"
        )
        
        # Check is_premium
        is_premium = user.get("is_premium") == True
        log_test(
            "User is_premium == true",
            is_premium,
            f"is_premium: {user.get('is_premium')}"
        )
        
        # Check auth_provider
        auth_provider = user.get("auth_provider")
        log_test(
            "User auth_provider == 'password'",
            auth_provider == "password",
            f"auth_provider: {auth_provider}"
        )
        
        user_id = user.get("id")
        if user_id:
            created_user_ids.append(user_id)
        
        return user_id
        
    except Exception as e:
        log_test("Admin create user", False, f"Exception: {str(e)}")
        return None


def test_admin_create_duplicate_user(admin_token: str):
    """Test POST /api/admin/users with duplicate email"""
    log_section("TEST 2.2: Admin Create Duplicate User (Should Fail)")
    
    if not admin_token:
        log_test("Admin create duplicate", False, "No admin token provided")
        return
    
    try:
        # Try to create user with demo email
        response = requests.post(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": DEMO_EMAIL,
                "password": "testpass123",
                "name": "Duplicate User"
            },
            timeout=10
        )
        
        # Should return 400
        is_400 = response.status_code == 400
        log_test(
            "Create duplicate user returns 400",
            is_400,
            f"Status: {response.status_code}"
        )
        
        if is_400:
            data = response.json()
            detail = data.get("detail", "")
            has_error_msg = "ya está registrado" in detail.lower() or "already" in detail.lower()
            log_test(
                "Error message mentions duplicate email",
                has_error_msg,
                f"Detail: {detail}"
            )
        
    except Exception as e:
        log_test("Admin create duplicate", False, f"Exception: {str(e)}")


def test_admin_create_short_password(admin_token: str):
    """Test POST /api/admin/users with short password"""
    log_section("TEST 2.3: Admin Create User with Short Password (Should Fail)")
    
    if not admin_token:
        log_test("Admin create short password", False, "No admin token provided")
        return
    
    try:
        import time
        test_email = f"shortpass_{int(time.time())}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": test_email,
                "password": "123",  # Less than 4 characters
                "name": "Short Pass User"
            },
            timeout=10
        )
        
        # Should return 400
        is_400 = response.status_code == 400
        log_test(
            "Create user with short password returns 400",
            is_400,
            f"Status: {response.status_code}"
        )
        
    except Exception as e:
        log_test("Admin create short password", False, f"Exception: {str(e)}")


def test_admin_update_user(admin_token: str, user_id: str):
    """Test PATCH /api/admin/users/{id}"""
    log_section("TEST 2.4: Admin Update User")
    
    if not admin_token or not user_id:
        log_test("Admin update user", False, "No admin token or user_id provided")
        return
    
    try:
        response = requests.request(
            "PATCH",
            f"{BASE_URL}/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "subscription_plan": "lifetime",
                "is_admin": True,
                "name": "Patched User Name"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "Update user returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return
        
        log_test("Update user returns 200", True)
        
        data = response.json()
        user = data.get("user", {})
        
        # Check fields were updated
        plan = user.get("subscription_plan")
        log_test(
            "User subscription_plan updated to 'lifetime'",
            plan == "lifetime",
            f"Plan: {plan}"
        )
        
        is_admin = user.get("is_admin") == True
        log_test(
            "User is_admin updated to true",
            is_admin,
            f"is_admin: {user.get('is_admin')}"
        )
        
        name = user.get("name")
        log_test(
            "User name updated",
            name == "Patched User Name",
            f"Name: {name}"
        )
        
    except Exception as e:
        log_test("Admin update user", False, f"Exception: {str(e)}")


def test_admin_update_nonexistent_user(admin_token: str):
    """Test PATCH /api/admin/users/{id} with non-existent ID"""
    log_section("TEST 2.5: Admin Update Non-existent User (Should Fail)")
    
    if not admin_token:
        log_test("Admin update non-existent", False, "No admin token provided")
        return
    
    try:
        fake_id = "nonexistent-user-id-12345"
        response = requests.request(
            "PATCH",
            f"{BASE_URL}/admin/users/{fake_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Updated Name"},
            timeout=10
        )
        
        # Should return 404
        is_404 = response.status_code == 404
        log_test(
            "Update non-existent user returns 404",
            is_404,
            f"Status: {response.status_code}"
        )
        
    except Exception as e:
        log_test("Admin update non-existent", False, f"Exception: {str(e)}")


def test_admin_reset_password(admin_token: str, user_id: str):
    """Test POST /api/admin/users/{id}/reset-password"""
    log_section("TEST 2.6: Admin Reset Password")
    
    if not admin_token or not user_id:
        log_test("Admin reset password", False, "No admin token or user_id provided")
        return
    
    new_password = "newpass99"
    
    try:
        # Reset password
        response = requests.post(
            f"{BASE_URL}/admin/users/{user_id}/reset-password",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"new_password": new_password},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "Reset password returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return
        
        log_test("Reset password returns 200", True)
        
        # Get user email from the response or fetch it
        # We need to login with the new password to verify
        # First, get the user's email
        user_response = requests.get(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if user_response.status_code == 200:
            users = user_response.json().get("users", [])
            user = next((u for u in users if u.get("id") == user_id), None)
            
            if user:
                user_email = user.get("email")
                
                # Try to login with new password
                login_response = requests.post(
                    f"{BASE_URL}/auth/login",
                    json={"email": user_email, "password": new_password},
                    timeout=10
                )
                
                login_success = login_response.status_code == 200
                log_test(
                    "Login with new password works",
                    login_success,
                    f"Status: {login_response.status_code}"
                )
        
    except Exception as e:
        log_test("Admin reset password", False, f"Exception: {str(e)}")


def test_admin_delete_user(admin_token: str, user_id: str):
    """Test DELETE /api/admin/users/{id}"""
    log_section("TEST 2.7: Admin Delete User")
    
    if not admin_token or not user_id:
        log_test("Admin delete user", False, "No admin token or user_id provided")
        return
    
    try:
        # Delete user
        response = requests.delete(
            f"{BASE_URL}/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "Delete user returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return
        
        log_test("Delete user returns 200", True)
        
        # Verify user is gone
        users_response = requests.get(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if users_response.status_code == 200:
            users = users_response.json().get("users", [])
            user_exists = any(u.get("id") == user_id for u in users)
            log_test(
                "User no longer in user list",
                not user_exists,
                f"User found: {user_exists}"
            )
            
            # Remove from cleanup list
            if user_id in created_user_ids:
                created_user_ids.remove(user_id)
        
    except Exception as e:
        log_test("Admin delete user", False, f"Exception: {str(e)}")


def test_admin_delete_demo_user(admin_token: str):
    """Test DELETE /api/admin/users/{demo_id} (Should Fail)"""
    log_section("TEST 2.8: Admin Delete Demo User (Should Fail)")
    
    if not admin_token:
        log_test("Admin delete demo", False, "No admin token provided")
        return
    
    try:
        # First, create a NEW admin user (not demo)
        import time
        new_admin_email = f"admin_temp_{int(time.time())}@test.com"
        
        create_response = requests.post(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": new_admin_email,
                "password": "adminpass123",
                "name": "Temp Admin",
                "is_admin": True
            },
            timeout=10
        )
        
        if create_response.status_code != 200:
            log_test("Create temp admin user", False, f"Status: {create_response.status_code}")
            return
        
        new_admin_id = create_response.json().get("user", {}).get("id")
        if new_admin_id:
            created_user_ids.append(new_admin_id)
        
        # Login as the new admin
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": new_admin_email, "password": "adminpass123"},
            timeout=10
        )
        
        if login_response.status_code != 200:
            log_test("Login as temp admin", False, f"Status: {login_response.status_code}")
            return
        
        new_admin_token = login_response.json().get("token")
        
        # Get demo user ID
        users_response = requests.get(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {new_admin_token}"},
            timeout=10
        )
        
        if users_response.status_code != 200:
            log_test("Get users list", False, f"Status: {users_response.status_code}")
            return
        
        users = users_response.json().get("users", [])
        demo_user = next((u for u in users if u.get("email") == DEMO_EMAIL), None)
        
        if not demo_user:
            log_test("Find demo user", False, "Demo user not found in list")
            return
        
        demo_id = demo_user.get("id")
        
        # Try to delete demo user as the new admin
        response = requests.delete(
            f"{BASE_URL}/admin/users/{demo_id}",
            headers={"Authorization": f"Bearer {new_admin_token}"},
            timeout=10
        )
        
        # Should return 400
        is_400 = response.status_code == 400
        log_test(
            "Delete demo user returns 400",
            is_400,
            f"Status: {response.status_code}"
        )
        
        if is_400:
            data = response.json()
            detail = data.get("detail", "")
            has_error_msg = "demo" in detail.lower()
            log_test(
                "Error message mentions demo user",
                has_error_msg,
                f"Detail: {detail}"
            )
        
    except Exception as e:
        log_test("Admin delete demo", False, f"Exception: {str(e)}")


def test_admin_delete_self(admin_token: str):
    """Test DELETE /api/admin/users/{my_own_id} (Should Fail)"""
    log_section("TEST 2.9: Admin Delete Self (Should Fail)")
    
    if not admin_token:
        log_test("Admin delete self", False, "No admin token provided")
        return
    
    try:
        # Get current user ID from /auth/me
        me_response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if me_response.status_code != 200:
            log_test("Get current user", False, f"Status: {me_response.status_code}")
            return
        
        my_id = me_response.json().get("id")
        
        # Try to delete self
        response = requests.delete(
            f"{BASE_URL}/admin/users/{my_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        # Should return 400
        is_400 = response.status_code == 400
        log_test(
            "Delete self returns 400",
            is_400,
            f"Status: {response.status_code}"
        )
        
        if is_400:
            data = response.json()
            detail = data.get("detail", "")
            has_error_msg = "ti mismo" in detail.lower() or "yourself" in detail.lower()
            log_test(
                "Error message mentions self-delete",
                has_error_msg,
                f"Detail: {detail}"
            )
        
    except Exception as e:
        log_test("Admin delete self", False, f"Exception: {str(e)}")


def test_admin_endpoints_without_auth():
    """Test admin endpoints return 401 without auth"""
    log_section("TEST 2.10: Admin Endpoints Without Auth (Should Fail)")
    
    try:
        # Test GET /admin/users
        response = requests.get(f"{BASE_URL}/admin/users", timeout=10)
        is_401 = response.status_code == 401
        log_test(
            "GET /admin/users without auth returns 401",
            is_401,
            f"Status: {response.status_code}"
        )
        
        # Test POST /admin/users
        response = requests.post(
            f"{BASE_URL}/admin/users",
            json={"email": "test@test.com", "password": "test", "name": "Test"},
            timeout=10
        )
        is_401 = response.status_code == 401
        log_test(
            "POST /admin/users without auth returns 401",
            is_401,
            f"Status: {response.status_code}"
        )
        
    except Exception as e:
        log_test("Admin endpoints without auth", False, f"Exception: {str(e)}")


def test_admin_endpoints_with_non_admin(non_admin_token: str):
    """Test admin endpoints return 403 with non-admin user"""
    log_section("TEST 2.11: Admin Endpoints With Non-Admin User (Should Fail)")
    
    if not non_admin_token:
        log_test("Admin endpoints with non-admin", False, "No non-admin token provided")
        return
    
    try:
        # Test GET /admin/users
        response = requests.get(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {non_admin_token}"},
            timeout=10
        )
        is_403 = response.status_code == 403
        log_test(
            "GET /admin/users with non-admin returns 403",
            is_403,
            f"Status: {response.status_code}"
        )
        
        # Test POST /admin/users
        response = requests.post(
            f"{BASE_URL}/admin/users",
            headers={"Authorization": f"Bearer {non_admin_token}"},
            json={"email": "test@test.com", "password": "test", "name": "Test"},
            timeout=10
        )
        is_403 = response.status_code == 403
        log_test(
            "POST /admin/users with non-admin returns 403",
            is_403,
            f"Status: {response.status_code}"
        )
        
    except Exception as e:
        log_test("Admin endpoints with non-admin", False, f"Exception: {str(e)}")


# ============= TEST 3: ADMIN SETTINGS =============

def test_admin_get_settings(admin_token: str):
    """Test GET /api/admin/settings"""
    log_section("TEST 3.1: Admin Get Settings")
    
    if not admin_token:
        log_test("Admin get settings", False, "No admin token provided")
        return None
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "GET /admin/settings returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
        
        log_test("GET /admin/settings returns 200", True)
        
        data = response.json()
        
        # Check all 6 keys are present
        required_keys = [
            "ga4_measurement_id",
            "gtm_id",
            "gsc_verification",
            "adsense_publisher_id",
            "bing_verification",
            "google_client_id"
        ]
        
        all_keys_present = all(key in data for key in required_keys)
        log_test(
            "Response contains all 6 required keys",
            all_keys_present,
            f"Keys: {list(data.keys())}"
        )
        
        # Check google_client_id has fallback value
        google_client_id = data.get("google_client_id", "")
        has_google_client_id = google_client_id != ""
        log_test(
            "google_client_id has value (env fallback)",
            has_google_client_id,
            f"google_client_id: {google_client_id[:20]}..." if google_client_id else "Empty"
        )
        
        return data
        
    except Exception as e:
        log_test("Admin get settings", False, f"Exception: {str(e)}")
        return None


def test_admin_update_settings(admin_token: str):
    """Test PUT /api/admin/settings"""
    log_section("TEST 3.2: Admin Update Settings")
    
    if not admin_token:
        log_test("Admin update settings", False, "No admin token provided")
        return None
    
    try:
        # Update settings
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "ga4_measurement_id": "G-TEST123",
                "gtm_id": "GTM-AAA111"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            log_test(
                "PUT /admin/settings returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return None
        
        log_test("PUT /admin/settings returns 200", True)
        
        data = response.json()
        
        # Check fields were updated
        ga4 = data.get("ga4_measurement_id")
        log_test(
            "ga4_measurement_id updated to 'G-TEST123'",
            ga4 == "G-TEST123",
            f"ga4_measurement_id: {ga4}"
        )
        
        gtm = data.get("gtm_id")
        log_test(
            "gtm_id updated to 'GTM-AAA111'",
            gtm == "GTM-AAA111",
            f"gtm_id: {gtm}"
        )
        
        # Check updated_at and updated_by are present
        has_updated_at = "updated_at" in data
        log_test(
            "Response contains updated_at",
            has_updated_at,
            f"updated_at: {data.get('updated_at')}"
        )
        
        has_updated_by = "updated_by" in data
        log_test(
            "Response contains updated_by",
            has_updated_by,
            f"updated_by: {data.get('updated_by')}"
        )
        
        return data
        
    except Exception as e:
        log_test("Admin update settings", False, f"Exception: {str(e)}")
        return None


def test_public_settings():
    """Test GET /api/public/settings (no auth)"""
    log_section("TEST 3.3: Public Settings (No Auth)")
    
    try:
        response = requests.get(f"{BASE_URL}/public/settings", timeout=10)
        
        if response.status_code != 200:
            log_test(
                "GET /public/settings returns 200",
                False,
                f"Status: {response.status_code}, Body: {response.text}"
            )
            return
        
        log_test("GET /public/settings returns 200 (no auth required)", True)
        
        data = response.json()
        
        # Check all 6 keys are present
        required_keys = [
            "ga4_measurement_id",
            "gtm_id",
            "gsc_verification",
            "adsense_publisher_id",
            "bing_verification",
            "google_client_id"
        ]
        
        all_keys_present = all(key in data for key in required_keys)
        log_test(
            "Response contains all 6 public keys",
            all_keys_present,
            f"Keys: {list(data.keys())}"
        )
        
        # Check values reflect what we just saved
        ga4 = data.get("ga4_measurement_id")
        log_test(
            "ga4_measurement_id reflects saved value 'G-TEST123'",
            ga4 == "G-TEST123",
            f"ga4_measurement_id: {ga4}"
        )
        
        gtm = data.get("gtm_id")
        log_test(
            "gtm_id reflects saved value 'GTM-AAA111'",
            gtm == "GTM-AAA111",
            f"gtm_id: {gtm}"
        )
        
    except Exception as e:
        log_test("Public settings", False, f"Exception: {str(e)}")


def test_admin_settings_without_auth():
    """Test GET /api/admin/settings without auth (Should Fail)"""
    log_section("TEST 3.4: Admin Settings Without Auth (Should Fail)")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/settings", timeout=10)
        is_401 = response.status_code == 401
        log_test(
            "GET /admin/settings without auth returns 401",
            is_401,
            f"Status: {response.status_code}"
        )
        
    except Exception as e:
        log_test("Admin settings without auth", False, f"Exception: {str(e)}")


def test_admin_settings_with_non_admin(non_admin_token: str):
    """Test GET /api/admin/settings with non-admin (Should Fail)"""
    log_section("TEST 3.5: Admin Settings With Non-Admin (Should Fail)")
    
    if not non_admin_token:
        log_test("Admin settings with non-admin", False, "No non-admin token provided")
        return
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {non_admin_token}"},
            timeout=10
        )
        is_403 = response.status_code == 403
        log_test(
            "GET /admin/settings with non-admin returns 403",
            is_403,
            f"Status: {response.status_code}"
        )
        
    except Exception as e:
        log_test("Admin settings with non-admin", False, f"Exception: {str(e)}")


def cleanup_settings(admin_token: str):
    """Clear test values from settings"""
    log_section("CLEANUP: Clear Test Settings")
    
    if not admin_token:
        log_warning("Cannot cleanup settings - no admin token")
        return
    
    try:
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "ga4_measurement_id": "",
                "gtm_id": ""
            },
            timeout=10
        )
        
        if response.status_code == 200:
            log_info("Test settings cleared successfully")
        else:
            log_warning(f"Failed to clear test settings: {response.status_code}")
        
    except Exception as e:
        log_warning(f"Exception during settings cleanup: {str(e)}")


def cleanup_users(admin_token: str):
    """Delete any remaining test users"""
    log_section("CLEANUP: Delete Test Users")
    
    if not admin_token:
        log_warning("Cannot cleanup users - no admin token")
        return
    
    for user_id in created_user_ids[:]:  # Copy list to avoid modification during iteration
        try:
            response = requests.delete(
                f"{BASE_URL}/admin/users/{user_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                log_info(f"Deleted test user: {user_id}")
                created_user_ids.remove(user_id)
            else:
                log_warning(f"Failed to delete user {user_id}: {response.status_code}")
        
        except Exception as e:
            log_warning(f"Exception deleting user {user_id}: {str(e)}")


def print_summary():
    """Print test summary"""
    log_section("TEST SUMMARY")
    
    total = len(test_results)
    passed = sum(1 for r in test_results if r["passed"])
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print(f"{GREEN}Passed: {passed}{RESET}")
    print(f"{RED}Failed: {failed}{RESET}")
    print(f"Success Rate: {(passed/total*100):.1f}%\n")
    
    if failed > 0:
        print(f"{RED}Failed Tests:{RESET}")
        for result in test_results:
            if not result["passed"]:
                print(f"  ❌ {result['name']}")
                if result["details"]:
                    print(f"     {result['details']}")
    
    return failed == 0


# ============= MAIN TEST RUNNER =============

def main():
    """Run all tests"""
    print(f"\n{BLUE}{'='*60}")
    print("  Backend API Test Suite")
    print("  Trading Calculator PRO")
    print(f"{'='*60}{RESET}\n")
    
    log_info(f"Backend URL: {BASE_URL}")
    log_info(f"Demo User: {DEMO_EMAIL}")
    print()
    
    # Test 1: Auth endpoints
    admin_token = test_auth_login_demo()
    non_admin_token, non_admin_user_id = test_auth_register_and_login()
    test_auth_me(admin_token)
    
    # Test 2: Admin user CRUD
    created_user_id = test_admin_create_user(admin_token)
    test_admin_create_duplicate_user(admin_token)
    test_admin_create_short_password(admin_token)
    test_admin_update_user(admin_token, created_user_id)
    test_admin_update_nonexistent_user(admin_token)
    test_admin_reset_password(admin_token, created_user_id)
    test_admin_delete_user(admin_token, created_user_id)
    test_admin_delete_demo_user(admin_token)
    test_admin_delete_self(admin_token)
    test_admin_endpoints_without_auth()
    test_admin_endpoints_with_non_admin(non_admin_token)
    
    # Test 3: Admin settings
    test_admin_get_settings(admin_token)
    test_admin_update_settings(admin_token)
    test_public_settings()
    test_admin_settings_without_auth()
    test_admin_settings_with_non_admin(non_admin_token)
    
    # Cleanup
    cleanup_settings(admin_token)
    cleanup_users(admin_token)
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()

#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Spanish-speaking user reported: "en el actual proyecto de github hay un problema con el registro,
  inicio de sesion,y admin,cuando inicio sesion con demo o otra cuenta el sistema no responde,
  quiero que añadas todas las apis correctas de google ademas desde admin, quiero que la
  funcionalidad sea 100% real sobre los usuarios."

  Root cause of the "system not responding": backend was not running because the `scipy`
  dependency was missing (ModuleNotFoundError on import). Frontend was also stopped because
  craco wasn't installed yet. Both services were restarted after `pip install -r requirements.txt`
  and `yarn install` — login/register endpoints now respond correctly.

  Net new work delivered in this session:
   1. Backend self-heal at startup: demo user (`demo@btccalc.pro / 1234`) is auto-promoted to
      admin on every boot if not already.
   2. New backend endpoints (admin only):
        - POST   /api/admin/users           → create user with plan/premium/admin flags
        - PATCH  /api/admin/users/{id}      → edit name/email/plan/premium/admin/sub_end/status/locale
        - DELETE /api/admin/users/{id}      → hard-delete (blocks self-delete + demo-delete) + cascade
        - POST   /api/admin/users/{id}/reset-password
        - GET    /api/admin/settings        → fetch Google API keys saved in DB (with env fallback)
        - PUT    /api/admin/settings        → upsert Google API keys (admin only)
        - GET    /api/public/settings       → public projection (used by SPA at boot)
   3. Frontend `GoogleIntegrations.jsx` now reads `/api/public/settings` first, then falls back
      to `REACT_APP_*` env vars. Admin can flip GA4/GTM/AdSense/GSC/Bing on/off WITHOUT a
      rebuild.
   4. Frontend `AdminPage.jsx` rewritten with:
        - Editable Google integrations panel (6 inputs + Save) → POSTs to /admin/settings
        - "Nuevo usuario" button + create dialog
        - Per-row Edit / Reset / Delete buttons + confirm dialogs
        - Delete row hidden for self and for the demo user (UI guard, backend also enforces)

backend:
  - task: "Auth login/register/google still works after refactor"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Manual curl: demo login returns token + is_admin=true. Bug was scipy missing, fixed."
        -working: true
        -agent: "testing"
        -comment: |
          ✅ ALL AUTH TESTS PASSED (12/12):
          - POST /api/auth/login with demo@btccalc.pro returns 200 with token + is_admin=true + subscription_plan=lifetime
          - POST /api/auth/register creates new user with is_admin=false + auth_provider=password
          - POST /api/auth/login with newly registered user returns 200 with token
          - GET /api/auth/me with demo token returns 200 with is_admin=true
          Auth flow is fully functional.

  - task: "Admin self-heal at startup (demo gets is_admin=True)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "startup_event idempotently patches demo user with is_admin=True + lifetime plan + auth_provider=password if missing."
        -working: true
        -agent: "testing"
        -comment: |
          ✅ VERIFIED: Demo user (demo@btccalc.pro) has is_admin=true, subscription_plan=lifetime, auth_provider=password.
          Self-heal working correctly.

  - task: "Admin user CRUD (create/edit/delete/reset-password)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: |
          Manual curl roundtrip OK:
            POST   /admin/users        → creates qa1@test.com plan=monthly is_premium
            PATCH  /admin/users/{id}   → upgrades to lifetime + admin + renames
            POST   /admin/users/{id}/reset-password → new password works on /auth/login
            DELETE /admin/users/{id}   → user gone, cascade attempted on related collections
            DELETE /admin/users/{demo} → 400 "No se puede borrar el usuario demo"
            DELETE /admin/users/{self} → 400 "No puedes borrarte a ti mismo"
          All 4xx errors return clean JSON `detail` strings.
        -working: true
        -agent: "testing"
        -comment: |
          ✅ ALL ADMIN CRUD TESTS PASSED (29/29):
          CREATE:
          - POST /admin/users with monthly plan → 200, subscription_plan=monthly, subscription_end populated (~30d), subscription_status=active, is_premium=true, auth_provider=password ✅
          - POST /admin/users with duplicate email → 400 "El email ya está registrado" ✅
          - POST /admin/users with password < 4 chars → 400 ✅
          
          UPDATE:
          - PATCH /admin/users/{id} with subscription_plan=lifetime, is_admin=true, name → 200, all fields updated ✅
          - PATCH /admin/users/{nonexistent_id} → 404 ✅
          
          RESET PASSWORD:
          - POST /admin/users/{id}/reset-password with new_password → 200 ✅
          - Login with new password works ✅
          
          DELETE:
          - DELETE /admin/users/{id} → 200, user removed from list ✅
          - DELETE /admin/users/{demo_id} (as different admin) → 400 "No se puede borrar el usuario demo" ✅
          - DELETE /admin/users/{my_own_id} → 400 "No puedes borrarte a ti mismo" ✅
          
          AUTH CHECKS:
          - All /admin/* endpoints without auth → 401 ✅
          - All /admin/* endpoints with non-admin user → 403 ✅
          
          All validation and security checks working correctly.

  - task: "Admin app settings + public settings (Google APIs from DB)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: |
          GET /admin/settings returns DB values with env fallback (so admin sees what's
          actually active even before the first save). PUT /admin/settings upserts only
          the fields explicitly sent (`exclude_unset=True`) and writes updated_at +
          updated_by. GET /public/settings exposes only the 6 non-secret keys
          (ga4_measurement_id, gtm_id, gsc_verification, adsense_publisher_id,
          bing_verification, google_client_id). Verified via curl.
        -working: true
        -agent: "testing"
        -comment: |
          ✅ ALL SETTINGS TESTS PASSED (12/12):
          ADMIN SETTINGS:
          - GET /admin/settings (admin) → 200 with all 6 keys (ga4_measurement_id, gtm_id, gsc_verification, adsense_publisher_id, bing_verification, google_client_id) ✅
          - google_client_id falls back to GOOGLE_CLIENT_ID env var before first PUT ✅
          - PUT /admin/settings with ga4_measurement_id=G-TEST123, gtm_id=GTM-AAA111 → 200, both fields persisted ✅
          - Response includes updated_at and updated_by=demo@btccalc.pro ✅
          
          PUBLIC SETTINGS:
          - GET /api/public/settings (no auth) → 200 with all 6 public keys ✅
          - Values reflect what was just saved (G-TEST123, GTM-AAA111) ✅
          - No authentication required ✅
          
          AUTH CHECKS:
          - GET /admin/settings without auth → 401 ✅
          - GET /admin/settings with non-admin token → 403 ✅
          
          Settings persistence and public projection working correctly.
          Test values cleaned up after testing.

frontend:
  - task: "AdminPage CRUD UI (create / edit / reset password / delete dialogs)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/AdminPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: |
          Awaiting user feedback. Lint clean. Components used: Dialog, Switch, Label, Select.
          Self/demo delete buttons hidden in UI in addition to backend guard.

  - task: "GoogleIntegrations dynamic loader (DB > env)"
    implemented: true
    working: "NA"
    file: "frontend/src/components/integrations/GoogleIntegrations.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: |
          Fetches /api/public/settings on mount, then injects gtag/GTM/AdSense/GSC/Bing
          tags using DB value first, REACT_APP_* env var as fallback. No-op if both empty.

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Auth login/register/google still works after refactor"
    - "Admin user CRUD (create/edit/delete/reset-password)"
    - "Admin app settings + public settings (Google APIs from DB)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      Backend self-test via curl OK for all new endpoints. Please re-verify:
        1. /auth/login still returns is_admin=true for demo@btccalc.pro / 1234.
        2. /auth/register creates a non-admin user, login round-trip works.
        3. POST /admin/users creates user; PATCH updates plan/premium/admin; reset-password
           lets the user log in with the new password; DELETE removes them.
        4. DELETE on demo user returns 400; DELETE on the calling admin returns 400.
        5. PUT /admin/settings persists the keys, GET /admin/settings returns them, and
           GET /public/settings exposes only the public projection.
      Auth credentials in /app/memory/test_credentials.md.
    -agent: "testing"
    -message: |
      ✅ COMPREHENSIVE BACKEND TESTING COMPLETE - ALL 53 TESTS PASSED (100% success rate)
      
      Tested via /app/backend_test.py against http://localhost:8001/api
      
      SUMMARY BY CATEGORY:
      
      1. AUTH ENDPOINTS (12 tests) - ALL PASS ✅
         - Demo login returns 200 with token, is_admin=true, lifetime plan
         - Register creates non-admin user with auth_provider=password
         - Login round-trip works for newly registered user
         - GET /auth/me returns correct user data
      
      2. ADMIN USER CRUD (29 tests) - ALL PASS ✅
         - POST /admin/users: Creates users with subscription plans, validates duplicates, enforces password length
         - PATCH /admin/users/{id}: Updates all fields correctly, returns 404 for non-existent users
         - POST /admin/users/{id}/reset-password: Resets password, new password works for login
         - DELETE /admin/users/{id}: Deletes users, blocks demo deletion, blocks self-deletion
         - Auth checks: All endpoints return 401 without auth, 403 with non-admin user
      
      3. ADMIN SETTINGS (12 tests) - ALL PASS ✅
         - GET /admin/settings: Returns all 6 keys with env fallback for google_client_id
         - PUT /admin/settings: Persists values, includes updated_at and updated_by
         - GET /public/settings: Public endpoint (no auth) returns all 6 keys with saved values
         - Auth checks: Returns 401 without auth, 403 with non-admin
      
      NO ISSUES FOUND. All endpoints working as specified in the review request.
      
      Database cleaned up: Test users deleted, test settings cleared.

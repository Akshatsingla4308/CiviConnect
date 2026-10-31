# CiviConnect (ਸਿਵਿਕ ਕਨੈਕਟ / सिविक कनेक्ट)

> **An independent, multilingual public-service information and government scheme navigation platform for India.**

CiviConnect empowers citizens across India and international visitors to discover public welfare schemes, evaluate deterministic legal eligibility without AI hallucinations, prepare personalized document checklists, and navigate official government procedures in **English**, **Hindi (हिंदी)**, and **Punjabi (ਪੰਜਾਬੀ)**.

---

## 1. System Architecture & Capabilities

```
+------------------------------------------------------------------------+
|             CiviConnect React 18 + Vite Production Frontend            |
|       - Art-Directed Warm Editorial Aesthetic (Ivory, Forest, Terracotta)|
|       - Trilingual Navigation (English, हिंदी, ਪੰਜਾਬੀ)                 |
|       - 18 Responsive Pages & Views with Zero Dead Clicks             |
+-----------------------------------+------------------------------------+
                                    | REST JSON (Bearer JWT Auth)
                                    v
+------------------------------------------------------------------------+
|                        FastAPI Backend Engine                          |
|  - Auth & Profile Services (Bcrypt, HS256 JWT, Role-Based Access)       |
|  - Deterministic Eligibility Engine (Mathematical Rule Evaluator)     |
|  - Scheme & Canonical Document Catalogs (52 Schemes, 39 Documents)    |
|  - Multi-Turn AI Assistant (Google Gemini 3.8 Flash / Grounded Fallback)|
|  - Personal Document Checklist Tracker & Application Tracker           |
|  - Supervisory Administration & Immutable Audit Trails                 |
+-----------------------------------+------------------------------------+
                                    | SQLAlchemy 2.0 ORM / Alembic
                                    v
+------------------------------------------------------------------------+
|                       Relational Database Layer                        |
|  - Primary: PostgreSQL (via psycopg2)                                  |
|  - Development Fallback: SQLite (`civiconnect.db`)                     |
|  - 14 Relational Models with Cascading Foreign Keys                    |
|  - Fully Idempotent Auto-Seeding (52 Schemes, 93 Rules, 154 Mappings) |
+------------------------------------------------------------------------+
```

---

## 2. Verified Knowledge Base

- **52 Verified Schemes**: Central Government & Punjab State initiatives across scholarships, agriculture, health insurance, social security, women & child welfare, disability grants, pensions, and housing.
- **39 Canonical Documents**: Aadhaar, PAN, Income Certificate, Caste/Community Certificate, Punjab Residence/Domicile, Land Records (Jamabandi/Fard), UDID Disability Card, MCP Card, etc.
- **100% Grounded Citations**: Direct links to authentic gazettes, official ministries, and `.gov.in` / `.nic.in` portals. Zero fabricated URLs or hallucinated benefits.

---

## 3. Quick Start (Windows PowerShell)

### Prerequisites
- Python 3.10+ (tested on Python 3.12.10)
- Node.js 18+ (tested on Node v20.20.2 & npm 10.8.2)
- PostgreSQL (Optional, service `postgresql-x64-18` or SQLite development fallback)

---

### Step 1: Backend Setup & Testing

Open a Windows PowerShell terminal in the repository root:

```powershell
# 1. Create and activate virtual environment
python -m venv backend\venv
& "backend\venv\Scripts\Activate.ps1"

# 2. Install backend dependencies
& "backend\venv\Scripts\pip.exe" install -r backend\requirements.txt

# 3. (Optional) Configure Environment Variables
Copy-Item .env.example .env

# 4. Run Automated Backend Pytest Suite
& "backend\venv\Scripts\pytest.exe" backend\tests
```

**Expected Test Result:**
```text
======================== 22 passed, 1 warning in ~12s ========================
```

### Step 2: Automated End-to-End Browser Testing

With backend (`http://127.0.0.1:8000`) and frontend (`http://127.0.0.1:5173`) running:

```powershell
node --experimental-websocket test_browser_suite.mjs
```

**Expected Browser Test Result:**
```text
==================================================
RESULTS: 20 passed, 0 failed
ALL TESTS PASSED SUCCESSFULLY!
==================================================
```
```

---

### Step 2: Start the Backend API Server

```powershell
.\start_backend.ps1
```
The FastAPI application starts at `http://127.0.0.1:8000`:
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`
- **System Health & Engine Status:** `http://127.0.0.1:8000/api/system/health`

---

### Step 3: Start the Frontend Application

Open a second PowerShell terminal in the repository root:

```powershell
.\start_frontend.ps1
```
The Vite development server will start at `http://127.0.0.1:5173`.

---

## 4. Production Frontend Build

To build the static distribution bundle:

```powershell
Set-Location frontend
npm run build
```

The output will be generated cleanly in `frontend/dist/`.

---

## 5. PostgreSQL Database Configuration

PostgreSQL is the intended primary database.

1. Ensure the PostgreSQL service is active:
   ```powershell
   Get-Service -Name *postgres*
   ```
2. Connect to PostgreSQL and create the database:
   ```sql
   CREATE DATABASE civiconnect_db;
   ```
3. Update `DATABASE_URL` in your `.env` file:
   ```ini
   DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/civiconnect_db
   ```
4. Restart the backend. The backend will automatically run migrations and idempotent seeds on startup.

*Note on Local Development Fallback:* If `DATABASE_URL` is unreachable or PostgreSQL credentials fail, CiviConnect automatically uses the local SQLite database (`sqlite:///./civiconnect.db`) and transparently reports the fallback on `/api/system/health` and the Admin Console.

---

## 6. AI Configuration (Google Gemini)

To enable live AI generation with Google Gemini:

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Set the key in your `.env` file or environment:
   ```ini
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-3.8-flash
   ```
3. Restart the backend server. The AI assistant will automatically use live `gemini-3.8-flash` grounded by verified database schemes.
4. **Resilient Quota & Provider Fallback:** If the Gemini API rate limit or quota is exhausted (HTTP 429), or if Google servers are temporarily unavailable (HTTP 503/504), CiviConnect bypasses retry loops, suppresses raw provider exceptions, and falls back to verified database scheme recommendations with a clear indicator for the citizen.
5. If no API key is provided, CiviConnect uses its grounded database navigator fallback, ensuring full functionality even offline or without external credentials.

---

## 7. Default Administrator Account

The initial database seed provisions an administrative account for verification management:
- **Email:** `admin@civiconnect.in`
- **Password:** `CivicAdmin@2026!`
- **Capabilities:** Toggle scheme gazette verification status, manage eligibility criteria, and view immutable audit trails.

---

## 8. Disclaimer

*CiviConnect is an independent public-service information initiative. CiviConnect is NOT an official government website, does not impersonate government entities, does not charge citizens for information, and does not submit applications on behalf of users. Always confirm requirements on official `.gov.in` portals.*

<div align="center">

# CiviConnect

### Public Services. Simplified for Everyone.

**A multilingual public-service navigation platform helping people discover government schemes, understand eligibility, and prepare for official processes.**

[![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-Backend-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**English · हिंदी · ਪੰਜਾਬੀ**

</div>

---

## Overview

Finding the right government scheme can be difficult. Information is spread across multiple portals, eligibility conditions can be confusing, and applicants may not know which documents to prepare or where to begin.

**CiviConnect** is an independent multilingual platform designed to make public-service information easier to understand and navigate. It brings scheme discovery, rule-based eligibility guidance, document information, and AI-assisted help into one interface.

The goal is simple: make government-service information more accessible without pretending to replace official government portals or decisions.

> **Important:** CiviConnect is an independent information platform. It is not a government website, does not grant benefits, and does not guarantee that an application will be approved.

## At a Glance

| | |
|---|---|
| **Purpose** | Discover schemes and understand public-service procedures |
| **Languages** | English, Hindi, and Punjabi |
| **Frontend** | React 18 + Vite |
| **Backend** | Python + FastAPI |
| **Data layer** | SQLAlchemy + relational database |
| **Production database** | PostgreSQL, subject to deployment configuration |
| **AI assistance** | Google Gemini integration with a database-backed fallback, when configured |
| **Eligibility** | Deterministic rule-based evaluation for supported criteria |

## Key Features

### 🧭 Scheme Discovery
Browse available central-government and Punjab-government scheme information, with details intended to help users understand a scheme's purpose and requirements.

### ⚖️ Rule-Based Eligibility Guidance
A deterministic eligibility engine evaluates configured scheme rules and can explain the conditions it checks. Results depend on the accuracy and completeness of the scheme data and the information supplied by the user; they are not official eligibility decisions.

### 💬 Multilingual Assistant
An assistant interface supports public-service questions in English, Hindi, and Punjabi. When the Gemini provider is configured, it can provide AI-assisted guidance; fallback behavior depends on the available local scheme data and current implementation.

### 📄 Document Centre
Explore document information associated with public-service processes and schemes. Always confirm the latest requirements with the relevant official authority.

### ✅ Personal Checklists and Application Tracking
Where enabled in the current deployment, user-facing checklist and tracking features can help people organize their own preparation and records. A user-entered status must not be interpreted as an official government status.

### 🔐 Accounts and Administration
Authentication and administrative capabilities support access to applicable user and management features. Their availability depends on the deployed configuration and permissions.

> Features and data may evolve. Refer to the current application and source code for the exact functionality enabled in a given deployment.

## How It Works

```mermaid
flowchart TD
    U[Citizen] --> FE[React + Vite Frontend]
    FE -->|REST API / JWT where required| BE[FastAPI Backend]

    BE --> AUTH[Authentication and Profile Services]
    BE --> SCHEME[Scheme and Document Services]
    BE --> ELIG[Deterministic Eligibility Engine]
    BE --> ASSIST[AI Assistant and Fallback]

    AUTH --> DB[(Relational Database)]
    SCHEME --> DB
    ELIG --> DB
    ASSIST --> DB
    ASSIST -. When configured .-> GEMINI[Google Gemini API]
```

The frontend communicates with the backend through API requests. The backend handles application logic, authentication, scheme data, eligibility evaluation, and assistant requests. AI-generated guidance should not override deterministic eligibility rules or substitute for official scheme decisions.

## Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 18 | User interface and interactive views |
| Frontend tooling | Vite | Development server and production build |
| Backend | Python, FastAPI | REST API and application services |
| ORM | SQLAlchemy | Relational data access |
| Database | PostgreSQL | Production relational database when configured |
| Local development | SQLite | Optional fallback if enabled by configuration |
| Authentication | JWT and password hashing | Authenticated access and credential protection |
| AI integration | Google Gemini | Optional AI-assisted responses |
| Testing | Pytest and browser test tooling | Automated backend and browser checks |

The exact dependencies and supported versions are defined by the project manifests and configuration files.

## Repository Structure

```text
CiviConnect/
├── backend/
│   ├── app/                 # API, models, services and configuration
│   ├── tests/               # Backend tests
│   ├── alembic/             # Database migration files, if configured
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/                 # React application source
│   ├── public/              # Static assets
│   └── package.json         # Frontend scripts and dependencies
├── .env.example             # Example environment configuration
├── start_backend.ps1        # Backend startup helper (Windows)
├── start_frontend.ps1       # Frontend startup helper (Windows)
├── test_browser_suite.mjs   # Browser test entry point, if present
└── README.md
```

This is a high-level guide. Directory names and available scripts should be checked against the current branch.

## Getting Started

### Prerequisites

Install the tools required by the repository:

- Python 3.10 or a version supported by the backend dependencies.
- Node.js and npm versions supported by the frontend.
- Git.
- PostgreSQL for a PostgreSQL-backed local setup, if desired.

### 1. Get the Project

```powershell
git clone https://github.com/Akshatsingla4308/CiviConnect.git
Set-Location CiviConnect
```

### 2. Configure the Backend

Create and activate a virtual environment:

```powershell
python -m venv backend\venv
& "backend\venv\Scripts\Activate.ps1"
```

Install backend dependencies:

```powershell
python -m pip install -r backend\requirements.txt
```

If the repository includes `.env.example`, create your local environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` locally and configure the values required by the current application. Common settings may include:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection string |
| `GEMINI_API_KEY` | Optional Google Gemini API key |
| `GEMINI_MODEL` | Configured Gemini model |
| `APP_ENV` | Application environment |
| `FRONTEND_ORIGINS` | Allowed frontend origins, if supported by the current configuration |

Check the backend configuration and `.env.example` for the complete, authoritative variable list. Do not commit `.env` or share secrets in issue reports.

### 3. Configure the Database

For a PostgreSQL setup, create a local database and set `DATABASE_URL` to the connection string expected by the application. For example:

```ini
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@localhost:5432/civiconnect_db
```

Replace the example username and password with your own local credentials. Do not paste real credentials into the README, source control, screenshots, or public issue trackers.

If SQLite fallback is supported and explicitly enabled by the current configuration, it may be used for local development. Do not rely on a development fallback for production data.

Before running migrations, inspect the repository's Alembic configuration and follow the migration workflow currently supported by the project. Never reset or recreate a production database to resolve a migration problem.

### 4. Start the Backend

From the repository root, use the project's startup helper if it is present:

```powershell
.\start_backend.ps1
```

Alternatively, follow the backend's documented entry point and environment setup.

When the server is running, the API may expose these endpoints if enabled by the application:

- API documentation: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/api/system/health`

Do not expose local development servers or diagnostic endpoints publicly without appropriate configuration.

### 5. Start the Frontend

Open a second PowerShell terminal in the repository root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Vite commonly serves the local frontend at `http://127.0.0.1:5173`; use the address printed by the terminal if it differs.

If the repository's root startup helper is configured for your environment, you may use it instead.

### 6. Build the Frontend

```powershell
Set-Location frontend
npm run build
```

The generated output is normally placed in `frontend/dist/`.

## Running Tests

Run the checks supported by the current repository. For example:

### Backend tests

From the repository root, with the project's Python environment activated:

```powershell
python -m pytest backend/tests
```

### Browser tests

If `test_browser_suite.mjs` is present and its required services and browser dependencies are installed, start the backend and frontend, then run:

```powershell
node --experimental-websocket test_browser_suite.mjs
```

### Production build

```powershell
Set-Location frontend
npm run build
```

Test results depend on the current code, environment, database, and installed dependencies. Run the commands locally to confirm the current state; previous test results should not be treated as a guarantee that every workflow works in production.

## AI Configuration

CiviConnect can integrate with Google Gemini when the backend is configured with a valid API key and supported model.

1. Create an API key through [Google AI Studio](https://aistudio.google.com/).
2. Store the key in the backend's local environment or deployment secret configuration.
3. Restart or redeploy the backend as required.

Never place an AI API key in frontend source code or commit it to Git.

If the AI provider is unavailable or its quota is exhausted, the application may use its configured database-backed fallback. A fallback response is not the same as a live AI-generated answer. Scheme relevance and accuracy depend on the quality of the underlying data and retrieval logic.

## Deployment Notes

### Frontend
Deploy the Vite frontend using the hosting configuration appropriate to the repository and hosting provider. Confirm that client-side routes support direct navigation and page refresh.

### Backend
Deploy the FastAPI service with the correct start command, dependency installation, environment variables, and health checks.

### Database
Use PostgreSQL for production if that is the configured deployment architecture. Apply schema changes through a safe, reviewed migration process. Preserve existing production records and avoid destructive startup seeding.

### Production checklist
- Configure all required secrets through the hosting provider's environment settings.
- Set explicit, trusted frontend origins for CORS.
- Ensure the database is reachable and backed up.
- Confirm administrator provisioning is secure and does not rely on a publicly known default password.
- Verify authentication, authorization, AI fallback, and critical user workflows after deployment.
- Check logs for errors without exposing credentials or personal information.

## Security and Privacy

Security matters because public-service applications may handle personal account information.

- Never commit `.env`, API keys, passwords, database credentials, or JWT secrets.
- Use unique, strong passwords and protect administrator accounts.
- Enforce authorization checks for user-specific records.
- Validate uploaded files and restrict access to private documents if document storage is enabled.
- Avoid logging passwords, tokens, identity numbers, or private document contents.
- Keep dependencies and deployment configuration updated.
- Verify scheme information and official links before relying on them.

If you discover a vulnerability, avoid publishing exploitable details or secrets in a public issue. Use a private reporting channel if one is provided by the project maintainer.

## Data Sources and Limitations

CiviConnect is intended to help users navigate public-service information. Scheme conditions, benefits, deadlines, required documents, and application procedures can change.

- Verify current requirements with the relevant official government authority.
- Eligibility guidance is informational and depends on the completeness and correctness of the configured rules.
- AI responses may be incomplete or incorrect and should not be treated as legal advice or an official government decision.
- CiviConnect does not itself grant benefits, submit applications, or guarantee approval unless an explicitly authorized integration is implemented and clearly documented.

## Contributing

Contributions that improve accessibility, language support, data quality, security, testing, and usability are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the relevant tests and frontend build.
5. Submit a pull request describing the change and its verification.

Please avoid including secrets, private user data, or unverified government-scheme claims in contributions.

## License

Check the repository for a `LICENSE` file to determine the project's licensing terms. No license is asserted here unless a valid license file is present.

---

<div align="center">

**CiviConnect — making public-service information easier to navigate.**

*Independent platform · Multilingual access · Informed citizens*

</div>

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Starting CiviConnect Backend Server    " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$VenvPython = Join-Path $BackendDir "venv\Scripts\python.exe"
$RootEnv = Join-Path $RootDir ".env"

# 1. Ensure Python virtual environment exists
if (-not (Test-Path $VenvPython)) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv (Join-Path $BackendDir "venv")
    & $VenvPython -m pip install --upgrade pip
    & $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")
}

# 2. Ensure root .env exists
if (-not (Test-Path $RootEnv)) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item (Join-Path $RootDir ".env.example") $RootEnv
}

# 3. Pre-flight PostgreSQL verification check
Write-Host "Verifying database connectivity..." -ForegroundColor Cyan
Set-Location $BackendDir
$env:PYTHONPATH = $BackendDir

$CheckDbScript = @"
import sys
sys.path.insert(0, r'$BackendDir')
from app.config import settings
from app.database import setup_database_engine, get_database_status

try:
    setup_database_engine()
    status = get_database_status()
    if status.get('is_connected') and status.get('active_dialect') == 'postgresql':
        print('SUCCESS: Connected to PostgreSQL database (civiconnect_db)')
        sys.exit(0)
    elif status.get('fallback_active'):
        print('WARNING: Running in SQLite fallback mode.')
        sys.exit(0)
    else:
        print('ERROR: ' + str(status.get('error_message') or 'Connection failed'))
        sys.exit(1)
except Exception as e:
    print('ERROR: ' + str(e))
    sys.exit(1)
"@

$DbCheckResult = & $VenvPython -c $CheckDbScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database Pre-flight Check Failed:" -ForegroundColor Red
    Write-Host $DbCheckResult -ForegroundColor Yellow
    Write-Host "Please ensure PostgreSQL service is running and DATABASE_URL in .env is valid." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host $DbCheckResult -ForegroundColor Green
}

# 4. Start Uvicorn
Write-Host "FastAPI listening at http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Interactive OpenAPI Docs at http://127.0.0.1:8000/docs" -ForegroundColor Cyan
& $VenvPython -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

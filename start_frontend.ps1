Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Starting CiviConnect Frontend Dev      " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Set-Location (Join-Path $PSScriptRoot "frontend")
if (-not (Test-Path (Join-Path $PSScriptRoot "frontend\node_modules"))) {
    Write-Host "Installing node modules..." -ForegroundColor Yellow
    npm install
}

Write-Host "Vite Dev Server starting at http://127.0.0.1:5173" -ForegroundColor Cyan
npm run dev -- --host 127.0.0.1 --port 5173

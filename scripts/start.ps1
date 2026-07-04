$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "backend\.env")) {
  Write-Host "[错误] 未找到 backend\.env" -ForegroundColor Red
  Write-Host "请先复制 backend\.env.example 为 backend\.env 并填入 API Key"
  exit 1
}

if (-not (Test-Path "backend\node_modules")) {
  npm install --prefix backend
}

if (-not (Test-Path "frontend\node_modules")) {
  npm install --prefix frontend
}

if (-not (Test-Path "node_modules")) {
  npm install
}

Write-Host "启动前后端..." -ForegroundColor Cyan
Write-Host "后端: http://localhost:3001"
Write-Host "前端: http://localhost:5173"
npm run dev

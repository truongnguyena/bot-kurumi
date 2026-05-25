param(
    [string]$App = "bot-kurumi",
    [string]$AppstatePath = "appstate.json",
    [string]$AdminKey = "2803"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$appstateFile = Join-Path $root $AppstatePath

if (-not (Test-Path $appstateFile)) {
    Write-Host "Khong tim thay: $appstateFile" -ForegroundColor Red
    Write-Host "Dat file cookie Facebook (appstate.json) cung thu muc voi index.js"
    exit 1
}

Write-Host "App Fly: $App" -ForegroundColor Cyan
Write-Host "Doc appstate..." -ForegroundColor Yellow

$raw = Get-Content $appstateFile -Raw -Encoding UTF8
# Kiem tra JSON hop le
$null = $raw | ConvertFrom-Json

# Fly secrets: 1 dong, khong xuong dong
$compact = ($raw | ConvertFrom-Json | ConvertTo-Json -Compress -Depth 50)

Write-Host "Set BOT_ADMIN_KEY..." -ForegroundColor Green
fly secrets set "BOT_ADMIN_KEY=$AdminKey" -a $App

Write-Host "Set APPSTATE_JSON (co the mat 10-30s)..." -ForegroundColor Green
fly secrets set "APPSTATE_JSON=$compact" -a $App

Write-Host "Restart app..." -ForegroundColor Green
fly apps restart $App

Write-Host ""
Write-Host "Xong! Xem log:" -ForegroundColor Green
Write-Host "  fly logs -a $App"

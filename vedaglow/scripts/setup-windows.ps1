# VEDAGLOW – one-time setup on Windows. Right-click -> "Run with PowerShell", or:  powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
# Run it from the vedaglow folder. It installs nothing outside this folder and never contacts your live shop.
$ErrorActionPreference = "Stop"
function Need($cmd, $hint) { if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { Write-Host "X $cmd not found. $hint" -ForegroundColor Red; exit 1 } else { Write-Host "OK $cmd found" -ForegroundColor Green } }
Need node "Install Node.js 20 or 22 LTS from https://nodejs.org (free), then run this again."
Need git  "Install Git from https://git-scm.com (free), then run this again."
$v = [int]((node -v).TrimStart("v").Split(".")[0]); if ($v -lt 20) { Write-Host "X Node $v is too old. Install Node 20 or 22 LTS." -ForegroundColor Red; exit 1 }
if (-not (Test-Path package.json)) { Write-Host "X Run this inside the vedaglow folder (the one with package.json)." -ForegroundColor Red; exit 1 }
Write-Host "Installing packages (3-6 minutes the first time)..."; npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local; Write-Host "Created .env.local. Open it in Notepad and paste the TEST Supabase values (NOT the live ones)." -ForegroundColor Yellow }
else { Write-Host "OK .env.local already exists (left untouched)" -ForegroundColor Green }
Write-Host "`nNext:  1) edit .env.local   2) npm run check-env   3) npm run dev:local   4) open http://localhost:3000" -ForegroundColor Cyan

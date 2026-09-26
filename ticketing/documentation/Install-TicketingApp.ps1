#Requires -Version 5.1
<#
  ITSD Ticketing System - Windows install/setup script.
  Run via install.bat (recommended), or directly as Administrator:
    powershell -ExecutionPolicy Bypass -File Install-TicketingApp.ps1
#>

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Text)
    Write-Host ""
    Write-Host "==> $Text" -ForegroundColor Cyan
}

function Set-EnvValue {
    param([string]$Path, [string]$Key, [string]$Value)
    $content = Get-Content -Path $Path -Raw
    $pattern = "(?m)^#?\s*$Key=.*$"
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, "$Key=$Value")
    } else {
        $content = $content.TrimEnd() + "`r`n$Key=$Value`r`n"
    }
    Set-Content -Path $Path -Value $content -NoNewline
}

$documentationDir = $PSScriptRoot
$repoRoot          = Split-Path -Parent $documentationDir
$backendDir        = Join-Path $repoRoot "webapp\backend"
$frontendDir       = Join-Path $repoRoot "webapp\frontend"

if (-not (Test-Path $backendDir) -or -not (Test-Path $frontendDir)) {
    Write-Host "Could not find webapp\backend / webapp\frontend next to this script." -ForegroundColor Red
    Write-Host "Keep this script inside the ticketing\documentation folder of the cloned repository." -ForegroundColor Red
    exit 1
}

Write-Step "Checking for Node.js"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Node.js not found - installing Node.js LTS via winget..."
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        # Refresh PATH in this session so 'node'/'npm' are usable without reopening the window.
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath    = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $env:Path    = "$machinePath;$userPath"
    } else {
        Write-Host "Node.js is not installed and winget is not available on this machine." -ForegroundColor Red
        Write-Host "Install Node.js LTS manually from https://nodejs.org/ and re-run this script." -ForegroundColor Red
        exit 1
    }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js installation could not be verified. Close this window, open a new admin terminal, and re-run install.bat." -ForegroundColor Red
    exit 1
}
node -v

$originalLocation = Get-Location
try {
    Write-Step "Installing backend dependencies (npm install)"
    Set-Location $backendDir
    npm install

    Write-Step "Configuring backend\.env"
    $envExample = Join-Path $backendDir ".env.example"
    $envFile    = Join-Path $backendDir ".env"
    if (-not (Test-Path $envFile)) {
        Copy-Item $envExample $envFile
    }

    $sessionSecret = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    Set-EnvValue -Path $envFile -Key "SESSION_SECRET" -Value $sessionSecret
    Set-EnvValue -Path $envFile -Key "COOKIE_SECURE" -Value "false"
    Set-EnvValue -Path $envFile -Key "SERVE_FRONTEND_DIST" -Value "../frontend/dist"
    Set-EnvValue -Path $envFile -Key "MASTER_USER_PASSWORD" -Value "itsdmaster"

    Write-Host "Backend .env configured. Master account will start with the password 'itsdmaster'." -ForegroundColor Yellow
    Write-Host "You MUST log in and change it immediately after this install finishes." -ForegroundColor Yellow

    Write-Step "Applying database schema (prisma migrate deploy)"
    npx prisma migrate deploy

    Write-Step "Seeding initial data (teams, categories, master/demo accounts)"
    $env:MASTER_USER_PASSWORD = "itsdmaster"
    npm run prisma:seed

    Write-Step "Building backend (TypeScript -> dist)"
    npm run build

    Write-Step "Installing frontend dependencies (npm install)"
    Set-Location $frontendDir
    npm install

    Write-Step "Building frontend (production bundle)"
    npm run build

    Write-Step "Configuring Windows Firewall (allow inbound TCP 4000)"
    $ruleName = "ITSD Ticketing (TCP 4000)"
    if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4000 | Out-Null
    }

    Write-Step "Starting the ticketing server"
    Set-Location $backendDir
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm start" -WorkingDirectory $backendDir -WindowStyle Normal

    Start-Sleep -Seconds 4
    Start-Process "http://localhost:4000/"

    Write-Step "Done"
    Write-Host "Login page opened in your browser: http://localhost:4000/" -ForegroundColor Green
    Write-Host "Master login: admin.master@company.example / itsdmaster (change on first login)." -ForegroundColor Green
    Write-Host "The server is running in the separate 'npm start' window - keep it open." -ForegroundColor Green
}
finally {
    Set-Location $originalLocation
}

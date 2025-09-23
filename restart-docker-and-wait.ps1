<#!
.SYNOPSIS
  Restart Docker Desktop (Windows), ensure Linux engine, and wait until Docker is ready.
.DESCRIPTION
  1. Attempts graceful shutdown of Docker Desktop.
  2. (Optional) Performs WSL shutdown if requested.
  3. Starts Docker Desktop minimized.
  4. Switches to Linux engine (if not already) using DockerCli.exe -SwitchLinuxEngine.
  5. Polls `docker version` until success or timeout.
  6. Optionally runs a quick validation container (hello-world / alpine uname -a).
.PARAMETER TimeoutSeconds
  Total seconds to wait for Docker to become ready (default 300).
.PARAMETER WslShutdown
  If supplied, will run `wsl --shutdown` before starting Docker (adds a few seconds).
.PARAMETER QuickTest
  If supplied, runs a `docker run --rm hello-world` after readiness check.
.EXAMPLE
  .\restart-docker-and-wait.ps1 -WslShutdown -QuickTest -TimeoutSeconds 240
.NOTES
  Requires: PowerShell run as a user with rights to start Docker Desktop.
#>
param(
  [int]$TimeoutSeconds = 300,
  [switch]$WslShutdown,
  [switch]$QuickTest
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "[STEP] $msg" -ForegroundColor Cyan }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Gray }
function Write-Ok($msg) { Write-Host "[ OK ] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

$dockerDesktopPath = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
$dockerCli = "C:\\Program Files\\Docker\\Docker\\DockerCli.exe"

if (-not (Test-Path $dockerDesktopPath)) { Write-Err "Docker Desktop not found at $dockerDesktopPath"; exit 1 }
if (-not (Test-Path $dockerCli)) { Write-Err "DockerCli.exe not found at $dockerCli"; exit 1 }

Write-Step "Stopping existing Docker Desktop processes (if any)"
Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue | ForEach-Object { $_.CloseMainWindow() | Out-Null }
Start-Sleep -Seconds 3
Get-Process -Name "Docker" -ErrorAction SilentlyContinue | ForEach-Object { Write-Info "Killing lingering process: $($_.Name)"; $_ | Stop-Process -Force }

if ($WslShutdown) {
  Write-Step "Shutting down WSL (this resets Linux VM state)"
  try { wsl --shutdown; Write-Ok "WSL shutdown complete" } catch { Write-Warn "WSL shutdown had an issue: $($_.Exception.Message)" }
}

Write-Step "Switching to Linux engine (idempotent)"
try {
  & $dockerCli -SwitchLinuxEngine | Out-Null
  Write-Ok "SwitchLinuxEngine invoked"
} catch {
  Write-Warn "SwitchLinuxEngine failed or already Linux: $($_.Exception.Message)"
}

Write-Step "Starting Docker Desktop minimized"
Start-Process -FilePath $dockerDesktopPath -WindowStyle Minimized | Out-Null

Write-Step "Waiting for Docker engine to become ready (timeout ${TimeoutSeconds}s)"
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$ready = $false
while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
  $ver = & docker version 2>$null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 3
}
$stopwatch.Stop()

if (-not $ready) { Write-Err "Docker did not become ready within $TimeoutSeconds seconds"; exit 2 }
Write-Ok "Docker is ready after $([int]$stopwatch.Elapsed.TotalSeconds)s"

Write-Step "Current docker context"
try { docker context ls } catch { Write-Warn "Could not list contexts: $($_.Exception.Message)" }

Write-Step "Verifying 'docker info'"
try { docker info --format '{{json .ServerVersion}}' } catch { Write-Warn "docker info had a warning: $($_.Exception.Message)" }

if ($QuickTest) {
  Write-Step "Running hello-world quick test"
  try {
    docker run --rm hello-world | Write-Info
    Write-Ok "hello-world ran successfully"
  } catch {
    Write-Warn "hello-world test failed: $($_.Exception.Message)"
  }
}

Write-Ok "Done. You can now run: heroku container:login; heroku container:push web; heroku container:release web"

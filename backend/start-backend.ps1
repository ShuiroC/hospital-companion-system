param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$jarPath = Join-Path $scriptDir "target\companion-backend-0.0.1-SNAPSHOT.jar"
$outLog = Join-Path $scriptDir "backend-live.out.log"
$errLog = Join-Path $scriptDir "backend-live.err.log"

Write-Host "Building backend jar..."
mvn -DskipTests package | Out-Host

if (-not (Test-Path $jarPath)) {
  throw "Jar not found: $jarPath"
}

Write-Host "Stopping process on port $Port if exists..."
$listenLine = netstat -ano -p tcp | Select-String ":$Port " | Select-String "LISTENING" | Select-Object -First 1
if ($listenLine) {
  $parts = ($listenLine.ToString() -replace "\s+", " ").Trim().Split(" ")
  $targetPid = $parts[-1]
  if ($targetPid -and $targetPid -ne "0") {
    Stop-Process -Id ([int]$targetPid) -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
  }
}

Write-Host "Starting backend..."
$proc = Start-Process -FilePath "java" `
  -ArgumentList "-jar `"$jarPath`"" `
  -WorkingDirectory $scriptDir `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -PassThru

Start-Sleep -Seconds 2

if ($proc.HasExited) {
  throw "Backend process exited immediately. Check logs: $outLog / $errLog"
}

Write-Host "Backend started."
Write-Host "PID: $($proc.Id)"
Write-Host "URL: http://localhost:$Port"
Write-Host "OUT: $outLog"
Write-Host "ERR: $errLog"

# update_network.ps1
# Detects the active Wi-Fi IPv4 address, updates asterisk_config/pjsip.conf, and reloads Asterisk.

$adapter = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "169.254*" } | Select-Object -First 1

if (-not $adapter) {
    $adapter = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | 
        Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { $_.IPAddress -notlike "169.254*" -and $_.IPAddress -notlike "127.*" } | 
        Select-Object -First 1
}

if (-not $adapter) {
    Write-Error "Could not find an active IPv4 network adapter. Please make sure you are connected to Wi-Fi."
    exit 1
}

$newIp = $adapter.IPAddress
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Detected current Wi-Fi IP: $newIp" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

$pjsipPath = Join-Path $PSScriptRoot "..\asterisk_config\pjsip.conf"
if (-not (Test-Path $pjsipPath)) {
    Write-Error "pjsip.conf not found at $pjsipPath"
    exit 1
}

$content = Get-Content $pjsipPath -Raw

# Replace external_media_address, external_signaling_address, and media_address
$updated = $content -replace 'external_media_address=.*', "external_media_address=$newIp"
$updated = $updated -replace 'external_signaling_address=.*', "external_signaling_address=$newIp"
$updated = $updated -replace 'media_address=.*', "media_address=$newIp"

Set-Content -Path $pjsipPath -Value $updated -NoNewline
Write-Host "Updated asterisk_config/pjsip.conf with IP: $newIp" -ForegroundColor Green

# Check if Docker container is running and reload
$containerRunning = docker ps -q -f "name=sh105-asterisk"
if ($containerRunning) {
    Write-Host "Reloading Asterisk PJSIP..." -ForegroundColor Cyan
    docker exec sh105-asterisk asterisk -rx "pjsip reload"
    Write-Host "Asterisk reloaded successfully!" -ForegroundColor Green
} else {
    Write-Warning "Container 'sh105-asterisk' is not currently running. Start it when ready."
}

Write-Host "`n--> ON YOUR MOBILE PHONE (Linphone):" -ForegroundColor Yellow
Write-Host "    Domain / Server: $newIp" -ForegroundColor White
Write-Host "    Username:        1001" -ForegroundColor White
Write-Host "    Password:        sh105pass" -ForegroundColor White
Write-Host "    Transport:       UDP" -ForegroundColor White
Write-Host "`n--> FOR API / FRONTEND CALLS:" -ForegroundColor Yellow
Write-Host "    Base URL:        http://${newIp}:8000" -ForegroundColor White

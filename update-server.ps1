# Quick script to update server with latest code
# Updates code from GitHub and restarts PM2

$REMOTE_HOST = "65.20.84.140"
$REMOTE_USER = "deployer"
$REMOTE_DIR = "~/Ads-Management-Fresh"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Update Server from GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/3] Pulling latest code from GitHub..." -ForegroundColor Cyan
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR} && git pull origin master"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git pull failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Code updated" -ForegroundColor Green

Write-Host "`n[2/3] Installing dependencies..." -ForegroundColor Cyan
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR}/backend && npm install --production 2>&1 | tail -10"
Write-Host "OK: Dependencies updated" -ForegroundColor Green

Write-Host "`n[3/3] Restarting PM2..." -ForegroundColor Cyan
ssh "${REMOTE_USER}@${REMOTE_HOST}" "pm2 restart all"

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: PM2 restarted" -ForegroundColor Green
} else {
    Write-Host "WARNING: PM2 restart had issues" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Server Updated Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nPM2 Status:" -ForegroundColor Cyan
ssh "${REMOTE_USER}@${REMOTE_HOST}" "pm2 status"

Write-Host "`nTo check logs:" -ForegroundColor Cyan
Write-Host "  ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 logs'" -ForegroundColor Gray
Write-Host ""

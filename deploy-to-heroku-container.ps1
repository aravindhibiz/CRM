# Heroku Container Deploy Script
# Successfully resolved "unsupported" registry error with BuildKit attestation disabling

Write-Host "🚀 Starting Heroku container deployment..." -ForegroundColor Green

# 1. Build frontend assets
Write-Host "📦 Building frontend assets..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Frontend build failed" -ForegroundColor Red; exit 1 }

# 2. Build container with BuildKit (but disable attestations that cause 'unsupported')
Write-Host "🐳 Building container image..." -ForegroundColor Cyan
$env:DOCKER_BUILDKIT="1"
docker buildx build --platform linux/amd64 --provenance=false --sbom=false -t registry.heroku.com/hibiz-tr-rocket-dev/web --load .
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Container build failed" -ForegroundColor Red; exit 1 }

# 3. Push to Heroku Container Registry
Write-Host "📤 Pushing to Heroku registry..." -ForegroundColor Cyan
docker push registry.heroku.com/hibiz-tr-rocket-dev/web
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Container push failed" -ForegroundColor Red; exit 1 }

# 4. Release to production
Write-Host "🚀 Releasing to production..." -ForegroundColor Cyan
heroku container:release web -a hibiz-tr-rocket-dev
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Container release failed" -ForegroundColor Red; exit 1 }

# 5. Show logs and open app
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📊 Opening app and showing recent logs..." -ForegroundColor Cyan
heroku open -a hibiz-tr-rocket-dev
Start-Sleep -Seconds 2
heroku logs --tail -a hibiz-tr-rocket-dev --num 20

Write-Host "`n🎉 Deployment successful! App is live at: https://hibiz-tr-rocket-dev-05c28b6796db.herokuapp.com" -ForegroundColor Green
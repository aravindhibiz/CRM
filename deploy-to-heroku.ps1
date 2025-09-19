# SalesFlow Pro - Heroku Deployment Script
Write-Host ""
Write-Host "========================================"
Write-Host "   SalesFlow Pro - Heroku Deployment"
Write-Host "========================================"
Write-Host ""

# Step 1: Check if Heroku CLI is installed
Write-Host "Checking Heroku CLI installation..."
try {
    heroku --version
    Write-Host "✅ Heroku CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Please install from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

# Step 2: Login to Heroku
Write-Host ""
Write-Host "Step 1: Login to Heroku"
heroku login

# Step 3: Create Heroku App
Write-Host ""
Write-Host "Step 2: Create Heroku App"
$APP_NAME = Read-Host "Enter your desired app name (e.g., salesflow-pro-crm)"
heroku create $APP_NAME

# Step 4: Set Environment Variables
Write-Host ""
Write-Host "Step 3: Setting Environment Variables"
Write-Host "Setting Supabase configuration..." -ForegroundColor Yellow

heroku config:set VITE_SUPABASE_URL=https://urckjqdnsdvdastclwsk.supabase.co
heroku config:set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY2tqcWRuc2R2ZGFzdGNsd3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mjg3MzIsImV4cCI6MjA3MDIwNDczMn0.GWxgSEIVpEkJLL4ZJLvd2_kLPVBl1pFs9AYoUX5Ugcs
heroku config:set VITE_SUPABASE_PROJECT_REF=urckjqdnsdvdastclwsk

Write-Host "Setting Gemini AI configuration..." -ForegroundColor Yellow
heroku config:set VITE_GEMINI_API_KEY=AIzaSyA_8lF-Ke32jvw6EKSvQKGsXibc8amKEhk

Write-Host "Setting app configuration..." -ForegroundColor Yellow
heroku config:set VITE_APP_NAME="SalesFlow Pro"
heroku config:set VITE_APP_VERSION=0.1.0
heroku config:set NODE_ENV=production
heroku config:set VITE_API_BASE_URL=https://$APP_NAME.herokuapp.com/api

# Step 5: Deploy
Write-Host ""
Write-Host "Step 4: Deploying to Heroku" -ForegroundColor Yellow
Write-Host "Pushing to Heroku..."
git push heroku feature/heroku-deploy:main

# Step 6: Open app
Write-Host ""
Write-Host "Step 5: Opening your app" -ForegroundColor Yellow
heroku open

Write-Host ""
Write-Host "========================================"
Write-Host "   Deployment Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Your app should now be live at:" -ForegroundColor Green
Write-Host "https://$APP_NAME.herokuapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful endpoints:" -ForegroundColor Green
Write-Host "Health check: https://$APP_NAME.herokuapp.com/health" -ForegroundColor Cyan
Write-Host "API info: https://$APP_NAME.herokuapp.com/api/info" -ForegroundColor Cyan
Write-Host ""

# Show logs
$showLogs = Read-Host "Would you like to view the app logs? (y/n)"
if ($showLogs -eq "y" -or $showLogs -eq "Y") {
    heroku logs --tail
}
@echo off
echo.
echo ========================================
echo    SalesFlow Pro - Heroku Deployment
echo ========================================
echo.

echo Step 1: Login to Heroku
heroku login
echo.

echo Step 2: Create Heroku App
set /p APP_NAME="Enter your desired app name (e.g., salesflow-pro-crm): "
heroku create %APP_NAME%
echo.

echo Step 3: Setting Environment Variables
echo Setting Supabase configuration...
heroku config:set VITE_SUPABASE_URL=https://urckjqdnsdvdastclwsk.supabase.co
heroku config:set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY2tqcWRuc2R2ZGFzdGNsd3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mjg3MzIsImV4cCI6MjA3MDIwNDczMn0.GWxgSEIVpEkJLL4ZJLvd2_kLPVBl1pFs9AYoUX5Ugcs
heroku config:set VITE_SUPABASE_PROJECT_REF=urckjqdnsdvdastclwsk

echo Setting Gemini AI configuration...
heroku config:set VITE_GEMINI_API_KEY=AIzaSyA_8lF-Ke32jvw6EKSvQKGsXibc8amKEhk

echo Setting app configuration...
heroku config:set VITE_APP_NAME="SalesFlow Pro"
heroku config:set VITE_APP_VERSION=0.1.0
heroku config:set NODE_ENV=production
heroku config:set VITE_API_BASE_URL=https://%APP_NAME%.herokuapp.com/api

echo.
echo Step 4: Deploying to Heroku
echo Pushing to Heroku...
git push heroku feature/heroku-deploy:main

echo.
echo Step 5: Opening your app
heroku open

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Your app should now be live at:
echo https://%APP_NAME%.herokuapp.com
echo.
echo Health check: https://%APP_NAME%.herokuapp.com/health
echo API info: https://%APP_NAME%.herokuapp.com/api/info
echo.
pause
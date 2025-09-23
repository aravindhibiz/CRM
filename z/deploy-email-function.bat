@echo off
echo Setting up and deploying Supabase Edge Function for email with Gemini

echo.
echo 1. Make sure Supabase CLI is installed
echo    npm install -g supabase

echo.
echo 2. Setting secrets for the function...
echo supabase secrets set GEMINI_API_KEY="AIzaSyA_8lF-Ke32jvw6EKSvQKGsXibc8amKEhk" --env-file=false

echo.
echo 3. Setting Resend API key...
echo supabase secrets set RESEND_API_KEY="your-resend-api-key" --env-file=false

echo.
echo 4. Deploying the send-email function...
echo cd supabase
echo supabase functions deploy send-email

echo.
echo 5. Testing the function locally first:
cd supabase
echo Starting local server...
echo supabase functions serve --no-verify-jwt --env-file=.env.local

echo.
echo ==============================================
echo.
echo FOR MANUAL DEPLOYMENT WITH DIRECT CURL TEST:
echo.
echo 1. Test the function with:
echo.
echo curl -X POST http://localhost:54321/functions/v1/send-email ^
echo -H "Content-Type: application/json" ^
echo -d "{\"to\":\"test@example.com\",\"subject\":\"Test Email\",\"body\":\"This is a test email content to check if Gemini is enhancing properly.\"}"
echo.
echo 2. If working properly, deploy with:
echo.
echo cd supabase
echo supabase functions deploy send-email
echo.
echo 3. Test the deployed function:
echo.
echo curl -X POST https://urckjqdnsdvdastclwsk.functions.supabase.co/send-email ^
echo -H "Content-Type: application/json" ^
echo -d "{\"to\":\"test@example.com\",\"subject\":\"Test Email\",\"body\":\"This is a test email content to check if Gemini is enhancing properly.\"}"

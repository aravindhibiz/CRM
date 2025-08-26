# Getting a Resend API Key

## Step 1: Sign up for Resend
1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" and create an account
3. Verify your email address

## Step 2: Create an API Key
1. Go to your Resend Dashboard
2. Click on "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name like "CRM-Rocket"
5. Copy the API key (starts with "re_")

## Step 3: Update Supabase Secrets
Once you have your API key, run this command:

```bash
cd "d:\current projects\CRM-Rocket"
npx supabase secrets set RESEND_API_KEY="your_actual_api_key_here"
```

## Step 4: Test the Function
1. Open the test-email-function.html file in your browser
2. Fill in the form and click "Send Email"
3. Check your email for the enhanced content

## Current Status
- ✅ Gemini API Key: Set and working
- ⚠️ Resend API Key: Using demo key (needs replacement)
- ✅ Function Deployed: Successfully deployed to Supabase

## Note
For testing without a Resend account, the function will still work but emails might not be delivered. The Gemini enhancement will still be visible in the function response.

# Gemini AI Email Generation Setup

This guide explains how to set up and use the new AI-powered email generation feature in your CRM.

## Features Added

### 1. **Generate Email Button**
- Added to the email compose modal
- Purple gradient button with sparkles icon
- Generates professional email content using Gemini AI

### 2. **Content Preview Modal**
- Shows generated subject and body content
- Options to "Use This Content" or "Discard"
- Preserves user's existing content if they discard

### 3. **Smart Context Generation**
- **Enhancement Mode**: Improves existing subject/body while maintaining original intent
- **Template Mode**: Creates professional emails from scratch when form is empty
- Uses contact information (name, company) for personalized content
- Generates professional, CRM-appropriate content with proper business etiquette

## Setup Instructions

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the generated key

### 2. Configure Environment Variables
Add your Gemini API key to both `.env` and `.env.local` files:

```bash
# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Important**: Replace `your_gemini_api_key_here` with your actual API key.

### 3. Restart Development Server
After adding the API key, restart your development server:
```bash
npm run dev
```

## How to Use

### 1. **Open Email Compose Modal**
- Navigate to contact management
- Click "Send Email" on any contact

### 2. **Two Generation Modes**

#### **Enhancement Mode** (with existing content):
1. Type your subject and/or body content first
2. Click the purple "Generate Email" button
3. Gemini will enhance and improve your existing content
4. Review the enhanced version in the preview modal

#### **Template Mode** (empty form):
1. Click the purple "Generate Email" button without typing anything
2. Gemini will create a complete professional email template
3. Content will be personalized using the contact's information
4. Review the generated template in the preview modal

### 3. **Review and Apply**
- Click "Use This Content" to apply the generated content to your email form
- Or click "Discard" to keep your original content
- Edit the generated content as needed before sending

### 4. **Send Email**
- Generated content becomes your email content
- Uses the existing email infrastructure (Supabase + Resend)

## Files Modified

### Frontend Changes
- `src/services/geminiService.js` - New service for Gemini API integration
- `src/pages/contact-management/components/ComposeEmailModal.jsx` - Added generation UI and logic

### Environment Configuration
- `.env` - Added VITE_GEMINI_API_KEY placeholder
- `.env.local` - Added VITE_GEMINI_API_KEY placeholder

## Technical Details

### API Integration
- Uses Gemini Pro model for text generation
- Direct API calls from frontend (secure with API key)
- Structured prompts with contact context

### UI/UX Features
- Loading states during generation
- Error handling with user feedback
- Modal-based preview system
- Gradient styling for AI features

### Security Considerations
- API key stored in environment variables
- Frontend-only integration (no backend required)
- Error handling for failed API calls

## Troubleshooting

### Common Issues
1. **"Failed to generate email content"**
   - Check if VITE_GEMINI_API_KEY is set correctly
   - Verify API key is valid and has quota
   - Check browser console for detailed errors

2. **Button not appearing**
   - Ensure development server is restarted after env changes
   - Check browser console for React errors

3. **Generated content is poor quality**
   - Add more context to existing subject/body before generating
   - The AI uses contact information and existing content as context

### Testing
You can test the integration by:
1. Opening the compose modal
2. Adding some basic subject/body text
3. Clicking "Generate Email"
4. Checking browser network tab for API calls

## Future Enhancements

Potential improvements:
- Templates for different email types (follow-up, proposal, etc.)
- Tone selection (formal, casual, persuasive)
- Integration with email templates
- Batch email generation for multiple contacts

import axios from 'axios';

// Direct Resend API implementation (for testing or if Edge Function isn't working)
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY; // Add this to your .env file
const SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || "onboarding@resend.dev"; // Use Resend's testing domain

const directEmailService = {
  sendEmail: async (emailData) => {
    console.log('Attempting to send email directly via Resend API:', emailData);
    
    try {
      // Format the request for Resend API
      const payload = {
        from: SENDER_EMAIL,
        to: emailData.to,
        subject: emailData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #333;">
            <p>Hello ${emailData.to.split('@')[0] || ''},</p>
            <div>${emailData.body}</div>
            <p style="margin-top: 20px;">Best regards,<br>CRM-Rocket Team</p>
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              Sent via CRM-Rocket
            </div>
          </div>
        `
      };

      if (emailData.cc) payload.cc = emailData.cc;
      if (emailData.bcc) payload.bcc = emailData.bcc;
      
      const response = await axios.post('https://api.resend.com/emails', payload, {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Email sent directly via Resend API:', response.data);
      return {
        success: true,
        data: response.data,
        method: 'direct'
      };
    } catch (error) {
      console.error('Error sending email via Resend API:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  testConnection: async () => {
    try {
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }
      return { success: true, message: 'Resend API key is configured' };
    } catch (error) {
      console.error('Resend API test failed:', error);
      throw error;
    }
  },

  getHealth: async () => {
    return { status: 'Direct Resend API integration' };
  },
};

export default directEmailService;

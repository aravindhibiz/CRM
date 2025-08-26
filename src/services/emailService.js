import axios from 'axios';

// Use Supabase Edge Function with Gemini and Resend
const SUPABASE_PROJECT_REF = import.meta.env.VITE_SUPABASE_PROJECT_REF || 'urckjqdnsdvdastclwsk';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_FUNCTION_URL = `https://${SUPABASE_PROJECT_REF}.functions.supabase.co/send-email`;

const emailService = {
  sendEmail: async (emailData) => {
    console.log('Attempting to send email with data:', emailData);
    console.log('Using Supabase Edge Function URL:', SUPABASE_FUNCTION_URL);
    
    try {
      const response = await axios.post(SUPABASE_FUNCTION_URL, emailData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      console.log('Email sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  },

  // Test email server connection
  testConnection: async () => {
    try {
      // We'll just do a quick check if the function URL is reachable
      const response = await axios.options(SUPABASE_FUNCTION_URL);
      return { success: true, message: 'Supabase Edge Function is available' };
    } catch (error) {
      console.error('Edge function connection test failed:', error);
      throw error;
    }
  },

  // Get server health status - not applicable for Edge Functions
  getHealth: async () => {
    return { status: 'Supabase Edge Function is not directly monitorable' };
  },
};

export default emailService;
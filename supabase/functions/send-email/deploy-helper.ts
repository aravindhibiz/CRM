// This file is a direct implementation of the Google Generative AI SDK for Supabase Edge Functions
// It provides an example of how to use the Gemini API in a Supabase Edge Function

// Import the required types
type GenerativeModel = {
  generateContent: (prompt: string) => Promise<{
    response: {
      text: () => string;
    };
  }>;
};

// Mock implementation for local testing
export const createMockGemini = () => {
  return {
    generateContent: (prompt: string) => {
      console.log(
        "LOCAL MOCK: Would call Gemini with prompt:",
        prompt.substring(0, 100) + "...",
      );

      // For testing, create a simple HTML response
      const recipient = prompt.includes("RECIPIENT:")
        ? prompt.split("RECIPIENT:")[1].split("\n")[0].trim()
        : "user";

      const content = prompt.includes("ORIGINAL CONTENT:")
        ? prompt.split("ORIGINAL CONTENT:")[1].split("\n")[0].trim()
        : "email content";

      const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Hello ${recipient.split("@")[0]},</p>
        
        <p>Thank you for your message. This is an AI-enhanced version of your email:</p>
        
        <blockquote style="border-left: 4px solid #0066cc; padding-left: 15px; margin-left: 0; color: #444;">
          ${content}
        </blockquote>
        
        <p>I hope this addresses your needs. Please let me know if you require any further information.</p>
        
        <p>Best regards,<br>CRM-Rocket Team</p>
        
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          Sent via CRM-Rocket
        </div>
      </div>`;

      return Promise.resolve({
        response: {
          text: () => html,
        },
      });
    },
  };
};

// This is a temporary implementation to help with deployment
console.log("Mock Gemini implementation loaded for deployment");

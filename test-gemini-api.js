// Test Gemini API Connection
// Run this in browser console to test the API key and connection

const testGeminiConnection = async () => {
  const GEMINI_API_KEY = 'AIzaSyA_8lF-Ke32jvw6EKSvQKGsXibc8amKEhk'; // Your API key
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Generate a simple JSON response with subject and body for a test email: {"subject": "Test Subject", "body": "Test Body"}'
          }]
        }]
      })
    });

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ Gemini API Connection Successful!');
    console.log('Response:', data);
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Generated Text:', generatedText);
    
  } catch (error) {
    console.error('❌ Gemini API Connection Failed:', error);
  }
};

// Uncomment the line below to run the test
// testGeminiConnection();

console.log('Test function loaded. Run testGeminiConnection() to test the API connection.');

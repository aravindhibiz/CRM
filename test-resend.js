// Simple Resend API test
const RESEND_API_KEY = "re_EJRhMRTz_PUbqSUbVXBk2rTQzii3Tz79C";

console.log("Testing Resend API key...");

fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "onboarding@resend.dev",
    to: "test@example.com",
    subject: "Test",
    html: "<p>Test email</p>"
  })
})
.then(response => {
  console.log("Status:", response.status);
  return response.text();
})
.then(text => {
  console.log("Response:", text);
})
.catch(error => {
  console.error("Error:", error);
});

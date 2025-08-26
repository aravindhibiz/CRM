import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// Initialize the Gemini SDK
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ||
  "AIzaSyA_8lF-Ke32jvw6EKSvQKGsXibc8amKEhk";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to generate enhanced email content
export async function generateEmailContent(
  originalSubject: string,
  originalBody: string,
  to: string,
): Promise<string> {
  try {
    const prompt = `
You are a professional email assistant. Your task is to enhance the following email while maintaining its core message and intent.
Make it friendly but professional, with proper HTML formatting optimized for business communication.

ORIGINAL SUBJECT: ${originalSubject}
RECIPIENT: ${to}
ORIGINAL CONTENT:
${originalBody}

Create a well-structured HTML email that includes:
1. A professional greeting using the recipient's email or name if it can be extracted from the email (or just "Hello" if unclear)
2. The enhanced content with proper paragraphs and formatting
3. A professional sign-off
4. A simple footer line: "Sent via CRM-Rocket"

IMPORTANT: Return ONLY the HTML content without any explanations or markdown. Include proper HTML formatting with inline CSS styles for professional appearance.
Use font-family: Arial, sans-serif; line-height: 1.5; color: #333; and other professional styling.

EXAMPLE FORMAT:
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
  <p>Hello [Name/Email],</p>
  <p>[Enhanced content goes here...]</p>
  <p>Best regards,</p>
  <p>Your Company</p>
  <div style="margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">Sent via CRM-Rocket</div>
</div>
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Log what we got from Gemini
    console.log(`Gemini response length: ${text.length} characters`);
    console.log(
      `Contains HTML tags: ${text.includes("<div") || text.includes("<p")}`,
    );

    // Extract HTML content if present, or wrap plaintext in HTML
    let processedContent = text;

    // Remove any markdown code blocks or explanations
    if (text.includes("```html")) {
      const htmlMatch = text.match(/```html([\s\S]*?)```/);
      if (htmlMatch && htmlMatch[1]) {
        processedContent = htmlMatch[1].trim();
      }
    }

    // If response doesn't have HTML tags, wrap it in proper HTML
    if (
      !processedContent.includes("<div") && !processedContent.includes("<p>")
    ) {
      return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
        <p>Hello,</p>
        <p>${processedContent}</p>
        <p>Best regards,<br>CRM-Rocket Team</p>
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          Sent via CRM-Rocket
        </div>
      </div>`;
    }

    // If the content has HTML but no container, wrap it
    if (
      !processedContent.includes("font-family") &&
      !processedContent.includes("style=")
    ) {
      return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
        ${processedContent}
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          Sent via CRM-Rocket
        </div>
      </div>`;
    }

    return processedContent;
  } catch (error) {
    console.error("Gemini content generation error:", error);
    console.error(
      "API Key provided:",
      GEMINI_API_KEY ? "Yes (length: " + GEMINI_API_KEY.length + ")" : "No",
    );
    console.error("Original content:", originalBody.substring(0, 100) + "...");

    // Return a formatted version of the original body with error notification
    return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin-bottom: 15px;">
        <p><strong>Note:</strong> AI enhancement unavailable. Showing original content.</p>
      </div>
      <p>Hello ${to.split("@")[0] || ""},</p>
      <p>${originalBody}</p>
      <p>Best regards,<br>CRM-Rocket Team</p>
      <div style="margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
        Sent via CRM-Rocket
      </div>
    </div>`;
  }
}

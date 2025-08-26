import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { generateEmailContent } from "./gemini.ts";

// For debugging
console.log("Edge function loaded");

Deno.serve(async (req) => {
  // Set CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, body, cc, bcc } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Preparing email to:", to, "with subject:", subject);

    // Get Resend API key
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("API Key exists:", apiKey ? "Yes" : "No");

    // Generate enhanced email content using Gemini
    console.log("Generating enhanced email content with Gemini...");
    let emailHtml: string;
    let isEnhanced = false;
    try {
      // Check if Gemini API key is available
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ||
        "AIzaSyA_8lF-Ke32jvw6EKSvQKGsXibc8amKEhk";
      console.log("Gemini API key available:", geminiApiKey ? "Yes" : "No");

      // Try to enhance the content
      emailHtml = await generateEmailContent(subject, body, to);
      console.log("Email content enhanced with Gemini");

      // Check if enhancement worked (minimal validation)
      if (emailHtml && emailHtml.length > body.length * 1.2) {
        isEnhanced = true;
        console.log("Content was successfully enhanced (longer than original)");
      } else {
        console.log(
          "Enhancement might have failed - similar length to original",
        );
      }
    } catch (genError) {
      console.error("Failed to enhance with Gemini:", genError);
      emailHtml =
        `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello ${to.split("@")[0] || ""},</p>
        <p>${body}</p>
        <p>Best regards,<br>CRM-Rocket Team</p>
      </div>`;
    }

    // Call Resend API to send email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Use Resend's verified testing domain
        to: "aravindprime23@gmail.com", // Always send to your verified email for testing
        subject: `[CRM Test] ${subject} (Originally to: ${to})`, // Show original recipient in subject
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">CRM Email Test</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Original Recipient:</strong> ${to}</p>
              <p><strong>Original Subject:</strong> ${subject}</p>
              ${cc ? `<p><strong>CC:</strong> ${cc}</p>` : ""}
              ${bcc ? `<p><strong>BCC:</strong> ${bcc}</p>` : ""}
            </div>
            <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0;">
              <h3 style="color: #0066cc;">AI-Enhanced Content:</h3>
              ${emailHtml}
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
              <h3>Original Content:</h3>
              ${body}
            </div>
          </div>
        `,
      }),
    });

    console.log("Resend API response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${error}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        enhanced: isEnhanced,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Function error:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

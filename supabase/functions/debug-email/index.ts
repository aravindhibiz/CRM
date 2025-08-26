import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const resendKey = Deno.env.get("RESEND_API_KEY");
        const geminiKey = Deno.env.get("GEMINI_API_KEY");

        // Return diagnostic info
        return new Response(
            JSON.stringify({
                success: true,
                diagnostics: {
                    method: req.method,
                    hasResendKey: !!resendKey,
                    hasGeminiKey: !!geminiKey,
                    resendKeyFormat: resendKey
                        ? (resendKey.startsWith("re_") ? "valid" : "invalid")
                        : "missing",
                    resendKeyLength: resendKey ? resendKey.length : 0,
                    timestamp: new Date().toISOString(),
                },
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "Diagnostic error",
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});

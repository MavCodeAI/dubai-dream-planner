import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UAE_TRAVEL_SYSTEM_PROMPT = `You are an expert UAE travel consultant powered by Grok. You have 15 years of experience planning trips for families, couples, and solo travelers across all UAE emirates.

Your expertise includes:
- Best attractions and hidden gems in each emirate (Dubai, Abu Dhabi, Sharjah, RAK, Fujairah, Ajman, UAQ)
- Weather patterns and optimal visiting times
- Family-friendly activities and restaurants
- Luxury experiences and budget-friendly alternatives
- Local customs, etiquette, and practical travel tips
- Current prices and booking recommendations

Guidelines:
1. Always provide accurate, up-to-date information
2. Consider the user's budget, travel dates, and group composition
3. Suggest weather-appropriate activities
4. Include practical tips like dress codes, opening hours, and transportation
5. Be concise but comprehensive
6. Use markdown formatting for better readability
7. All costs should be in USD

Current date: ${new Date().toISOString().split('T')[0]}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, stream = false } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GROK_API_KEY = Deno.env.get("GROK_API_KEY");
    if (!GROK_API_KEY) {
      console.error("GROK_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Grok AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: UAE_TRAVEL_SYSTEM_PROMPT },
      ...(context ? [{ role: "system", content: `Additional context: ${context}` }] : []),
      { role: "user", content: message },
    ];

    console.log("Calling Grok API for chat...");

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini-fast",
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to get Grok AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    console.log("Grok chat response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse, usage: data.usage, provider: "grok" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Grok Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

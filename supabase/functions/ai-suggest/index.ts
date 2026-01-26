import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUGGESTION_SYSTEM_PROMPT = `You are an expert UAE travel advisor. Provide smart activity suggestions based on context.

Use ReAct (Reasoning + Acting) approach:
Thought: Analyze the current itinerary and remaining budget
Action: Identify gaps or opportunities for improvement
Observation: Consider time of day, weather, and traveler preferences
Result: Provide 3-5 specific, actionable suggestions

Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    {
      "id": "suggest-1",
      "name": "Activity Name",
      "description": "Why this activity is recommended",
      "estimatedCostUSD": 50,
      "durationHours": 2,
      "timeOfDay": "afternoon",
      "familyFriendly": true,
      "reasoning": "This complements your existing activities because...",
      "tags": ["adventure", "outdoor"]
    }
  ],
  "budgetAnalysis": {
    "remainingBudget": 500,
    "suggestedSpend": 150,
    "recommendation": "You have room for 1-2 more premium activities"
  }
}

Rules:
- Suggestions must fit the remaining budget
- Consider what activities are already planned
- Vary the types of activities
- Include a mix of free and paid options
- All costs in USD`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentActivities = [], 
      remainingBudget, 
      city, 
      timeOfDay,
      dayNumber,
      interests = [],
      hasChildren = false
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Suggest activities for a traveler in the UAE:

Current city: ${city || 'Dubai'}
Day number: ${dayNumber || 1}
Time of day needed: ${timeOfDay || 'any'}
Remaining budget: $${remainingBudget || 500} USD
Has children: ${hasChildren ? 'Yes' : 'No'}
Interests: ${interests.length > 0 ? interests.join(', ') : 'general sightseeing'}

Current activities already planned:
${currentActivities.length > 0 
  ? currentActivities.map((a: any) => `- ${a.name} ($${a.estimatedCostUSD})`).join('\n')
  : 'No activities planned yet'}

Provide 3-5 complementary activity suggestions that:
1. Fit within the remaining budget
2. Don't duplicate existing activities
3. Match the traveler's interests
4. Are appropriate for the time of day
${hasChildren ? '5. Are family-friendly' : ''}

Return as JSON.`;

    console.log("Generating AI suggestions...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SUGGESTION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get suggestions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    let suggestions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse suggestions JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse suggestions. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI suggestions generated successfully");

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Suggest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

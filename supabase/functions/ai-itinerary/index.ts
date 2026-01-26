import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ITINERARY_SYSTEM_PROMPT = `You are an expert UAE travel planner. Generate detailed day-by-day itineraries.

Think step-by-step (Chain-of-Thought):
1. Analyze the user's requirements (dates, travelers, budget, interests)
2. Consider the weather for their travel dates
3. Plan activities that match their interests and pace preference
4. Verify budget constraints are met
5. Optimize the schedule for minimal travel time
6. Include family-friendly options if children are present

Self-Critique before responding:
1. Verify total cost is within budget
2. Check all activities are appropriate for the travelers
3. Ensure no scheduling conflicts
4. Validate family-friendliness if children present

Return ONLY valid JSON matching this exact schema:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "2024-02-01",
      "city": "dubai",
      "activities": [
        {
          "id": "unique-id",
          "name": "Activity Name",
          "description": "Brief description",
          "durationHours": 2,
          "estimatedCostUSD": 50,
          "timeOfDay": "morning",
          "familyFriendly": true,
          "tags": ["culture", "photography"]
        }
      ],
      "dailyCostUSD": 150
    }
  ],
  "totalCostUSD": 450,
  "suggestions": ["Tip 1", "Tip 2"]
}

Rules:
- timeOfDay must be: "morning", "afternoon", "evening", or "anytime"
- All costs in USD
- 2-5 activities per day based on pace (relaxed: 2-3, standard: 3-4, packed: 4-5)
- Activities should match selected interests
- Stay within budget constraint`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      cities, 
      startDate, 
      endDate, 
      adults, 
      children, 
      budget, 
      interests, 
      pace,
      tripType 
    } = await req.json();

    if (!cities || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: cities, startDate, endDate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Generate a detailed UAE travel itinerary with these parameters:

Cities to visit: ${Array.isArray(cities) ? cities.join(', ') : cities}
Travel dates: ${startDate} to ${endDate}
Travelers: ${adults} adults, ${children || 0} children
Trip type: ${tripType || 'leisure'}
Budget: $${budget} USD total
Interests: ${Array.isArray(interests) ? interests.join(', ') : interests || 'general sightseeing'}
Pace: ${pace || 'standard'}

Requirements:
- Distribute days across the selected cities
- Match activities to the specified interests
- Stay within the budget
- If children are present, prioritize family-friendly activities
- Consider weather and optimal timing for each activity

Generate the complete itinerary as JSON.`;

    console.log("Generating AI itinerary...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ITINERARY_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
        JSON.stringify({ error: "Failed to generate itinerary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    let itinerary;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse itinerary JSON:", parseError);
      console.error("Raw content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse itinerary. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI itinerary generated successfully");

    return new Response(
      JSON.stringify(itinerary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Itinerary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

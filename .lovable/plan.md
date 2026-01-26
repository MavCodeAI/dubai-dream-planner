
# UAE Tour Planner - Full Advanced Agentic AI Implementation Plan

## Executive Summary

This plan transforms the UAE Tour Planner from a rule-based system into a fully **Agentic AI Application** where AI autonomously understands user intent, calls tools, and generates personalized itineraries.

---

## Part 1: Critical Bug Fixes

### Fix 1: PDF Export Error (Build Blocking)

**File:** `src/lib/pdf-export.ts` (Line 127)

**Problem:** 
```
error TS2339: Property 'getNumberOfPages' does not exist on type '...'
```

**Cause:** jsPDF v4 changed the API. The method is now `pdf.getNumberOfPages()` not `pdf.internal.getNumberOfPages()`.

**Solution:**
```typescript
// Line 127: Change from
const totalPages = pdf.internal.getNumberOfPages();

// To
const totalPages = pdf.getNumberOfPages();
```

---

## Part 2: Security Issue - Move AI Logic to Backend

### Current Problem

The `src/lib/agentic/longcat-client.ts` makes direct API calls from the frontend, which:
1. Exposes API keys in browser
2. Allows users to see/modify requests
3. No rate limiting on server side

### Solution: Create Secure Edge Functions

All AI calls will go through Supabase Edge Functions using the **Lovable AI Gateway** (no external API keys needed).

---

## Part 3: Backend Edge Functions

### Function 1: AI Chat Assistant

**File:** `supabase/functions/ai-chat/index.ts`

**Purpose:** Handle all chat-based AI interactions

**Features:**
- Streaming responses for better UX
- Context-aware conversations
- UAE travel expertise
- Error handling (429, 402)

**Request/Response:**
```text
POST /functions/v1/ai-chat
Body: { message: string, context?: string }
Response: { response: string, intent?: object }
```

**Prompting Techniques Used:**
1. **Role Prompting**: "You are an expert UAE travel planner with 15 years experience"
2. **Chain-of-Thought**: "First analyze the request, then plan step-by-step"
3. **Few-Shot Examples**: Provide example inputs/outputs
4. **Structured Output**: Return JSON for intents

---

### Function 2: AI Itinerary Generator

**File:** `supabase/functions/ai-itinerary/index.ts`

**Purpose:** Generate complete trip itineraries using AI

**Features:**
- Parse user preferences
- Generate day-by-day activities
- Optimize for budget
- Consider family needs
- Weather-aware suggestions

**Request/Response:**
```text
POST /functions/v1/ai-itinerary
Body: { 
  cities: string[],
  dates: { start: string, end: string },
  travelers: { adults: number, children: number },
  budget: number,
  interests: string[],
  pace: string
}
Response: { days: DayPlan[], totalCost: number, suggestions: string[] }
```

**Prompting Techniques Used:**
1. **ReAct (Reasoning + Acting)**: Think step-by-step about each day
2. **Constraints**: "Stay within budget of $X", "Family-friendly activities only"
3. **Self-Critique**: "Verify the plan meets all requirements"
4. **Structured Output**: Return valid JSON schema

---

### Function 3: AI Smart Suggestions

**File:** `supabase/functions/ai-suggest/index.ts`

**Purpose:** Provide contextual activity suggestions

**Features:**
- Based on current itinerary
- Budget-aware alternatives
- Weather considerations
- Similar activity recommendations

**Request/Response:**
```text
POST /functions/v1/ai-suggest
Body: { 
  currentActivities: Activity[],
  remainingBudget: number,
  city: string,
  timeOfDay: string
}
Response: { suggestions: Activity[], reasoning: string }
```

---

## Part 4: Frontend Components

### Component 1: AI Floating Chat Button

**File:** `src/components/AIFloatingButton.tsx`

**Purpose:** Persistent chat assistant available on all pages

**Features:**
- Floating button (bottom-right corner)
- Expandable chat panel
- Quick action buttons
- Typing indicator
- Message history

**UI Design:**
```text
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │  AI Chat Messages       │    │
│  │  ...                    │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  Type message...    [→] │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
         [🤖] ← Floating Button
```

---

### Component 2: AI Suggest Card

**File:** `src/components/AISuggestCard.tsx`

**Purpose:** Show AI-powered suggestions inline

**Features:**
- "AI Suggest" button on each day
- Loading animation
- Suggestion cards with accept/reject
- Budget impact preview

---

### Component 3: AI Client Helper

**File:** `src/lib/ai-client.ts`

**Purpose:** Frontend helper to call Edge Functions

**Features:**
- Supabase function invocation
- Error handling
- Loading states
- Retry logic

**Example:**
```typescript
import { supabase } from '@/integrations/supabase/client';

export const aiClient = {
  chat: async (message: string) => {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { message }
    });
    if (error) throw error;
    return data;
  },
  
  generateItinerary: async (params: ItineraryParams) => {
    const { data, error } = await supabase.functions.invoke('ai-itinerary', {
      body: params
    });
    if (error) throw error;
    return data;
  }
};
```

---

## Part 5: Update Existing Components

### Update 1: AgenticChat.tsx

**Current:** Calls LongCat API directly from frontend
**New:** Calls Edge Functions via Supabase client

**Changes:**
1. Remove LongCat client imports
2. Use `supabase.functions.invoke('ai-chat', ...)`
3. Add streaming support
4. Better error handling

---

### Update 2: Itinerary.tsx

**Add AI Features:**
1. "AI Suggest" button on each day card
2. "AI Optimize Budget" button in header
3. "AI Regenerate" uses AI instead of random

**New Props for DayCard:**
```typescript
onAISuggest?: () => void
isAISuggesting?: boolean
```

---

### Update 3: Remove Insecure Frontend AI Calls

**Files to Update:**
- `src/lib/agentic/ai-gateway.ts` - Route through Edge Functions
- `src/lib/agentic/longcat-client.ts` - Remove or make backend-only
- `src/lib/agentic/orchestrator.ts` - Use Edge Functions

---

## Part 6: Supabase Configuration

### Update config.toml

```toml
project_id = "magwwbsarvbmnztgypao"

[functions.ai-chat]
verify_jwt = false

[functions.ai-itinerary]
verify_jwt = false

[functions.ai-suggest]
verify_jwt = false
```

---

## Part 7: AI Model & Gateway

### Lovable AI Gateway

**URL:** `https://ai.gateway.lovable.dev/v1/chat/completions`
**Auth:** Uses LOVABLE_API_KEY (auto-configured in Edge Functions)
**Model:** `google/gemini-3-flash-preview` (fast, capable)

**Benefits:**
- No external API keys needed
- Already configured in Lovable Cloud
- Rate limiting handled
- Cost included in Lovable plan

---

## Part 8: Advanced Prompting Techniques

### 1. Role Prompting
```text
System: "You are an expert UAE travel consultant with 15 years of experience 
planning trips for families, couples, and solo travelers. You have deep 
knowledge of Dubai, Abu Dhabi, Sharjah, and all UAE emirates."
```

### 2. Chain-of-Thought (CoT)
```text
"Think step-by-step:
1. First, analyze the user's requirements
2. Consider the weather for their dates
3. Plan activities that match their interests
4. Verify budget constraints
5. Optimize the schedule for minimal travel time
Then provide your recommendation."
```

### 3. Few-Shot Examples
```text
Example 1:
Input: "Family trip to Dubai, 3 days, $2000"
Output: {
  "days": [
    { "dayNumber": 1, "activities": ["Burj Khalifa", "Dubai Mall"] },
    ...
  ]
}
```

### 4. ReAct (Reasoning + Acting)
```text
Thought: The user wants a family trip with children
Action: Filter activities for family-friendly options
Observation: Found 15 family-friendly activities in Dubai
Thought: Budget is $2000, need to prioritize high-value experiences
Action: Select top activities within budget
Result: Recommend Burj Khalifa, Dubai Aquarium, Desert Safari
```

### 5. Structured Output
```text
"Return your response as valid JSON matching this schema:
{
  days: Array<{
    dayNumber: number,
    city: string,
    activities: Array<{
      name: string,
      time: string,
      duration: number,
      cost: number
    }>
  }>
}"
```

### 6. Self-Critique
```text
"After generating the itinerary:
1. Verify total cost is within budget
2. Check all activities are appropriate for travelers
3. Ensure no scheduling conflicts
4. Validate family-friendliness if children present
If any issues found, fix them before responding."
```

---

## Part 9: File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ai-chat/index.ts` | Chat backend |
| `supabase/functions/ai-itinerary/index.ts` | Itinerary generation |
| `supabase/functions/ai-suggest/index.ts` | Smart suggestions |
| `src/components/AIFloatingButton.tsx` | Floating chat UI |
| `src/components/AISuggestCard.tsx` | Suggestion cards |
| `src/lib/ai-client.ts` | Frontend AI helper |

### Files to Update

| File | Change |
|------|--------|
| `src/lib/pdf-export.ts` | Fix getNumberOfPages API |
| `src/components/AgenticChat.tsx` | Use Edge Functions |
| `src/pages/Itinerary.tsx` | Add AI suggest buttons |
| `src/lib/agentic/ai-gateway.ts` | Route through backend |
| `supabase/config.toml` | Add function configs |

---

## Part 10: Implementation Phases

### Phase 1: Critical Fixes (5 minutes)
1. Fix PDF export build error
2. Update jsPDF API call

### Phase 2: Edge Functions (20 minutes)
1. Create ai-chat function
2. Create ai-itinerary function
3. Create ai-suggest function
4. Update config.toml

### Phase 3: Frontend Integration (15 minutes)
1. Create ai-client.ts helper
2. Update AgenticChat to use Edge Functions
3. Add AIFloatingButton component

### Phase 4: Itinerary AI Features (15 minutes)
1. Add AI suggest buttons to DayCard
2. Add AI regenerate functionality
3. Add budget optimization

### Phase 5: Testing & Polish (10 minutes)
1. Test all AI flows
2. Error handling
3. Loading states
4. Edge cases

---

## Technical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Onboarding   │  │  Itinerary   │  │  AIFloatingBtn   │  │
│  │    Page      │  │    Page      │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                   │            │
│         └─────────────────┼───────────────────┘            │
│                           ↓                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              src/lib/ai-client.ts                   │   │
│  │         supabase.functions.invoke()                 │   │
│  └───────────────────────┬─────────────────────────────┘   │
└──────────────────────────┼─────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   ai-chat      │  │  ai-itinerary  │  │   ai-suggest   │ │
│  │                │  │                │  │                │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
│           │                   │                   │         │
│           └───────────────────┼───────────────────┘         │
│                               ↓                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LOVABLE AI GATEWAY                          │   │
│  │    https://ai.gateway.lovable.dev/v1/chat/completions │   │
│  │    Model: google/gemini-3-flash-preview               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Expected Outcomes

After implementation:

1. **Build Error Fixed**: PDF export works correctly
2. **Secure Backend**: All AI calls go through Edge Functions
3. **AI Chatbot**: Floating chat available on all pages
4. **Smart Suggestions**: AI-powered activity recommendations
5. **AI Itinerary**: Fully AI-generated trip plans
6. **No External API Keys**: Uses Lovable AI Gateway (included)
7. **Production Ready**: Proper error handling and loading states

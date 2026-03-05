import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/types';

interface AIError {
  error: string;
}

interface ChatResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ItineraryResponse {
  days: {
    dayNumber: number;
    date: string;
    city: string;
    activities: Activity[];
    dailyCostUSD: number;
  }[];
  totalCostUSD: number;
  suggestions?: string[];
}

interface SuggestionResponse {
  suggestions: {
    id: string;
    name: string;
    description: string;
    estimatedCostUSD: number;
    durationHours: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
    familyFriendly: boolean;
    reasoning: string;
    tags: string[];
  }[];
  budgetAnalysis?: {
    remainingBudget: number;
    suggestedSpend: number;
    recommendation: string;
  };
}

/**
 * Custom error class for AI client operations
 * Provides additional context for error handling
 * 
 * @example
 * ```typescript
 * throw new AIClientError('Rate limit exceeded', 429, true, false);
 * ```
 */
class AIClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRateLimit: boolean = false,
    public isCreditsExhausted: boolean = false
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

/**
 * AI Client for communicating with Supabase Edge Functions
 * Provides methods for chat, itinerary generation, and suggestions
 * 
 * @example
 * ```typescript
 * import { aiClient } from './lib/ai-client';
 * 
 * const response = await aiClient.chat('What to do in Dubai?');
 * const itinerary = await aiClient.generateItinerary({
 *   cities: ['dubai'],
 *   startDate: '2024-03-01',
 *   endDate: '2024-03-07',
 *   adults: 2,
 *   children: 0,
 *   budget: 5000,
 *   interests: ['culture', 'adventure'],
 *   pace: 'standard'
 * });
 * ```
 */
export const aiClient = {
  /**
   * Send a chat message to the AI assistant
   * 
   * @param message - The user's message
   * @param context - Optional context for the conversation
   * @returns Promise resolving to chat response with AI text
   * @throws AIClientError on API failure
   * @example
   * ```typescript
   * const response = await aiClient.chat(
   *   'Best time to visit Dubai?',
   *   'Planning a family trip'
   * );
   * console.log(response.response);
   * ```
   */
  chat: async (message: string, context?: string, provider: 'lovable' | 'grok' = 'lovable'): Promise<ChatResponse> => {
    const functionName = provider === 'grok' ? 'ai-grok' : 'ai-chat';
    console.log(`Calling ${functionName} edge function...`);
    
    const { data, error } = await supabase.functions.invoke<ChatResponse | AIError>(functionName, {
      body: { message, context }
    });

    if (error) {
      console.error('AI chat error:', error);
      throw new AIClientError(error.message || 'Failed to get AI response');
    }

    if (data && 'error' in data) {
      const aiError = data as AIError;
      throw new AIClientError(
        aiError.error,
        undefined,
        aiError.error.includes('Rate limit'),
        aiError.error.includes('credits')
      );
    }

    return data as ChatResponse;
  },

  /**
   * Generate an AI-powered itinerary
   * 
   * @param params - Itinerary generation parameters
   * @returns Promise resolving to itinerary with days, activities, and cost
   * @throws AIClientError on generation failure
   * @example
   * ```typescript
   * const itinerary = await aiClient.generateItinerary({
   *   cities: ['dubai', 'abu-dhabi'],
   *   startDate: '2024-03-01',
   *   endDate: '2024-03-07',
   *   adults: 2,
   *   children: 1,
   *   budget: 10000,
   *   interests: ['culture', 'beach'],
   *   pace: 'relaxed'
   * });
   * console.log(itinerary.days);
   * ```
   */
  generateItinerary: async (params: {
    cities: string[];
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    budget: number;
    interests: string[];
    pace: string;
    tripType?: string;
  }): Promise<ItineraryResponse> => {
    console.log('Calling ai-itinerary edge function...');
    
    const { data, error } = await supabase.functions.invoke<ItineraryResponse | AIError>('ai-itinerary', {
      body: params
    });

    if (error) {
      console.error('AI itinerary error:', error);
      throw new AIClientError(error.message || 'Failed to generate itinerary');
    }

    if (data && 'error' in data) {
      const aiError = data as AIError;
      throw new AIClientError(
        aiError.error,
        undefined,
        aiError.error.includes('Rate limit'),
        aiError.error.includes('credits')
      );
    }

    return data as ItineraryResponse;
  },

  /**
   * Get AI-powered activity suggestions
   * 
   * @param params - Suggestion parameters
   * @returns Promise resolving to activity suggestions with budget analysis
   * @throws AIClientError on API failure
   * @example
   * ```typescript
   * const suggestions = await aiClient.getSuggestions({
   *   currentActivities: [existingActivity],
   *   remainingBudget: 500,
   *   city: 'dubai',
   *   dayNumber: 3
   * });
   * console.log(suggestions.suggestions);
   * ```
   */
  getSuggestions: async (params: {
    currentActivities?: Activity[];
    remainingBudget: number;
    city: string;
    timeOfDay?: string;
    dayNumber?: number;
    interests?: string[];
    hasChildren?: boolean;
  }): Promise<SuggestionResponse> => {
    console.log('Calling ai-suggest edge function...');
    
    const { data, error } = await supabase.functions.invoke<SuggestionResponse | AIError>('ai-suggest', {
      body: params
    });

    if (error) {
      console.error('AI suggest error:', error);
      throw new AIClientError(error.message || 'Failed to get suggestions');
    }

    if (data && 'error' in data) {
      const aiError = data as AIError;
      throw new AIClientError(
        aiError.error,
        undefined,
        aiError.error.includes('Rate limit'),
        aiError.error.includes('credits')
      );
    }

    return data as SuggestionResponse;
  },

  /**
   * Stream chat response for real-time display
   * Streams tokens as they arrive from the AI
   * 
   * @param message - The user's message
   * @param onDelta - Callback for each token received
   * @param onDone - Callback when streaming completes
   * @param onError - Callback for errors
   * @example
   * ```typescript
   * await aiClient.streamChat(
   *   'Tell me about Dubai culture',
   *   (text) => console.log('New:', text),
   *   () => console.log('Done'),
   *   (error) => console.error(error)
   * );
   * ```
   */
  streamChat: async (
    message: string,
    onDelta: (text: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): Promise<void> => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIClientError(
          errorData.error || 'Failed to start stream',
          response.status,
          response.status === 429,
          response.status === 402
        );
      }

      if (!response.body) {
        throw new AIClientError('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      onDone();
    } catch (error) {
      console.error('Stream chat error:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }
};

export { AIClientError };
export type { ChatResponse, ItineraryResponse, SuggestionResponse };

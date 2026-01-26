import { supabase } from '@/integrations/supabase/client';
import { Activity, OnboardingData } from '@/types';

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

export const aiClient = {
  /**
   * Send a chat message to the AI assistant
   */
  chat: async (message: string, context?: string): Promise<ChatResponse> => {
    console.log('Calling ai-chat edge function...');
    
    const { data, error } = await supabase.functions.invoke<ChatResponse | AIError>('ai-chat', {
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

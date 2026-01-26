// AI Gateway Integration for Agentic AI
// This handles LLM calls through multiple providers with fallback support

import { longCatClient } from './longcat-client';
import { languageDetector, LanguageContext } from './language-detector';

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider?: string;
}

export interface TravelIntent {
  city?: string;
  dates?: {
    start: string;
    end: string;
  };
  travelers?: {
    adults: number;
    children: number;
    infants: number;
  };
  budget?: {
    amount: number;
    currency: string;
  };
  interests?: string[];
  tripType?: 'leisure' | 'business' | 'family' | 'adventure' | 'luxury';
  urgency?: 'immediate' | 'soon' | 'planning';
}

export class AIGateway {
  private lovableBaseUrl = 'https://api.lovable.ai/v1';
  private lovableApiKey: string | null = null;
  private preferredProvider: 'lovable' | 'longcat' = 'longcat'; // Default to LongCat
  private enableFallback = true;

  constructor() {
    // In production, these should come from environment variables
    this.lovableApiKey = import.meta.env.VITE_LOVABLE_API_KEY || null;
    
    // Validate Lovable API key format if provided
    if (this.lovableApiKey && this.lovableApiKey.length < 10) {
      console.warn('VITE_LOVABLE_API_KEY appears to be invalid (too short)');
    }
    
    // Check which provider is available and set preference
    this.initializeProvider();
  }

  private validateLovableApiKey(): void {
    if (!this.lovableApiKey) {
      throw new Error(
        'Lovable API key not configured. Please set VITE_LOVABLE_API_KEY environment variable. ' +
        'Refer to .env.example for the required format.'
      );
    }
    
    if (this.lovableApiKey.length < 10) {
      throw new Error('VITE_LOVABLE_API_KEY appears to be invalid (too short)');
    }
  }

  private async initializeProvider(): Promise<void> {
    // Check if LongCat API is available
    const longCatAvailable = await longCatClient.healthCheck();
    
    if (!longCatAvailable && this.lovableApiKey) {
      this.preferredProvider = 'lovable';
      console.log('LongCat API unavailable, falling back to Lovable');
    } else if (longCatAvailable) {
      this.preferredProvider = 'longcat';
      console.log('Using LongCat API as preferred provider');
    } else {
      console.warn('No AI providers available');
    }
  }

  async callLLM(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    // Try preferred provider first, then fallback if enabled
    try {
      if (this.preferredProvider === 'longcat') {
        return await this.callLongCat(prompt, systemPrompt);
      } else {
        return await this.callLovable(prompt, systemPrompt);
      }
    } catch (error) {
      console.error(`Primary provider (${this.preferredProvider}) failed:`, error);
      
      if (this.enableFallback) {
        // Try the other provider
        try {
          if (this.preferredProvider === 'longcat') {
            return await this.callLovable(prompt, systemPrompt);
          } else {
            return await this.callLongCat(prompt, systemPrompt);
          }
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
          throw new Error('All AI providers failed');
        }
      }
      
      throw error;
    }
  }

  private async callLongCat(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ];

    const response = await longCatClient.chatCompletion(messages, {
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      provider: 'longcat'
    };
  }

  private async callLovable(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    this.validateLovableApiKey();

    const response = await fetch(`${this.lovableBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.lovableApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Lovable API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      provider: 'lovable'
    };
  }

  async extractTravelIntent(userInput: string): Promise<TravelIntent> {
    // Detect language first
    const languageContext = languageDetector.detectLanguage(userInput);
    
    try {
      // Use LongCat directly for travel intent extraction with language context
      return await longCatClient.extractTravelIntent(userInput);
    } catch (error) {
      console.error('Failed to extract travel intent with LongCat, trying fallback:', error);
      
      // Fallback to generic LLM call with language-specific prompts
      const languagePrompts = languageDetector.generateLanguageSpecificPrompt(
        `You are a UAE travel expert AI assistant. Extract travel intent from user messages.

Rules:
1. Always return valid JSON
2. Infer missing information logically
3. Convert relative dates to absolute dates
4. Default currency to AED unless specified
5. Identify trip type from context

Example:
Input: 'دبئی اگلے ہفتے'
Output: {city: 'dubai', dates: '2024-02-01 to 2024-02-07'}

Return only valid JSON:`,
        languageContext,
        'travel_intent'
      );

      const prompt = `Extract travel intent from this message: "${userInput}"

Current date: ${new Date().toISOString().split('T')[0]}

Return only valid JSON:`;

      try {
        const response = await this.callLLM(prompt, languagePrompts.systemPrompt);
        const intent = JSON.parse(response.content);
        return intent;
      } catch (fallbackError) {
        console.error('Failed to extract travel intent:', fallbackError);
        // Return basic fallback intent
        return {
          city: 'dubai',
          travelers: { adults: 1, children: 0, infants: 0 },
          tripType: 'leisure'
        };
      }
    }
  }

  async generateItinerarySuggestion(intent: TravelIntent, userLanguage?: string): Promise<string> {
    // Detect language from user input if provided
    const languageContext = userLanguage ? languageDetector.detectLanguage(userLanguage) : 
                            languageDetector.detectLanguage(JSON.stringify(intent));
    
    try {
      // Use LongCat directly for itinerary generation with language context
      return await longCatClient.generateItinerarySuggestion(intent);
    } catch (error) {
      console.error('Failed to generate itinerary suggestion with LongCat, trying fallback:', error);
      
      // Fallback to generic LLM call with language-specific prompts
      const languagePrompts = languageDetector.generateLanguageSpecificPrompt(
        `Create personalized itinerary suggestions.

Guidelines:
1. Consider weather conditions
2. Match activities to interests  
3. Respect budget constraints
4. Include family-friendly options if children present
5. Suggest optimal timing for each activity
6. Include transportation tips`,
        languageContext,
        'itinerary'
      );

      const prompt = `Generate a personalized itinerary suggestion for this trip:

${JSON.stringify(intent, null, 2)}

Focus on:
- Best attractions for their interests
- Weather-appropriate activities
- Budget-friendly options
- Family considerations if applicable

Provide 3-4 specific suggestions with brief descriptions:`;

      try {
        const response = await this.callLLM(prompt, languagePrompts.systemPrompt);
        return languageDetector.formatResponse(response.content, languageContext);
      } catch (fallbackError) {
        console.error('Failed to generate itinerary suggestion:', fallbackError);
        return languageDetector.getErrorMessage('general', languageContext);
      }
    }
  }

  async answerTravelQuestion(question: string, context?: string): Promise<string> {
    // Detect language from the question
    const languageContext = languageDetector.detectLanguage(question);
    
    try {
      // Use LongCat directly for travel questions with language context
      return await longCatClient.answerTravelQuestion(question, context);
    } catch (error) {
      console.error('Failed to answer travel question with LongCat, trying fallback:', error);
      
      // Fallback to generic LLM call with language-specific prompts
      const languagePrompts = languageDetector.generateLanguageSpecificPrompt(
        `Provide accurate, helpful information about UAE travel.

Guidelines:
1. Be concise but comprehensive
2. Include practical tips
3. Mention current regulations if relevant
4. Suggest alternatives when appropriate

Focus on Dubai, Abu Dhabi, Sharjah, and other emirates.`,
        languageContext,
        'question'
      );

      const prompt = `Question: ${question}
${context ? `Context: ${context}` : ''}

Provide a helpful, accurate answer:`;

      try {
        const response = await this.callLLM(prompt, languagePrompts.systemPrompt);
        return languageDetector.formatResponse(response.content, languageContext);
      } catch (fallbackError) {
        console.error('Failed to answer travel question:', fallbackError);
        return languageDetector.getErrorMessage('general', languageContext);
      }
    }
  }

  // New method to get AI provider status
  getProviderStatus(): { provider: string; available: boolean; fallback: boolean } {
    return {
      provider: this.preferredProvider,
      available: this.preferredProvider !== null,
      fallback: this.enableFallback
    };
  }

  // Method to switch providers manually
  setPreferredProvider(provider: 'lovable' | 'longcat'): void {
    this.preferredProvider = provider;
    console.log(`Switched to ${provider} as preferred provider`);
  }
}

// Singleton instance
export const aiGateway = new AIGateway();

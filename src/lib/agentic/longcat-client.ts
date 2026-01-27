// LongCat API Client - OpenAI Compatible Format
// Integration with LongCat API Platform for AI features

import { TravelIntent } from './ai-gateway';
import { Activity } from './agents/activity-agent';
import { WeatherData } from './agents/weather-agent';

export interface WeatherImpactAnalysis {
  activityId: string;
  activityName: string;
  suitability: 'Good' | 'Fair' | 'Poor';
  recommendations: string[];
  bestTiming: string;
  safetyConsiderations: string[];
  indoorAlternatives?: string;
}

export interface LongCatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LongCatResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface LongCatError {
  error: {
    code: string;
    message: string;
    type: string;
    retry_after?: number;
  };
}

/**
 * LongCat API Client - OpenAI Compatible Format
 * Integration with LongCat API Platform for AI features
 * 
 * @example
 * ```typescript
 * import { longCatClient } from './lib/agentic/longcat-client';
 * 
 * const response = await longCatClient.chatCompletion([
 *   { role: 'system', content: 'You are a travel expert' },
 *   { role: 'user', content: 'Best time to visit Dubai?' }
 * ], { temperature: 0.7 });
 * ```
 */
export class LongCatClient {
  private baseUrl = import.meta.env.VITE_LONGCAT_API_URL || 'https://api.longcat.chat/openai';
  private apiKey: string | null = null;
  private defaultModel = 'LongCat-Flash-Chat';
  private rateLimiter: Map<string, number[]> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_REQUESTS = 100; // Max 100 requests per minute
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // Base delay in ms

  constructor() {
    this.apiKey = import.meta.env.VITE_LONGCAT_API_KEY || null;
    
    // Validate API key if provided (will be validated at usage time for graceful degradation)
    if (this.apiKey && this.apiKey.length < 10) {
      console.warn('VITE_LONGCAT_API_KEY appears to be invalid (too short)');
    }
  }

  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new Error(
        'LongCat API key not configured. Please set VITE_LONGCAT_API_KEY environment variable. ' +
        'Refer to .env.example for the required format.'
      );
    }
    
    if (this.apiKey.length < 10) {
      throw new Error('VITE_LONGCAT_API_KEY appears to be invalid (too short)');
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    // Clean old requests
    for (const [key, timestamps] of this.rateLimiter.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.rateLimiter.delete(key);
      } else {
        this.rateLimiter.set(key, validTimestamps);
      }
    }

    // Check current rate limit
    const key = 'global';
    const requests = this.rateLimiter.get(key) || [];
    
    if (requests.length >= this.RATE_LIMIT_REQUESTS) {
      const oldestRequest = Math.min(...requests);
      const waitTime = oldestRequest + this.RATE_LIMIT_WINDOW - now;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Add current request
    requests.push(now);
    this.rateLimiter.set(key, requests);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === retries) {
          throw error;
        }

        // Check if error is retryable
        if (error.message?.includes('rate_limit_exceeded')) {
          const retryAfter = error.message?.match(/retry after (\d+)/)?.[1];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.RETRY_DELAY_BASE * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        // For other errors, use exponential backoff
        if (error.message?.includes('503') || error.message?.includes('timeout')) {
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        // Non-retryable error
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Send a chat completion request to the LongCat API
   * 
   * @param messages - Array of messages with role and content
   * @param options - Optional settings for model, temperature, max_tokens
   * @returns Promise resolving to the chat completion response
   * @throws Error if API key is not configured or request fails
   * @example
   * ```typescript
   * const response = await longCatClient.chatCompletion([
   *   { role: 'system', content: 'You are a UAE travel expert' },
   *   { role: 'user', content: 'Suggest activities in Dubai' }
   * ], { temperature: 0.7, max_tokens: 500 });
   * ```
   */
  async chatCompletion(
    messages: LongCatMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<LongCatResponse> {
    this.validateApiKey();

    return this.retryWithBackoff(async () => {
      await this.checkRateLimit();

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: Math.min(options.max_tokens || 1000, 8000), // Respect 8K limit
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorData: LongCatError = await response.json();
          const retryAfter = errorData.error.retry_after || 60;
          throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
        }
        
        if (response.status >= 500) {
          throw new Error(`LongCat API server error: ${response.status} ${response.statusText}`);
        }

        const errorData: LongCatError = await response.json();
        throw new Error(`LongCat API error: ${errorData.error.code} - ${errorData.error.message}`);
      }

      return await response.json();
    });
  }

  /**
   * Extract travel intent from user input
   * Uses AI to parse natural language and extract structured travel information
   * 
   * @param userInput - The user's message in English or Urdu
   * @returns Promise resolving to extracted TravelIntent object
   * @throws Error if extraction fails
   * @example
   * ```typescript
   * const intent = await longCatClient.extractTravelIntent(
   *   'میں دبئی جانا چاہتا ہوں اگلے ہفتے، 2 بالغ، $3000 بجٹ'
   * );
   * // Returns: { city: 'dubai', dates: {...}, travelers: {...}, budget: {...} }
   * ```
   */
  async extractTravelIntent(userInput: string): Promise<TravelIntent> {
    const systemPrompt = `You are a UAE travel expert AI assistant. Extract travel intent from user messages in Urdu/English.

Rules:
1. Always return valid JSON
2. Infer missing information logically
3. Convert relative dates to absolute dates
4. Default currency to AED unless specified
5. Identify trip type from context
6. Consider UAE-specific context (Dubai, Abu Dhabi, Sharjah, etc.)

Example:
Input: "میں دبئی جانا چاہتا ہوں اگلے ہفتے، 2 بالغ، 1 بچہ، $3000 بجٹ"
Output: {
  "city": "dubai",
  "dates": {
    "start": "2024-02-01",
    "end": "2024-02-07"
  },
  "travelers": {
    "adults": 2,
    "children": 1,
    "infants": 0
  },
  "budget": {
    "amount": 11000,
    "currency": "AED"
  },
  "interests": ["family", "sightseeing"],
  "tripType": "family",
  "urgency": "soon"
}`;

    const prompt = `Extract travel intent from this message: "${userInput}"

Current date: ${new Date().toISOString().split('T')[0]}

Return only valid JSON:`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.3, max_tokens: 500 });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to extract travel intent with LongCat:', error);
      throw error;
    }
  }

  /**
   * Generate personalized itinerary suggestions
   * 
   * @param intent - TravelIntent with trip details
   * @returns Promise resolving to itinerary suggestion text
   * @throws Error if generation fails
   * @example
   * ```typescript
   * const suggestion = await longCatClient.generateItinerarySuggestion({
   *   city: 'dubai',
   *   dates: { start: '2024-03-01', end: '2024-03-07' },
   *   travelers: { adults: 2, children: 1 },
   *   budget: { amount: 5000, currency: 'AED' }
   * });
   * ```
   */
  async generateItinerarySuggestion(intent: TravelIntent): Promise<string> {
    const systemPrompt = `You are an expert UAE travel planner. Create personalized itinerary suggestions.

Guidelines:
1. Consider weather conditions (hot climate, indoor/outdoor balance)
2. Match activities to interests and demographics
3. Respect budget constraints (mention free alternatives)
4. Include family-friendly options if children present
5. Suggest optimal timing for each activity (avoid midday heat)
6. Include transportation tips (metro, taxi, ride-sharing)
7. Mention cultural considerations and dress codes
8. Recommend authentic local experiences

Respond in a conversational, helpful tone using Urdu/English mix for better user experience.`;

    const prompt = `Generate a personalized itinerary suggestion for this trip:

${JSON.stringify(intent, null, 2)}

Focus on:
- Best attractions for their interests in UAE
- Weather-appropriate activities (avoid peak heat hours)
- Budget-friendly options and free alternatives
- Family considerations if applicable
- Cultural experiences and local insights
- Practical tips for tourists in UAE

Provide 3-4 specific suggestions with brief descriptions and practical tips:`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.8, max_tokens: 800 });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Failed to generate itinerary suggestion with LongCat:', error);
      throw error;
    }
  }

  /**
   * Answer travel-related questions
   * 
   * @param question - The travel question to answer
   * @param context - Optional context for the question
   * @returns Promise resolving to the answer text
   * @example
   * ```typescript
   * const answer = await longCatClient.answerTravelQuestion(
   *   'What should I wear in Dubai?',
   *   'Traveling in December'
   * );
   * ```
   */
  async answerTravelQuestion(question: string, context?: string): Promise<string> {
    const systemPrompt = `You are a knowledgeable UAE travel guide. Provide accurate, helpful information about UAE travel.

Guidelines:
1. Be concise but comprehensive
2. Include practical tips and current information
3. Mention cultural norms and regulations if relevant
4. Suggest alternatives when appropriate
5. Use Urdu/English mix for better understanding
6. Focus on Dubai, Abu Dhabi, Sharjah, and other emirates
7. Include safety tips and emergency information when relevant

Always provide actionable advice.`;

    const prompt = `Question: ${question}
${context ? `Context: ${context}` : ''}

Provide a helpful, accurate answer with practical tips:`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.6, max_tokens: 600 });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Failed to answer travel question with LongCat:', error);
      throw error;
    }
  }

  async generateActivityRecommendations(
    city: string, 
    interests: string[], 
    weather: WeatherData | null,
    budget: number
  ): Promise<string> {
    const systemPrompt = `You are a UAE activity expert. Recommend activities based on user preferences.

Consider:
1. Weather conditions and seasonal appropriateness
2. Budget constraints and value for money
3. Cultural appropriateness and local customs
4. Family-friendly options when relevant
5. Transportation and accessibility
6. Peak vs off-peak timing recommendations

Provide specific, actionable recommendations.`;

    const prompt = `Generate activity recommendations for:

City: ${city}
Interests: ${interests.join(', ')}
Weather: ${JSON.stringify(weather)}
Budget: ${budget} AED

Provide 3-5 specific recommendations with:
- Activity name and brief description
- Best time to visit
- Estimated cost
- Tips for the experience
- Weather considerations`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.7, max_tokens: 700 });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Failed to generate activity recommendations with LongCat:', error);
      throw error;
    }
  }

  async analyzeWeatherImpact(activities: Activity[], weather: WeatherData[]): Promise<WeatherImpactAnalysis[]> {
    const systemPrompt = `You are a weather and travel expert. Analyze how weather conditions affect outdoor activities in UAE.

Consider:
1. Temperature thresholds for different activities
2. Heat safety recommendations
3. Indoor alternatives during extreme weather
4. Optimal timing suggestions
5. Seasonal variations in UAE

Provide practical, safety-focused advice.`;

    const prompt = `Analyze weather impact on these activities:

Activities: ${JSON.stringify(activities, null, 2)}
Weather Forecast: ${JSON.stringify(weather, null, 2)}

For each activity, provide:
- Weather suitability score (Good/Fair/Poor)
- Specific recommendations
- Best timing suggestions
- Safety considerations
- Indoor alternatives if needed

Return as structured JSON:`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.4, max_tokens: 1000 });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to analyze weather impact with LongCat:', error);
      throw error;
    }
  }

  // Health check method
  /**
   * Check if the LongCat API is available
   * 
   * @returns Promise resolving to true if API is healthy, false otherwise
   * @example
   * ```typescript
   * const isHealthy = await longCatClient.healthCheck();
   * if (isHealthy) {
   *   // Use LongCat API
   * }
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.chatCompletion([
        { role: 'user', content: 'Hello' }
      ], { max_tokens: 10 });
      return true;
    } catch (error) {
      console.error('LongCat API health check failed:', error);
      return false;
    }
  }

  // Get available models
  async getModels(): Promise<string[]> {
    // LongCat supports these models based on documentation
    return [
      'LongCat-Flash-Chat',
      'LongCat-Flash-Thinking',
      'LongCat-Flash-Thinking-2601'
    ];
  }

  // Get rate limit status
  getRateLimitStatus(): { 
    requestsInWindow: number; 
    maxRequests: number; 
    resetTime: number; 
    timeUntilReset: number;
  } {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    const key = 'global';
    const requests = this.rateLimiter.get(key) || [];
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    const oldestRequest = validRequests.length > 0 ? Math.min(...validRequests) : now;
    const resetTime = oldestRequest + this.RATE_LIMIT_WINDOW;
    const timeUntilReset = Math.max(0, resetTime - now);

    return {
      requestsInWindow: validRequests.length,
      maxRequests: this.RATE_LIMIT_REQUESTS,
      resetTime,
      timeUntilReset
    };
  }

  // Get API usage statistics
  getUsageStats(): {
    provider: string;
    model: string;
    rateLimit: {
      requestsInWindow: number;
      maxRequests: number;
      resetTime: number;
      timeUntilReset: number;
    };
    configured: boolean;
  } {
    return {
      provider: 'LongCat API Platform',
      model: this.defaultModel,
      rateLimit: this.getRateLimitStatus(),
      configured: !!this.apiKey
    };
  }
}

// Singleton instance
export const longCatClient = new LongCatClient();

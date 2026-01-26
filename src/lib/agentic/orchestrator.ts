// Agentic Orchestrator - Manages the AI workflow and coordinates different agents
import { aiGateway, TravelIntent } from './ai-gateway';
import { WeatherAgent, WeatherData } from './agents/weather-agent';
import { ActivityAgent, Activity } from './agents/activity-agent';
import { BudgetAgent, BudgetAnalysis } from './agents/budget-agent';
import { PlanningAgent, Itinerary } from './agents/planning-agent';

export interface AgenticState {
  userMessage: string;
  intent?: TravelIntent;
  weather?: WeatherData[];
  activities?: Activity[];
  budgetAnalysis?: BudgetAnalysis;
  itinerary?: Itinerary;
  suggestions?: string[];
  errors: string[];
  isProcessing: boolean;
  currentStep: 'understanding' | 'researching' | 'planning' | 'finalizing' | 'complete';
}

/**
 * Agentic Orchestrator - Manages the AI workflow and coordinates different agents
 * This is the main entry point for the agentic AI system
 */
export class AgenticOrchestrator {
  private weatherAgent = new WeatherAgent();
  private activityAgent = new ActivityAgent();
  private budgetAgent = new BudgetAgent();
  private planningAgent = new PlanningAgent();

  /**
   * Process a user message and generate a response
   * This is the main method for interacting with the agentic AI system
   * 
   * @param message - The user's input message
   * @param currentState - Optional current state to continue from
   * @returns Promise resolving to the updated agentic state
   * @example
   * ```typescript
   * const state = await orchestrator.processUserMessage(
   *   'I want to visit Dubai next week with my family'
   * );
   * console.log(state.itinerary);
   * ```
   */
  async processUserMessage(message: string, currentState: Partial<AgenticState> = {}): Promise<AgenticState> {
    const state: AgenticState = {
      userMessage: message,
      errors: [],
      isProcessing: true,
      currentStep: 'understanding',
      ...currentState
    };

    try {
      // Step 1: Understanding - Extract user intent
      state.currentStep = 'understanding';
      state.intent = await this.extractIntent(message);
      
      // Step 2: Research - Gather information from various agents
      state.currentStep = 'researching';
      await this.gatherInformation(state);
      
      // Step 3: Planning - Generate itinerary and suggestions
      state.currentStep = 'planning';
      await this.generatePlan(state);
      
      // Step 4: Finalizing - Validate and optimize
      state.currentStep = 'finalizing';
      await this.finalizePlan(state);
      
      state.currentStep = 'complete';
      state.isProcessing = false;
      
    } catch (error) {
      console.error('Agentic orchestrator error:', error);
      state.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      state.isProcessing = false;
    }

    return state;
  }

  private async extractIntent(message: string): Promise<TravelIntent> {
    try {
      const intent = await aiGateway.extractTravelIntent(message);
      
      // Validate and enhance intent
      if (!intent.city) {
        intent.city = 'dubai'; // Default to Dubai
      }
      
      if (!intent.travelers) {
        intent.travelers = { adults: 1, children: 0, infants: 0 };
      }
      
      if (!intent.dates) {
        // Default to next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const weekAfter = new Date(nextWeek);
        weekAfter.setDate(weekAfter.getDate() + 7);
        
        intent.dates = {
          start: nextWeek.toISOString().split('T')[0],
          end: weekAfter.toISOString().split('T')[0]
        };
      }
      
      return intent;
    } catch (error) {
      console.error('Intent extraction failed:', error);
      throw new Error('Failed to understand your travel request');
    }
  }

  private async gatherInformation(state: AgenticState): Promise<void> {
    if (!state.intent) {
      throw new Error('No intent available for research');
    }

    const tasks: Promise<void>[] = [];

    // Get weather information
    if (state.intent.city && state.intent.dates) {
      tasks.push(
        this.weatherAgent.getWeatherForecast(state.intent.city, state.intent.dates.start)
          .then(weather => { state.weather = weather; })
          .catch(error => { 
            console.warn('Weather fetch failed:', error);
            state.errors.push('Weather information unavailable');
          })
      );
    }

    // Get activity suggestions
    if (state.intent.city) {
      tasks.push(
        this.activityAgent.getActivities(state.intent.city, state.intent)
          .then(activities => { state.activities = activities; })
          .catch(error => { 
            console.warn('Activities fetch failed:', error);
            state.errors.push('Activity suggestions unavailable');
          })
      );
    }

    // Analyze budget
    if (state.intent.budget) {
      tasks.push(
        this.budgetAgent.analyzeBudget(state.intent)
          .then(analysis => { state.budgetAnalysis = analysis; })
          .catch(error => { 
            console.warn('Budget analysis failed:', error);
            state.errors.push('Budget analysis unavailable');
          })
      );
    }

    // Wait for all information gathering tasks
    await Promise.allSettled(tasks);
  }

  private async generatePlan(state: AgenticState): Promise<void> {
    if (!state.intent) {
      throw new Error('No intent available for planning');
    }

    try {
      // Generate AI suggestions based on gathered information
      const suggestions = await aiGateway.generateItinerarySuggestion(state.intent);
      state.suggestions = [suggestions];

      // Generate structured itinerary
      state.itinerary = await this.planningAgent.generateItinerary(
        state.intent,
        {
          weather: state.weather,
          activities: state.activities,
          budgetAnalysis: state.budgetAnalysis
        }
      );

    } catch (error) {
      console.error('Plan generation failed:', error);
      state.errors.push('Failed to generate travel plan');
    }
  }

  private async finalizePlan(state: AgenticState): Promise<void> {
    if (!state.itinerary) {
      throw new Error('No itinerary available for finalization');
    }
    
    if (!state.intent) {
      throw new Error('No intent available for finalization');
    }

    try {
      // Validate the plan
      const validation = await this.planningAgent.validateItinerary(state.itinerary, state.intent);
      
      if (!validation.isValid) {
        state.errors.push(...validation.issues);
        
        // Try to fix common issues
        state.itinerary = await this.planningAgent.fixItineraryIssues(state.itinerary, validation.issues);
      }

      // Optimize the plan
      state.itinerary = await this.planningAgent.optimizeItinerary(state.itinerary, state.intent);

    } catch (error) {
      console.error('Plan finalization failed:', error);
      state.errors.push('Failed to finalize travel plan');
    }
  }

  /**
   * Generate clarifying questions for incomplete travel intent
   * 
   * @param intent - Partial travel intent to check for missing information
   * @returns Array of clarifying questions in Urdu/English
   * @example
   * ```typescript
   * const questions = await orchestrator.getClarifyingQuestions({
   *   city: 'dubai'
   * });
   * // Returns: ['کب سفر کرنا ہے؟', 'کتنے افراد سفر کر رہے ہیں؟', ...]
   * ```
   */
  async getClarifyingQuestions(intent: Partial<TravelIntent>): Promise<string[]> {
    const questions: string[] = [];

    if (!intent.city) {
      questions.push('کون سے شہر میں جانا چاہتے ہیں؟ (دبئی، ابو ظہبی، شارجہ؟)');
    }

    if (!intent.dates) {
      questions.push('کب سفر کرنا ہے؟ (تاریخیں بتائیں)');
    }

    if (!intent.travelers) {
      questions.push('کتنے افراد سفر کر رہے ہیں؟ (بالغ، بچے؟)');
    }

    if (!intent.budget) {
      questions.push('آپ کا بجٹ کتنا ہے؟');
    }

    if (!intent.interests || intent.interests.length === 0) {
      questions.push('آپ کی دلچسپیاں کیا ہیں؟ (شاپنگ، ایڈونچر، ثقافت؟)');
    }

    return questions;
  }

  /**
   * Handle follow-up messages and update the plan accordingly
   * 
   * @param message - The follow-up message from the user
   * @param state - Current agentic state
   * @returns Updated agentic state after processing follow-up
   * @example
   * ```typescript
   * const updatedState = await orchestrator.handleFollowUp(
   *   'Actually, I want to add 2 more days',
   *   currentState
   * );
   * ```
   */
  async handleFollowUp(message: string, state: AgenticState): Promise<AgenticState> {
    // Update intent based on follow-up
    try {
      const updatedIntent = await aiGateway.extractTravelIntent(
        `${state.userMessage} ${message}`
      );
      
      return this.processUserMessage(state.userMessage, {
        ...state,
        intent: { ...state.intent, ...updatedIntent }
      });
    } catch (error) {
      console.error('Follow-up handling failed:', error);
      state.errors.push('Failed to process follow-up message');
      return state;
    }
  }
}

// Singleton instance
export const agenticOrchestrator = new AgenticOrchestrator();

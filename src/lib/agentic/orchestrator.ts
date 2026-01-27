// Agentic Orchestrator - Manages the AI workflow and coordinates different agents
import { aiGateway, TravelIntent } from './ai-gateway';
import { WeatherAgent, WeatherData } from './agents/weather-agent';
import { ActivityAgent, Activity } from './agents/activity-agent';
import { BudgetAgent, BudgetAnalysis } from './agents/budget-agent';
import { PlanningAgent, Itinerary } from './agents/planning-agent';
import { contextEngine, ContextSuggestion } from './context-engine';
import { triggerManager } from './triggers';
import { notificationManager } from './notifications/notification-manager';
import { dynamicAgentRouter, RoutingDecision } from './dynamic-router';
import { agentBus, AGENTS, TOPICS, AgentMessage } from './communication/agent-bus';
import { sharedContextStore } from './shared-context';
import { sessionContinuityManager } from './session-continuity';
import { preferenceLearner } from './learning/preference-learner';
import { stateMachine } from './state-machine';
import { actionAgent } from './agents/action-agent';
import { bookingWorkflowManager } from './workflows/booking-workflow';

export interface AgenticState {
  userMessage: string;
  intent?: TravelIntent;
  weather?: WeatherData[];
  activities?: Activity[];
  budgetAnalysis?: BudgetAnalysis;
  itinerary?: Itinerary;
  suggestions?: string[];
  proactiveSuggestions?: ContextSuggestion[];
  routingDecision?: RoutingDecision;
  errors: string[];
  isProcessing: boolean;
  currentStep: 'understanding' | 'researching' | 'planning' | 'finalizing' | 'complete';
}

export interface OrchestratorConfig {
  enableProactiveIntelligence: boolean;
  enableMultiAgentCoordination: boolean;
  enableLearning: boolean;
  enableSessionContinuity: boolean;
}

/**
 * Agentic Orchestrator - Main entry point for the agentic AI system
 * Enhanced with all phases of autonomous agent features
 */
export class AgenticOrchestrator {
  private weatherAgent = new WeatherAgent();
  private activityAgent = new ActivityAgent();
  private budgetAgent = new BudgetAgent();
  private planningAgent = new PlanningAgent();
  private config: OrchestratorConfig;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      enableProactiveIntelligence: config?.enableProactiveIntelligence !== false,
      enableMultiAgentCoordination: config?.enableMultiAgentCoordination !== false,
      enableLearning: config?.enableLearning !== false,
      enableSessionContinuity: config?.enableSessionContinuity !== false
    };

    this.initialize();
  }

  /**
   * Initialize all agentic components
   */
  private async initialize(): Promise<void> {
    console.log('Initializing Agentic Orchestrator...');

    // Initialize trigger system
    await triggerManager.initialize();

    // Initialize notification manager
    notificationManager.initialize();

    // Load persisted states
    stateMachine.loadPersistedStates();

    // Resume interrupted workflows
    await stateMachine.resumeInterruptedWorkflows();

    // Register orchestrator with agent bus
    agentBus.registerAgent({
      id: AGENTS.ORCHESTRATOR,
      name: 'orchestrator',
      type: 'orchestrator',
      version: '2.0.0',
      status: 'online',
      capabilities: ['coordination', 'routing', 'learning', 'proactive'],
      lastSeen: new Date()
    });

    // Subscribe to context updates
    agentBus.subscribe(AGENTS.ORCHESTRATOR, [TOPICS.CONTEXT_UPDATE], async (message: AgentMessage) => {
      await this.handleContextUpdate(message);
    });

    console.log('Agentic Orchestrator initialized');
  }

  /**
   * Process a user message and generate a response
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
      // Update session activity
      if (this.config.enableSessionContinuity) {
        sessionContinuityManager.updateActivity();
        sessionContinuityManager.saveChatMessage('user', message);
      }

      // Learn from user message
      if (this.config.enableLearning && sessionContinuityManager.getUserId()) {
        preferenceLearner.learnFromInteraction(
          sessionContinuityManager.getUserId()!,
          { message }
        );
      }

      // Step 1: Understanding - Extract user intent
      state.currentStep = 'understanding';
      state.intent = await this.extractIntent(message);
      
      // Store intent in context
      if (this.config.enableProactiveIntelligence) {
        contextEngine.setCurrentTrip('current_trip', state.intent);
      }

      // Step 2: Research - Gather information from various agents
      state.currentStep = 'researching';
      await this.gatherInformation(state);
      
      // Step 3: Planning - Generate itinerary and suggestions
      state.currentStep = 'planning';
      await this.generatePlan(state);
      
      // Step 4: Finalizing - Validate and optimize
      state.currentStep = 'finalizing';
      await this.finalizePlan(state);

      // Get proactive suggestions
      if (this.config.enableProactiveIntelligence) {
        state.proactiveSuggestions = contextEngine.getContextualSuggestions();
      }

      state.currentStep = 'complete';
      state.isProcessing = false;

      // Save assistant response to session
      if (this.config.enableSessionContinuity) {
        sessionContinuityManager.saveChatMessage('assistant', 
          state.suggestions?.join('\n') || 'Your travel plan is ready!'
        );
      }

    } catch (error) {
      console.error('Agentic orchestrator error:', error);
      state.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      state.isProcessing = false;
    }

    return state;
  }

  /**
   * Extract user intent with enhanced routing
   */
  private async extractIntent(message: string): Promise<TravelIntent> {
    try {
      // Use dynamic router for intent analysis
      if (this.config.enableMultiAgentCoordination) {
        const routingDecision = await dynamicAgentRouter.routeIntent(message);
        console.log('Routing decision:', routingDecision);
      }

      const intent = await aiGateway.extractTravelIntent(message);
      
      // Validate and enhance intent
      if (!intent.city) {
        intent.city = 'dubai';
      }
      
      if (!intent.travelers) {
        intent.travelers = { adults: 1, children: 0, infants: 0 };
      }
      
      if (!intent.dates) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const weekAfter = new Date(nextWeek);
        weekAfter.setDate(weekAfter.getDate() + 7);
        
        intent.dates = {
          start: nextWeek.toISOString().split('T')[0],
          end: weekAfter.toISOString().split('T')[0]
        };
      }

      // Store in shared context
      sharedContextStore.setLocal('current_intent', intent, AGENTS.ORCHESTRATOR);

      return intent;
    } catch (error) {
      console.error('Intent extraction failed:', error);
      throw new Error('Failed to understand your travel request');
    }
  }

  /**
   * Gather information using coordinated agents
   */
  private async gatherInformation(state: AgenticState): Promise<void> {
    if (!state.intent) {
      throw new Error('No intent available for research');
    }

    const tasks: Promise<void>[] = [];

    // Get weather information
    if (state.intent.city && state.intent.dates) {
      tasks.push(
        this.weatherAgent.getWeatherForecast(state.intent.city, state.intent.dates.start)
          .then(weather => { 
            state.weather = weather;
            sharedContextStore.setLocal('weather', weather, AGENTS.WEATHER);
          })
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
          .then(activities => { 
            state.activities = activities;
            sharedContextStore.setLocal('activities', activities, AGENTS.ACTIVITY);
          })
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
          .then(analysis => { 
            state.budgetAnalysis = analysis;
            sharedContextStore.setLocal('budget', analysis, AGENTS.BUDGET);
          })
          .catch(error => { 
            console.warn('Budget analysis failed:', error);
            state.errors.push('Budget analysis unavailable');
          })
      );
    }

    // Broadcast to agent bus
    if (this.config.enableMultiAgentCoordination) {
      agentBus.broadcast(TOPICS.TRIP_PLANNING, {
        intent: state.intent,
        city: state.intent.city
      });
    }

    await Promise.allSettled(tasks);
  }

  /**
   * Generate plan using planning agent
   */
  private async generatePlan(state: AgenticState): Promise<void> {
    if (!state.intent) {
      throw new Error('No intent available for planning');
    }

    try {
      const suggestions = await aiGateway.generateItinerarySuggestion(state.intent);
      state.suggestions = [suggestions];

      state.itinerary = await this.planningAgent.generateItinerary(
        state.intent,
        {
          weather: state.weather,
          activities: state.activities,
          budgetAnalysis: state.budgetAnalysis
        }
      );

      sharedContextStore.setLocal('itinerary', state.itinerary, AGENTS.PLANNING);

    } catch (error) {
      console.error('Plan generation failed:', error);
      state.errors.push('Failed to generate travel plan');
    }
  }

  /**
   * Finalize plan with validation
   */
  private async finalizePlan(state: AgenticState): Promise<void> {
    if (!state.itinerary || !state.intent) {
      throw new Error('No itinerary available for finalization');
    }

    try {
      const validation = await this.planningAgent.validateItinerary(state.itinerary, state.intent);
      
      if (!validation.isValid) {
        state.errors.push(...validation.issues);
        state.itinerary = await this.planningAgent.fixItineraryIssues(state.itinerary, validation.issues);
      }

      state.itinerary = await this.planningAgent.optimizeItinerary(state.itinerary, state.intent);

    } catch (error) {
      console.error('Plan finalization failed:', error);
      state.errors.push('Failed to finalize travel plan');
    }
  }

  /**
   * Handle context update from agent bus
   */
  private async handleContextUpdate(message: AgentMessage): Promise<void> {
    const payload = message.payload as { key?: string; value?: unknown };
    console.log('Context update received:', payload.key);
    
    if (payload.key === 'weather' && this.config.enableProactiveIntelligence) {
      const weatherData = payload.value as WeatherData[];
      if (weatherData.length > 0 && weatherData[0].conditions) {
        notificationManager.showWeatherAlert(
          'Dubai',
          weatherData[0].conditions
        );
      }
    }
  }

  /**
   * Generate clarifying questions for incomplete travel intent
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
   * Handle follow-up messages
   */
  async handleFollowUp(message: string, state: AgenticState): Promise<AgenticState> {
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

  /**
   * Start a new session
   */
  startSession(userId: string): string {
    const session = sessionContinuityManager.startSession(userId);
    return session.id;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return sessionContinuityManager.getSessionId();
  }

  /**
   * End current session
   */
  endSession(): void {
    sessionContinuityManager.endSession();
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    activeAgents: number;
    pendingActions: number;
    activeWorkflows: number;
    unreadNotifications: number;
  } {
    return {
      activeAgents: dynamicAgentRouter.getStats().totalAgents,
      pendingActions: actionAgent.getPendingActions().length,
      activeWorkflows: bookingWorkflowManager.getActiveWorkflows().length,
      unreadNotifications: notificationManager.getUnreadCount()
    };
  }
}

// Singleton instance
export const agenticOrchestrator = new AgenticOrchestrator();

// Context Engine - Tracks user session state and behavior for proactive intelligence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TravelIntent } from './ai-gateway';
import { Activity, OnboardingData } from '@/types';

export interface SessionContext {
  // identity User and preferences
  userId: string;
  sessionId: string;
  
  // Current trip context
  currentIntent: TravelIntent | null;
  currentTripId: string | null;
  
  // Activity history
  viewedActivities: string[];
  bookedActivities: string[];
  favoriteActivities: string[];
  
  // Interaction patterns
  messageCount: number;
  lastInteractionTime: Date;
  preferredLanguage: 'urdu' | 'english' | 'bilingual';
  
  // Preferences learned over time
  preferences: UserPreferences;
  
  // Session state
  isActive: boolean;
  startedAt: Date;
}

export interface UserPreferences {
  // Activity preferences
  preferredActivities: string[];
  avoidedActivities: string[];
  
  // Budget preferences
  averageBudgetRange: { min: number; max: number };
  spendingPattern: 'budget' | 'moderate' | 'luxury';
  
  // Time preferences
  preferredPace: 'relaxed' | 'standard' | 'packed';
  preferredStartTime: string;
  activityDuration: 'short' | 'medium' | 'long';
  
  // Travel style
  tripType: 'solo' | 'couple' | 'family' | 'group';
  interests: string[];
  
  // Communication preferences
  notificationFrequency: 'low' | 'medium' | 'high';
  proactiveTipsEnabled: boolean;
  priceAlertEnabled: boolean;
}

export interface ContextSuggestion {
  id: string;
  type: 'recommendation' | 'reminder' | 'tip' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relevanceScore: number;
  context: string;
  action?: {
    label: string;
    handler: string;
    params?: Record<string, unknown>;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export interface BehaviorPattern {
  patternType: 'search' | 'booking' | 'browsing' | 'planning';
  frequency: number;
  lastOccurrence: Date;
  averageSessionDuration: number;
  peakActivityHours: number[];
  commonQueries: string[];
}

class ContextEngine {
  private store: ReturnType<typeof createContextStore>;
  private patterns: Map<string, BehaviorPattern> = new Map();
  private suggestions: ContextSuggestion[] = [];
  private listeners: Set<(suggestions: ContextSuggestion[]) => void> = new Set();

  constructor() {
    this.store = createContextStore();
  }

  /**
   * Initialize context for a new user session
   */
  async initializeSession(userId: string): Promise<void> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.store.setState({
      userId,
      sessionId,
      currentIntent: null,
      currentTripId: null,
      viewedActivities: [],
      bookedActivities: [],
      favoriteActivities: [],
      messageCount: 0,
      lastInteractionTime: new Date(),
      preferredLanguage: 'bilingual',
      preferences: this.getDefaultPreferences(),
      isActive: true,
      startedAt: new Date()
    });

    await this.loadUserPreferences(userId);
    await this.loadBehaviorPatterns(userId);
  }

  /**
   * Update current trip context
   */
  setCurrentTrip(tripId: string, intent: TravelIntent): void {
    this.store.setState({
      currentTripId: tripId,
      currentIntent: intent
    });
    
    this.updateContext('trip_selection', { tripId, city: intent.city });
  }

  /**
   * Track activity view for recommendations
   */
  trackActivityView(activityId: string): void {
    const state = this.store.getState();
    const viewedActivities = [...new Set([...state.viewedActivities, activityId])];
    this.store.setState({ viewedActivities });
    
    this.updateContext('activity_view', { activityId });
    this.generateSuggestions();
  }

  /**
   * Track activity booking
   */
  trackActivityBooking(activityId: string): void {
    const state = this.store.getState();
    const bookedActivities = [...state.bookedActivities, activityId];
    this.store.setState({ bookedActivities });
    
    this.updateContext('activity_booking', { activityId });
    this.learnFromBooking(activityId);
  }

  /**
   * Track user message
   */
  trackMessage(): void {
    const state = this.store.getState();
    this.store.setState({
      messageCount: state.messageCount + 1,
      lastInteractionTime: new Date()
    });
    
    this.updateBehaviorPattern('search');
  }

  /**
   * Update preferred language based on user input
   */
  updatePreferredLanguage(language: 'urdu' | 'english' | 'bilingual'): void {
    this.store.setState({ preferredLanguage: language });
  }

  /**
   * Get context-aware suggestions based on current session state
   */
  getContextualSuggestions(): ContextSuggestion[] {
    const state = this.store.getState();
    const suggestions: ContextSuggestion[] = [];

    // Generate trip-related suggestions
    if (state.currentIntent && state.currentTripId) {
      suggestions.push(...this.generateTripSuggestions(state));
    }

    // Generate activity suggestions based on history
    if (state.viewedActivities.length > 0) {
      suggestions.push(...this.generateActivitySuggestions(state));
    }

    // Generate preference-based suggestions
    suggestions.push(...this.generatePreferenceSuggestions(state));

    // Sort by relevance and priority
    return suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.relevanceScore - a.relevanceScore;
    });
  }

  /**
   * Generate suggestions based on current trip
   */
  private generateTripSuggestions(state: SessionContext): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    if (state.currentIntent?.dates) {
      const tripDate = new Date(state.currentIntent.dates.start);
      const today = new Date();
      const daysUntilTrip = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilTrip <= 7 && daysUntilTrip > 0) {
        suggestions.push({
          id: `trip_reminder_${Date.now()}`,
          type: 'reminder',
          title: 'Trip Approaching Soon!',
          description: `Your trip to ${state.currentIntent.city} is in ${daysUntilTrip} days. Time to start planning!`,
          priority: daysUntilTrip <= 3 ? 'urgent' : 'high',
          relevanceScore: 0.95,
          context: 'trip_timeline',
          action: {
            label: 'Start Planning',
            handler: 'startPlanning'
          },
          createdAt: new Date()
        });
      }
    }

    if (state.currentIntent?.budget) {
      suggestions.push({
        id: `budget_tip_${Date.now()}`,
        type: 'tip',
        title: 'Budget Optimization',
        description: `Based on your ${state.currentIntent.budget?.amount?.toLocaleString() || state.currentIntent.budget} budget, here are some cost-effective activities...`,
        priority: 'medium',
        relevanceScore: 0.8,
        context: 'budget_planning',
        action: {
          label: 'View Budget Options',
          handler: 'viewBudgetOptions'
        },
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on viewed activities
   */
  private generateActivitySuggestions(state: SessionContext): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];

    // Similar activities based on viewed
    if (state.viewedActivities.length >= 3) {
      suggestions.push({
        id: `similar_activities_${Date.now()}`,
        type: 'recommendation',
        title: 'Similar Activities You Might Like',
        description: 'Based on your browsing history, here are some activities you might enjoy...',
        priority: 'medium',
        relevanceScore: 0.75,
        context: 'activity_recommendation',
        action: {
          label: 'View Recommendations',
          handler: 'viewSimilarActivities'
        },
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on user preferences
   */
  private generatePreferenceSuggestions(state: SessionContext): ContextSuggestion[] {
    const suggestions: ContextSuggestion[] = [];
    const { preferences } = state;

    if (preferences.proactiveTipsEnabled) {
      suggestions.push({
        id: `personalized_tip_${Date.now()}`,
        type: 'tip',
        title: 'Personalized Travel Tip',
        description: this.getPersonalizedTip(preferences),
        priority: 'low',
        relevanceScore: 0.6,
        context: 'personalized_tip',
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  /**
   * Get a personalized tip based on user preferences
   */
  private getPersonalizedTip(preferences: UserPreferences): string {
    const tips: string[] = [];

    if (preferences.interests.includes('shopping')) {
      tips.push('Dubai has amazing malls with great deals during sale seasons.');
    }
    if (preferences.interests.includes('culture')) {
      tips.push('Visit Al Fahidi Historical Neighborhood for an authentic Dubai experience.');
    }
    if (preferences.spendingPattern === 'budget') {
      tips.push('Consider using public transport - it\'s efficient and cost-effective.');
    }
    if (preferences.tripType === 'family') {
      tips.push('Dubai has many family-friendly attractions with child-friendly facilities.');
    }

    return tips[Math.floor(Math.random() * tips.length)] || 'Enjoy your trip to the UAE!';
  }

  /**
   * Learn from user booking behavior
   */
  private async learnFromBooking(activityId: string): Promise<void> {
    // In a real implementation, this would analyze the booked activity
    // and update user preferences accordingly
    console.log('Learning from booking:', activityId);
  }

  /**
   * Update behavior pattern based on interaction
   */
  private updateBehaviorPattern(patternType: BehaviorPattern['patternType']): void {
    const existing = this.patterns.get(patternType);
    
    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = new Date();
    } else {
      this.patterns.set(patternType, {
        patternType,
        frequency: 1,
        lastOccurrence: new Date(),
        averageSessionDuration: 0,
        peakActivityHours: [],
        commonQueries: []
      });
    }
  }

  /**
   * Update context in the store
   */
  private updateContext(contextType: string, data: Record<string, unknown>): void {
    console.log('Context updated:', contextType, data);
    this.generateSuggestions();
  }

  /**
   * Generate and emit suggestions to listeners
   */
  private generateSuggestions(): void {
    const suggestions = this.getContextualSuggestions();
    this.suggestions = suggestions;
    this.listeners.forEach(listener => listener(suggestions));
  }

  /**
   * Load user preferences from storage
   */
  private async loadUserPreferences(userId: string): Promise<void> {
    // In a real implementation, this would load from Supabase or local storage
    const stored = localStorage.getItem(`user_prefs_${userId}`);
    if (stored) {
      const preferences = JSON.parse(stored);
      this.store.setState({ preferences });
    }
  }

  /**
   * Load behavior patterns from storage
   */
  private async loadBehaviorPatterns(userId: string): Promise<void> {
    // In a real implementation, this would load from Supabase
    console.log('Loading behavior patterns for user:', userId);
  }

  /**
   * Save user preferences to storage
   */
  async saveUserPreferences(): Promise<void> {
    const state = this.store.getState();
    localStorage.setItem(
      `user_prefs_${state.userId}`,
      JSON.stringify(state.preferences)
    );
  }

  /**
   * Get current session context
   */
  getContext(): SessionContext {
    return this.store.getState();
  }

  /**
   * Subscribe to suggestion updates
   */
  subscribeToSuggestions(listener: (suggestions: ContextSuggestion[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    await this.saveUserPreferences();
    this.store.setState({ isActive: false });
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      preferredActivities: [],
      avoidedActivities: [],
      averageBudgetRange: { min: 100, max: 500 },
      spendingPattern: 'moderate',
      preferredPace: 'standard',
      preferredStartTime: '09:00',
      activityDuration: 'medium',
      tripType: 'solo',
      interests: [],
      notificationFrequency: 'medium',
      proactiveTipsEnabled: true,
      priceAlertEnabled: true
    };
  }
}

// Zustand store for context state
function createContextStore() {
  return create<SessionContext>()(
    persist(
      (set) => ({
        userId: '',
        sessionId: '',
        currentIntent: null,
        currentTripId: null,
        viewedActivities: [],
        bookedActivities: [],
        favoriteActivities: [],
        messageCount: 0,
        lastInteractionTime: new Date(),
        preferredLanguage: 'bilingual',
        preferences: {
          preferredActivities: [],
          avoidedActivities: [],
          averageBudgetRange: { min: 100, max: 500 },
          spendingPattern: 'moderate',
          preferredPace: 'standard',
          preferredStartTime: '09:00',
          activityDuration: 'medium',
          tripType: 'solo',
          interests: [],
          notificationFrequency: 'medium',
          proactiveTipsEnabled: true,
          priceAlertEnabled: true
        },
        isActive: false,
        startedAt: new Date()
      }),
      {
        name: 'context-engine-storage',
        partialize: (state) => ({
          userId: state.userId,
          viewedActivities: state.viewedActivities,
          bookedActivities: state.bookedActivities,
          favoriteActivities: state.favoriteActivities,
          preferences: state.preferences
        })
      }
    )
  );
}

// Singleton instance
export const contextEngine = new ContextEngine();

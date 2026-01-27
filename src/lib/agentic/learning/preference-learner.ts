// User Preference Learner - Learn and store preferences across sessions
export interface UserProfile {
  userId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  preferences: LearnedPreferences;
  interactionCount: number;
  lastInteraction: Date;
}

export interface LearnedPreferences {
  favoriteActivities: string[];
  dislikedActivities: string[];
  preferredActivityTypes: string[];
  preferredDuration: 'short' | 'medium' | 'long';
  averageSpend: number;
  spendRange: { min: number; max: number };
  spendingTendency: 'budget' | 'moderate' | 'luxury';
  preferredStartTime: string;
  preferredPace: 'relaxed' | 'moderate' | 'packed';
  activityDensity: 'low' | 'medium' | 'high';
  tripType: 'solo' | 'couple' | 'family' | 'group';
  preferredCities: string[];
  travelStyle: 'adventurous' | 'balanced' | 'comfortable';
  preferredLanguage: 'urdu' | 'english' | 'bilingual';
  responseStyle: 'concise' | 'detailed' | 'balanced';
  confidenceScores: Record<string, number>;
  lastLearnedAt: Record<string, Date>;
  [key: string]: unknown;
}

export interface PreferenceUpdate {
  preference: string;
  oldValue: unknown;
  newValue: unknown;
  source: 'explicit' | 'implicit' | 'correction';
  confidence: number;
  timestamp: Date;
}

export interface PreferencePattern {
  preference: string;
  value: unknown;
  occurrenceCount: number;
  lastSeen: Date;
  confidence: number;
}

// ==================== Preference Learner Class ====================

class PreferenceLearner {
  private profiles: Map<string, UserProfile> = new Map();
  private patterns: Map<string, Map<string, PreferencePattern>> = new Map();
  private updateHistory: Map<string, PreferenceUpdate[]> = new Map();
  private currentUserId: string | null = null;

  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MIN_OCCURRENCES = 3;

  /**
   * Initialize or get user profile
   */
  getOrCreateProfile(userId: string): UserProfile {
    let profile = this.profiles.get(userId);
    
    if (!profile) {
      const loaded = this.loadProfile(userId);
      if (loaded) {
        profile = loaded;
      } else {
        profile = {
          userId,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: this.getDefaultPreferences(),
          interactionCount: 0,
          lastInteraction: new Date()
        };
      }
    }
    
    this.currentUserId = userId;
    return profile;
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): LearnedPreferences {
    return {
      favoriteActivities: [],
      dislikedActivities: [],
      preferredActivityTypes: [],
      preferredDuration: 'medium',
      averageSpend: 0,
      spendRange: { min: 100, max: 500 },
      spendingTendency: 'moderate',
      preferredStartTime: '09:00',
      preferredPace: 'moderate',
      activityDensity: 'medium',
      tripType: 'solo',
      preferredCities: [],
      travelStyle: 'balanced',
      preferredLanguage: 'bilingual',
      responseStyle: 'balanced',
      confidenceScores: {},
      lastLearnedAt: {}
    };
  }

  /**
   * Learn from user interaction
   */
  learnFromInteraction(
    userId: string,
    interaction: {
      message?: string;
      action?: string;
      selection?: string;
      correction?: string;
      feedback?: 'positive' | 'negative' | 'neutral';
    }
  ): void {
    const profile = this.getOrCreateProfile(userId);
    profile.interactionCount++;
    profile.lastInteraction = new Date();
    profile.updatedAt = new Date();

    if (interaction.message) {
      this.learnFromMessage(profile, interaction.message);
    }
    if (interaction.action) {
      this.learnFromAction(profile, interaction.action);
    }
    if (interaction.selection) {
      this.learnFromSelection(profile, interaction.selection);
    }
    if (interaction.correction) {
      this.learnFromCorrection(profile, interaction.correction);
    }
    if (interaction.feedback) {
      this.learnFromFeedback(profile, interaction.feedback);
    }

    this.saveProfile(profile);
  }

  /**
   * Learn from message content
   */
  private learnFromMessage(profile: UserProfile, message: string): void {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('السلام') || lowerMessage.includes('کے') || lowerMessage.includes('ہے')) {
      this.updatePreference(profile, 'preferredLanguage', 'urdu', 'implicit', 0.8);
    } else if (lowerMessage.split(/\s+/).every(w => /^[a-zA-Z]+$/.test(w))) {
      this.updatePreference(profile, 'preferredLanguage', 'english', 'implicit', 0.8);
    }

    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
      this.updatePreference(profile, 'spendingTendency', 'budget', 'implicit', 0.7);
    } else if (lowerMessage.includes('luxury') || lowerMessage.includes('premium')) {
      this.updatePreference(profile, 'spendingTendency', 'luxury', 'implicit', 0.7);
    }

    if (lowerMessage.includes('family') || lowerMessage.includes('kids')) {
      this.updatePreference(profile, 'tripType', 'family', 'implicit', 0.8);
    } else if (lowerMessage.includes('couple') || lowerMessage.includes('honeymoon')) {
      this.updatePreference(profile, 'tripType', 'couple', 'implicit', 0.8);
    } else if (lowerMessage.includes('solo') || lowerMessage.includes('alone')) {
      this.updatePreference(profile, 'tripType', 'solo', 'implicit', 0.8);
    }

    if (lowerMessage.includes('relaxed') || lowerMessage.includes('slow')) {
      this.updatePreference(profile, 'preferredPace', 'relaxed', 'implicit', 0.7);
    } else if (lowerMessage.includes('packed') || lowerMessage.includes('full day')) {
      this.updatePreference(profile, 'preferredPace', 'packed', 'implicit', 0.7);
    }

    const cities = ['dubai', 'abu dhabi', 'sharjah', 'ras al khaimah', 'fujairah'];
    cities.forEach(city => {
      if (lowerMessage.includes(city)) {
        this.addToListPreference(profile, 'preferredCities', city, 'implicit');
      }
    });
  }

  /**
   * Learn from action
   */
  private learnFromAction(profile: UserProfile, action: string): void {
    if (action.includes('booking') || action.includes('purchase')) {
      this.updatePreference(profile, 'spendingTendency', 'moderate', 'implicit', 0.6);
    }
  }

  /**
   * Learn from selection
   */
  private learnFromSelection(profile: UserProfile, selection: string): void {
    this.addToListPreference(profile, 'favoriteActivities', selection, 'implicit');
  }

  /**
   * Learn from correction
   */
  private learnFromCorrection(profile: UserProfile, _correction: string): void {
    this.updatePreference(profile, 'responseStyle', 'detailed', 'correction', 0.95);
  }

  /**
   * Learn from feedback
   */
  private learnFromFeedback(profile: UserProfile, feedback: 'positive' | 'negative' | 'neutral'): void {
    const confidenceMap: Record<string, number> = { positive: 0.8, negative: 0.6, neutral: 0.4 };
    this.updatePreference(profile, 'engagementLevel', feedback, 'explicit', confidenceMap[feedback] || 0.5);
  }

  /**
   * Update a preference
   */
  private updatePreference(
    profile: UserProfile,
    preference: string,
    value: unknown,
    source: 'explicit' | 'implicit' | 'correction',
    baseConfidence: number
  ): void {
    const oldValue = profile.preferences[preference];
    const confidence = this.calculateConfidence(profile, preference, source, baseConfidence);

    if (confidence >= this.CONFIDENCE_THRESHOLD || oldValue !== value) {
      profile.preferences[preference] = value;
      profile.preferences.confidenceScores[preference] = confidence;
      profile.preferences.lastLearnedAt[preference] = new Date();
      profile.version++;

      this.recordUpdate(profile.userId, {
        preference,
        oldValue,
        newValue: value,
        source,
        confidence,
        timestamp: new Date()
      });
    }
  }

  /**
   * Add to list preference
   */
  private addToListPreference(
    profile: UserProfile,
    preference: string,
    value: string,
    source: 'explicit' | 'implicit' | 'correction'
  ): void {
    const list = profile.preferences[preference] as string[] | undefined;
    if (list && !list.includes(value)) {
      list.push(value);
      profile.version++;
    }
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(
    profile: UserProfile,
    preference: string,
    source: 'explicit' | 'implicit' | 'correction',
    baseConfidence: number
  ): number {
    const sourceMultiplier: Record<string, number> = { explicit: 1.0, correction: 0.95, implicit: 0.8 };
    const history = this.patterns.get(profile.userId)?.get(preference);

    if (history) {
      const occurrenceBonus = Math.min(history.occurrenceCount * 0.05, 0.2);
      return Math.min(sourceMultiplier[source] * baseConfidence + occurrenceBonus, 1.0);
    }

    return sourceMultiplier[source] * baseConfidence;
  }

  /**
   * Record update
   */
  private recordUpdate(userId: string, update: PreferenceUpdate): void {
    const history = this.updateHistory.get(userId) || [];
    history.unshift(update);
    if (history.length > 100) history.pop();
    this.updateHistory.set(userId, history);

    if (!this.patterns.has(userId)) {
      this.patterns.set(userId, new Map());
    }
    
    const userPatterns = this.patterns.get(userId)!;
    const existing = userPatterns.get(update.preference);
    
    if (existing) {
      existing.occurrenceCount++;
      existing.lastSeen = new Date();
      existing.confidence = update.confidence;
    } else {
      userPatterns.set(update.preference, {
        preference: update.preference,
        value: update.newValue,
        occurrenceCount: 1,
        lastSeen: new Date(),
        confidence: update.confidence
      });
    }
  }

  /**
   * Get preferences
   */
  getPreferences(userId: string): LearnedPreferences | null {
    const profile = this.profiles.get(userId);
    return profile?.preferences || null;
  }

  /**
   * Get confidence scores
   */
  getConfidenceScores(userId: string): Record<string, number> {
    const profile = this.profiles.get(userId);
    return profile?.preferences.confidenceScores || {};
  }

  /**
   * Get update history
   */
  getUpdateHistory(userId: string): PreferenceUpdate[] {
    return this.updateHistory.get(userId) || [];
  }

  /**
   * Export profile
   */
  exportProfile(userId: string): string | null {
    const profile = this.profiles.get(userId);
    return profile ? JSON.stringify(profile, null, 2) : null;
  }

  /**
   * Import profile
   */
  importProfile(profileData: string): void {
    try {
      const profile = JSON.parse(profileData) as UserProfile;
      profile.createdAt = new Date(profile.createdAt);
      profile.updatedAt = new Date(profile.updatedAt);
      this.profiles.set(profile.userId, profile);
    } catch (error) {
      console.error('Failed to import profile:', error);
    }
  }

  /**
   * Clear user data
   */
  clearUserData(userId: string): void {
    this.profiles.delete(userId);
    this.patterns.delete(userId);
    this.updateHistory.delete(userId);
    localStorage.removeItem(`user_profile_${userId}`);
  }

  /**
   * Save profile
   */
  private saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(`user_profile_${profile.userId}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  /**
   * Load profile
   */
  private loadProfile(userId: string): UserProfile | null {
    try {
      const stored = localStorage.getItem(`user_profile_${userId}`);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        profile.createdAt = new Date(profile.createdAt);
        profile.updatedAt = new Date(profile.updatedAt);
        return profile;
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
    return null;
  }

  /**
   * Predict next preference
   */
  predictNextPreference(userId: string): { preference: string; predictedValue: unknown; confidence: number } | null {
    const patterns = this.patterns.get(userId);
    if (!patterns) return null;

    let best: { preference: string; value: unknown; confidence: number } | null = null;

    patterns.forEach((pattern, preference) => {
      if (pattern.occurrenceCount >= this.MIN_OCCURRENCES) {
        if (!best || pattern.confidence > best.confidence) {
          best = { preference, value: pattern.value, confidence: pattern.confidence };
        }
      }
    });

    return best;
  }
}

// Singleton instance
export const preferenceLearner = new PreferenceLearner();

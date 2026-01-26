// Simple analytics tracking for user behavior
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

class SimpleAnalytics {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.loadStoredEvents();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadStoredEvents() {
    try {
      const stored = localStorage.getItem('uae-analytics-events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics events:', error);
    }
  }

  private saveEvents() {
    try {
      localStorage.setItem('uae-analytics-events', JSON.stringify(this.events.slice(-100))); // Keep last 100 events
    } catch (error) {
      console.warn('Failed to save analytics events:', error);
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    this.saveEvents();

    // In production, you could send this to an analytics service
    // this.sendToAnalyticsService(analyticsEvent);
  }

  // Track page views
  page(page: string) {
    this.track('page_view', { page });
  }

  // Track user interactions
  trackClick(element: string, context?: string) {
    this.track('click', { element, context });
  }

  // Track feature usage
  trackFeature(feature: string, action?: string) {
    this.track('feature_used', { feature, action });
  }

  // Track errors
  trackError(error: string, context?: string) {
    this.track('error', { error, context });
  }

  // Track conversion events
  trackConversion(type: string, value?: number) {
    this.track('conversion', { type, value });
  }

  // Get analytics summary
  getSummary() {
    const summary = {
      totalEvents: this.events.length,
      sessionStart: this.events[0]?.timestamp || Date.now(),
      lastActivity: this.events[this.events.length - 1]?.timestamp || Date.now(),
      uniqueEvents: new Set(this.events.map(e => e.event)).size,
      pageViews: this.events.filter(e => e.event === 'page_view').length,
      errors: this.events.filter(e => e.event === 'error').length,
      conversions: this.events.filter(e => e.event === 'conversion').length,
    };

    return summary;
  }

  // Export analytics data
  exportData() {
    return {
      sessionId: this.sessionId,
      events: this.events,
      summary: this.getSummary(),
      exportedAt: Date.now(),
    };
  }

  // Clear analytics data
  clearData() {
    this.events = [];
    localStorage.removeItem('uae-analytics-events');
  }
}

// Create singleton instance
const analytics = new SimpleAnalytics();

// React hook for analytics
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFeature: analytics.trackFeature.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    getSummary: analytics.getSummary.bind(analytics),
    exportData: analytics.exportData.bind(analytics),
    clearData: analytics.clearData.bind(analytics),
  };
};

export default analytics;

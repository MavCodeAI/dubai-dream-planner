import { describe, it, expect, beforeEach } from 'vitest';
import { PlanningAgent } from '../lib/agentic/agents/planning-agent';
import type { TravelIntent } from '../lib/agentic/ai-gateway';
// Activity type imported from types

describe('PlanningAgent', () => {
  let planningAgent: PlanningAgent;

  beforeEach(() => {
    planningAgent = new PlanningAgent();
  });

  describe('generateItinerary', () => {
    it('should generate itinerary for Dubai trip', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-07' },
        travelers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 5000, currency: 'AED' },
        interests: ['culture', 'adventure']
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      expect(itinerary).toBeDefined();
      expect(itinerary.city).toBe('dubai');
      expect(itinerary.days.length).toBe(7);
      expect(itinerary.totalCost).toBeGreaterThan(0);
    });

    it('should calculate total cost correctly', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-03' }, // 3 days
        travelers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 3000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      const calculatedTotal = itinerary.days.reduce((sum, day) => sum + day.totalCost, 0);
      expect(itinerary.totalCost).toBe(calculatedTotal);
    });

    it('should generate summary with activity counts', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-04' }, // 4 days
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 2000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      expect(itinerary.summary.activities).toBeGreaterThan(0);
      expect(itinerary.summary.freeActivities + itinerary.summary.paidActivities).toBe(itinerary.summary.activities);
    });

    it('should generate recommendations', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-03' },
        travelers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 3000, currency: 'AED' },
        tripType: 'family'
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      expect(itinerary.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle short trips', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-02' }, // 2 days
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 1000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      expect(itinerary.days.length).toBe(2);
    });

    it('should include weather data if provided', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-03' },
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 1000, currency: 'AED' }
      };

      const context = {
        weather: [{
          date: '2024-03-01',
          temperature: { min: 25, max: 35, average: 30 },
          conditions: 'Sunny',
          humidity: 60,
          windSpeed: 10,
          recommendations: []
        }]
      };

      const itinerary = await planningAgent.generateItinerary(intent, context);
      
      expect(itinerary.days[0].weather).toBeDefined();
      expect(itinerary.days[0].weather.temperature.average).toBe(30);
    });
  });

  describe('validateItinerary', () => {
    it('should validate a complete itinerary', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-03' },
        travelers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 5000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      const validation = await planningAgent.validateItinerary(itinerary, intent);
      
      expect(validation.isValid).toBe(true);
    });

    it('should detect over-scheduled days', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-01' },
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 1000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      // Manually over-schedule the first day
      itinerary.days[0].totalDuration = 12;
      
      const validation = await planningAgent.validateItinerary(itinerary, intent);
      
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('Day 1');
    });

    it('should warn about budget issues', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-03' },
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 100, currency: 'AED' } // Very low budget
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      const validation = await planningAgent.validateItinerary(itinerary, intent);
      
      expect(validation.issues.some(i => i.includes('exceeds budget'))).toBe(true);
    });

    it('should suggest cultural activities for Dubai', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-02' },
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 1000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      // Remove all cultural activities
      itinerary.days.forEach(day => {
        day.activities = day.activities.filter(pa => pa.activity.category !== 'Cultural');
      });
      
      const validation = await planningAgent.validateItinerary(itinerary, intent);
      
      expect(validation.suggestions.some(s => s.includes('cultural'))).toBe(true);
    });
  });

  describe('fixItineraryIssues', () => {
    it('should reduce over-scheduled days', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-02' },
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 1000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      // Over-schedule first day
      itinerary.days[0].totalDuration = 12;
      itinerary.days[0].activities = [
        ...itinerary.days[0].activities,
        { activity: { id: 'extra1', name: 'Extra 1', category: 'Indoor', description: '', duration: 3, price: { adult: 50, child: 40, currency: 'AED' }, location: { city: 'dubai', area: 'Test' }, rating: 4.0, reviews: 100, images: [], suitableFor: ['solo'], bestTime: 'Anytime', weatherDependent: false, bookingRequired: false, tips: [] }, startTime: '2:00 PM', endTime: '5:00 PM', estimatedCost: 50, notes: [] },
        { activity: { id: 'extra2', name: 'Extra 2', category: 'Indoor', description: '', duration: 3, price: { adult: 50, child: 40, currency: 'AED' }, location: { city: 'dubai', area: 'Test' }, rating: 4.0, reviews: 100, images: [], suitableFor: ['solo'], bestTime: 'Anytime', weatherDependent: false, bookingRequired: false, tips: [] }, startTime: '5:00 PM', endTime: '8:00 PM', estimatedCost: 50, notes: [] }
      ];
      
      const fixed = await planningAgent.fixItineraryIssues(itinerary, ['Over-scheduled day']);
      
      expect(fixed.days[0].totalDuration).toBeLessThanOrEqual(8);
    });
  });

  describe('optimizeItinerary', () => {
    it('should reorder activities by location', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-01' },
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 1000, currency: 'AED' }
      };

      const itinerary = await planningAgent.generateItinerary(intent, {});
      
      // Set different areas
      if (itinerary.days[0].activities.length > 1) {
        const activityAreas = ['Zabeel', 'Al Quoz', 'Marina'];
        itinerary.days[0].activities.forEach((pa, i) => {
          pa.activity.location!.area = activityAreas[i % activityAreas.length];
        });
        
        const optimized = await planningAgent.optimizeItinerary(itinerary, intent);
        
        // Activities should be sorted alphabetically by area
        const sortedAreas = optimized.days[0].activities.map(pa => pa.activity.location!.area);
        const expectedOrder = [...sortedAreas].sort();
        expect(sortedAreas).toEqual(expectedOrder);
      }
    });
  });

  describe('private methods', () => {
    it('should calculate days between dates', () => {
      const days = (planningAgent as any).calculateDaysBetweenDates('2024-03-01', '2024-03-08');
      expect(days).toBe(8); // Inclusive
    });

    it('should add days to date', () => {
      const newDate = (planningAgent as any).addDaysToDate('2024-03-01', 5);
      expect(newDate).toBe('2024-03-06');
    });

    it('should generate unique itinerary ID', () => {
      const id1 = (planningAgent as any).generateItineraryId();
      const id2 = (planningAgent as any).generateItineraryId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('itinerary_');
    });

    it('should generate itinerary title', () => {
      const title = (planningAgent as any).generateItineraryTitle('dubai', '2024-03-01', '2024-03-07');
      
      expect(title).toContain('Dubai');
      expect(title).toContain('Mar');
    });

    it('should format time correctly', () => {
      expect((planningAgent as any).formatTime(9)).toBe('9:00 AM');
      expect((planningAgent as any).formatTime(14)).toBe('2:00 PM');
      expect((planningAgent as any).formatTime(12)).toBe('12:00 PM');
      expect((planningAgent as any).formatTime(0)).toBe('12:00 AM');
    });
  });

  describe('day focus rotation', () => {
    it('should rotate day focus', () => {
      const focus1 = (planningAgent as any).getDayFocus(1);
      const focus2 = (planningAgent as any).getDayFocus(2);
      const focus7 = (planningAgent as any).getDayFocus(7);
      
      expect(focus1).not.toBe(focus2);
      expect(focus1).not.toBe(focus7);
    });
  });
});

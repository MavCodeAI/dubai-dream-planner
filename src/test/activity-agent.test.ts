import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityAgent } from '../lib/agentic/agents/activity-agent';
import type { TravelIntent } from '../lib/agentic/ai-gateway';

describe('ActivityAgent', () => {
  let activityAgent: ActivityAgent;

  beforeEach(() => {
    activityAgent = new ActivityAgent();
  });

  describe('getActivities', () => {
    it('should return activities for Dubai', async () => {
      const activities = await activityAgent.getActivities('dubai');
      
      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      
      // All activities should be in Dubai
      activities.forEach(activity => {
        expect(activity.location.city.toLowerCase()).toBe('dubai');
      });
    });

    it('should return activities for Abu Dhabi', async () => {
      const activities = await activityAgent.getActivities('abu-dhabi');
      
      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      
      activities.forEach(activity => {
        expect(activity.location.city.toLowerCase()).toBe('abu-dhabi');
      });
    });

    it('should be case insensitive for city name', async () => {
      const activitiesLower = await activityAgent.getActivities('dubai');
      const activitiesUpper = await activityAgent.getActivities('DUBAI');
      const activitiesMixed = await activityAgent.getActivities('Dubai');
      
      expect(activitiesLower.length).toBe(activitiesUpper.length);
      expect(activitiesLower.length).toBe(activitiesMixed.length);
    });

    it('should return empty array for unknown city', async () => {
      const activities = await activityAgent.getActivities('unknown-city');
      
      expect(activities).toEqual([]);
    });
  });

  describe('getActivities with intent filter', () => {
    it('should filter by interests', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        interests: ['adventure']
      };

      const activities = await activityAgent.getActivities('dubai', intent);
      
      expect(activities.length).toBeGreaterThan(0);
      activities.forEach(activity => {
        expect(['Adventure', 'Outdoor']).toContain(activity.category);
      });
    });

    it('should filter by family-friendly when children present', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        travelers: { adults: 2, children: 1, infants: 0 }
      };

      const activities = await activityAgent.getActivities('dubai', intent);
      
      expect(activities.length).toBeGreaterThan(0);
      activities.forEach(activity => {
        expect(activity.suitableFor).toContain('families');
      });
    });
  });

  describe('searchActivities', () => {
    it('should find activities by name', async () => {
      const results = await activityAgent.searchActivities('burj', 'dubai');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('burj');
    });

    it('should find activities by description', async () => {
      const results = await activityAgent.searchActivities('roller coaster', 'abu-dhabi');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find activities by category', async () => {
      const results = await activityAgent.searchActivities('beach', 'dubai');
      
      results.forEach(activity => {
        expect(activity.category).toBe('Beach');
      });
    });

    it('should be case insensitive', async () => {
      const resultsLower = await activityAgent.searchActivities('desert safari', 'dubai');
      const resultsUpper = await activityAgent.searchActivities('DESERT SAFARI', 'dubai');
      
      expect(resultsLower.length).toBe(resultsUpper.length);
    });

    it('should return empty for no matches', async () => {
      const results = await activityAgent.searchActivities('xyznonexistent', 'dubai');
      
      expect(results).toEqual([]);
    });
  });

  describe('getActivityById', () => {
    it('should return activity by valid id', () => {
      const activity = activityAgent.getActivityById('burj-khalifa');
      
      expect(activity).toBeDefined();
      expect(activity?.id).toBe('burj-khalifa');
      expect(activity?.name).toBe('Burj Khalifa');
    });

    it('should return undefined for invalid id', () => {
      const activity = activityAgent.getActivityById('invalid-id');
      
      expect(activity).toBeUndefined();
    });
  });

  describe('getActivitiesByCategory', () => {
    it('should return activities by category', async () => {
      const activities = await activityAgent.getActivitiesByCategory('adventure', 'dubai');
      
      expect(activities.length).toBeGreaterThan(0);
      activities.forEach(activity => {
        expect(activity.category).toBe('Adventure');
      });
    });

    it('should return activities for cultural category', async () => {
      const activities = await activityAgent.getActivitiesByCategory('cultural', 'dubai');
      
      expect(activities.length).toBeGreaterThan(0);
      activities.forEach(activity => {
        expect(activity.category).toBe('Cultural');
      });
    });

    it('should be case insensitive', async () => {
      const activitiesLower = await activityAgent.getActivitiesByCategory('shopping', 'dubai');
      const activitiesUpper = await activityAgent.getActivitiesByCategory('SHOPPING', 'dubai');
      
      expect(activitiesLower.length).toBe(activitiesUpper.length);
    });
  });

  describe('getRecommendedItinerary', () => {
    it('should generate itinerary for multiple days', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        interests: ['culture', 'adventure']
      };

      const itinerary = await activityAgent.getRecommendedItinerary('dubai', intent, 3);
      
      expect(itinerary).toBeDefined();
      expect(itinerary.length).toBe(3); // 3 days
      itinerary.forEach(dayActivities => {
        expect(Array.isArray(dayActivities)).toBe(true);
      });
    });

    it('should return activities within max hours per day', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        interests: ['culture']
      };

      const itinerary = await activityAgent.getRecommendedItinerary('dubai', intent, 2);
      
      itinerary.forEach(dayActivities => {
        const totalHours = dayActivities.reduce((sum, a) => sum + a.duration, 0);
        expect(totalHours).toBeLessThanOrEqual(12); // Allow some buffer
      });
    });
  });

  describe('activity data integrity', () => {
    it('should have valid activity structure', async () => {
      const activities = await activityAgent.getActivities('dubai');
      
      activities.forEach(activity => {
        expect(activity.id).toBeDefined();
        expect(activity.name).toBeDefined();
        expect(activity.category).toBeDefined();
        expect(activity.description).toBeDefined();
        expect(activity.duration).toBeGreaterThan(0);
        expect(activity.price).toBeDefined();
        expect(activity.location).toBeDefined();
        expect(activity.rating).toBeGreaterThanOrEqual(0);
        expect(activity.rating).toBeLessThanOrEqual(5);
        expect(activity.reviews).toBeGreaterThanOrEqual(0);
        expect(activity.suitableFor).toBeInstanceOf(Array);
      });
    });

    it('should have valid price structure', async () => {
      const activities = await activityAgent.getActivities('dubai');
      
      activities.forEach(activity => {
        expect(typeof activity.price.adult).toBe('number');
        expect(typeof activity.price.child).toBe('number');
        expect(typeof activity.price.currency).toBe('string');
      });
    });

    it('should have valid location structure', async () => {
      const activities = await activityAgent.getActivities('dubai');
      
      activities.forEach(activity => {
        expect(typeof activity.location.city).toBe('string');
        expect(typeof activity.location.area).toBe('string');
      });
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetAgent } from '../lib/agentic/agents/budget-agent';
import type { TravelIntent } from '../lib/agentic/ai-gateway';
import type { Activity } from '../types';

describe('BudgetAgent', () => {
  let budgetAgent: BudgetAgent;

  beforeEach(() => {
    budgetAgent = new BudgetAgent();
  });

  describe('analyzeBudget', () => {
    it('should analyze budget for Dubai trip', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-07' },
        travelers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 5000, currency: 'AED' }
      };

      const analysis = await budgetAgent.analyzeBudget(intent);
      
      expect(analysis).toBeDefined();
      expect(analysis.totalBudget).toBe(5000);
      expect(analysis.currency).toBe('AED');
      expect(analysis.breakdown).toBeDefined();
      expect(analysis.dailyBudget).toBeGreaterThan(0);
      expect(['within-budget', 'over-budget', 'tight']).toContain(analysis.budgetStatus);
    });

    it('should calculate daily budget correctly', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-08' }, // 7 days
        travelers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 7000, currency: 'AED' }
      };

      const analysis = await budgetAgent.analyzeBudget(intent);
      
      expect(analysis.dailyBudget).toBe(1000); // 7000 / 7 days
    });

    it('should handle Abu Dhabi city costs', async () => {
      const intent: TravelIntent = {
        city: 'abu-dhabi',
        dates: { start: '2024-03-01', end: '2024-03-04' }, // 3 days
        travelers: { adults: 2, children: 1, infants: 0 },
        budget: { amount: 3000, currency: 'AED' }
      };

      const analysis = await budgetAgent.analyzeBudget(intent);
      
      expect(analysis.breakdown.accommodation).toBeLessThan(analysis.breakdown.activities);
    });

    it('should throw error when no budget provided', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        travelers: { adults: 1, children: 0, infants: 0 }
      };

      await expect(budgetAgent.analyzeBudget(intent)).rejects.toThrow('No budget provided');
    });

    it('should calculate traveler multiplier correctly', async () => {
      const intent: TravelIntent = {
        city: 'dubai',
        dates: { start: '2024-03-01', end: '2024-03-03' }, // 2 days
        travelers: { adults: 2, children: 2, infants: 0 }, // 2 adults + 1.2 children = 3.2 multiplier
        budget: { amount: 10000, currency: 'AED' }
      };

      const analysis = await budgetAgent.analyzeBudget(intent);
      
      // Food and activities should be higher due to more travelers
      expect(analysis.breakdown.food).toBeGreaterThan(analysis.breakdown.shopping);
    });
  });

  describe('estimateActivityCosts', () => {
    const mockActivities: Activity[] = [
      {
        id: 'burj-khalifa',
        name: 'Burj Khalifa',
        category: 'Indoor',
        description: 'Observation deck',
        duration: 2,
        price: { adult: 150, child: 120, currency: 'AED' },
        location: { city: 'dubai', area: 'Downtown Dubai' },
        rating: 4.8,
        reviews: 45000,
        images: [],
        suitableFor: ['families', 'couples', 'solo'],
        bestTime: '5-7 PM',
        weatherDependent: false,
        bookingRequired: true,
        tips: []
      }
    ];

    it('should estimate costs for 2 adults', async () => {
      const estimates = await budgetAgent.estimateActivityCosts(mockActivities, { adults: 2, children: 0 });
      
      expect(estimates.length).toBe(1);
      expect(estimates[0].estimatedCost).toBe(300); // 150 * 2 adults
    });

    it('should estimate costs for adults and children', async () => {
      const estimates = await budgetAgent.estimateActivityCosts(mockActivities, { adults: 2, children: 1 });
      
      expect(estimates[0].estimatedCost).toBe(420); // 150*2 + 120*1
    });

    it('should determine necessity correctly', async () => {
      const estimates = await budgetAgent.estimateActivityCosts(mockActivities, { adults: 1, children: 0 });
      
      expect(estimates[0].necessity).toBe('essential');
    });

    it('should have correct currency', async () => {
      const estimates = await budgetAgent.estimateActivityCosts(mockActivities, { adults: 1, children: 0 });
      
      expect(estimates[0].currency).toBe('AED');
    });
  });

  describe('optimizeBudget', () => {
    const mockActivities: Activity[] = [
      {
        id: 'burj-khalifa',
        name: 'Burj Khalifa',
        category: 'Indoor',
        description: 'Observation deck',
        duration: 2,
        price: { adult: 150, child: 120, currency: 'AED' },
        location: { city: 'dubai', area: 'Downtown Dubai' },
        rating: 4.8,
        reviews: 45000,
        images: [],
        suitableFor: ['families', 'couples', 'solo'],
        bestTime: '5-7 PM',
        weatherDependent: false,
        bookingRequired: true,
        tips: []
      },
      {
        id: 'desert-safari',
        name: 'Desert Safari',
        category: 'Adventure',
        description: 'Desert adventure',
        duration: 6,
        price: { adult: 200, child: 150, currency: 'AED' },
        location: { city: 'dubai', area: 'Desert' },
        rating: 4.7,
        reviews: 32000,
        images: [],
        suitableFor: ['families', 'couples'],
        bestTime: '3-9 PM',
        weatherDependent: true,
        bookingRequired: true,
        tips: []
      }
    ];

    it('should optimize activities within budget', async () => {
      const analysis = {
        totalBudget: 1000,
        currency: 'AED',
        breakdown: {
          accommodation: 300,
          activities: 400,
          food: 150,
          transportation: 50,
          shopping: 50,
          miscellaneous: 50
        },
        recommendations: [],
        warnings: [],
        optimizationTips: [],
        dailyBudget: 142,
        budgetStatus: 'within-budget' as const
      };

      const result = await budgetAgent.optimizeBudget(analysis, mockActivities);
      
      expect(result.optimizedActivities).toBeDefined();
      expect(result.savings).toBeGreaterThanOrEqual(0);
      expect(result.optimizationNotes).toBeInstanceOf(Array);
    });
  });

  describe('getBudgetInsights', () => {
    it('should provide insights for high accommodation percentage', () => {
      const analysis = {
        totalBudget: 1000,
        currency: 'AED',
        breakdown: {
          accommodation: 450, // 45%
          activities: 200,
          food: 150,
          transportation: 100,
          shopping: 50,
          miscellaneous: 50
        },
        recommendations: [],
        warnings: [],
        optimizationTips: [],
        dailyBudget: 142,
        budgetStatus: 'tight' as const
      };

      const insights = budgetAgent.getBudgetInsights(analysis);
      
      expect(insights.some(i => i.includes('Accommodation'))).toBe(true);
    });

    it('should provide insights for tight daily budget', () => {
      const analysis = {
        totalBudget: 1000,
        currency: 'AED',
        breakdown: {
          accommodation: 200,
          activities: 300,
          food: 200,
          transportation: 100,
          shopping: 100,
          miscellaneous: 100
        },
        recommendations: [],
        warnings: [],
        optimizationTips: [],
        dailyBudget: 150, // Less than 200
        budgetStatus: 'tight' as const
      };

      const insights = budgetAgent.getBudgetInsights(analysis);
      
      expect(insights.some(i => i.includes('Daily budget'))).toBe(true);
    });

    it('should provide insights for generous budget', () => {
      const analysis = {
        totalBudget: 10000,
        currency: 'AED',
        breakdown: {
          accommodation: 3000,
          activities: 2500,
          food: 2000,
          transportation: 1000,
          shopping: 1000,
          miscellaneous: 500
        },
        recommendations: [],
        warnings: [],
        optimizationTips: [],
        dailyBudget: 1500, // More than 1000
        budgetStatus: 'within-budget' as const
      };

      const insights = budgetAgent.getBudgetInsights(analysis);
      
      expect(insights.some(i => i.includes('generous budget'))).toBe(true);
    });
  });

  describe('private methods', () => {
    it('should calculate days correctly', () => {
      const days = (budgetAgent as any).calculateDays({
        start: '2024-03-01',
        end: '2024-03-08'
      });
      
      expect(days).toBe(7);
    });

    it('should return default days when no dates', () => {
      const days = (budgetAgent as any).calculateDays(undefined);
      
      expect(days).toBe(7);
    });

    it('should calculate traveler multiplier', () => {
      const multiplier1 = (budgetAgent as any).calculateTravelerMultiplier({ adults: 1, children: 0 });
      expect(multiplier1).toBe(1);
      
      const multiplier2 = (budgetAgent as any).calculateTravelerMultiplier({ adults: 2, children: 2 });
      expect(multiplier2).toBe(3.2); // 2 + 2*0.6
    });

    it('should determine budget status correctly', () => {
      const status1 = (budgetAgent as any).getBudgetStatus(1000, 800); // 80%
      expect(status1).toBe('within-budget');
      
      const status2 = (budgetAgent as any).getBudgetStatus(1000, 950); // 95%
      expect(status2).toBe('tight');
      
      const status3 = (budgetAgent as any).getBudgetStatus(1000, 1300); // 130%
      expect(status3).toBe('over-budget');
    });
  });
});

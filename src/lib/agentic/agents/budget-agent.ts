// Budget Agent - Handles budget analysis and cost optimization
import { TravelIntent } from '../ai-gateway';
import { Activity } from '../../../types';

export interface BudgetAnalysis {
  totalBudget: number;
  currency: string;
  breakdown: {
    accommodation: number;
    activities: number;
    food: number;
    transportation: number;
    shopping: number;
    miscellaneous: number;
  };
  recommendations: string[];
  warnings: string[];
  optimizationTips: string[];
  dailyBudget: number;
  budgetStatus: 'within-budget' | 'over-budget' | 'tight';
}

export interface CostEstimate {
  category: string;
  item: string;
  estimatedCost: number;
  currency: string;
  necessity: 'essential' | 'recommended' | 'optional';
}

export class BudgetAgent {
  private dailyCosts: { [city: string]: { [category: string]: number } } = {
    dubai: {
      accommodation: 300, food: 150, transportation: 50,
      activities: 200, shopping: 100, miscellaneous: 50
    },
    'abu-dhabi': {
      accommodation: 250, food: 120, transportation: 40,
      activities: 180, shopping: 80, miscellaneous: 40
    },
    sharjah: {
      accommodation: 150, food: 80, transportation: 30,
      activities: 100, shopping: 50, miscellaneous: 30
    }
  };

  async analyzeBudget(intent: TravelIntent): Promise<BudgetAnalysis> {
    if (!intent.budget) throw new Error('No budget provided for analysis');

    const city = intent.city || 'dubai';
    const days = this.calculateDays(intent.dates);
    const totalBudget = intent.budget.amount;
    const currency = intent.budget.currency;
    const breakdown = this.calculateBudgetBreakdown(city, days, intent.travelers);
    const totalEstimated = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);

    const analysis: BudgetAnalysis = {
      totalBudget, currency, breakdown,
      recommendations: [], warnings: [], optimizationTips: [],
      dailyBudget: totalBudget / days,
      budgetStatus: this.getBudgetStatus(totalBudget, totalEstimated)
    };

    this.generateRecommendations(analysis, intent);
    this.generateWarnings(analysis, intent);
    this.generateOptimizationTips(analysis);

    return analysis;
  }

  private calculateDays(dates?: { start: string; end: string }): number {
    if (!dates) return 7;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  }

  private calculateBudgetBreakdown(city: string, days: number, travelers?: { adults: number; children: number }): BudgetAnalysis['breakdown'] {
    const cityCosts = this.dailyCosts[city.toLowerCase()] || this.dailyCosts.dubai;
    const multiplier = this.calculateTravelerMultiplier(travelers);
    return {
      accommodation: cityCosts.accommodation * days,
      food: cityCosts.food * days * multiplier,
      transportation: cityCosts.transportation * days * multiplier,
      activities: cityCosts.activities * days * multiplier,
      shopping: cityCosts.shopping * days,
      miscellaneous: cityCosts.miscellaneous * days
    };
  }

  private calculateTravelerMultiplier(travelers?: { adults: number; children: number }): number {
    if (!travelers) return 1;
    return (travelers.adults || 1) + ((travelers.children || 0) * 0.6);
  }

  private getBudgetStatus(budget: number, estimated: number): BudgetAnalysis['budgetStatus'] {
    if (estimated > budget * 1.2) return 'over-budget';
    if (estimated > budget * 0.9) return 'tight';
    return 'within-budget';
  }

  private generateRecommendations(analysis: BudgetAnalysis, intent: TravelIntent): void {
    const { breakdown, totalBudget } = analysis;
    if (breakdown.accommodation > totalBudget * 0.4) analysis.recommendations.push('Consider budget hotels or apartment rentals');
    if (breakdown.activities > totalBudget * 0.3) analysis.recommendations.push('Focus on free attractions like beaches and parks');
    if (breakdown.food > totalBudget * 0.25) analysis.recommendations.push('Try local eateries and food courts');
    if (intent.travelers && intent.travelers.children > 0) {
      analysis.recommendations.push('Look for family packages and kids-free deals');
    }
    analysis.recommendations.push('Use public transport (Metro/Bus) instead of taxis');
    analysis.recommendations.push('Book attractions online for early bird discounts');
  }

  private generateWarnings(analysis: BudgetAnalysis, intent: TravelIntent): void {
    const { totalBudget, breakdown } = analysis;
    if (totalBudget < 500) analysis.warnings.push('Very tight budget');
    const totalEstimated = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
    if (totalEstimated > totalBudget) {
      analysis.warnings.push(`Estimated costs (AED ${totalEstimated}) exceed budget by AED ${totalEstimated - totalBudget}`);
    }
    if (intent.dates) {
      const month = new Date(intent.dates.start).getMonth();
      if (month >= 5 && month <= 9) analysis.warnings.push('Summer season - indoor activities may cost more');
    }
  }

  private generateOptimizationTips(analysis: BudgetAnalysis): void {
    analysis.optimizationTips.push('Book hotels in Deira/Bur Dubai for better rates');
    analysis.optimizationTips.push('Eat at local cafeterias for authentic and cheap meals');
    analysis.optimizationTips.push('Get a Nol card for discounted Metro travel');
    analysis.optimizationTips.push('Many attractions offer combo tickets - buy in bundles');
  }

  async estimateActivityCosts(activities: Activity[], travelers: { adults: number; children: number }): Promise<CostEstimate[]> {
    return activities.map(activity => {
      const price = activity.price;
      const adultCost = (price?.adult || 0) * travelers.adults;
      const childCost = (price?.child || 0) * travelers.children;
      return {
        category: activity.category || 'General',
        item: activity.name,
        estimatedCost: adultCost + childCost,
        currency: price?.currency || 'AED',
        necessity: this.determineNecessity(activity)
      };
    });
  }

  private determineNecessity(activity: Activity): 'essential' | 'recommended' | 'optional' {
    const essential = ['burj-khalifa', 'sheikh-zayed-grand-mosque'];
    const recommended = ['desert-safari', 'dubai-mall', 'ferrari-world'];
    if (essential.includes(activity.id)) return 'essential';
    if (recommended.includes(activity.id)) return 'recommended';
    return 'optional';
  }

  async optimizeBudget(analysis: BudgetAnalysis, activities: Activity[]): Promise<{
    optimizedActivities: Activity[];
    savings: number;
    optimizationNotes: string[];
  }> {
    const optimizedActivities: Activity[] = [];
    let savings = 0;
    const optimizationNotes: string[] = [];

    const sortedActivities = activities.sort((a, b) => {
      const ratioA = (a.rating || 3) / ((a.price?.adult || 1));
      const ratioB = (b.rating || 3) / ((b.price?.adult || 1));
      return ratioB - ratioA;
    });

    let remainingBudget = analysis.breakdown.activities;
    
    for (const activity of sortedActivities) {
      const cost = activity.price?.adult || activity.estimatedCostUSD || 0;
      if (cost <= remainingBudget) {
        optimizedActivities.push(activity);
        remainingBudget -= cost;
      } else {
        const freeAlternative = this.findFreeAlternative(activity);
        if (freeAlternative) {
          optimizedActivities.push(freeAlternative);
          savings += cost;
          optimizationNotes.push(`Replaced ${activity.name} with free alternative: ${freeAlternative.name}`);
        }
      }
    }

    return { optimizedActivities, savings, optimizationNotes };
  }

  private findFreeAlternative(activity: Activity): Activity | null {
    if (activity.id === 'burj-khalifa') {
      return {
        id: 'dubai-fountain-view',
        name: 'Dubai Fountain Show (Free)',
        description: 'Spectacular fountain show outside Dubai Mall',
        category: 'Outdoor',
        duration: 1,
        price: { adult: 0, child: 0, currency: 'AED' },
        location: { city: 'dubai', area: 'Downtown Dubai' },
        rating: 4.5,
        suitableFor: ['families', 'couples', 'solo'],
        weatherDependent: false,
        bookingRequired: false,
        tips: ['Best viewed from Dubai Mall waterfront']
      };
    }
    return null;
  }

  getBudgetInsights(analysis: BudgetAnalysis): string[] {
    const insights: string[] = [];
    const total = Object.values(analysis.breakdown).reduce((sum, cost) => sum + cost, 0);
    const accommodationPct = (analysis.breakdown.accommodation / total) * 100;
    if (accommodationPct > 40) insights.push('Accommodation takes up a large portion of your budget.');
    if (analysis.dailyBudget < 200) insights.push('Daily budget is tight. Focus on free activities.');
    else if (analysis.dailyBudget > 1000) insights.push('Generous budget. Consider premium experiences.');
    return insights;
  }
}

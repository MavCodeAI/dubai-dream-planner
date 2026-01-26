// Budget Agent - Handles budget analysis and cost optimization
import { TravelIntent } from '../ai-gateway';
import { Activity } from './activity-agent';

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
      accommodation: 300,
      food: 150,
      transportation: 50,
      activities: 200,
      shopping: 100,
      miscellaneous: 50
    },
    'abu-dhabi': {
      accommodation: 250,
      food: 120,
      transportation: 40,
      activities: 180,
      shopping: 80,
      miscellaneous: 40
    },
    sharjah: {
      accommodation: 150,
      food: 80,
      transportation: 30,
      activities: 100,
      shopping: 50,
      miscellaneous: 30
    }
  };

  async analyzeBudget(intent: TravelIntent): Promise<BudgetAnalysis> {
    if (!intent.budget) {
      throw new Error('No budget provided for analysis');
    }

    const city = intent.city || 'dubai';
    const days = this.calculateDays(intent.dates);
    const totalBudget = intent.budget.amount;
    const currency = intent.budget.currency;

    // Calculate estimated costs
    const breakdown = this.calculateBudgetBreakdown(city, days, intent.travelers);
    const totalEstimated = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);

    const analysis: BudgetAnalysis = {
      totalBudget,
      currency,
      breakdown,
      recommendations: [],
      warnings: [],
      optimizationTips: [],
      dailyBudget: totalBudget / days,
      budgetStatus: this.getBudgetStatus(totalBudget, totalEstimated)
    };

    // Generate recommendations
    this.generateRecommendations(analysis, intent);
    this.generateWarnings(analysis, intent);
    this.generateOptimizationTips(analysis, intent);

    return analysis;
  }

  private calculateDays(dates?: { start: string; end: string }): number {
    if (!dates) return 7; // Default 7 days
    
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  private calculateBudgetBreakdown(
    city: string, 
    days: number, 
    travelers?: { adults: number; children: number }
  ): BudgetAnalysis['breakdown'] {
    const cityCosts = this.dailyCosts[city.toLowerCase()] || this.dailyCosts.dubai;
    const travelerMultiplier = this.calculateTravelerMultiplier(travelers);

    const breakdown: BudgetAnalysis['breakdown'] = {
      accommodation: cityCosts.accommodation * days,
      food: cityCosts.food * days * travelerMultiplier,
      transportation: cityCosts.transportation * days * travelerMultiplier,
      activities: cityCosts.activities * days * travelerMultiplier,
      shopping: cityCosts.shopping * days,
      miscellaneous: cityCosts.miscellaneous * days
    };

    return breakdown;
  }

  private calculateTravelerMultiplier(travelers?: { adults: number; children: number }): number {
    if (!travelers) return 1;
    
    const adults = travelers.adults || 1;
    const children = travelers.children || 0;
    
    // Children cost about 60% of adults
    return adults + (children * 0.6);
  }

  private getBudgetStatus(budget: number, estimated: number): BudgetAnalysis['budgetStatus'] {
    if (estimated > budget * 1.2) return 'over-budget';
    if (estimated > budget * 0.9) return 'tight';
    return 'within-budget';
  }

  private generateRecommendations(analysis: BudgetAnalysis, intent: TravelIntent): void {
    const { breakdown, totalBudget } = analysis;

    // Accommodation recommendations
    if (breakdown.accommodation > totalBudget * 0.4) {
      analysis.recommendations.push('Consider budget hotels or apartment rentals to save on accommodation');
    }

    // Activity recommendations
    if (breakdown.activities > totalBudget * 0.3) {
      analysis.recommendations.push('Focus on free attractions like beaches, parks, and window shopping');
    }

    // Food recommendations
    if (breakdown.food > totalBudget * 0.25) {
      analysis.recommendations.push('Try local eateries and food courts for affordable meals');
    }

    // Family-specific recommendations
    if (intent.travelers && intent.travelers.children > 0) {
      analysis.recommendations.push('Look for family packages and kids-free deals');
      analysis.recommendations.push('Visit free parks and beaches for children entertainment');
    }

    // General recommendations
    analysis.recommendations.push('Use public transport (Metro/Bus) instead of taxis');
    analysis.recommendations.push('Book attractions online for early bird discounts');
  }

  private generateWarnings(analysis: BudgetAnalysis, intent: TravelIntent): void {
    const { totalBudget, breakdown } = analysis;

    // Budget warnings
    if (totalBudget < 500) {
      analysis.warnings.push('Very tight budget - consider extending trip duration or reducing activities');
    }

    // Cost warnings
    const totalEstimated = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);
    if (totalEstimated > totalBudget) {
      analysis.warnings.push(`Estimated costs (AED ${totalEstimated}) exceed your budget by AED ${totalEstimated - totalBudget}`);
    }

    // Seasonal warnings
    const dates = intent.dates;
    if (dates) {
      const month = new Date(dates.start).getMonth();
      if (month >= 5 && month <= 9) { // Summer months
        analysis.warnings.push('Summer season - indoor activities may cost more due to AC');
      }
    }
  }

  private generateOptimizationTips(analysis: BudgetAnalysis, intent: TravelIntent): void {
    const { breakdown } = analysis;

    // Accommodation tips
    analysis.optimizationTips.push('Book hotels in Deira/Bur Dubai for better rates');
    analysis.optimizationTips.push('Consider Airbnb or serviced apartments for longer stays');

    // Food tips
    analysis.optimizationTips.push('Eat at local cafeterias for authentic and cheap meals');
    analysis.optimizationTips.push('Many malls offer food court deals during weekdays');

    // Transportation tips
    analysis.optimizationTips.push('Get a Nol card for discounted Metro travel');
    analysis.optimizationTips.push('Use Careem/Uber for airport transfers only');

    // Activity tips
    analysis.optimizationTips.push('Many attractions offer combo tickets - buy in bundles');
    analysis.optimizationTips.push('Visit museums on free entry days (if applicable)');

    // Shopping tips
    analysis.optimizationTips.push('Shop during Dubai Shopping Festival (January) for best deals');
    analysis.optimizationTips.push('Visit outlet malls for branded items at lower prices');
  }

  async estimateActivityCosts(activities: Activity[], travelers: { adults: number; children: number }): Promise<CostEstimate[]> {
    const estimates: CostEstimate[] = [];

    activities.forEach(activity => {
      const adultCost = activity.price.adult * travelers.adults;
      const childCost = activity.price.child * travelers.children;
      const totalCost = adultCost + childCost;

      estimates.push({
        category: activity.category,
        item: activity.name,
        estimatedCost: totalCost,
        currency: activity.price.currency,
        necessity: this.determineNecessity(activity)
      });
    });

    return estimates;
  }

  private determineNecessity(activity: Activity): 'essential' | 'recommended' | 'optional' {
    const essentialActivities = ['burj-khalifa', 'sheikh-zayed-grand-mosque'];
    const recommendedActivities = ['desert-safari', 'dubai-mall', 'ferrari-world'];

    if (essentialActivities.includes(activity.id)) return 'essential';
    if (recommendedActivities.includes(activity.id)) return 'recommended';
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

    // Sort activities by cost-effectiveness (rating/price ratio)
    const sortedActivities = activities.sort((a, b) => {
      const ratioA = a.rating / (a.price.adult || 1);
      const ratioB = b.rating / (b.price.adult || 1);
      return ratioB - ratioA;
    });

    // Select activities within budget
    let remainingBudget = analysis.breakdown.activities;
    
    for (const activity of sortedActivities) {
      if (activity.price.adult <= remainingBudget) {
        optimizedActivities.push(activity);
        remainingBudget -= activity.price.adult;
      } else {
        // Look for free alternatives
        const freeAlternative = this.findFreeAlternative(activity);
        if (freeAlternative) {
          optimizedActivities.push(freeAlternative);
          savings += activity.price.adult;
          optimizationNotes.push(`Replaced ${activity.name} with free alternative: ${freeAlternative.name}`);
        }
      }
    }

    return {
      optimizedActivities,
      savings,
      optimizationNotes
    };
  }

  private findFreeAlternative(activity: Activity): Activity | null {
    const freeAlternatives: { [key: string]: Partial<Activity> } = {
      'burj-khalifa': {
        id: 'dubai-fountain-view',
        name: 'Dubai Fountain Show (Free)',
        category: 'Outdoor',
        description: 'Spectacular fountain show outside Dubai Mall',
        duration: 1,
        price: { adult: 0, child: 0, currency: 'AED' },
        location: { city: 'dubai', area: 'Downtown Dubai' },
        rating: 4.5,
        reviews: 25000,
        suitableFor: ['families', 'couples', 'solo'],
        bestTime: '6-11 PM (every 30 minutes)',
        weatherDependent: false,
        bookingRequired: false,
        tips: ['Best viewed from Dubai Mall waterfront']
      }
    };

    const alternative = freeAlternatives[activity.id];
    if (alternative) {
      return {
        id: '',
        category: 'Outdoor',
        duration: 0,
        price: { adult: 0, child: 0, currency: 'AED' },
        location: { city: '', area: '' },
        rating: 0,
        reviews: 0,
        images: [],
        suitableFor: [],
        bestTime: '',
        weatherDependent: false,
        bookingRequired: false,
        tips: [],
        ...alternative
      } as Activity;
    }

    return null;
  }

  getBudgetInsights(analysis: BudgetAnalysis): string[] {
    const insights: string[] = [];

    // Budget distribution insights
    const total = Object.values(analysis.breakdown).reduce((sum, cost) => sum + cost, 0);
    const accommodationPercentage = (analysis.breakdown.accommodation / total) * 100;
    
    if (accommodationPercentage > 40) {
      insights.push('Accommodation takes up a large portion of your budget. Consider alternatives.');
    }

    // Daily budget insights
    if (analysis.dailyBudget < 200) {
      insights.push('Daily budget is quite tight. Focus on free activities and local food.');
    } else if (analysis.dailyBudget > 1000) {
      insights.push('You have a generous budget. Consider premium experiences and fine dining.');
    }

    return insights;
  }
}

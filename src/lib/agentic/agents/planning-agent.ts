// Planning Agent - Creates and optimizes travel itineraries
import { TravelIntent } from '../ai-gateway';
import { Activity } from './activity-agent';
import { BudgetAnalysis } from './budget-agent';
import { WeatherData } from './weather-agent';

export interface DayPlan {
  date: string;
  dayNumber: number;
  activities: PlannedActivity[];
  totalCost: number;
  totalDuration: number;
  weather: WeatherData;
  notes: string[];
  tips: string[];
}

export interface PlannedActivity {
  activity: Activity;
  startTime: string;
  endTime: string;
  estimatedCost: number;
  transportation?: {
    type: string;
    cost: number;
    duration: number;
  };
  notes: string[];
}

export interface Itinerary {
  id: string;
  title: string;
  city: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  totalCost: number;
  totalDuration: number;
  summary: {
    activities: number;
    freeActivities: number;
    paidActivities: number;
    categories: { [category: string]: number };
  };
  recommendations: string[];
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export class PlanningAgent {
  async generateItinerary(
    intent: TravelIntent,
    context: {
      weather?: WeatherData[];
      activities?: Activity[];
      budgetAnalysis?: BudgetAnalysis;
    }
  ): Promise<Itinerary> {
    const city = intent.city || 'dubai';
    const startDate = intent.dates?.start || new Date().toISOString().split('T')[0];
    const endDate = intent.dates?.end || this.getDefaultEndDate(startDate);

    const days = this.calculateDaysBetweenDates(startDate, endDate);
    const dayPlans: DayPlan[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = this.addDaysToDate(startDate, i);
      const dayPlan = await this.generateDayPlan(
        currentDate,
        i + 1,
        intent,
        context
      );
      dayPlans.push(dayPlan);
    }

    const itinerary: Itinerary = {
      id: this.generateItineraryId(),
      title: this.generateItineraryTitle(city, startDate, endDate),
      city,
      startDate,
      endDate,
      days: dayPlans,
      totalCost: dayPlans.reduce((sum, day) => sum + day.totalCost, 0),
      totalDuration: dayPlans.reduce((sum, day) => sum + day.totalDuration, 0),
      summary: this.generateSummary(dayPlans),
      recommendations: this.generateItineraryRecommendations(intent, dayPlans),
      warnings: this.generateItineraryWarnings(intent, dayPlans)
    };

    return itinerary;
  }

  private getDefaultEndDate(startDate: string): string {
    return this.addDaysToDate(startDate, 7);
  }

  private calculateDaysBetweenDates(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private addDaysToDate(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private async generateDayPlan(
    date: string,
    dayNumber: number,
    intent: TravelIntent,
    context: {
      weather?: WeatherData[];
      activities?: Activity[];
      budgetAnalysis?: BudgetAnalysis;
    }
  ): Promise<DayPlan> {
    const weather = context.weather?.find(w => w.date === date) || this.getDefaultWeather(date);
    const availableActivities = context.activities || [];
    
    const plannedActivities: PlannedActivity[] = [];
    let currentTime = 9; // Start at 9 AM
    let totalCost = 0;

    // Select activities for the day
    const dayActivities = this.selectActivitiesForDay(availableActivities, intent, dayNumber);

    for (const activity of dayActivities) {
      if (currentTime + activity.duration > 21) break; // End by 9 PM

      const plannedActivity: PlannedActivity = {
        activity,
        startTime: this.formatTime(currentTime),
        endTime: this.formatTime(currentTime + activity.duration),
        estimatedCost: this.calculateActivityCost(activity, intent.travelers),
        transportation: this.getTransportationInfo(activity),
        notes: this.generateActivityNotes(activity, weather),
      };

      plannedActivities.push(plannedActivity);
      totalCost += plannedActivity.estimatedCost;
      currentTime += activity.duration + 1; // Add 1 hour for travel/breaks
    }

    return {
      date,
      dayNumber,
      activities: plannedActivities,
      totalCost,
      totalDuration: plannedActivities.reduce((sum, pa) => sum + pa.activity.duration, 0),
      weather,
      notes: this.generateDayNotes(plannedActivities, weather),
      tips: this.generateDayTips(plannedActivities, weather, intent)
    };
  }

  private selectActivitiesForDay(
    activities: Activity[],
    intent: TravelIntent,
    dayNumber: number
  ): Activity[] {
    const dayActivities: Activity[] = [];
    const maxActivities = 3; // Max 3 activities per day
    let totalDuration = 0;

    // Different focus for different days
    const dayFocus = this.getDayFocus(dayNumber);
    const filteredActivities = activities.filter(activity => 
      activity.category === dayFocus || dayFocus === 'mixed'
    );

    // Sort by rating and price
    const sortedActivities = filteredActivities.sort((a, b) => {
      const scoreA = a.rating * (1 / (a.price.adult || 1));
      const scoreB = b.rating * (1 / (b.price.adult || 1));
      return scoreB - scoreA;
    });

    for (const activity of sortedActivities) {
      if (dayActivities.length >= maxActivities) break;
      if (totalDuration + activity.duration > 8) break; // Max 8 hours per day

      dayActivities.push(activity);
      totalDuration += activity.duration;
    }

    return dayActivities;
  }

  private getDayFocus(dayNumber: number): string {
    const focuses = ['Cultural', 'Adventure', 'Shopping', 'Beach', 'Indoor', 'mixed'];
    return focuses[(dayNumber - 1) % focuses.length];
  }

  private calculateActivityCost(activity: Activity, travelers?: { adults: number; children: number }): number {
    if (!travelers) return activity.price.adult;
    return (activity.price.adult * travelers.adults) + (activity.price.child * travelers.children);
  }

  private getTransportationInfo(activity: Activity): { type: string; cost: number; duration: number } {
    // Simple transportation logic
    const transportCosts = {
      'Dubai Mall': { type: 'Metro', cost: 7.5, duration: 30 },
      'Burj Khalifa': { type: 'Metro', cost: 7.5, duration: 30 },
      'Desert Safari': { type: 'Tour Bus', cost: 0, duration: 60 },
      'Jumeirah Beach': { type: 'Taxi', cost: 30, duration: 20 },
      default: { type: 'Taxi', cost: 25, duration: 25 }
    };

    return transportCosts[activity.location.area] || transportCosts.default;
  }

  private generateActivityNotes(activity: Activity, weather: WeatherData): string[] {
    const notes: string[] = [];

    if (activity.weatherDependent && weather.temperature.average > 35) {
      notes.push('Hot weather - bring water and sun protection');
    }

    if (activity.bookingRequired) {
      notes.push('Booking required - book in advance');
    }

    if (activity.suitableFor.includes('kids')) {
      notes.push('Family-friendly activity');
    }

    return notes;
  }

  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  private generateDayNotes(activities: PlannedActivity[], weather: WeatherData): string[] {
    const notes: string[] = [];

    if (weather.temperature.average > 35) {
      notes.push('Very hot day - stay hydrated and seek shade');
    } else if (weather.temperature.average < 25) {
      notes.push('Pleasant weather for outdoor activities');
    }

    if (activities.length === 0) {
      notes.push('Relaxation day - enjoy at your own pace');
    }

    return notes;
  }

  private generateDayTips(
    activities: PlannedActivity[],
    weather: WeatherData,
    intent: TravelIntent
  ): string[] {
    const tips: string[] = [];

    // Weather-based tips
    if (weather.conditions.includes('Sunny')) {
      tips.push('Don\'t forget sunscreen and sunglasses');
    }

    // Activity-based tips
    activities.forEach(pa => {
      tips.push(...pa.activity.tips);
    });

    // Family tips
    if (intent.travelers && intent.travelers.children > 0) {
      tips.push('Keep snacks and water handy for kids');
      tips.push('Plan for frequent breaks');
    }

    return tips;
  }

  private getDefaultWeather(date: string): WeatherData {
    return {
      date,
      temperature: { min: 25, max: 35, average: 30 },
      conditions: 'Sunny',
      humidity: 60,
      windSpeed: 10,
      recommendations: ['Great weather for sightseeing']
    };
  }

  private generateItineraryId(): string {
    return `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateItineraryTitle(city: string, startDate: string, endDate: string): string {
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${cityName} Adventure: ${start} - ${end}`;
  }

  private generateSummary(dayPlans: DayPlan[]): Itinerary['summary'] {
    const allActivities = dayPlans.flatMap(day => day.activities);
    const categories: { [category: string]: number } = {};

    allActivities.forEach(pa => {
      categories[pa.activity.category] = (categories[pa.activity.category] || 0) + 1;
    });

    const freeActivities = allActivities.filter(pa => pa.estimatedCost === 0).length;
    const paidActivities = allActivities.length - freeActivities;

    return {
      activities: allActivities.length,
      freeActivities,
      paidActivities,
      categories
    };
  }

  private generateItineraryRecommendations(intent: TravelIntent, dayPlans: DayPlan[]): string[] {
    const recommendations: string[] = [];

    // Based on trip type
    if (intent.tripType === 'family') {
      recommendations.push('Consider visiting KidZania or Dubai Aquarium for children');
    }

    if (intent.tripType === 'adventure') {
      recommendations.push('Add skydiving or hot air balloon for extra thrill');
    }

    // Based on itinerary
    if (dayPlans.length < 3) {
      recommendations.push('Consider extending your stay to explore more attractions');
    }

    recommendations.push('Keep some free time for spontaneous discoveries');
    recommendations.push('Try local cuisine at traditional restaurants');

    return recommendations;
  }

  private generateItineraryWarnings(intent: TravelIntent, dayPlans: DayPlan[]): string[] {
    const warnings: string[] = [];

    // Check for over-scheduling
    const busyDays = dayPlans.filter(day => day.totalDuration > 8);
    if (busyDays.length > 0) {
      warnings.push('Some days are quite packed - consider removing some activities');
    }

    // Check for budget concerns
    const totalCost = dayPlans.reduce((sum, day) => sum + day.totalCost, 0);
    if (intent.budget && totalCost > intent.budget.amount * 0.8) {
      warnings.push('Activities are consuming most of your budget');
    }

    return warnings;
  }

  async validateItinerary(itinerary: Itinerary, intent: TravelIntent): Promise<ValidationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for logical issues
    if (itinerary.days.length === 0) {
      issues.push('No days planned in itinerary');
    }

    // Check for over-scheduling
    itinerary.days.forEach((day, index) => {
      if (day.totalDuration > 10) {
        issues.push(`Day ${index + 1} is over-scheduled (${day.totalDuration} hours)`);
      }
    });

    // Check budget
    if (intent.budget && itinerary.totalCost > intent.budget.amount) {
      issues.push(`Total cost (AED ${itinerary.totalCost}) exceeds budget (AED ${intent.budget.amount})`);
    }

    // Check for missing essentials
    const hasCultural = itinerary.days.some(day => 
      day.activities.some(pa => pa.activity.category === 'Cultural')
    );
    if (!hasCultural && intent.city === 'dubai') {
      suggestions.push('Consider adding cultural activities like mosque visits or heritage sites');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  async fixItineraryIssues(itinerary: Itinerary, issues: string[]): Promise<Itinerary> {
    const fixedItinerary = { ...itinerary };

    // Fix over-scheduling
    for (let i = 0; i < fixedItinerary.days.length; i++) {
      const day = fixedItinerary.days[i];
      if (day.totalDuration > 8) {
        // Remove the least cost-effective activity
        const activities = [...day.activities];
        activities.sort((a, b) => {
          const scoreA = a.activity.rating / (a.estimatedCost || 1);
          const scoreB = b.activity.rating / (b.estimatedCost || 1);
          return scoreA - scoreB;
        });
        
        activities.pop(); // Remove the least cost-effective
        fixedItinerary.days[i] = {
          ...day,
          activities,
          totalDuration: activities.reduce((sum, pa) => sum + pa.activity.duration, 0),
          totalCost: activities.reduce((sum, pa) => sum + pa.estimatedCost, 0)
        };
      }
    }

    return fixedItinerary;
  }

  async optimizeItinerary(itinerary: Itinerary, intent: TravelIntent): Promise<Itinerary> {
    // Reorder activities for better flow
    const optimizedDays = itinerary.days.map(day => {
      const activities = [...day.activities];
      
      // Sort by location proximity (simplified)
      activities.sort((a, b) => {
        const areaA = a.activity.location.area;
        const areaB = b.activity.location.area;
        return areaA.localeCompare(areaB);
      });

      return { ...day, activities };
    });

    return {
      ...itinerary,
      days: optimizedDays
    };
  }
}

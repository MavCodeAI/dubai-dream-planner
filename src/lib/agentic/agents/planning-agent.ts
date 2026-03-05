// Planning Agent - Creates and optimizes travel itineraries
import { TravelIntent } from '../ai-gateway';
import { Activity } from '../../../types';
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
      const dayPlan = await this.generateDayPlan(currentDate, i + 1, intent, context);
      dayPlans.push(dayPlan);
    }

    return {
      id: this.generateItineraryId(),
      title: this.generateItineraryTitle(city, startDate, endDate),
      city, startDate, endDate,
      days: dayPlans,
      totalCost: dayPlans.reduce((sum, day) => sum + day.totalCost, 0),
      totalDuration: dayPlans.reduce((sum, day) => sum + day.totalDuration, 0),
      summary: this.generateSummary(dayPlans),
      recommendations: this.generateItineraryRecommendations(intent, dayPlans),
      warnings: this.generateItineraryWarnings(intent, dayPlans)
    };
  }

  private getDefaultEndDate(startDate: string): string {
    return this.addDaysToDate(startDate, 7);
  }

  private calculateDaysBetweenDates(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private addDaysToDate(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private async generateDayPlan(
    date: string, dayNumber: number, intent: TravelIntent,
    context: { weather?: WeatherData[]; activities?: Activity[]; budgetAnalysis?: BudgetAnalysis; }
  ): Promise<DayPlan> {
    const weather = context.weather?.find(w => w.date === date) || this.getDefaultWeather(date);
    const availableActivities = context.activities || [];
    
    const plannedActivities: PlannedActivity[] = [];
    let currentTime = 9;
    let totalCost = 0;

    const dayActivities = this.selectActivitiesForDay(availableActivities, dayNumber);

    for (const activity of dayActivities) {
      const dur = activity.duration || activity.durationHours || 2;
      if (currentTime + dur > 21) break;

      const plannedActivity: PlannedActivity = {
        activity,
        startTime: this.formatTime(currentTime),
        endTime: this.formatTime(currentTime + dur),
        estimatedCost: this.calculateActivityCost(activity, intent.travelers),
        transportation: this.getTransportationInfo(activity),
        notes: this.generateActivityNotes(activity, weather),
      };

      plannedActivities.push(plannedActivity);
      totalCost += plannedActivity.estimatedCost;
      currentTime += dur + 1;
    }

    return {
      date, dayNumber,
      activities: plannedActivities,
      totalCost,
      totalDuration: plannedActivities.reduce((sum, pa) => sum + (pa.activity.duration || pa.activity.durationHours || 2), 0),
      weather,
      notes: this.generateDayNotes(plannedActivities, weather),
      tips: this.generateDayTips(plannedActivities, weather, intent)
    };
  }

  private selectActivitiesForDay(activities: Activity[], dayNumber: number): Activity[] {
    const dayActivities: Activity[] = [];
    const maxActivities = 3;
    let totalDuration = 0;

    const dayFocus = this.getDayFocus(dayNumber);
    const filteredActivities = activities.filter(activity => 
      (activity.category || '') === dayFocus || dayFocus === 'mixed'
    );

    const sortedActivities = filteredActivities.sort((a, b) => {
      const scoreA = (a.rating || 3) * (1 / ((a.price?.adult || 1)));
      const scoreB = (b.rating || 3) * (1 / ((b.price?.adult || 1)));
      return scoreB - scoreA;
    });

    for (const activity of sortedActivities) {
      if (dayActivities.length >= maxActivities) break;
      const dur = activity.duration || activity.durationHours || 2;
      if (totalDuration + dur > 8) break;
      dayActivities.push(activity);
      totalDuration += dur;
    }

    return dayActivities;
  }

  private getDayFocus(dayNumber: number): string {
    const focuses = ['Cultural', 'Adventure', 'Shopping', 'Beach', 'Indoor', 'mixed'];
    return focuses[(dayNumber - 1) % focuses.length];
  }

  private calculateActivityCost(activity: Activity, travelers?: { adults: number; children: number }): number {
    const price = activity.price;
    if (!price) return activity.estimatedCostUSD || 0;
    if (!travelers) return price.adult;
    return (price.adult * travelers.adults) + (price.child * travelers.children);
  }

  private getTransportationInfo(activity: Activity): { type: string; cost: number; duration: number } {
    const transportCosts: Record<string, { type: string; cost: number; duration: number }> = {
      'Dubai Mall': { type: 'Metro', cost: 7.5, duration: 30 },
      'Burj Khalifa': { type: 'Metro', cost: 7.5, duration: 30 },
      'Desert Safari': { type: 'Tour Bus', cost: 0, duration: 60 },
      'Jumeirah Beach': { type: 'Taxi', cost: 30, duration: 20 },
    };
    const area = activity.location?.area || '';
    return transportCosts[area] || { type: 'Taxi', cost: 25, duration: 25 };
  }

  private generateActivityNotes(activity: Activity, weather: WeatherData): string[] {
    const notes: string[] = [];
    if (activity.weatherDependent && weather.temperature.average > 35) notes.push('Hot weather - bring water');
    if (activity.bookingRequired) notes.push('Booking required');
    if ((activity.suitableFor || []).includes('kids')) notes.push('Family-friendly');
    return notes;
  }

  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  private generateDayNotes(activities: PlannedActivity[], weather: WeatherData): string[] {
    const notes: string[] = [];
    if (weather.temperature.average > 35) notes.push('Very hot day - stay hydrated');
    else if (weather.temperature.average < 25) notes.push('Pleasant weather for outdoor activities');
    if (activities.length === 0) notes.push('Relaxation day');
    return notes;
  }

  private generateDayTips(activities: PlannedActivity[], weather: WeatherData, intent: TravelIntent): string[] {
    const tips: string[] = [];
    if (weather.conditions.includes('Sunny')) tips.push('Don\'t forget sunscreen');
    activities.forEach(pa => {
      tips.push(...(pa.activity.tips || []));
    });
    if (intent.travelers && intent.travelers.children > 0) {
      tips.push('Keep snacks and water handy for kids');
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
      const cat = pa.activity.category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const freeActivities = allActivities.filter(pa => pa.estimatedCost === 0).length;
    return {
      activities: allActivities.length,
      freeActivities,
      paidActivities: allActivities.length - freeActivities,
      categories
    };
  }

  private generateItineraryRecommendations(intent: TravelIntent, dayPlans: DayPlan[]): string[] {
    const recommendations: string[] = [];
    if (intent.tripType === 'family') recommendations.push('Consider visiting KidZania or Dubai Aquarium');
    if (intent.tripType === 'adventure') recommendations.push('Add skydiving or hot air balloon');
    if (dayPlans.length < 3) recommendations.push('Consider extending your stay');
    recommendations.push('Keep some free time for spontaneous discoveries');
    return recommendations;
  }

  private generateItineraryWarnings(intent: TravelIntent, dayPlans: DayPlan[]): string[] {
    const warnings: string[] = [];
    const busyDays = dayPlans.filter(day => day.totalDuration > 8);
    if (busyDays.length > 0) warnings.push('Some days are quite packed');
    const totalCost = dayPlans.reduce((sum, day) => sum + day.totalCost, 0);
    if (intent.budget && totalCost > intent.budget.amount * 0.8) warnings.push('Activities consuming most of budget');
    return warnings;
  }

  async validateItinerary(itinerary: Itinerary, intent: TravelIntent): Promise<ValidationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    if (itinerary.days.length === 0) issues.push('No days planned');
    itinerary.days.forEach((day, index) => {
      if (day.totalDuration > 10) issues.push(`Day ${index + 1} is over-scheduled`);
    });
    if (intent.budget && itinerary.totalCost > intent.budget.amount) {
      issues.push(`Total cost exceeds budget`);
    }
    const hasCultural = itinerary.days.some(day => 
      day.activities.some(pa => (pa.activity.category || '') === 'Cultural')
    );
    if (!hasCultural && intent.city === 'dubai') {
      suggestions.push('Consider adding cultural activities');
    }
    return { isValid: issues.length === 0, issues, suggestions };
  }

  async fixItineraryIssues(itinerary: Itinerary, _issues: string[]): Promise<Itinerary> {
    const fixedItinerary = { ...itinerary };
    for (let i = 0; i < fixedItinerary.days.length; i++) {
      const day = fixedItinerary.days[i];
      if (day.totalDuration > 8) {
        const activities = [...day.activities];
        activities.sort((a, b) => {
          const scoreA = (a.activity.rating || 3) / (a.estimatedCost || 1);
          const scoreB = (b.activity.rating || 3) / (b.estimatedCost || 1);
          return scoreA - scoreB;
        });
        activities.pop();
        fixedItinerary.days[i] = {
          ...day, activities,
          totalDuration: activities.reduce((sum, pa) => sum + (pa.activity.duration || pa.activity.durationHours || 2), 0),
          totalCost: activities.reduce((sum, pa) => sum + pa.estimatedCost, 0)
        };
      }
    }
    return fixedItinerary;
  }

  async optimizeItinerary(itinerary: Itinerary, _intent: TravelIntent): Promise<Itinerary> {
    const optimizedDays = itinerary.days.map(day => {
      const activities = [...day.activities];
      activities.sort((a, b) => {
        const areaA = a.activity.location?.area || '';
        const areaB = b.activity.location?.area || '';
        return areaA.localeCompare(areaB);
      });
      return { ...day, activities };
    });
    return { ...itinerary, days: optimizedDays };
  }
}

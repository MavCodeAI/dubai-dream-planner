// Weather Agent - Handles weather information and recommendations
import { longCatClient } from '../longcat-client';
import { Activity } from './activity-agent';

// Re-export WeatherImpactAnalysis from longcat-client
export type WeatherImpactAnalysis = {
  activityId: string;
  activityName: string;
  suitability: 'Good' | 'Fair' | 'Poor';
  recommendations: string[];
  bestTiming: string;
  safetyConsiderations: string[];
  indoorAlternatives?: string;
};export interface WeatherData {
  date: string;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  conditions: string;
  humidity: number;
  windSpeed: number;
  recommendations: string[];
}

export class WeatherAgent {
  // @ts-ignore - used for future weather API integration
  private apiKey: string | null = null;
  // @ts-ignore - used for future weather API integration  
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || null;
  }

  async getWeatherForecast(city: string, date: string): Promise<WeatherData[]> {
    try {
      // For demo purposes, return mock data
      // In production, integrate with OpenWeatherMap API
      return this.getMockWeatherData(city, date);
    } catch (error) {
      console.error('Weather forecast failed:', error);
      throw new Error('Failed to get weather forecast');
    }
  }

  private getMockWeatherData(city: string, startDate: string): WeatherData[] {
    const mockData: WeatherData[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      // UAE weather patterns
      const baseTemp = city.toLowerCase().includes('dubai') ? 32 : 30;
      const variation = Math.random() * 8 - 4; // ±4 degrees variation
      
      mockData.push({
        date: currentDate.toISOString().split('T')[0],
        temperature: {
          min: Math.round(baseTemp + variation - 5),
          max: Math.round(baseTemp + variation + 5),
          average: Math.round(baseTemp + variation)
        },
        conditions: this.getRandomWeatherCondition(),
        humidity: Math.round(50 + Math.random() * 30), // 50-80% humidity
        windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
        recommendations: this.getWeatherRecommendations(baseTemp + variation)
      });
    }
    
    return mockData;
  }

  private getRandomWeatherCondition(): string {
    const conditions = ['Sunny', 'Partly Cloudy', 'Clear', 'Mostly Sunny', 'Hot and Clear'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private getWeatherRecommendations(temperature: number): string[] {
    const recommendations: string[] = [];
    
    if (temperature > 35) {
      recommendations.push('Stay hydrated - carry water bottles');
      recommendations.push('Plan indoor activities during 12 PM - 4 PM');
      recommendations.push('Use sunscreen and wear light clothing');
      recommendations.push('Visit air-conditioned attractions');
    } else if (temperature > 25) {
      recommendations.push('Great weather for outdoor activities');
      recommendations.push('Perfect for beach visits');
      recommendations.push('Evening desert activities recommended');
    } else {
      recommendations.push('Pleasant weather for sightseeing');
      recommendations.push('Light jacket recommended for evenings');
    }
    
    // UAE-specific recommendations
    recommendations.push('Check prayer times for mosque visits');
    recommendations.push('Respect local dress codes');
    
    return recommendations;
  }

  async getBestActivityTimes(weather: WeatherData[]): Promise<{ [activity: string]: string[] }> {
    const bestTimes: { [activity: string]: string[] } = {
      'Outdoor Sightseeing': [],
      'Beach Activities': [],
      'Desert Safari': [],
      'Shopping': [],
      'Indoor Activities': []
    };

    weather.forEach((day, _index) => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (day.temperature.average > 35) {
        bestTimes['Outdoor Sightseeing'].push(`${dayName}: 7-10 AM or 5-8 PM`);
        bestTimes['Beach Activities'].push(`${dayName}: 7-9 AM or 6-8 PM`);
        bestTimes['Desert Safari'].push(`${dayName}: 4-8 PM`);
        bestTimes['Shopping'].push(`${dayName}: Any time (malls are air-conditioned)`);
        bestTimes['Indoor Activities'].push(`${dayName}: Any time`);
      } else if (day.temperature.average > 25) {
        bestTimes['Outdoor Sightseeing'].push(`${dayName}: 8 AM - 6 PM`);
        bestTimes['Beach Activities'].push(`${dayName}: 8 AM - 12 PM or 4-7 PM`);
        bestTimes['Desert Safari'].push(`${dayName}: 3-9 PM`);
        bestTimes['Shopping'].push(`${dayName}: Any time`);
        bestTimes['Indoor Activities'].push(`${dayName}: Any time`);
      } else {
        bestTimes['Outdoor Sightseeing'].push(`${dayName}: 9 AM - 5 PM`);
        bestTimes['Beach Activities'].push(`${dayName}: 10 AM - 4 PM`);
        bestTimes['Desert Safari'].push(`${dayName}: 2-8 PM`);
        bestTimes['Shopping'].push(`${dayName}: Any time`);
        bestTimes['Indoor Activities'].push(`${dayName}: Any time`);
      }
    });

    return bestTimes;
  }

  async analyzeWeatherImpact(activities: Activity[], weather: WeatherData[]): Promise<WeatherImpactAnalysis[]> {
    // Use LongCat AI for enhanced weather impact analysis
    try {
      const results = await longCatClient.analyzeWeatherImpact(activities, weather);
      
      // Map to WeatherImpactAnalysis format
      return results.map(result => ({
        activityId: '',
        activityName: result.activityName,
        suitability: result.suitability,
        recommendations: result.recommendations,
        bestTiming: result.bestTiming,
        safetyConsiderations: result.safetyConsiderations,
        indoorAlternatives: result.indoorAlternatives
      }));
    } catch (error) {
      console.error('Failed to analyze weather impact with AI, using fallback:', error);
      
      // Fallback to existing logic
      return activities.map(activity => {
        const impact = this.calculateWeatherImpact(activity, weather);
        return {
          activityId: activity.id,
          activityName: activity.name,
          suitability: impact.suitability,
          recommendations: impact.notes,
          bestTiming: impact.recommendedTime,
          safetyConsiderations: []
        };
      });
    }
  }

  private calculateWeatherImpact(activity: Activity, weather: WeatherData[]): { suitability: 'Good' | 'Fair' | 'Poor'; notes: string[]; recommendedTime: string } {
    // Simple weather impact calculation
    const avgTemp = weather.reduce((sum, day) => sum + day.temperature.average, 0) / weather.length;
    
    let suitability: 'Good' | 'Fair' | 'Poor' = 'Good';
    let notes: string[] = [];
    let recommendedTime = 'Any time';

    if (activity.category === 'Outdoor') {
      if (avgTemp > 38) {
        suitability = 'Poor';
        notes.push('Very hot weather - avoid midday');
        recommendedTime = 'Early morning or evening';
      } else if (avgTemp > 32) {
        suitability = 'Fair';
        notes.push('Hot weather - bring water');
        recommendedTime = 'Morning or evening';
      }
    } else if (activity.category === 'Beach') {
      if (avgTemp > 40) {
        suitability = 'Poor';
        notes.push('Too hot for beach activities');
      } else if (avgTemp > 35) {
        suitability = 'Fair';
        notes.push('Very hot - limit sun exposure');
        recommendedTime = 'Early morning or late afternoon';
      }
    }

    return { suitability, notes, recommendedTime };
  }
}

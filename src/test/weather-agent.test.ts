import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherAgent, WeatherData } from '../lib/agentic/agents/weather-agent';
import type { Activity } from '../types';

// Mock the longcat-client module
const mockAnalyzeWeatherImpact = vi.fn();
vi.mock('../lib/agentic/longcat-client', () => ({
  longCatClient: {
    analyzeWeatherImpact: mockAnalyzeWeatherImpact
  }
}));

describe('WeatherAgent', () => {
  let weatherAgent: WeatherAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    weatherAgent = new WeatherAgent();
  });

  describe('getWeatherForecast', () => {
    it('should return mock weather data for Dubai', async () => {
      const forecast = await weatherAgent.getWeatherForecast('dubai', '2024-03-01');
      
      expect(forecast).toBeDefined();
      expect(Array.isArray(forecast)).toBe(true);
      expect(forecast.length).toBe(7); // 7 day forecast
      
      // Check first day's structure
      const firstDay = forecast[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('temperature');
      expect(firstDay).toHaveProperty('conditions');
      expect(firstDay).toHaveProperty('humidity');
      expect(firstDay).toHaveProperty('windSpeed');
      expect(firstDay).toHaveProperty('recommendations');
    });

    it('should return valid temperature ranges', async () => {
      const forecast = await weatherAgent.getWeatherForecast('dubai', '2024-03-01');
      
      forecast.forEach(day => {
        expect(day.temperature.min).toBeLessThan(day.temperature.max);
        expect(day.temperature.average).toBeGreaterThanOrEqual(day.temperature.min);
        expect(day.temperature.average).toBeLessThanOrEqual(day.temperature.max);
      });
    });

    it('should return valid humidity values', async () => {
      const forecast = await weatherAgent.getWeatherForecast('dubai', '2024-03-01');
      
      forecast.forEach(day => {
        expect(day.humidity).toBeGreaterThanOrEqual(50);
        expect(day.humidity).toBeLessThanOrEqual(80);
      });
    });

    it('should return valid wind speed values', async () => {
      const forecast = await weatherAgent.getWeatherForecast('dubai', '2024-03-01');
      
      forecast.forEach(day => {
        expect(day.windSpeed).toBeGreaterThanOrEqual(5);
        expect(day.windSpeed).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('getBestActivityTimes', () => {
    it('should return activity time recommendations', async () => {
      const mockWeather: WeatherData[] = [
        {
          date: '2024-03-01',
          temperature: { min: 25, max: 35, average: 30 },
          conditions: 'Sunny',
          humidity: 60,
          windSpeed: 10,
          recommendations: []
        }
      ];

      const bestTimes = await weatherAgent.getBestActivityTimes(mockWeather);
      
      expect(bestTimes).toHaveProperty('Outdoor Sightseeing');
      expect(bestTimes).toHaveProperty('Beach Activities');
      expect(bestTimes).toHaveProperty('Desert Safari');
      expect(bestTimes).toHaveProperty('Shopping');
      expect(bestTimes).toHaveProperty('Indoor Activities');
    });

    it('should suggest early morning for hot weather', async () => {
      const hotWeather: WeatherData[] = [
        {
          date: '2024-03-01',
          temperature: { min: 30, max: 42, average: 38 },
          conditions: 'Sunny',
          humidity: 70,
          windSpeed: 8,
          recommendations: []
        }
      ];

      const bestTimes = await weatherAgent.getBestActivityTimes(hotWeather);
      
      expect(bestTimes['Outdoor Sightseeing'][0]).toContain('7-10 AM');
    });

    it('should suggest evening for desert safari in hot weather', async () => {
      const hotWeather: WeatherData[] = [
        {
          date: '2024-03-01',
          temperature: { min: 30, max: 42, average: 38 },
          conditions: 'Sunny',
          humidity: 70,
          windSpeed: 8,
          recommendations: []
        }
      ];

      const bestTimes = await weatherAgent.getBestActivityTimes(hotWeather);
      
      expect(bestTimes['Desert Safari'][0]).toContain('4-8 PM');
    });
  });

  describe('analyzeWeatherImpact', () => {
    const mockActivities: Activity[] = [
      {
        id: 'burj-khalifa',
        name: 'Burj Khalifa',
        category: 'Indoor',
        description: 'World\'s tallest building',
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

    const mockWeather: WeatherData[] = [
      {
        date: '2024-03-01',
        temperature: { min: 25, max: 35, average: 30 },
        conditions: 'Sunny',
        humidity: 60,
        windSpeed: 10,
        recommendations: []
      }
    ];

    it('should return weather impact analysis for activities', async () => {
      mockAnalyzeWeatherImpact.mockResolvedValue([
        {
          activityName: 'Burj Khalifa',
          suitability: 'Good',
          recommendations: ['Great day for indoor activities'],
          bestTiming: 'Any time',
          safetyConsiderations: []
        }
      ]);

      const analysis = await weatherAgent.analyzeWeatherImpact(mockActivities, mockWeather);
      
      expect(Array.isArray(analysis)).toBe(true);
      expect(analysis.length).toBe(mockActivities.length);
    });

    it('should handle AI fallback on error', async () => {
      mockAnalyzeWeatherImpact.mockRejectedValue(new Error('AI failed'));

      const analysis = await weatherAgent.analyzeWeatherImpact(mockActivities, mockWeather);
      
      expect(Array.isArray(analysis)).toBe(true);
      expect(analysis.length).toBe(mockActivities.length);
      
      // Should have fallback analysis with activity ID
      expect(analysis[0]).toHaveProperty('activityId');
      expect(analysis[0]).toHaveProperty('activityName');
      expect(analysis[0]).toHaveProperty('suitability');
    });
  });

  describe('private methods', () => {
    it('should generate valid weather conditions', () => {
      const conditions = ['Sunny', 'Partly Cloudy', 'Clear', 'Mostly Sunny', 'Hot and Clear'];
      
      for (let i = 0; i < 10; i++) {
        const condition = (weatherAgent as any).getRandomWeatherCondition();
        expect(conditions).toContain(condition);
      }
    });

    it('should generate appropriate recommendations for hot weather', () => {
      const recommendations = (weatherAgent as any).getWeatherRecommendations(40);
      
      expect(recommendations).toContain('Stay hydrated - carry water bottles');
      expect(recommendations).toContain('Plan indoor activities during 12 PM - 4 PM');
    });

    it('should generate appropriate recommendations for pleasant weather', () => {
      const recommendations = (weatherAgent as any).getWeatherRecommendations(28);
      
      expect(recommendations).toContain('Great weather for outdoor activities');
      expect(recommendations).toContain('Perfect for beach visits');
    });

    it('should include UAE-specific recommendations', () => {
      const recommendations = (weatherAgent as any).getWeatherRecommendations(30);
      
      expect(recommendations).toContain('Check prayer times for mosque visits');
      expect(recommendations).toContain('Respect local dress codes');
    });
  });
});

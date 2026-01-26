// Activity Agent - Manages activity recommendations and bookings
import { TravelIntent } from '../ai-gateway';
import { longCatClient } from '../longcat-client';
import { Activity } from '../../../types';

// Re-export Activity for backward compatibility
export type { Activity };

export class ActivityAgent {
  private activities: Activity[] = [];

  constructor() {
    this.loadActivities();
  }

  private loadActivities(): void {
    // Dubai Activities
    this.activities = [
      {
        id: 'burj-khalifa',
        name: 'Burj Khalifa',
        category: 'Indoor',
        description: 'World\'s tallest building with observation decks',
        duration: 2,
        price: { adult: 150, child: 120, currency: 'AED' },
        location: { city: 'dubai', area: 'Downtown Dubai' },
        rating: 4.8,
        reviews: 45000,
        images: [],
        suitableFor: ['families', 'couples', 'solo'],
        bestTime: '5-7 PM for sunset views',
        weatherDependent: false,
        bookingRequired: true,
        tips: ['Book tickets online to avoid queues', 'Prime time sunset slots sell out fast']
      },
      {
        id: 'desert-safari',
        name: 'Desert Safari',
        category: 'Adventure',
        description: 'Evening desert adventure with dune bashing and entertainment',
        duration: 6,
        price: { adult: 200, child: 150, currency: 'AED' },
        location: { city: 'dubai', area: 'Desert Conservation Reserve' },
        rating: 4.7,
        reviews: 32000,
        images: [],
        suitableFor: ['families', 'couples', 'groups'],
        bestTime: '3-9 PM',
        weatherDependent: true,
        bookingRequired: true,
        tips: ['Wear comfortable clothing', 'Bring camera for sunset photos']
      },
      {
        id: 'dubai-mall',
        name: 'Dubai Mall',
        category: 'Shopping',
        description: 'World\'s largest shopping mall with entertainment options',
        duration: 4,
        price: { adult: 0, child: 0, currency: 'AED' },
        location: { city: 'dubai', area: 'Downtown Dubai' },
        rating: 4.6,
        reviews: 68000,
        images: [],
        suitableFor: ['families', 'couples', 'solo', 'kids'],
        bestTime: 'Any time',
        weatherDependent: false,
        bookingRequired: false,
        tips: ['Visit aquarium early morning', 'Weekdays are less crowded']
      },
      {
        id: 'jumeirah-beach',
        name: 'Jumeirah Beach',
        category: 'Beach',
        description: 'Public beach with Burj Al Arab views',
        duration: 3,
        price: { adult: 0, child: 0, currency: 'AED' },
        location: { city: 'dubai', area: 'Jumeirah' },
        rating: 4.5,
        reviews: 28000,
        images: [],
        suitableFor: ['families', 'couples', 'solo'],
        bestTime: '7-10 AM or 5-7 PM',
        weatherDependent: true,
        bookingRequired: false,
        tips: ['Bring sun protection', 'Best photos during golden hour']
      },
      {
        id: 'global-village',
        name: 'Global Village',
        category: 'Cultural',
        description: 'Multi-cultural entertainment park with pavilions from 90+ countries',
        duration: 4,
        price: { adult: 20, child: 15, currency: 'AED' },
        location: { city: 'dubai', area: 'Dubai Land' },
        rating: 4.4,
        reviews: 15000,
        images: [],
        suitableFor: ['families', 'couples', 'groups'],
        bestTime: '6-11 PM',
        weatherDependent: false,
        bookingRequired: false,
        tips: ['Go on weekdays for fewer crowds', 'Try food from different pavilions']
      },
      // Abu Dhabi Activities
      {
        id: 'sheikh-zayed-grand-mosque',
        name: 'Sheikh Zayed Grand Mosque',
        category: 'Cultural',
        description: 'Stunning architectural masterpiece and important religious site',
        duration: 2,
        price: { adult: 0, child: 0, currency: 'AED' },
        location: { city: 'abu-dhabi', area: 'Mussafah' },
        rating: 4.9,
        reviews: 52000,
        images: [],
        suitableFor: ['families', 'couples', 'solo'],
        bestTime: '9-11 AM or 4-6 PM',
        weatherDependent: false,
        bookingRequired: false,
        tips: ['Dress modestly', 'Free guided tours available', 'Beautiful at sunset']
      },
      {
        id: 'ferrari-world',
        name: 'Ferrari World',
        category: 'Adventure',
        description: 'Ferrari-themed amusement park with world\'s fastest roller coaster',
        duration: 5,
        price: { adult: 295, child: 235, currency: 'AED' },
        location: { city: 'abu-dhabi', area: 'Yas Island' },
        rating: 4.6,
        reviews: 18000,
        images: [],
        suitableFor: ['families', 'couples', 'groups', 'kids'],
        bestTime: 'Any time',
        weatherDependent: false,
        bookingRequired: true,
        tips: ['Fast pass recommended on weekends', 'Try Formula Rossa - world\'s fastest coaster']
      }
    ];
  }

  async getActivities(city: string, intent?: TravelIntent): Promise<Activity[]> {
    try {
      let filteredActivities = this.activities.filter(activity => 
        activity.location.city.toLowerCase() === city.toLowerCase()
      );

      // Filter based on intent if provided
      if (intent) {
        filteredActivities = this.filterByIntent(filteredActivities, intent);
      }

      return filteredActivities;
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  private filterByIntent(activities: Activity[], intent: TravelIntent): Activity[] {
    let filtered = [...activities];

    // Filter by interests
    if (intent.interests && intent.interests.length > 0) {
      filtered = filtered.filter(activity => {
        return intent.interests!.some(interest => 
          this.matchesInterest(activity, interest)
        );
      });
    }

    // Filter by travelers (family-friendly if children)
    if (intent.travelers && intent.travelers.children > 0) {
      filtered = filtered.filter(activity => 
        activity.suitableFor.includes('families') || activity.suitableFor.includes('kids')
      );
    }

    // Filter by budget
    if (intent.budget) {
      filtered = filtered.filter(activity => {
        const totalCost = this.calculateActivityCost(activity, intent.travelers!);
        return totalCost <= intent.budget!.amount * 0.3; // Max 30% of budget per activity
      });
    }

    return filtered;
  }

  private matchesInterest(activity: Activity, interest: string): boolean {
    const interestMap: { [key: string]: string[] } = {
      'adventure': ['Adventure', 'Outdoor'],
      'culture': ['Cultural'],
      'shopping': ['Shopping'],
      'beach': ['Beach'],
      'family': ['Indoor', 'Outdoor', 'Cultural'],
      'luxury': ['Indoor', 'Cultural'],
      'food': ['Dining']
    };

    const matchingCategories = interestMap[interest.toLowerCase()] || [];
    return matchingCategories.includes(activity.category);
  }

  private calculateActivityCost(activity: Activity, travelers: { adults: number; children: number }): number {
    return (activity.price.adult * travelers.adults) + (activity.price.child * travelers.children);
  }

  async getRecommendedItinerary(city: string, intent: TravelIntent, days: number): Promise<Activity[][]> {
    const activities = await this.getActivities(city, intent);
    const itinerary: Activity[][] = [];

    for (let day = 0; day < days; day++) {
      const dayActivities = await this.planDayActivitiesWithAI(activities, intent, day);
      itinerary.push(dayActivities);
    }

    return itinerary;
  }

  private async planDayActivitiesWithAI(availableActivities: Activity[], intent: TravelIntent, dayIndex: number): Promise<Activity[]> {
    try {
      // Use LongCat AI for intelligent activity planning
      const weather = await this.getWeatherForCity(intent.city || 'dubai');
      const interests = intent.interests || [];
      const budget = intent.budget?.amount || 1000;

      const aiRecommendations = await longCatClient.generateActivityRecommendations(
        intent.city || 'dubai',
        interests,
        weather,
        budget
      );

      // Parse AI recommendations and match with available activities
      return this.matchAIRecommendationsToActivities(aiRecommendations, availableActivities, dayIndex);
    } catch (error) {
      console.error('Failed to use AI for activity planning, using fallback:', error);
      return this.planDayActivities(availableActivities, intent, dayIndex);
    }
  }

  private async getWeatherForCity(city: string): Promise<any[]> {
    // Mock weather data - in production, integrate with weather agent
    return [
      {
        date: new Date().toISOString().split('T')[0],
        temperature: { average: 32, min: 25, max: 38 },
        conditions: 'Sunny',
        humidity: 60,
        windSpeed: 10
      }
    ];
  }

  private matchAIRecommendationsToActivities(aiRecommendations: string, availableActivities: Activity[], dayIndex: number): Activity[] {
    const dayActivities: Activity[] = [];
    let totalHours = 0;
    const maxHours = 8;

    // Simple keyword matching to connect AI recommendations with available activities
    const recommendations = aiRecommendations.toLowerCase();
    
    for (const activity of availableActivities) {
      if (totalHours >= maxHours) break;
      
      const activityName = activity.name.toLowerCase();
      const activityCategory = activity.category.toLowerCase();
      
      // Check if AI recommendation mentions this activity or category
      if (recommendations.includes(activityName) || 
          recommendations.includes(activityCategory) ||
          this.matchesKeywords(recommendations, activity)) {
        
        if (totalHours + activity.duration <= maxHours) {
          dayActivities.push(activity);
          totalHours += activity.duration;
        }
      }
    }

    // If no activities matched, use fallback
    if (dayActivities.length === 0) {
      return this.planDayActivities(availableActivities, { travelers: { adults: 1, children: 0 } } as TravelIntent, dayIndex);
    }

    return dayActivities;
  }

  private matchesKeywords(recommendations: string, activity: Activity): boolean {
    const keywordMap: { [key: string]: string[] } = {
      'beach': ['beach', 'sea', 'swim', 'sun'],
      'adventure': ['adventure', 'thrill', 'exciting', 'desert'],
      'cultural': ['culture', 'museum', 'mosque', 'heritage'],
      'shopping': ['shop', 'mall', 'buy', 'market'],
      'indoor': ['indoor', 'air-conditioned', 'building']
    };

    const keywords = keywordMap[activity.category.toLowerCase()] || [];
    return keywords.some(keyword => recommendations.includes(keyword));
  }

  private planDayActivities(availableActivities: Activity[], intent: TravelIntent, dayIndex: number): Activity[] {
    const dayActivities: Activity[] = [];
    let totalHours = 0;
    const maxHours = 8; // Max 8 hours of activities per day

    // Mix of different activity types
    const categories = ['Cultural', 'Adventure', 'Shopping', 'Beach', 'Indoor'];
    let currentCategoryIndex = dayIndex % categories.length;

    const remainingActivities = [...availableActivities];

    while (totalHours < maxHours && remainingActivities.length > 0) {
      const targetCategory = categories[currentCategoryIndex];
      const suitableActivities = remainingActivities.filter(activity => 
        activity.category === targetCategory && 
        totalHours + activity.duration <= maxHours
      );

      if (suitableActivities.length > 0) {
        const selectedActivity = suitableActivities[0]; // Pick first suitable
        dayActivities.push(selectedActivity);
        totalHours += selectedActivity.duration;
        
        // Remove selected activity from remaining
        const index = remainingActivities.indexOf(selectedActivity);
        remainingActivities.splice(index, 1);
      }

      currentCategoryIndex = (currentCategoryIndex + 1) % categories.length;
    }

    return dayActivities;
  }

  async searchActivities(query: string, city: string): Promise<Activity[]> {
    const cityActivities = this.activities.filter(activity => 
      activity.location.city.toLowerCase() === city.toLowerCase()
    );

    return cityActivities.filter(activity => 
      activity.name.toLowerCase().includes(query.toLowerCase()) ||
      activity.description.toLowerCase().includes(query.toLowerCase()) ||
      activity.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  getActivityById(id: string): Activity | undefined {
    return this.activities.find(activity => activity.id === id);
  }

  getActivitiesByCategory(category: string, city: string): Activity[] {
    return this.activities.filter(activity => 
      activity.location.city.toLowerCase() === city.toLowerCase() &&
      activity.category.toLowerCase() === category.toLowerCase()
    );
  }
}

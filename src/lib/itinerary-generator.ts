import { Activity, DayPlan, OnboardingData, Trip } from '@/types';
import { MOCK_ACTIVITIES } from '@/data/activities';
import { generateId } from './storage';
import { aiClient } from './ai-client';
import { eachDayOfInterval, parseISO, format } from 'date-fns';

const PACE_ACTIVITIES = {
  relaxed: { min: 2, max: 3 },
  standard: { min: 3, max: 4 },
  packed: { min: 4, max: 5 },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function filterActivities(
  activities: Activity[],
  cities: string[],
  interests: string[],
  hasChildren: boolean
): Activity[] {
  return activities.filter(activity => {
    // Filter by city
    if (!cities.includes(activity.city)) return false;
    
    // Filter by interests (at least one tag matches)
    const hasMatchingInterest = activity.tags.some(tag => interests.includes(tag));
    if (!hasMatchingInterest) return false;
    
    // Family-friendly filter
    if (hasChildren && !activity.familyFriendly) return false;
    
    return true;
  });
}

function selectActivitiesForDay(
  availableActivities: Activity[],
  usedActivityIds: Set<string>,
  pace: 'relaxed' | 'standard' | 'packed',
  maxBudget: number
): Activity[] {
  const { min, max } = PACE_ACTIVITIES[pace];
  const targetCount = Math.floor(Math.random() * (max - min + 1)) + min;
  
  const selectedActivities: Activity[] = [];
  let dailyCost = 0;
  
  // Try to balance time of day
  const timeSlots = ['morning', 'afternoon', 'evening'] as const;
  const shuffledActivities = shuffleArray(availableActivities);
  
  for (const timeSlot of timeSlots) {
    if (selectedActivities.length >= targetCount) break;
    
    const slotActivities = shuffledActivities.filter(
      a => (a.timeOfDay === timeSlot || a.timeOfDay === 'anytime') && 
           !selectedActivities.find(s => s.id === a.id) &&
           dailyCost + a.estimatedCostUSD <= maxBudget
    );
    
    if (slotActivities.length > 0) {
      const activity = slotActivities[0];
      selectedActivities.push(activity);
      dailyCost += activity.estimatedCostUSD;
      usedActivityIds.add(activity.id);
    }
  }
  
  // Fill remaining slots if needed (allow duplicates if necessary)
  while (selectedActivities.length < min) {
    const remaining = shuffledActivities.filter(
      a => !selectedActivities.find(s => s.id === a.id) &&
           dailyCost + a.estimatedCostUSD <= maxBudget
    );
    
    if (remaining.length === 0) break;
    
    const activity = remaining[0];
    selectedActivities.push(activity);
    dailyCost += activity.estimatedCostUSD;
    usedActivityIds.add(activity.id);
  }
  
  // Sort by time of day
  const timeOrder = { morning: 0, afternoon: 1, evening: 2, anytime: 1.5 };
  return selectedActivities.sort((a, b) => timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay]);
}

export async function generateItinerary(onboardingData: OnboardingData): Promise<Trip> {
  const {
    cities,
    startDate,
    endDate,
    adults,
    children,
    tripType,
    budgetUSD,
    interests,
    pace,
  } = onboardingData;
  
  try {
    // Try AI generation first
    console.log('Attempting AI itinerary generation...');
    const aiResponse = await aiClient.generateItinerary({
      cities,
      startDate,
      endDate,
      adults,
      children,
      budget: budgetUSD,
      interests,
      pace,
      tripType
    });

    // Convert AI response to Trip format
    const trip: Trip = {
      id: generateId(),
      name: `UAE Adventure - ${format(parseISO(startDate), 'MMM d')} to ${format(parseISO(endDate), 'MMM d, yyyy')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      onboardingData,
      days: aiResponse.days.map(day => ({
        ...day,
        activities: day.activities.map(activity => ({
          ...activity,
          city: activity.city || day.city,
          tags: activity.tags || [],
          familyFriendly: activity.familyFriendly ?? true,
          luxuryLevel: activity.luxuryLevel || 'budget'
        }))
      })),
      totalCostUSD: aiResponse.totalCostUSD,
    };

    console.log('AI itinerary generated successfully');
    return trip;
  } catch (error) {
    console.warn('AI generation failed, falling back to mock data:', error);
    
    // Fallback to original mock-based generation
    return generateMockItinerary(onboardingData);
  }
}

// Original mock-based generation as fallback
function generateMockItinerary(onboardingData: OnboardingData): Trip {
  const {
    cities,
    startDate,
    endDate,
    children,
    budgetUSD,
    interests,
    pace,
  } = onboardingData;
  
  const hasChildren = children > 0;
  
  // Calculate dates
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  
  // Budget guardrail: activities should be under 55% of total budget
  const activityBudget = budgetUSD * 0.55;
  const dailyBudget = activityBudget / days.length;
  
  // Filter activities based on preferences
  const eligibleActivities = filterActivities(
    MOCK_ACTIVITIES,
    cities,
    interests,
    hasChildren
  );
  
  const usedActivityIds = new Set<string>();
  
  // Distribute cities across days
  const cityRotation = [...cities];
  
  const dayPlans: DayPlan[] = days.map((date, index) => {
    const cityIndex = index % cityRotation.length;
    const city = cityRotation[cityIndex];
    
    // Get activities for this city
    const cityActivities = eligibleActivities.filter(a => a.city === city);
    
    // Calculate available activities per day (distribute evenly)
    const totalDays = days.length;
    const activitiesPerDay = Math.ceil(cityActivities.length / totalDays);
    const adjustedMaxBudget = Math.max(dailyBudget, activitiesPerDay * 20); // Ensure budget allows activities
    
    let selectedActivities = selectActivitiesForDay(
      cityActivities,
      usedActivityIds,
      pace,
      adjustedMaxBudget
    );
    
    // EMERGENCY FALLBACK: If no activities selected, add at least one
    if (selectedActivities.length === 0 && cityActivities.length > 0) {
      // Find the cheapest available activity
      const fallbackActivity = cityActivities
        .filter(a => a.estimatedCostUSD <= dailyBudget)
        .sort((a, b) => a.estimatedCostUSD - b.estimatedCostUSD)[0];
      
      if (fallbackActivity) {
        selectedActivities = [fallbackActivity];
        usedActivityIds.add(fallbackActivity.id);
      }
    }
    
    const dailyCost = selectedActivities.reduce(
      (sum, a) => sum + a.estimatedCostUSD,
      0
    );
    
    return {
      dayNumber: index + 1,
      date: format(date, 'yyyy-MM-dd'),
      city,
      activities: selectedActivities,
      dailyCostUSD: dailyCost,
    };
  });
  
  const totalCost = dayPlans.reduce((sum, day) => sum + day.dailyCostUSD, 0);
  
  const trip: Trip = {
    id: generateId(),
    name: `UAE Adventure - ${format(parseISO(startDate), 'MMM d')} to ${format(parseISO(endDate), 'MMM d, yyyy')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    onboardingData,
    days: dayPlans,
    totalCostUSD: totalCost,
  };
  
  return trip;
}

export async function regenerateDay(trip: Trip, dayNumber: number): Promise<Trip> {
  const dayIndex = dayNumber - 1;
  const day = trip.days[dayIndex];
  
  if (!day) return trip;
  
  try {
    // Try AI regeneration first
    console.log(`Attempting AI regeneration for Day ${dayNumber}...`);
    const suggestions = await aiClient.getSuggestions({
      currentActivities: day.activities,
      remainingBudget: trip.onboardingData.budgetUSD - trip.totalCostUSD + day.dailyCostUSD,
      city: day.city,
      dayNumber,
      interests: trip.onboardingData.interests,
      hasChildren: trip.onboardingData.children > 0
    });

    // Convert AI suggestions to new activities
    const newActivities = suggestions.suggestions.slice(0, 4).map(suggestion => ({
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: suggestion.name,
      city: day.city,
      description: suggestion.description,
      durationHours: suggestion.durationHours,
      estimatedCostUSD: suggestion.estimatedCostUSD,
      tags: suggestion.tags,
      timeOfDay: suggestion.timeOfDay,
      familyFriendly: suggestion.familyFriendly,
      luxuryLevel: 'budget' as const
    }));

    const updatedDays = [...trip.days];
    updatedDays[dayIndex] = {
      ...day,
      activities: newActivities,
      dailyCostUSD: newActivities.reduce((sum, a) => sum + a.estimatedCostUSD, 0),
    };

    const totalCost = updatedDays.reduce((sum, d) => sum + d.dailyCostUSD, 0);

    console.log(`Day ${dayNumber} regenerated successfully with AI`);
    return {
      ...trip,
      days: updatedDays,
      totalCostUSD: totalCost,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`AI regeneration failed for Day ${dayNumber}, falling back to mock data:`, error);
    
    // Fallback to original mock-based regeneration
    return regenerateDayMock(trip, dayNumber);
  }
}

// Original mock-based regeneration as fallback
function regenerateDayMock(trip: Trip, dayNumber: number): Trip {
  const dayIndex = dayNumber - 1;
  const day = trip.days[dayIndex];
  
  if (!day) return trip;
  
  const { onboardingData } = trip;
  const hasChildren = onboardingData.children > 0;
  
  // Get used activity IDs from other days
  const usedActivityIds = new Set<string>();
  trip.days.forEach((d, i) => {
    if (i !== dayIndex) {
      d.activities.forEach(a => usedActivityIds.add(a.id));
    }
  });
  
  const eligibleActivities = filterActivities(
    MOCK_ACTIVITIES,
    [day.city],
    onboardingData.interests,
    hasChildren
  );
  
  const dailyBudget = (onboardingData.budgetUSD * 0.55) / trip.days.length;
  
  const newActivities = selectActivitiesForDay(
    eligibleActivities,
    usedActivityIds,
    onboardingData.pace,
    dailyBudget
  );
  
  const updatedDays = [...trip.days];
  updatedDays[dayIndex] = {
    ...day,
    activities: newActivities,
    dailyCostUSD: newActivities.reduce((sum, a) => sum + a.estimatedCostUSD, 0),
  };
  
  const totalCost = updatedDays.reduce((sum, d) => sum + d.dailyCostUSD, 0);
  
  return {
    ...trip,
    days: updatedDays,
    totalCostUSD: totalCost,
    updatedAt: new Date().toISOString(),
  };
}

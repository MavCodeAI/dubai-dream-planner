import { Activity, DayPlan, OnboardingData, Trip } from '@/types';
import { MOCK_ACTIVITIES } from '@/data/activities';
import { generateId } from './storage';
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
  tripType: string,
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
           !usedActivityIds.has(a.id) &&
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
  
  // Fill remaining slots if needed
  while (selectedActivities.length < min) {
    const remaining = shuffledActivities.filter(
      a => !usedActivityIds.has(a.id) &&
           !selectedActivities.find(s => s.id === a.id) &&
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

export function generateItinerary(onboardingData: OnboardingData): Trip {
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
  
  const hasChildren = children > 0;
  const totalTravelers = adults + children;
  
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
    tripType,
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
    
    const selectedActivities = selectActivitiesForDay(
      cityActivities,
      usedActivityIds,
      pace,
      dailyBudget
    );
    
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

export function regenerateDay(trip: Trip, dayNumber: number): Trip {
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
    onboardingData.tripType,
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

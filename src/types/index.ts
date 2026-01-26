export interface OnboardingData {
  cities: string[];
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  tripType: 'solo' | 'couple' | 'family' | 'group';
  budgetUSD: number;
  interests: string[];
  pace: 'relaxed' | 'standard' | 'packed';
}

/**
 * Detailed Activity interface for travel planning
 */
export interface Activity {
  /** Unique identifier for the activity */
  id: string;
  /** Name of the activity */
  name: string;
  /** Category of the activity */
  category: 'Outdoor' | 'Indoor' | 'Beach' | 'Cultural' | 'Adventure' | 'Shopping' | 'Dining';
  /** Detailed description of the activity */
  description: string;
  /** Duration of the activity in hours */
  duration: number;
  /** Duration in hours (alias for duration) */
  durationHours?: number;
  /** Pricing information */
  price: {
    adult: number;
    child: number;
    currency: string;
  };
  /** Estimated cost in USD */
  estimatedCostUSD?: number;
  /** Location details */
  location: {
    city: string;
    area: string;
    coordinates?: { lat: number; lng: number };
  };
  /** City (shortcut for location.city) */
  city?: string;
  /** Activity rating (0-5) */
  rating: number;
  /** Number of reviews */
  reviews: number;
  /** Array of image URLs */
  images: string[];
  /** Target audiences */
  suitableFor: string[];
  /** Best time to visit */
  bestTime: string;
  /** Time of day for the activity */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  /** Whether activity is weather-dependent */
  weatherDependent: boolean;
  /** Whether booking is required */
  bookingRequired: boolean;
  /** Tips for the activity */
  tips: string[];
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  city: string;
  activities: Activity[];
  dailyCostUSD: number;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  onboardingData: OnboardingData;
  days: DayPlan[];
  totalCostUSD: number;
}

export interface StorageData {
  onboardingData: OnboardingData | null;
  currentTrip: Trip | null;
  savedTrips: Trip[];
  isFirstVisit: boolean;
  isProUser: boolean;
}

export const EMIRATES = [
  { id: 'dubai', name: 'Dubai', icon: 'Building2' },
  { id: 'abu-dhabi', name: 'Abu Dhabi', icon: 'Landmark' },
  { id: 'sharjah', name: 'Sharjah', icon: 'BookOpen' },
  { id: 'ajman', name: 'Ajman', icon: 'Palmtree' },
  { id: 'ras-al-khaimah', name: 'Ras Al Khaimah', icon: 'Mountain' },
  { id: 'fujairah', name: 'Fujairah', icon: 'Waves' },
  { id: 'umm-al-quwain', name: 'Umm Al Quwain', icon: 'Anchor' },
] as const;

export const INTERESTS = [
  { id: 'beach', name: 'Beach & Relaxation', icon: 'Waves' },
  { id: 'culture', name: 'Culture & Heritage', icon: 'Landmark' },
  { id: 'adventure', name: 'Adventure & Thrills', icon: 'Mountain' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag' },
  { id: 'food', name: 'Food & Dining', icon: 'Utensils' },
  { id: 'family', name: 'Family Activities', icon: 'Users' },
  { id: 'photography', name: 'Photography', icon: 'Camera' },
  { id: 'nightlife', name: 'Nightlife', icon: 'Moon' },
] as const;

export const TRIP_TYPES = [
  { id: 'solo', name: 'Solo', icon: 'User' },
  { id: 'couple', name: 'Couple', icon: 'Heart' },
  { id: 'family', name: 'Family', icon: 'Users' },
  { id: 'group', name: 'Group', icon: 'Users' },
] as const;

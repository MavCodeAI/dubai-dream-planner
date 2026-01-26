import { StorageData, Trip, OnboardingData } from '@/types';

const STORAGE_KEY = 'uae-tour-planner-v1';

const defaultStorageData: StorageData = {
  onboardingData: null,
  currentTrip: null,
  savedTrips: [],
};

export function getStorageData(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultStorageData;
    
    const parsed = JSON.parse(data);
    return {
      onboardingData: parsed.onboardingData || null,
      currentTrip: parsed.currentTrip || null,
      savedTrips: parsed.savedTrips || [],
    };
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultStorageData;
  }
}

export function saveStorageData(data: Partial<StorageData>): void {
  try {
    const current = getStorageData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function saveOnboardingData(data: OnboardingData): void {
  saveStorageData({ onboardingData: data });
}

export function getOnboardingData(): OnboardingData | null {
  return getStorageData().onboardingData;
}

export function saveCurrentTrip(trip: Trip): void {
  saveStorageData({ currentTrip: trip });
}

export function getCurrentTrip(): Trip | null {
  return getStorageData().currentTrip;
}

export function saveTrip(trip: Trip): void {
  const { savedTrips } = getStorageData();
  const existingIndex = savedTrips.findIndex(t => t.id === trip.id);
  
  if (existingIndex >= 0) {
    savedTrips[existingIndex] = { ...trip, updatedAt: new Date().toISOString() };
  } else {
    savedTrips.push(trip);
  }
  
  saveStorageData({ savedTrips, currentTrip: trip });
}

export function getSavedTrips(): Trip[] {
  return getStorageData().savedTrips;
}

export function deleteTrip(tripId: string): void {
  const { savedTrips, currentTrip } = getStorageData();
  const filtered = savedTrips.filter(t => t.id !== tripId);
  
  saveStorageData({
    savedTrips: filtered,
    currentTrip: currentTrip?.id === tripId ? null : currentTrip,
  });
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

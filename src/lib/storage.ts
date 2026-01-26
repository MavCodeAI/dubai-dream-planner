import { StorageData, Trip, OnboardingData } from '@/types';

/**
 * Storage utilities for persisting trip and user data
 * Uses localStorage for client-side data persistence
 * 
 * @example
 * ```typescript
 * import { saveOnboardingData, getCurrentTrip, saveTrip } from './lib/storage';
 * 
 * // Save onboarding data
 * saveOnboardingData({
 *   cities: ['dubai'],
 *   startDate: '2024-03-01',
 *   endDate: '2024-03-07',
 *   adults: 2,
 *   children: 0,
 *   budgetUSD: 5000,
 *   interests: ['culture'],
 *   pace: 'standard',
 *   tripType: 'couple'
 * });
 * ```
 */

const STORAGE_KEY = 'uae-tour-planner-v1';

const defaultStorageData: StorageData = {
  onboardingData: null,
  currentTrip: null,
  savedTrips: [],
  isFirstVisit: true,
  isProUser: false,
};

/**
 * Get all storage data from localStorage
 * 
 * @returns StorageData object with all stored data
 * @example
 * ```typescript
 * const data = getStorageData();
 * console.log(data.currentTrip);
 * console.log(data.savedTrips);
 * ```
 */
export function getStorageData(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultStorageData;
    
    const parsed = JSON.parse(data);
    return {
      onboardingData: parsed.onboardingData || null,
      currentTrip: parsed.currentTrip || null,
      savedTrips: parsed.savedTrips || [],
      isFirstVisit: parsed.isFirstVisit ?? true,
      isProUser: parsed.isProUser ?? false,
    };
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultStorageData;
  }
}

/**
 * Save partial storage data to localStorage
 * Merges with existing data
 * 
 * @param data - Partial data to save
 * @example
 * ```typescript
 * saveStorageData({ isFirstVisit: false });
 * ```
 */
export function saveStorageData(data: Partial<StorageData>): void {
  try {
    const current = getStorageData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Save onboarding data for a trip
 * 
 * @param data - The onboarding form data
 * @example
 * ```typescript
 * saveOnboardingData({
 *   cities: ['dubai', 'abu-dhabi'],
 *   startDate: '2024-03-01',
 *   endDate: '2024-03-07',
 *   adults: 2,
 *   children: 1,
 *   budgetUSD: 10000,
 *   interests: ['culture', 'adventure'],
 *   pace: 'standard',
 *   tripType: 'family'
 * });
 * ```
 */
export function saveOnboardingData(data: OnboardingData): void {
  saveStorageData({ onboardingData: data });
}

/**
 * Get stored onboarding data
 * 
 * @returns OnboardingData or null if not found
 */
export function getOnboardingData(): OnboardingData | null {
  return getStorageData().onboardingData;
}

/**
 * Save the current trip being edited
 * 
 * @param trip - The trip object to save
 * @example
 * ```typescript
 * saveCurrentTrip({
 *   id: 'trip-123',
 *   name: 'Dubai Adventure',
 *   days: [...],
 *   totalCostUSD: 4500
 * });
 * ```
 */
export function saveCurrentTrip(trip: Trip): void {
  saveStorageData({ currentTrip: trip });
}

/**
 * Get the current trip being edited
 * 
 * @returns Trip or null if not found
 */
export function getCurrentTrip(): Trip | null {
  return getStorageData().currentTrip;
}

/**
 * Save a trip to the saved trips collection
 * Updates existing trip if ID matches, otherwise adds new
 * 
 * @param trip - The trip to save
 * @example
 * ```typescript
 * saveTrip(generatedTrip);
 * ```
 */
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

/**
 * Get all saved trips
 * 
 * @returns Array of saved Trip objects
 */
export function getSavedTrips(): Trip[] {
  return getStorageData().savedTrips;
}

/**
 * Delete a trip from saved trips
 * 
 * @param tripId - The ID of the trip to delete
 * @example
 * ```typescript
 * deleteTrip('trip-123');
 * ```
 */
export function deleteTrip(tripId: string): void {
  const { savedTrips, currentTrip } = getStorageData();
  const filtered = savedTrips.filter(t => t.id !== tripId);
  
  saveStorageData({
    savedTrips: filtered,
    currentTrip: currentTrip?.id === tripId ? null : currentTrip,
  });
}

/**
 * Clear all stored data
 * Use with caution - this removes all data
 * 
 * @example
 * ```typescript
 * clearAllData(); // Wipes all local storage
 * ```
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate a unique ID for trips and activities
 * 
 * @returns A unique string ID
 * @example
 * ```typescript
 * const id = generateId(); // 'abc123xyz789'
 * ```
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Check if this is the user's first visit
 * 
 * @returns True if first visit, false otherwise
 */
export function isFirstVisit(): boolean {
  return getStorageData().isFirstVisit;
}

/**
 * Mark first visit as complete
 */
export function markFirstVisitComplete(): void {
  saveStorageData({ isFirstVisit: false });
}

/**
 * Check if user has pro subscription
 * 
 * @returns True if pro user, false otherwise
 */
export function isProUser(): boolean {
  return getStorageData().isProUser;
}

/**
 * Upgrade user to pro subscription
 */
export function upgradeToPro(): void {
  saveStorageData({ isProUser: true });
}

export function canSaveMoreTrips(): boolean {
  const { savedTrips, isProUser } = getStorageData();
  return isProUser || savedTrips.length < 1;
}

/**
 * Check if user can export PDF
 * Only pro users can export PDF
 * 
 * @returns True if user can export PDF
 */
export function canExportPDF(): boolean {
  return getStorageData().isProUser;
}

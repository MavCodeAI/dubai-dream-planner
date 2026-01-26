import { toast } from 'sonner';
import { Trip } from '@/types';

export interface TripData {
  onboardingData: {
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    cities: string[];
    budgetUSD: number;
    interests: string[];
  };
  days: Array<{
    dayNumber: number;
    activities: Array<{
      id: string;
      name: string;
      estimatedCostUSD: number;
    }>;
  }>;
  totalCostUSD: number;
  name: string;
  updatedAt: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, recoverable: boolean = true) {
    super(message, 'STORAGE_ERROR', recoverable);
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', true);
  }
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  return promise
    .then<[T, null]>((data: T) => [data, null])
    .catch<[null, Error]>((error: Error) => {
      console.error('Async operation failed:', error);
      
      const userMessage = errorMessage || 'Something went wrong. Please try again.';
      
      // Show user-friendly toast
      toast.error(userMessage);
      
      return [null, error instanceof AppError ? error : new AppError(userMessage, 'UNKNOWN_ERROR')];
    });
}

export function safeLocalStorageOperation<T>(
  operation: () => T,
  fallback: T,
  errorMessage?: string
): T {
  try {
    return operation();
  } catch (error) {
    console.error('LocalStorage operation failed:', error);
    
    const message = errorMessage || 'Unable to save data. Your browser storage might be full.';
    
    toast.error(message, {
      description: 'Try clearing some browser data or using a different browser.',
      duration: 5000,
    });
    
    return fallback;
  }
}

export function validateTripData(data: TripData): boolean {
  try {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid trip data format');
    }

    if (!data.onboardingData || !data.days) {
      throw new ValidationError('Missing required trip information');
    }

    if (!Array.isArray(data.days) || data.days.length === 0) {
      throw new ValidationError('Trip must have at least one day');
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      toast.error(error.message);
    }
    return false;
  }
}

export function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attemptOperation = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        attempts++;
        
        if (attempts >= maxRetries) {
          reject(error);
          return;
        }

        console.warn(`Operation failed, retrying... (${attempts}/${maxRetries})`, error);
        
        setTimeout(attemptOperation, delay * attempts);
      }
    };

    attemptOperation();
  });
}

export function logError(error: Error, context?: string) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', errorData);
  }

  // In production, you could send this to an error tracking service
  // sendErrorToTrackingService(errorData);
}

export function handleCriticalError(error: Error, fallbackMessage?: string) {
  logError(error, 'Critical Error');
  
  const message = fallbackMessage || 'A critical error occurred. Please refresh the page.';
  
  toast.error(message, {
    duration: 10000,
    action: {
      label: 'Refresh',
      onClick: () => window.location.reload(),
    },
  });
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    toast.error('An unexpected error occurred', {
      description: 'Please refresh the page if this persists.',
    });
    
    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    toast.error('Something went wrong', {
      description: 'The page may not work correctly. Consider refreshing.',
    });
  });
}

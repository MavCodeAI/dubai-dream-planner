// Notification Manager - Toast notifications, in-app notification center, and notification preferences

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'proactive';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  source?: string;
  action?: {
    label: string;
    handler: string;
    params?: Record<string, unknown>;
  };
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enabled: boolean;
  toastEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
  showProactiveTips: boolean;
  showPriceAlerts: boolean;
  showWeatherAlerts: boolean;
  showBookingReminders: boolean;
  maxNotifications: number;
  autoHideDelay: number; // milliseconds
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  toastEnabled: true,
  soundEnabled: false,
  vibrationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  showProactiveTips: true,
  showPriceAlerts: true,
  showWeatherAlerts: true,
  showBookingReminders: true,
  maxNotifications: 50,
  autoHideDelay: 5000
};

// ==================== Notification Manager Class ====================

class NotificationManager {
  private notifications: Notification[] = [];
  private preferences: NotificationPreferences = { ...defaultPreferences };
  private isCenterOpen = false;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private toastListeners: Set<(notification: Notification) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('notification_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = (data.notifications || []).map((n: Notification) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        this.preferences = { ...defaultPreferences, ...data.preferences };
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('notification_data', JSON.stringify({
        notifications: this.notifications.slice(0, this.preferences.maxNotifications),
        preferences: this.preferences
      }));
    } catch (error) {
      console.error('Failed to save notification data:', error);
    }
  }

  /**
   * Create a full notification object
   */
  private createNotification(data: Partial<Notification>): Notification {
    return {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: data.type || 'info',
      priority: data.priority || 'medium',
      title: data.title || '',
      message: data.message || '',
      source: data.source,
      action: data.action,
      read: false,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      metadata: data.metadata
    };
  }

  /**
   * Check if in quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHoursEnabled || !this.preferences.quietHoursStart || !this.preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (this.preferences.quietHoursStart > this.preferences.quietHoursEnd) {
      return currentTime >= this.preferences.quietHoursStart || currentTime <= this.preferences.quietHoursEnd;
    }
    
    return currentTime >= this.preferences.quietHoursStart && currentTime <= this.preferences.quietHoursEnd;
  }

  /**
   * Show a toast notification
   */
  showToast(
    title: string,
    message: string,
    options: Partial<Notification> = {}
  ): Notification {
    const notification = this.createNotification({
      type: 'info',
      priority: 'medium',
      title,
      message,
      ...options
    });

    // Check quiet hours
    if (this.isInQuietHours()) {
      this.queueNotification(notification);
      return notification;
    }

    // Show toast to listeners
    this.toastListeners.forEach(listener => listener(notification));

    // Auto-hide if enabled
    if (this.preferences.autoHideDelay > 0 && notification.priority !== 'urgent') {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, this.preferences.autoHideDelay);
    }

    return notification;
  }

  /**
   * Queue notification for later delivery
   */
  private queueNotification(notification: Notification): void {
    const queue = JSON.parse(localStorage.getItem('notification_queue') || '[]');
    queue.push(notification);
    localStorage.setItem('notification_queue', JSON.stringify(queue));
  }

  /**
   * Process queued notifications
   */
  processQueuedNotifications(): void {
    const queue = JSON.parse(localStorage.getItem('notification_queue') || '[]');
    if (queue.length === 0) return;

    if (this.isInQuietHours()) return;

    queue.forEach((notification: Notification) => {
      this.toastListeners.forEach(listener => listener(notification));
    });

    localStorage.setItem('notification_queue', '[]');
  }

  /**
   * Show success notification
   */
  showSuccess(title: string, message: string): Notification {
    return this.showToast(title, message, { type: 'success' });
  }

  /**
   * Show error notification
   */
  showError(title: string, message: string): Notification {
    return this.showToast(title, message, { type: 'error', priority: 'high' });
  }

  /**
   * Show warning notification
   */
  showWarning(title: string, message: string): Notification {
    return this.showToast(title, message, { type: 'warning', priority: 'medium' });
  }

  /**
   * Show proactive tip
   */
  showProactiveTip(title: string, message: string, action?: Notification['action']): Notification {
    if (!this.preferences.showProactiveTips) {
      return this.createNotification({});
    }

    return this.showToast(title, message, {
      type: 'proactive',
      priority: 'low',
      source: 'proactive_intelligence',
      action
    });
  }

  /**
   * Show price alert
   */
  showPriceAlert(activityName: string, oldPrice: number, newPrice: number): Notification {
    if (!this.preferences.showPriceAlerts) {
      return this.createNotification({});
    }

    const percentage = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    
    return this.showToast('Price Drop Alert!', 
      `${activityName} is now ${percentage}% cheaper (${newPrice} AED)`,
      {
        type: 'info',
        priority: 'medium',
        source: 'price_monitor',
        action: {
          label: 'View Deal',
          handler: 'viewActivity'
        },
        metadata: { oldPrice, newPrice, percentage }
      }
    );
  }

  /**
   * Show weather alert
   */
  showWeatherAlert(city: string, conditions: string): Notification {
    if (!this.preferences.showWeatherAlerts) {
      return this.createNotification({});
    }

    return this.showToast('Weather Alert', 
      `Weather update for ${city}: ${conditions}`,
      {
        type: 'warning',
        priority: 'medium',
        source: 'weather_monitor'
      }
    );
  }

  /**
   * Show booking reminder
   */
  showBookingReminder(activityName: string, date: string): Notification {
    if (!this.preferences.showBookingReminders) {
      return this.createNotification({});
    }

    return this.showToast('Booking Reminder', 
      `Don't forget your booking for ${activityName} on ${date}`,
      {
        type: 'info',
        priority: 'high',
        source: 'booking_reminder',
        action: {
          label: 'View Booking',
          handler: 'viewBooking'
        }
      }
    );
  }

  /**
   * Add notification to the store (without toast)
   */
  addNotification(notification: Partial<Notification>): Notification {
    const fullNotification = this.createNotification(notification);
    
    this.notifications = [fullNotification, ...this.notifications];
    
    // Limit notifications
    if (this.notifications.length > this.preferences.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.preferences.maxNotifications);
    }

    this.saveToStorage();
    this.notifyListeners();
    return fullNotification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    this.notifications = this.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Dismiss/remove notification
   */
  dismissNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get notification stats
   */
  getStats(): NotificationStats {
    const byType: Record<NotificationType, number> = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
      proactive: 0
    };
    
    const byPriority: Record<NotificationPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    this.notifications.forEach(n => {
      byType[n.type]++;
      byPriority[n.priority]++;
    });

    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.read).length,
      byType,
      byPriority
    };
  }

  /**
   * Open notification center
   */
  openCenter(): void {
    this.isCenterOpen = true;
    this.notifyListeners();
  }

  /**
   * Close notification center
   */
  closeCenter(): void {
    this.isCenterOpen = false;
    this.notifyListeners();
  }

  /**
   * Toggle notification center
   */
  toggleCenter(): void {
    this.isCenterOpen = !this.isCenterOpen;
    this.notifyListeners();
  }

  /**
   * Get notification center state
   */
  isCenterOpenState(): boolean {
    return this.isCenterOpen;
  }

  /**
   * Update preferences
   */
  updatePreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    this.saveToStorage();
  }

  /**
   * Get preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to toast events
   */
  subscribeToToasts(listener: (notification: Notification) => void): () => void {
    this.toastListeners.add(listener);
    return () => this.toastListeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  /**
   * Initialize - process queued notifications
   */
  initialize(): void {
    this.processQueuedNotifications();
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

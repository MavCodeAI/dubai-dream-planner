// Trigger System - Time-based, event-based, and behavior-based triggers for proactive intelligence

// ==================== Trigger Types ====================

export type TriggerType = 'time' | 'event' | 'behavior';
export type TriggerCategory = 
  | 'trip_approaching'
  | 'weather_change'
  | 'price_drop'
  | 'booking_reminder'
  | 'activity_suggestion'
  | 'user_behavior'
  | 'system';

export type TriggerPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TriggerAction {
  id: string;
  type: 'notification' | 'suggestion' | 'workflow' | 'api_call' | 'state_update';
  payload: Record<string, unknown>;
}

// ==================== Time-Based Triggers ====================

export interface TimeTriggerConfig {
  schedule: TimeSchedule;
  timezone: string;
}

export type TimeSchedule = 
  | FixedSchedule
  | RecurringSchedule
  | RelativeSchedule;

export interface FixedSchedule {
  kind: 'fixed';
  dateTime: string; // ISO 8601
}

export interface RecurringSchedule {
  kind: 'recurring';
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string; // HH:mm
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  interval?: number; // Custom interval
}

export interface RelativeSchedule {
  kind: 'relative';
  reference: 'trip_start' | 'trip_end' | 'booking_date' | 'user_registration';
  offset: number; // Days relative to reference
  direction: 'before' | 'after';
}

// ==================== Event-Based Triggers ====================

export interface EventTriggerConfig {
  eventType: EventType;
  eventFilter?: EventFilter;
}

export type EventType = 
  | 'weather_update'
  | 'price_change'
  | 'availability_change'
  | 'booking_confirmation'
  | 'cancellation'
  | 'user_action'
  | 'external_api';

export interface EventFilter {
  fields: EventFilterField[];
  logic: 'and' | 'or';
}

export interface EventFilterField {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'between';
  value: unknown;
}

// ==================== Behavior-Based Triggers ====================

export interface BehaviorTriggerConfig {
  behaviorPattern: BehaviorPattern;
  thresholds: BehaviorThreshold[];
}

export type BehaviorPattern = 
  | 'frequent_query'
  | 'repeated_activity_view'
  | 'cart_abandonment'
  | 'search_intensification'
  | 'engagement_drop'
  | 'session_extended';

export interface BehaviorThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  timeWindow?: number; // Minutes for sliding window
}

// ==================== Runtime Trigger Interface ====================

export interface RuntimeTrigger {
  id: string;
  type: TriggerType;
  category: TriggerCategory;
  priority: TriggerPriority;
  enabled: boolean;
  createdAt: Date;
  lastFiredAt?: Date;
  fireCount: number;
  config: TimeTriggerConfig | EventTriggerConfig | BehaviorTriggerConfig;
  actions: TriggerAction[];
}

// ==================== Trigger Definitions ====================

export interface TimeTriggerDefinition {
  type: 'time';
  category: TriggerCategory;
  priority: TriggerPriority;
  enabled: boolean;
  config: TimeTriggerConfig;
  actions: TriggerAction[];
}

export interface EventTriggerDefinition {
  type: 'event';
  category: TriggerCategory;
  priority: TriggerPriority;
  enabled: boolean;
  config: EventTriggerConfig;
  actions: TriggerAction[];
}

export interface BehaviorTriggerDefinition {
  type: 'behavior';
  category: TriggerCategory;
  priority: TriggerPriority;
  enabled: boolean;
  config: BehaviorTriggerConfig;
  actions: TriggerAction[];
}

export type TriggerDefinition = TimeTriggerDefinition | EventTriggerDefinition | BehaviorTriggerDefinition;

// ==================== Trigger Instances ====================

export interface TriggerActionExecution {
  actionId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executedAt: Date;
}

export interface TriggerInstance {
  triggerId: string;
  firedAt: Date;
  conditionsMet: boolean;
  actionsExecuted: TriggerActionExecution[];
  metadata?: Record<string, unknown>;
}

// ==================== Predefined Triggers ====================

export const PREDEFINED_TIME_TRIGGERS: TimeTriggerDefinition[] = [
  {
    type: 'time',
    category: 'trip_approaching',
    priority: 'high',
    enabled: true,
    config: {
      schedule: {
        kind: 'relative',
        reference: 'trip_start',
        offset: 7,
        direction: 'before'
      },
      timezone: 'Asia/Dubai'
    },
    actions: [
      {
        id: 'trip_reminder_notification',
        type: 'notification',
        payload: {
          title: 'Trip Approaching!',
          message: 'Your trip to {{city}} is in 7 days. Ready to finalize your plans?',
          priority: 'high'
        }
      }
    ]
  },
  {
    type: 'time',
    category: 'trip_approaching',
    priority: 'urgent',
    enabled: true,
    config: {
      schedule: {
        kind: 'relative',
        reference: 'trip_start',
        offset: 1,
        direction: 'before'
      },
      timezone: 'Asia/Dubai'
    },
    actions: [
      {
        id: 'trip_tomorrow_notification',
        type: 'notification',
        payload: {
          title: 'Trip Tomorrow!',
          message: 'Your trip to {{city}} starts tomorrow! Make sure you have everything ready.',
          priority: 'urgent'
        }
      }
    ]
  }
];

export const PREDEFINED_EVENT_TRIGGERS: EventTriggerDefinition[] = [
  {
    type: 'event',
    category: 'weather_change',
    priority: 'medium',
    enabled: true,
    config: {
      eventType: 'weather_update',
      eventFilter: {
        fields: [
          { field: 'changeDetected', operator: 'eq', value: true },
          { field: 'severity', operator: 'in', value: ['moderate', 'severe'] }
        ],
        logic: 'and'
      }
    },
    actions: [
      {
        id: 'weather_alert_notification',
        type: 'notification',
        payload: {
          title: 'Weather Update',
          message: 'Weather conditions may affect your planned activities in {{city}}.',
          priority: 'medium'
        }
      }
    ]
  },
  {
    type: 'event',
    category: 'price_drop',
    priority: 'medium',
    enabled: true,
    config: {
      eventType: 'price_change',
      eventFilter: {
        fields: [
          { field: 'changeType', operator: 'eq', value: 'decrease' },
          { field: 'percentage', operator: 'gt', value: 10 }
        ],
        logic: 'and'
      }
    },
    actions: [
      {
        id: 'price_drop_suggestion',
        type: 'suggestion',
        payload: {
          title: 'Price Drop Alert!',
          message: 'Great news! Prices for {{activity}} have dropped by {{percentage}}%.',
          priority: 'medium'
        }
      }
    ]
  }
];

export const PREDEFINED_BEHAVIOR_TRIGGERS: BehaviorTriggerDefinition[] = [
  {
    type: 'behavior',
    category: 'user_behavior',
    priority: 'low',
    enabled: true,
    config: {
      behaviorPattern: 'frequent_query',
      thresholds: [
        { metric: 'queryCount', operator: 'gt', value: 5, timeWindow: 60 }
      ]
    },
    actions: [
      {
        id: 'frequent_query_suggestion',
        type: 'suggestion',
        payload: {
          title: 'Quick Tip',
          message: "I notice you're asking about similar things. Would you like me to create a custom itinerary for you?",
          priority: 'low'
        }
      }
    ]
  },
  {
    type: 'behavior',
    category: 'user_behavior',
    priority: 'medium',
    enabled: true,
    config: {
      behaviorPattern: 'cart_abandonment',
      thresholds: [
        { metric: 'viewedActivities', operator: 'gt', value: 3 },
        { metric: 'bookedActivities', operator: 'eq', value: 0 }
      ]
    },
    actions: [
      {
        id: 'cart_abandonment_reminder',
        type: 'notification',
        payload: {
          title: 'Still Planning?',
          message: "You've been looking at some great activities. Ready to book any of them?",
          priority: 'medium'
        }
      }
    ]
  }
];

// ==================== Trigger Manager ====================

export interface TriggerManagerConfig {
  checkInterval: number; // milliseconds
  maxTriggersPerCheck: number;
  enableAnalytics: boolean;
}

export interface TriggerResult {
  trigger: RuntimeTrigger;
  fired: boolean;
  instance?: TriggerInstance;
}

// ==================== Trigger Serialization ====================

export interface TriggerSerialization {
  version: string;
  triggers: SerializedTrigger[];
  lastSyncAt: string;
}

export interface SerializedTrigger {
  id: string;
  type: TriggerType;
  category: TriggerCategory;
  priority: TriggerPriority;
  enabled: boolean;
  schedule?: TimeSchedule;
  eventType?: EventType;
  eventFilter?: EventFilter;
  behaviorPattern?: BehaviorPattern;
  thresholds?: BehaviorThreshold[];
  actions: TriggerAction[];
}

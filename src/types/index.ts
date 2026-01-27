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

export interface Activity {
  id: string;
  name: string;
  city: string;
  description: string;
  durationHours: number;
  estimatedCostUSD: number;
  tags: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  familyFriendly: boolean;
  luxuryLevel: 'budget' | 'mid' | 'lux';
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

// ==================== Agentic AI Types ====================

// Context Engine Types
export interface SessionContext {
  userId: string;
  sessionId: string;
  currentIntent?: Record<string, unknown>;
  currentTripId: string | null;
  viewedActivities: string[];
  bookedActivities: string[];
  favoriteActivities: string[];
  messageCount: number;
  lastInteractionTime: Date;
  preferredLanguage: 'urdu' | 'english' | 'bilingual';
  preferences: UserPreferences;
  isActive: boolean;
  startedAt: Date;
}

export interface UserPreferences {
  preferredActivities: string[];
  avoidedActivities: string[];
  averageBudgetRange: { min: number; max: number };
  spendingPattern: 'budget' | 'moderate' | 'luxury';
  preferredPace: 'relaxed' | 'standard' | 'packed';
  preferredStartTime: string;
  activityDuration: 'short' | 'medium' | 'long';
  tripType: 'solo' | 'couple' | 'family' | 'group';
  interests: string[];
  notificationFrequency: 'low' | 'medium' | 'high';
  proactiveTipsEnabled: boolean;
  priceAlertEnabled: boolean;
}

export interface ContextSuggestion {
  id: string;
  type: 'recommendation' | 'reminder' | 'tip' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relevanceScore: number;
  context: string;
  action?: {
    label: string;
    handler: string;
    params?: Record<string, unknown>;
  };
  createdAt: Date;
  expiresAt?: Date;
}

// Trigger Types
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

export interface TimeSchedule {
  kind: 'fixed' | 'recurring' | 'relative';
  dateTime?: string;
  time?: string;
  daysOfWeek?: number[];
  reference?: string;
  offset?: number;
  direction?: 'before' | 'after';
}

export interface EventType {
  eventType: string;
  eventFilter?: {
    fields: Array<{ field: string; operator: string; value: unknown }>;
    logic: 'and' | 'or';
  };
}

export interface BehaviorPattern {
  behaviorPattern: string;
  thresholds: Array<{ metric: string; operator: string; value: number; timeWindow?: number }>;
}

// Notification Types
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
  quietHoursStart?: string;
  quietHoursEnd?: string;
  showProactiveTips: boolean;
  showPriceAlerts: boolean;
  showWeatherAlerts: boolean;
  showBookingReminders: boolean;
  maxNotifications: number;
  autoHideDelay: number;
}

// Action Agent Types
export type ActionType = 'book' | 'reserve' | 'purchase' | 'inquire' | 'cancel' | 'modify' | 'query';
export type ActionStatus = 'pending' | 'in_progress' | 'awaiting_confirmation' | 'confirmed' | 'completed' | 'failed' | 'cancelled';

export interface ActionParams {
  activityId?: string;
  activityName?: string;
  activityProvider?: string;
  date?: string;
  time?: string;
  duration?: number;
  participants?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  options?: Record<string, unknown>;
  specialRequests?: string;
}

export interface ActionResult {
  success: boolean;
  confirmationNumber?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface Action {
  id: string;
  type: ActionType;
  status: ActionStatus;
  params: ActionParams;
  result?: ActionResult;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

// Workflow Types
export type WorkflowType = 'booking' | 'cancellation' | 'modification';
export type WorkflowStatus = 
  | 'initiated'
  | 'collecting_info'
  | 'validating'
  | 'processing'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data?: Record<string, unknown>;
  error?: string;
  completedAt?: Date;
}

export interface BookingWorkflow {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  actionId?: string;
  params: ActionParams;
  result?: {
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

// State Machine Types
export type StateType = 'action' | 'workflow' | 'session' | 'user_preference';
export type StateStatus = 'active' | 'completed' | 'paused' | 'error' | 'archived';

export interface StateTransition {
  from: string;
  to: string;
  event: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface StateSnapshot {
  id: string;
  type: StateType;
  key: string;
  value: Record<string, unknown>;
  status: StateStatus;
  version: number;
  transitions: StateTransition[];
  createdAt: Date;
  updatedAt: Date;
  lastEvent?: string;
  metadata?: Record<string, unknown>;
}

// Agent Bus Types
export type AgentId = string;
export type MessageType = 'request' | 'response' | 'event' | 'broadcast' | 'query';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId | 'broadcast';
  type: MessageType;
  priority: MessagePriority;
  topic: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  replyTo?: string;
  correlationId?: string;
  ttl?: number;
  metadata?: {
    source: string;
    version: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    tags?: string[];
  };
}

export interface AgentInfo {
  id: AgentId;
  name: string;
  type: string;
  version: string;
  status: 'online' | 'offline' | 'busy';
  capabilities: string[];
  lastSeen: Date;
  metadata?: Record<string, unknown>;
}

export interface AgentSubscription {
  agentId: AgentId;
  topics: string[];
  handler: (message: AgentMessage) => Promise<AgentMessage | void>;
  priority: number;
}

// Dynamic Router Types
export type IntentComplexity = 'simple' | 'moderate' | 'complex' | 'very_complex';
export type AgentType = 'planning' | 'weather' | 'activity' | 'budget' | 'booking' | 'general';

export interface IntentAnalysis {
  complexity: IntentComplexity;
  requiredAgents: AgentType[];
  estimatedSteps: number;
  requiresParallel: boolean;
  requiresExternalApi: boolean;
  keywords: string[];
}

export interface RoutingDecision {
  primaryAgent: AgentId;
  supportingAgents: AgentId[];
  parallelAgents: AgentId[];
  fallbackAgent: AgentId;
  strategy: 'single' | 'sequential' | 'parallel' | 'hybrid';
  estimatedCost: number;
  estimatedTime: number;
}

export interface ActiveAgent {
  id: AgentId;
  type: AgentType;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'busy';
  currentTask?: string;
}

// Session Continuity Types
export interface SessionState {
  id: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
  state: 'active' | 'paused' | 'restoring' | 'ended';
  data: SessionData;
  restoredFrom: string | null;
}

export interface SessionData {
  currentIntent?: Record<string, unknown>;
  currentWorkflowId?: string;
  pendingActions: string[];
  chatContext: ChatContext;
  userPreferences: Record<string, unknown>;
  customData: Record<string, unknown>;
}

export interface ChatContext {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  lastMessageId: string | null;
  suggestedActions: string[];
}

// Preference Learning Types
export interface UserProfile {
  userId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  preferences: LearnedPreferences;
  interactionCount: number;
  lastInteraction: Date;
}

export interface LearnedPreferences {
  favoriteActivities: string[];
  dislikedActivities: string[];
  preferredActivityTypes: string[];
  preferredDuration: 'short' | 'medium' | 'long';
  averageSpend: number;
  spendRange: { min: number; max: number };
  spendingTendency: 'budget' | 'moderate' | 'luxury';
  preferredStartTime: string;
  preferredPace: 'relaxed' | 'moderate' | 'packed';
  activityDensity: 'low' | 'medium' | 'high';
  tripType: 'solo' | 'couple' | 'family' | 'group';
  preferredCities: string[];
  travelStyle: 'adventurous' | 'balanced' | 'comfortable';
  preferredLanguage: 'urdu' | 'english' | 'bilingual';
  responseStyle: 'concise' | 'detailed' | 'balanced';
  confidenceScores: Record<string, number>;
  lastLearnedAt: Record<string, Date>;
  [key: string]: unknown;
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

// Trigger System Implementation - Manages time-based, event-based, and behavior-based triggers
import { 
  TriggerDefinition,
  RuntimeTrigger,
  TriggerInstance,
  TriggerAction,
  TriggerActionExecution,
  TriggerManagerConfig,
  PREDEFINED_TIME_TRIGGERS,
  PREDEFINED_EVENT_TRIGGERS,
  PREDEFINED_BEHAVIOR_TRIGGERS
} from './types';

type TriggerListener = (instance: TriggerInstance) => void;

export class TriggerManager {
  private triggers: Map<string, RuntimeTrigger> = new Map();
  private listeners: Set<TriggerListener> = new Set();
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Map<string, Set<(data: unknown) => void>> = new Map();
  private config: TriggerManagerConfig;

  constructor(config: Partial<TriggerManagerConfig> = {}) {
    this.config = {
      checkInterval: config.checkInterval || 60000, // 1 minute default
      maxTriggersPerCheck: config.maxTriggersPerCheck || 10,
      enableAnalytics: config.enableAnalytics !== false
    };
  }

  /**
   * Initialize the trigger manager and load predefined triggers
   */
  async initialize(): Promise<void> {
    // Load predefined triggers
    this.loadPredefinedTriggers();
    
    // Start the check interval for time-based triggers
    this.startMonitoring();
    
    console.log('TriggerManager initialized with', this.triggers.size, 'triggers');
  }

  /**
   * Load all predefined triggers
   */
  private loadPredefinedTriggers(): void {
    // Load time triggers
    PREDEFINED_TIME_TRIGGERS.forEach(trigger => {
      this.registerTrigger(trigger);
    });

    // Load event triggers
    PREDEFINED_EVENT_TRIGGERS.forEach(trigger => {
      this.registerTrigger(trigger);
    });

    // Load behavior triggers
    PREDEFINED_BEHAVIOR_TRIGGERS.forEach(trigger => {
      this.registerTrigger(trigger);
    });
  }

  /**
   * Register a new trigger
   */
  registerTrigger(trigger: TriggerDefinition): string {
    const runtimeTrigger: RuntimeTrigger = {
      ...trigger,
      id: trigger.type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      fireCount: 0
    };
    this.triggers.set(runtimeTrigger.id, runtimeTrigger);
    return runtimeTrigger.id;
  }

  /**
   * Unregister a trigger
   */
  unregisterTrigger(triggerId: string): boolean {
    return this.triggers.delete(triggerId);
  }

  /**
   * Enable a trigger
   */
  enableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Disable a trigger
   */
  disableTrigger(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Start monitoring triggers
   */
  private startMonitoring(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    
    this.checkIntervalId = setInterval(() => {
      this.checkTimeTriggers();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring triggers
   */
  stopMonitoring(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Check all time-based triggers
   */
  private async checkTimeTriggers(): Promise<void> {
    const now = new Date();
    let checked = 0;

    for (const [id, trigger] of this.triggers) {
      if (checked >= this.config.maxTriggersPerCheck) break;
      
      if (trigger.type === 'time' && trigger.enabled) {
        if (this.shouldFireTimeTrigger(trigger, now)) {
          checked++;
          await this.fireTrigger(id, trigger);
        }
      }
    }
  }

  /**
   * Check if a time trigger should fire
   */
  private shouldFireTimeTrigger(trigger: RuntimeTrigger, now: Date): boolean {
    const schedule = (trigger.config as { schedule?: { kind: string; dateTime?: string; time?: string; daysOfWeek?: number[]; reference?: string; offset?: number; direction?: string } }).schedule;
    if (!schedule) return false;
    
    if (schedule.kind === 'fixed') {
      const fireTime = new Date(schedule.dateTime!);
      return fireTime <= now && 
        (!trigger.lastFiredAt || fireTime.getTime() > trigger.lastFiredAt.getTime());
    }
    
    if (schedule.kind === 'recurring') {
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime !== schedule.time) return false;
      
      const dayOfWeek = now.getDay();
      if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(dayOfWeek)) return false;
      
      if (trigger.lastFiredAt) {
        const lastFiredDay = trigger.lastFiredAt.getDate();
        if (lastFiredDay === now.getDate()) return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Fire a trigger and execute its actions
   */
  private async fireTrigger(triggerId: string, trigger: RuntimeTrigger): Promise<void> {
    const instance: TriggerInstance = {
      triggerId,
      firedAt: new Date(),
      conditionsMet: true,
      actionsExecuted: []
    };

    try {
      // Execute all actions
      for (const action of trigger.actions) {
        const execution = await this.executeAction(action);
        instance.actionsExecuted.push(execution);
      }

      // Update trigger state
      trigger.lastFiredAt = new Date();
      trigger.fireCount++;

      // Notify listeners
      this.listeners.forEach(listener => listener(instance));

      if (this.config.enableAnalytics) {
        this.trackTriggerFire(trigger, instance);
      }

    } catch (error) {
      console.error('Error firing trigger:', error);
    }
  }

  /**
   * Execute a trigger action
   */
  private async executeAction(action: TriggerAction): Promise<TriggerActionExecution> {
    try {
      let result: unknown;

      switch (action.type) {
        case 'notification':
          result = await this.handleNotificationAction(action.payload);
          break;
        case 'suggestion':
          result = await this.handleSuggestionAction(action.payload);
          break;
        case 'workflow':
          result = await this.handleWorkflowAction(action.payload);
          break;
        case 'api_call':
          result = await this.handleApiCallAction(action.payload);
          break;
        case 'state_update':
          this.handleStateUpdateAction(action.payload);
          result = { success: true };
          break;
        default:
          result = { success: false, error: 'Unknown action type' };
      }

      return {
        actionId: action.id,
        success: true,
        result,
        executedAt: new Date()
      };

    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date()
      };
    }
  }

  /**
   * Handle notification action
   */
  private async handleNotificationAction(payload: Record<string, unknown>): Promise<{ notificationId: string }> {
    console.log('Notification action:', payload);
    return { notificationId: 'notif_' + Date.now() };
  }

  /**
   * Handle suggestion action
   */
  private async handleSuggestionAction(payload: Record<string, unknown>): Promise<{ suggestionId: string }> {
    console.log('Suggestion action:', payload);
    return { suggestionId: 'sugg_' + Date.now() };
  }

  /**
   * Handle workflow action
   */
  private async handleWorkflowAction(payload: Record<string, unknown>): Promise<{ workflowId: string }> {
    console.log('Workflow action:', payload);
    return { workflowId: 'wf_' + Date.now() };
  }

  /**
   * Handle API call action
   */
  private async handleApiCallAction(payload: Record<string, unknown>): Promise<{ response: unknown }> {
    console.log('API call action:', payload);
    return { response: null };
  }

  /**
   * Handle state update action
   */
  private handleStateUpdateAction(payload: Record<string, unknown>): void {
    console.log('State update action:', payload);
  }

  /**
   * Track trigger fire for analytics
   */
  private trackTriggerFire(trigger: RuntimeTrigger, instance: TriggerInstance): void {
    console.log('Trigger fired:', trigger.category, instance);
  }

  /**
   * Emit an event for event-based triggers
   */
  emitEvent(eventType: string, data: unknown): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
    
    // Check event-based triggers
    this.checkEventTriggers(eventType, data);
  }

  /**
   * Check event-based triggers
   */
  private async checkEventTriggers(eventType: string, data: unknown): Promise<void> {
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'event' && trigger.enabled) {
        const eventConfig = trigger.config as { eventType?: string; eventFilter?: { fields: Array<{ field: string; operator: string; value: unknown }>; logic: string } };
        if (eventConfig.eventType === eventType) {
          if (this.evaluateEventFilter(eventConfig.eventFilter, data)) {
            await this.fireTrigger(id, trigger);
          }
        }
      }
    }
  }

  /**
   * Evaluate event filter conditions
   */
  private evaluateEventFilter(
    filter: { fields: Array<{ field: string; operator: string; value: unknown }>; logic: string } | undefined,
    data: unknown
  ): boolean {
    if (!filter) return true;
    
    const results = filter.fields.map(field => {
      const fieldValue = this.getNestedValue(data, field.field);
      return this.evaluateCondition(fieldValue, field.operator, field.value);
    });
    
    return filter.logic === 'and' 
      ? results.every(r => r) 
      : results.some(r => r);
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    if (typeof obj !== 'object' || obj === null) return undefined;
    
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(value: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq': return value === expected;
      case 'ne': return value !== expected;
      case 'gt': return typeof value === 'number' && value > (expected as number);
      case 'lt': return typeof value === 'number' && value < (expected as number);
      case 'gte': return typeof value === 'number' && value >= (expected as number);
      case 'lte': return typeof value === 'number' && value <= (expected as number);
      case 'contains': return typeof value === 'string' && value.includes(expected as string);
      case 'in': return Array.isArray(expected) && expected.includes(value);
      case 'between': return Array.isArray(expected) && typeof value === 'number' && value >= (expected[0] as number) && value <= (expected[1] as number);
      default: return false;
    }
  }

  /**
   * Report behavior for behavior-based triggers
   */
  reportBehavior(behaviorType: string, metrics: Record<string, number>): void {
    this.checkBehaviorTriggers(behaviorType, metrics);
  }

  /**
   * Check behavior-based triggers
   */
  private async checkBehaviorTriggers(behaviorType: string, metrics: Record<string, number>): Promise<void> {
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'behavior' && trigger.enabled) {
        const behaviorConfig = trigger.config as { behaviorPattern?: string; thresholds?: Array<{ metric: string; operator: string; value: number }> };
        if (behaviorConfig.behaviorPattern === behaviorType) {
          if (this.evaluateBehaviorThresholds(behaviorConfig.thresholds || [], metrics)) {
            await this.fireTrigger(id, trigger);
          }
        }
      }
    }
  }

  /**
   * Evaluate behavior thresholds
   */
  private evaluateBehaviorThresholds(
    thresholds: Array<{ metric: string; operator: string; value: number }>,
    metrics: Record<string, number>
  ): boolean {
    return thresholds.every(threshold => {
      const metricValue = metrics[threshold.metric];
      if (metricValue === undefined) return false;
      return this.evaluateCondition(metricValue, threshold.operator, threshold.value);
    });
  }

  /**
   * Subscribe to trigger fires
   */
  subscribe(listener: TriggerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all registered triggers
   */
  getTriggers(): RuntimeTrigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get trigger by ID
   */
  getTrigger(id: string): RuntimeTrigger | undefined {
    return this.triggers.get(id);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.eventHandlers.clear();
    this.triggers.clear();
  }
}

// Singleton instance
export const triggerManager = new TriggerManager();

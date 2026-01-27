// Action Agent - Handles external API integrations and action execution for bookings, reservations, and purchases
import { notificationManager } from '../notifications/notification-manager';

export type ActionType = 'book' | 'reserve' | 'purchase' | 'inquire' | 'cancel' | 'modify' | 'query';
export type ActionStatus = 'pending' | 'in_progress' | 'awaiting_confirmation' | 'confirmed' | 'completed' | 'failed' | 'cancelled';

export interface ActionParams {
  // Activity details
  activityId?: string;
  activityName?: string;
  activityProvider?: string;
  
  // Booking details
  date?: string;
  time?: string;
  duration?: number;
  participants?: number;
  
  // Personal details
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  
  // Payment details
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  
  // Additional options
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

export interface ActionHandler {
  type: ActionType;
  execute: (params: ActionParams) => Promise<ActionResult>;
  validate?: (params: ActionParams) => { valid: boolean; error?: string };
  cancel?: (actionId: string) => Promise<ActionResult>;
  modify?: (actionId: string, updates: Partial<ActionParams>) => Promise<ActionResult>;
}

// ==================== Action Agent Class ====================

class ActionAgent {
  private actions: Map<string, Action> = new Map();
  private handlers: Map<ActionType, ActionHandler> = new Map();
  private listeners: Set<(action: Action) => void> = new Set();

  constructor() {
    // Register default handlers
    this.registerDefaultHandlers();
  }

  /**
   * Register default action handlers
   */
  private registerDefaultHandlers(): void {
    // Inquiry handler
    this.registerHandler({
      type: 'inquire',
      execute: async (params) => this.handleInquiry(params),
      validate: (params) => this.validateInquiry(params)
    });

    // Booking handler
    this.registerHandler({
      type: 'book',
      execute: async (params) => this.handleBooking(params),
      validate: (params) => this.validateBooking(params)
    });

    // Cancellation handler
    this.registerHandler({
      type: 'cancel',
      execute: async (params) => this.handleCancellation(params),
      validate: (params) => this.validateCancellation(params)
    });
  }

  /**
   * Register a custom action handler
   */
  registerHandler(handler: ActionHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /**
   * Create a new action
   */
  async createAction(type: ActionType, params: ActionParams): Promise<Action> {
    const handler = this.handlers.get(type);
    
    if (!handler) {
      throw new Error(`No handler registered for action type: ${type}`);
    }

    // Validate params
    if (handler.validate) {
      const validation = handler.validate(params);
      if (!validation.valid) {
        throw new Error(validation.error || 'Validation failed');
      }
    }

    const action: Action = {
      id: 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      status: 'pending',
      params,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    this.actions.set(action.id, action);
    this.notifyListeners(action);

    // Execute the action
    await this.executeAction(action.id);

    return action;
  }

  /**
   * Execute an action
   */
  async executeAction(actionId: string): Promise<Action> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    const handler = this.handlers.get(action.type);
    if (!handler) {
      action.status = 'failed';
      action.result = { success: false, error: 'No handler registered' };
      this.updateAction(action);
      return action;
    }

    try {
      action.status = 'in_progress';
      action.updatedAt = new Date();
      this.updateAction(action);

      // Execute the handler
      const result = await handler.execute(action.params);
      
      action.result = result;
      action.status = result.success ? 'confirmed' : 'failed';
      action.updatedAt = new Date();
      
      // Notify result
      if (result.success) {
        notificationManager.showSuccess('Action Completed', 
          `Your ${action.type} for ${action.params.activityName} has been processed.`);
      } else {
        notificationManager.showError('Action Failed', result.error || 'An error occurred');
      }

    } catch (error) {
      action.retryCount++;
      
      if (action.retryCount < action.maxRetries) {
        action.status = 'pending';
        // Retry after delay
        setTimeout(() => this.executeAction(actionId), 2000 * action.retryCount);
      } else {
        action.status = 'failed';
        action.result = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    this.updateAction(action);
    return action;
  }

  /**
   * Cancel an action
   */
  async cancelAction(actionId: string): Promise<Action> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    const handler = this.handlers.get(action.type);
    if (!handler?.cancel) {
      throw new Error(`Cancellation not supported for action type: ${action.type}`);
    }

    try {
      const result = await handler.cancel(actionId);
      action.status = result.success ? 'cancelled' : 'failed';
      action.result = result;
    } catch (error) {
      action.status = 'failed';
      action.result = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    action.updatedAt = new Date();
    this.updateAction(action);
    return action;
  }

  /**
   * Modify an action
   */
  async modifyAction(actionId: string, updates: Partial<ActionParams>): Promise<Action> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    const handler = this.handlers.get(action.type);
    if (!handler?.modify) {
      throw new Error(`Modification not supported for action type: ${action.type}`);
    }

    try {
      const result = await handler.modify(actionId, updates);
      action.status = result.success ? 'pending' : 'failed';
      action.result = result;
      action.params = { ...action.params, ...updates };
    } catch (error) {
      action.status = 'failed';
      action.result = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    action.updatedAt = new Date();
    this.updateAction(action);
    return action;
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): Action | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get all actions
   */
  getAllActions(): Action[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by status
   */
  getActionsByStatus(status: ActionStatus): Action[] {
    return Array.from(this.actions.values()).filter(a => a.status === status);
  }

  /**
   * Get pending actions
   */
  getPendingActions(): Action[] {
    return this.getActionsByStatus('pending');
  }

  /**
   * Get in-progress actions
   */
  getInProgressActions(): Action[] {
    return this.getActionsByStatus('in_progress');
  }

  /**
   * Subscribe to action updates
   */
  subscribe(listener: (action: Action) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of action update
   */
  private notifyListeners(action: Action): void {
    this.listeners.forEach(listener => listener(action));
  }

  /**
   * Update action and notify listeners
   */
  private updateAction(action: Action): void {
    this.actions.set(action.id, action);
    this.notifyListeners(action);
    this.persistActions();
  }

  /**
   * Persist actions to localStorage
   */
  private persistActions(): void {
    try {
      const actions = Array.from(this.actions.values());
      localStorage.setItem('action_agent_data', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to persist actions:', error);
    }
  }

  /**
   * Load persisted actions
   */
  loadPersistedActions(): void {
    try {
      const stored = localStorage.getItem('action_agent_data');
      if (stored) {
        const actions = JSON.parse(stored);
        actions.forEach((a: Action) => {
          this.actions.set(a.id, {
            ...a,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load persisted actions:', error);
    }
  }

  // ==================== Default Handler Implementations ====================

  /**
   * Handle inquiry action
   */
  private async handleInquiry(params: ActionParams): Promise<ActionResult> {
    // Simulate API call for inquiry
    await this.simulateApiCall(1000);
    
    return {
      success: true,
      details: {
        inquiryId: 'INQ_' + Date.now(),
        message: `Inquiry sent to ${params.activityProvider || 'provider'}`,
        expectedResponseTime: '24-48 hours'
      }
    };
  }

  /**
   * Validate inquiry params
   */
  private validateInquiry(params: ActionParams): { valid: boolean; error?: string } {
    if (!params.activityName) {
      return { valid: false, error: 'Activity name is required' };
    }
    return { valid: true };
  }

  /**
   * Handle booking action
   */
  private async handleBooking(params: ActionParams): Promise<ActionResult> {
    // Simulate booking API call
    await this.simulateApiCall(2000);
    
    // Generate confirmation number
    const confirmationNumber = 'BK' + Date.now().toString(36).toUpperCase();
    
    return {
      success: true,
      confirmationNumber,
      details: {
        bookedDate: params.date,
        bookedTime: params.time,
        participants: params.participants,
        totalAmount: params.amount
      }
    };
  }

  /**
   * Validate booking params
   */
  private validateBooking(params: ActionParams): { valid: boolean; error?: string } {
    if (!params.activityId) {
      return { valid: false, error: 'Activity ID is required' };
    }
    if (!params.date) {
      return { valid: false, error: 'Date is required' };
    }
    if (!params.participants || params.participants < 1) {
      return { valid: false, error: 'Valid participant count is required' };
    }
    return { valid: true };
  }

  /**
   * Handle cancellation action
   */
  private async handleCancellation(params: ActionParams): Promise<ActionResult> {
    // Simulate cancellation API call
    await this.simulateApiCall(1500);
    
    return {
      success: true,
      details: {
        cancellationId: 'CAN_' + Date.now(),
        refundStatus: 'processing',
        refundAmount: params.amount
      }
    };
  }

  /**
   * Validate cancellation params
   */
  private validateCancellation(params: ActionParams): { valid: boolean; error?: string } {
    if (!params.activityId) {
      return { valid: false, error: 'Activity ID is required' };
    }
    return { valid: true };
  }

  /**
   * Simulate API call with delay
   */
  private async simulateApiCall(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Singleton instance
export const actionAgent = new ActionAgent();

// Helper function to create booking action
export async function createBooking(params: ActionParams): Promise<Action> {
  return actionAgent.createAction('book', params);
}

// Helper function to create inquiry action
export async function createInquiry(params: ActionParams): Promise<Action> {
  return actionAgent.createAction('inquire', params);
}

// Helper function to create cancellation action
export async function createCancellation(params: ActionParams): Promise<Action> {
  return actionAgent.createAction('cancel', params);
}

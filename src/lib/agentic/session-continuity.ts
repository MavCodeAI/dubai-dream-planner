// Session Continuity Manager - Resume interrupted workflows and restore session state
import { actionAgent } from './agents/action-agent';
import { bookingWorkflowManager } from './workflows/booking-workflow';
import { stateMachine } from './state-machine';
import { contextEngine } from './context-engine';
import { preferenceLearner } from './learning/preference-learner';

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

export interface RestorationResult {
  success: boolean;
  sessionId: string;
  restoredItems: RestoredItem[];
  errors: RestorationError[];
  timestamp: Date;
}

export interface RestoredItem {
  type: 'workflow' | 'action' | 'context' | 'preferences' | 'chat';
  id: string;
  status: 'restored' | 'partial' | 'failed';
  details?: string;
}

export interface RestorationError {
  type: string;
  message: string;
  recoverable: boolean;
}

// ==================== Session Continuity Manager Class ====================

class SessionContinuityManager {
  private currentSession: SessionState | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private readonly SESSION_TIMEOUT = 3600000; // 1 hour

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize session from storage
   */
  private initializeFromStorage(): void {
    try {
      const stored = localStorage.getItem('current_session');
      if (stored) {
        const session = JSON.parse(stored) as SessionState;
        this.currentSession = {
          ...session,
          startedAt: new Date(session.startedAt),
          lastActivity: new Date(session.lastActivity)
        };
        
        // Check if session is still valid
        if (this.isSessionExpired(this.currentSession)) {
          this.endSession();
        } else {
          // Restore session state
          this.restoreSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  /**
   * Start a new session
   */
  startSession(userId: string): SessionState {
    // End any existing session
    if (this.currentSession) {
      this.endSession();
    }

    const session: SessionState = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      startedAt: new Date(),
      lastActivity: new Date(),
      state: 'active',
      data: {
        pendingActions: [],
        chatContext: {
          messages: [],
          lastMessageId: null,
          suggestedActions: []
        },
        userPreferences: {},
        customData: {}
      },
      restoredFrom: null
    };

    this.currentSession = session;
    this.saveSession();
    this.startAutoSave();

    console.log('Session started:', session.id);
    return session;
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date();
      this.saveSession();
    }
  }

  /**
   * Update session data
   */
  updateData(updates: Partial<SessionData>): void {
    if (this.currentSession) {
      this.currentSession.data = { ...this.currentSession.data, ...updates };
      this.currentSession.lastActivity = new Date();
      this.saveSession();
    }
  }

  /**
   * Save chat context
   */
  saveChatMessage(role: 'user' | 'assistant', content: string): void {
    if (!this.currentSession) return;

    const message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date()
    };

    this.currentSession.data.chatContext.messages.push(message);
    this.currentSession.data.chatContext.lastMessageId = message.id;
    this.updateActivity();
  }

  /**
   * Get chat context
   */
  getChatContext(): ChatContext | null {
    return this.currentSession?.data.chatContext || null;
  }

  /**
   * Get chat messages
   */
  getChatMessages(): Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }> {
    return this.currentSession?.data.chatContext.messages || [];
  }

  /**
   * Add suggested action
   */
  addSuggestedAction(action: string): void {
    if (this.currentSession) {
      const actions = this.currentSession.data.chatContext.suggestedActions;
      if (!actions.includes(action)) {
        actions.push(action);
      }
    }
  }

  /**
   * Clear suggested actions
   */
  clearSuggestedActions(): void {
    if (this.currentSession) {
      this.currentSession.data.chatContext.suggestedActions = [];
    }
  }

  /**
   * Save pending action
   */
  savePendingAction(actionId: string): void {
    if (this.currentSession) {
      const actions = this.currentSession.data.pendingActions;
      if (!actions.includes(actionId)) {
        actions.push(actionId);
      }
    }
  }

  /**
   * Remove pending action
   */
  removePendingAction(actionId: string): void {
    if (this.currentSession) {
      this.currentSession.data.pendingActions = 
        this.currentSession.data.pendingActions.filter(id => id !== actionId);
    }
  }

  /**
   * Set current workflow
   */
  setCurrentWorkflow(workflowId: string): void {
    if (this.currentSession) {
      this.currentSession.data.currentWorkflowId = workflowId;
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionState | null {
    return this.currentSession;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.currentSession?.id || null;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.currentSession?.userId || null;
  }

  /**
   * Restore session
   */
  async restoreSession(): Promise<RestorationResult> {
    if (!this.currentSession) {
      return {
        success: false,
        sessionId: '',
        restoredItems: [],
        errors: [{ type: 'no_session', message: 'No session to restore', recoverable: false }],
        timestamp: new Date()
      };
    }

    this.currentSession.state = 'restoring';
    const restoredItems: RestoredItem[] = [];
    const errors: RestorationError[] = [];

    // Restore workflow
    if (this.currentSession.data.currentWorkflowId) {
      try {
        const workflow = bookingWorkflowManager.getWorkflow(this.currentSession.data.currentWorkflowId);
        if (workflow && workflow.status !== 'completed' && workflow.status !== 'cancelled') {
          restoredItems.push({
            type: 'workflow',
            id: workflow.id,
            status: 'restored',
            details: `Resumed ${workflow.type} workflow`
          });
        }
      } catch (error) {
        errors.push({
          type: 'workflow_restore',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true
        });
      }
    }

    // Restore pending actions
    for (const actionId of this.currentSession.data.pendingActions) {
      try {
        const action = actionAgent.getAction(actionId);
        if (action && action.status === 'pending') {
          await actionAgent.executeAction(actionId);
          restoredItems.push({
            type: 'action',
            id: actionId,
            status: 'restored',
            details: `Re-executed ${action.type} action`
          });
        }
      } catch (error) {
        errors.push({
          type: 'action_restore',
          message: `Failed to restore action ${actionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recoverable: true
        });
      }
    }

    // Restore user preferences
    try {
      const preferences = preferenceLearner.getPreferences(this.currentSession.userId);
      if (preferences) {
        this.currentSession.data.userPreferences = preferences as Record<string, unknown>;
        restoredItems.push({
          type: 'preferences',
          id: this.currentSession.userId,
          status: 'restored'
        });
      }
    } catch (error) {
      errors.push({
        type: 'preferences_restore',
        message: 'Failed to restore preferences',
        recoverable: true
      });
    }

    // Resume interrupted workflows in state machine
    try {
      await stateMachine.resumeInterruptedWorkflows();
    } catch (error) {
      errors.push({
        type: 'state_machine_resume',
        message: 'Failed to resume some workflows',
        recoverable: true
      });
    }

    this.currentSession.state = 'active';
    this.currentSession.restoredFrom = this.currentSession.id;
    this.saveSession();

    const result: RestorationResult = {
      success: errors.length === 0 || restoredItems.length > 0,
      sessionId: this.currentSession.id,
      restoredItems,
      errors,
      timestamp: new Date()
    };

    console.log('Session restored:', result);
    return result;
  }

  /**
   * End session
   */
  endSession(): void {
    if (this.currentSession) {
      this.currentSession.state = 'ended';
      this.stopAutoSave();
      this.saveSession();
      
      console.log('Session ended:', this.currentSession.id);
      this.currentSession = null;
    }
  }

  /**
   * Pause session
   */
  pauseSession(): void {
    if (this.currentSession && this.currentSession.state === 'active') {
      this.currentSession.state = 'paused';
      this.stopAutoSave();
      this.saveSession();
    }
  }

  /**
   * Resume session
   */
  async resumeSession(): Promise<RestorationResult | null> {
    if (this.currentSession && this.currentSession.state === 'paused') {
      this.currentSession.state = 'active';
      this.startAutoSave();
      return this.restoreSession();
    }
    return null;
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: SessionState): boolean {
    return Date.now() - session.lastActivity.getTime() > this.SESSION_TIMEOUT;
  }

  /**
   * Auto-save session
   */
  private autoSave(): void {
    if (this.currentSession && this.currentSession.state === 'active') {
      this.updateActivity();
    }
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => this.autoSave(), this.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Save session to storage
   */
  private saveSession(): void {
    if (this.currentSession) {
      try {
        localStorage.setItem('current_session', JSON.stringify(this.currentSession));
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }

  /**
   * Export session data
   */
  exportSessionData(): string | null {
    if (!this.currentSession) return null;
    return JSON.stringify(this.currentSession, null, 2);
  }

  /**
   * Clear all session data
   */
  clearAllData(): void {
    this.endSession();
    localStorage.removeItem('current_session');
    localStorage.removeItem('action_agent_data');
    localStorage.removeItem('booking_workflows');
    localStorage.removeItem('state_machine_data');
  }
}

// Singleton instance
export const sessionContinuityManager = new SessionContinuityManager();

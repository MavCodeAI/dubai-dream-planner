// State Machine - Track action states across sessions with persistence
// Using localStorage for persistence (Supabase table not available)

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

export interface StateDefinition {
  type: StateType;
  initialState: string;
  states: StateConfig[];
  events: StateEvent[];
}

export interface StateConfig {
  name: string;
  onEnter?: (snapshot: StateSnapshot) => Promise<void>;
  onExit?: (snapshot: StateSnapshot) => Promise<void>;
  onEvent?: (snapshot: StateSnapshot, event: string, data?: unknown) => Promise<StateTransition>;
}

export interface StateEvent {
  name: string;
  from: string | string[];
  to: string;
  guard?: (snapshot: StateSnapshot, data?: unknown) => boolean;
  action?: (snapshot: StateSnapshot, data?: unknown) => Promise<void>;
}

// ==================== State Machine Class ====================

class StateMachine {
  private snapshots: Map<string, StateSnapshot> = new Map();
  private definitions: Map<StateType, StateDefinition> = new Map();
  private listeners: Map<string, Set<(snapshot: StateSnapshot) => void>> = new Map();

  constructor() {
    // Register default state definitions
    this.registerDefaultDefinitions();
  }

  /**
   * Register default state definitions
   */
  private registerDefaultDefinitions(): void {
    // Action state definition
    this.registerDefinition({
      type: 'action',
      initialState: 'pending',
      states: [
        { name: 'pending' },
        { name: 'in_progress' },
        { name: 'awaiting_confirmation' },
        { name: 'confirmed' },
        { name: 'completed' },
        { name: 'failed' },
        { name: 'cancelled' }
      ],
      events: [
        { name: 'START', from: 'pending', to: 'in_progress' },
        { name: 'CONFIRM', from: 'in_progress', to: 'awaiting_confirmation' },
        { name: 'RESOLVE', from: ['in_progress', 'awaiting_confirmation'], to: 'confirmed' },
        { name: 'COMPLETE', from: ['in_progress', 'confirmed'], to: 'completed' },
        { name: 'FAIL', from: ['pending', 'in_progress', 'awaiting_confirmation', 'confirmed'], to: 'failed' },
        { name: 'CANCEL', from: ['pending', 'in_progress', 'awaiting_confirmation'], to: 'cancelled' },
        { name: 'RETRY', from: 'failed', to: 'pending' }
      ]
    });

    // Workflow state definition
    this.registerDefinition({
      type: 'workflow',
      initialState: 'initiated',
      states: [
        { name: 'initiated' },
        { name: 'collecting_info' },
        { name: 'validating' },
        { name: 'processing' },
        { name: 'confirming' },
        { name: 'completed' },
        { name: 'failed' },
        { name: 'cancelled' }
      ],
      events: [
        { name: 'START', from: 'initiated', to: 'collecting_info' },
        { name: 'VALIDATE', from: 'collecting_info', to: 'validating' },
        { name: 'PROCESS', from: ['collecting_info', 'validating'], to: 'processing' },
        { name: 'CONFIRM', from: 'processing', to: 'confirming' },
        { name: 'COMPLETE', from: ['processing', 'confirming'], to: 'completed' },
        { name: 'FAIL', from: ['initiated', 'collecting_info', 'validating', 'processing', 'confirming'], to: 'failed' },
        { name: 'CANCEL', from: ['initiated', 'collecting_info', 'validating', 'processing', 'confirming'], to: 'cancelled' },
        { name: 'RETRY', from: 'failed', to: 'initiated' }
      ]
    });

    // Session state definition
    this.registerDefinition({
      type: 'session',
      initialState: 'new',
      states: [
        { name: 'new' },
        { name: 'active' },
        { name: 'idle' },
        { name: 'paused' },
        { name: 'ended' }
      ],
      events: [
        { name: 'ACTIVATE', from: ['new', 'idle'], to: 'active' },
        { name: 'IDLE', from: 'active', to: 'idle' },
        { name: 'RESUME', from: ['idle', 'paused'], to: 'active' },
        { name: 'PAUSE', from: 'active', to: 'paused' },
        { name: 'END', from: ['active', 'idle', 'paused'], to: 'ended' }
      ]
    });
  }

  /**
   * Register a state definition
   */
  registerDefinition(definition: StateDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  /**
   * Create a new state snapshot
   */
  async createState(
    type: StateType,
    key: string,
    initialValue?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<StateSnapshot> {
    const definition = this.definitions.get(type);
    if (!definition) {
      throw new Error(`No state definition registered for type: ${type}`);
    }

    const snapshot: StateSnapshot = {
      id: 'state_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      key,
      value: initialValue || {},
      status: 'active',
      version: 1,
      transitions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEvent: 'CREATE',
      metadata
    };

    this.snapshots.set(this.getSnapshotKey(type, key), snapshot);
    this.persistSnapshot(snapshot);
    this.notifyListeners(type, key, snapshot);

    return snapshot;
  }

  /**
   * Send an event to transition state
   */
  async sendEvent(
    type: StateType,
    key: string,
    event: string,
    data?: unknown
  ): Promise<StateSnapshot> {
    const snapshotKey = this.getSnapshotKey(type, key);
    const snapshot = this.snapshots.get(snapshotKey);
    
    if (!snapshot) {
      throw new Error(`State not found: ${type}/${key}`);
    }

    const definition = this.definitions.get(type);
    if (!definition) {
      throw new Error(`No state definition registered for type: ${type}`);
    }

    // Find the event definition
    const eventDef = definition.events.find(e => e.name === event);
    if (!eventDef) {
      throw new Error(`Event '${event}' not found in definition for type: ${type}`);
    }

    // Check guard condition
    if (eventDef.guard && !eventDef.guard(snapshot, data)) {
      throw new Error(`Guard condition failed for event: ${event}`);
    }

    // Check if current state is valid for this event
    const fromStates = Array.isArray(eventDef.from) ? eventDef.from : [eventDef.from];
    const currentState = this.getCurrentState(snapshot);
    
    if (!fromStates.includes(currentState)) {
      throw new Error(`Invalid state transition: cannot send '${event}' from '${currentState}'`);
    }

    // Execute action if defined
    if (eventDef.action) {
      await eventDef.action(snapshot, data);
    }

    // Create transition
    const transition: StateTransition = {
      from: currentState,
      to: eventDef.to,
      event,
      timestamp: new Date(),
      metadata: data as Record<string, unknown>
    };

    // Update snapshot
    snapshot.value = { ...snapshot.value, ...(data as Record<string, unknown>) };
    snapshot.transitions.push(transition);
    snapshot.status = eventDef.to === 'failed' || eventDef.to === 'cancelled' ? 'archived' : 'active';
    snapshot.version++;
    snapshot.lastEvent = event;
    snapshot.updatedAt = new Date();

    this.snapshots.set(snapshotKey, snapshot);
    this.persistSnapshot(snapshot);
    this.notifyListeners(type, key, snapshot);

    return snapshot;
  }

  /**
   * Get current state from snapshot
   */
  private getCurrentState(snapshot: StateSnapshot): string {
    const lastTransition = snapshot.transitions[snapshot.transitions.length - 1];
    if (!lastTransition) {
      const definition = this.definitions.get(snapshot.type);
      return definition?.initialState || 'unknown';
    }
    return lastTransition.to;
  }

  /**
   * Get state snapshot
   */
  getState(type: StateType, key: string): StateSnapshot | undefined {
    return this.snapshots.get(this.getSnapshotKey(type, key));
  }

  /**
   * Get all states of a type
   */
  getStatesByType(type: StateType): StateSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => s.type === type);
  }

  /**
   * Get active states
   */
  getActiveStates(type?: StateType): StateSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => {
      if (type && s.type !== type) return false;
      return s.status === 'active';
    });
  }

  /**
   * Update state value
   */
  async updateValue(
    type: StateType,
    key: string,
    updates: Record<string, unknown>
  ): Promise<StateSnapshot> {
    const snapshotKey = this.getSnapshotKey(type, key);
    const snapshot = this.snapshots.get(snapshotKey);
    
    if (!snapshot) {
      throw new Error(`State not found: ${type}/${key}`);
    }

    snapshot.value = { ...snapshot.value, ...updates };
    snapshot.version++;
    snapshot.updatedAt = new Date();

    this.snapshots.set(snapshotKey, snapshot);
    this.persistSnapshot(snapshot);
    this.notifyListeners(type, key, snapshot);

    return snapshot;
  }

  /**
   * Archive state
   */
  async archiveState(type: StateType, key: string): Promise<void> {
    const snapshot = await this.sendEvent(type, key, 'END');
    snapshot.status = 'archived';
    this.notifyListeners(type, key, snapshot);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(type: StateType, key: string, listener: (snapshot: StateSnapshot) => void): () => void {
    const fullKey = `${type}:${key}`;
    if (!this.listeners.has(fullKey)) {
      this.listeners.set(fullKey, new Set());
    }
    this.listeners.get(fullKey)!.add(listener);

    return () => {
      this.listeners.get(fullKey)?.delete(listener);
    };
  }

  /**
   * Subscribe to all state changes of a type
   */
  subscribeToType(type: StateType, listener: (snapshot: StateSnapshot) => void): () => void {
    return this.subscribe(type, '*', listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(type: StateType, key: string, snapshot: StateSnapshot): void {
    // Notify specific key listeners
    const fullKey = `${type}:${key}`;
    this.listeners.get(fullKey)?.forEach(listener => listener(snapshot));

    // Notify wildcard listeners
    const wildcardKey = `${type}:*`;
    this.listeners.get(wildcardKey)?.forEach(listener => listener(snapshot));
  }

  /**
   * Get snapshot key
   */
  private getSnapshotKey(type: StateType, key: string): string {
    return `${type}:${key}`;
  }

  /**
   * Persist snapshot to localStorage
   */
  private persistSnapshot(snapshot: StateSnapshot): void {
    try {
      const states = JSON.parse(localStorage.getItem('state_machine_data') || '{}');
      states[this.getSnapshotKey(snapshot.type, snapshot.key)] = snapshot;
      localStorage.setItem('state_machine_data', JSON.stringify(states));
    } catch (error) {
      console.error('Failed to persist snapshot:', error);
    }
  }

  /**
   * Load persisted states from localStorage
   */
  loadPersistedStates(): void {
    try {
      const stored = localStorage.getItem('state_machine_data');
      if (stored) {
        const states = JSON.parse(stored);
        Object.values(states).forEach((s: unknown) => {
          const snapshot = s as StateSnapshot;
          this.snapshots.set(this.getSnapshotKey(snapshot.type, snapshot.key), {
            ...snapshot,
            createdAt: new Date(snapshot.createdAt),
            updatedAt: new Date(snapshot.updatedAt),
            transitions: snapshot.transitions.map((t: StateTransition) => ({
              ...t,
              timestamp: new Date(t.timestamp)
            }))
          });
        });
      }
    } catch (error) {
      console.error('Failed to load persisted states:', error);
    }
  }

  /**
   * Resume interrupted workflows
   */
  async resumeInterruptedWorkflows(): Promise<void> {
    const workflows = this.getActiveStates('workflow');
    
    for (const workflow of workflows) {
      const lastTransition = workflow.transitions[workflow.transitions.length - 1];
      if (lastTransition && lastTransition.event === 'PROCESS') {
        // Resume processing
        try {
          await this.sendEvent('workflow', workflow.key, 'PROCESS', workflow.value);
        } catch (error) {
          console.warn('Failed to resume workflow:', workflow.key, error);
        }
      }
    }
  }

  /**
   * Get state history
   */
  getHistory(type: StateType, key: string): StateTransition[] {
    const snapshot = this.snapshots.get(this.getSnapshotKey(type, key));
    return snapshot?.transitions || [];
  }

  /**
   * Clear all states
   */
  clearAll(): void {
    this.snapshots.clear();
    localStorage.removeItem('state_machine_data');
  }
}

// Singleton instance
export const stateMachine = new StateMachine();

// Shared Context Store - Real-time state sharing for multi-agent parallel processing
import { agentBus, TOPICS } from './communication/agent-bus';
import { AgentMessage } from './communication/agent-bus';

export type ContextKey = string;
export type ContextValue = unknown;
export type ContextVersion = number;

export interface SharedContext {
  key: ContextKey;
  value: ContextValue;
  version: ContextVersion;
  updatedAt: Date;
  updatedBy: string;
  source: string;
}

export interface ContextUpdate {
  key: ContextKey;
  oldValue?: ContextValue;
  newValue: ContextValue;
  version: ContextVersion;
  timestamp: Date;
  source: string;
}

export interface ContextConflict {
  key: ContextKey;
  localValue: ContextValue;
  remoteValue: ContextValue;
  localVersion: ContextVersion;
  remoteVersion: ContextVersion;
  timestamp: Date;
}

export interface ContextMergeStrategy {
  name: string;
  resolve: (local: ContextValue, remote: ContextValue, key: ContextKey) => ContextValue;
}

// ==================== Shared Context Store Class ====================

class SharedContextStore {
  private context: Map<ContextKey, SharedContext> = new Map();
  private versionHistory: Map<ContextKey, ContextUpdate[]> = new Map();
  private conflictListeners: Set<(conflict: ContextConflict) => void> = new Set();
  private updateListeners: Map<ContextKey, Set<(update: ContextUpdate) => void>> = new Map();
  private mergeStrategies: Map<string, ContextMergeStrategy> = new Map();
  private maxHistorySize = 100;

  constructor() {
    // Register default merge strategies
    this.registerDefaultMergeStrategies();
    
    // Subscribe to context updates from other agents
    this.subscribeToUpdates();
  }

  /**
   * Register default merge strategies
   */
  private registerDefaultMergeStrategies(): void {
    // Last-write-wins strategy
    this.registerMergeStrategy({
      name: 'last_write_wins',
      resolve: (_local, remote) => remote
    });

    // First-write-wins strategy
    this.registerMergeStrategy({
      name: 'first_write_wins',
      resolve: (local) => local
    });

    // Deep merge strategy for objects
    this.registerMergeStrategy({
      name: 'deep_merge',
      resolve: (local, remote) => this.deepMerge(local, remote)
    });

    // Array concatenation strategy
    this.registerMergeStrategy({
      name: 'array_concat',
      resolve: (local, remote) => {
        if (Array.isArray(local) && Array.isArray(remote)) {
          return [...local, ...remote];
        }
        return remote;
      }
    });
  }

  /**
   * Subscribe to context updates from agent bus
   */
  private subscribeToUpdates(): void {
    agentBus.subscribe('context_store', [TOPICS.CONTEXT_UPDATE], async (message: AgentMessage) => {
      if (message.payload.key && message.payload.value) {
        await this.handleRemoteUpdate(
          message.payload.key as ContextKey,
          message.payload.value as ContextValue,
          message.from
        );
      }
    });
  }

  /**
   * Handle remote context update
   */
  private async handleRemoteUpdate(key: ContextKey, value: ContextValue, source: string): Promise<void> {
    const localContext = this.context.get(key);
    
    if (!localContext) {
      // No local context, accept remote
      this.setLocal(key, value, source);
      return;
    }

    // Check for conflicts
    if (localContext.version !== (value as SharedContext)?.version) {
      const conflict: ContextConflict = {
        key,
        localValue: localContext.value,
        remoteValue: value,
        localVersion: localContext.version,
        remoteVersion: (value as SharedContext)?.version || 0,
        timestamp: new Date()
      };

      // Check if we have a merge strategy
      const strategy = this.mergeStrategies.get(key) || this.mergeStrategies.get('default');
      if (strategy) {
        const merged = strategy.resolve(localContext.value, value, key);
        this.setLocal(key, merged, source);
      } else {
        // Notify conflict listeners
        this.conflictListeners.forEach(listener => listener(conflict));
      }
    }
  }

  /**
   * Set local context value
   */
  setLocal(key: ContextKey, value: ContextValue, source: string): SharedContext {
    const existing = this.context.get(key);
    const version = (existing?.version || 0) + 1;

    const context: SharedContext = {
      key,
      value,
      version,
      updatedAt: new Date(),
      updatedBy: source,
      source
    };

    this.context.set(key, context);
    this.addToHistory(key, {
      key,
      oldValue: existing?.value,
      newValue: value,
      version,
      timestamp: new Date(),
      source
    });

    // Notify local listeners
    this.notifyUpdateListeners(key, {
      key,
      oldValue: existing?.value,
      newValue: value,
      version,
      timestamp: new Date(),
      source
    });

    // Broadcast to other agents
    this.broadcastUpdate(key, context);

    return context;
  }

  /**
   * Get context value
   */
  get(key: ContextKey): ContextValue | undefined {
    return this.context.get(key)?.value;
  }

  /**
   * Get context with metadata
   */
  getWithMeta(key: ContextKey): SharedContext | undefined {
    return this.context.get(key);
  }

  /**
   * Get all context
   */
  getAll(): Map<ContextKey, SharedContext> {
    return new Map(this.context);
  }

  /**
   * Delete context
   */
  delete(key: ContextKey): void {
    this.context.delete(key);
    this.versionHistory.delete(key);
    this.updateListeners.delete(key);
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.context.clear();
    this.versionHistory.clear();
    this.updateListeners.clear();
  }

  /**
   * Get version history for a key
   */
  getHistory(key: ContextKey): ContextUpdate[] {
    return this.versionHistory.get(key) || [];
  }

  /**
   * Register merge strategy for a key
   */
  registerMergeStrategy(strategy: ContextMergeStrategy): void {
    this.mergeStrategies.set(strategy.name, strategy);
  }

  /**
   * Set merge strategy for a specific key
   */
  setMergeStrategyForKey(key: ContextKey, strategyName: string): void {
    this.mergeStrategies.set(key, this.mergeStrategies.get(strategyName)!);
  }

  /**
   * Subscribe to updates for a specific key
   */
  subscribeToKey(key: ContextKey, listener: (update: ContextUpdate) => void): () => void {
    if (!this.updateListeners.has(key)) {
      this.updateListeners.set(key, new Set());
    }
    this.updateListeners.get(key)!.add(listener);

    return () => {
      this.updateListeners.get(key)?.delete(listener);
    };
  }

  /**
   * Subscribe to all updates
   */
  subscribeToAll(listener: (update: ContextUpdate) => void): () => void {
    return this.subscribeToKey('*', listener);
  }

  /**
   * Subscribe to conflicts
   */
  subscribeToConflicts(listener: (conflict: ContextConflict) => void): () => void {
    this.conflictListeners.add(listener);
    return () => this.conflictListeners.delete(listener);
  }

  /**
   * Notify update listeners
   */
  private notifyUpdateListeners(key: ContextKey, update: ContextUpdate): void {
    // Notify specific key listeners
    this.updateListeners.get(key)?.forEach(listener => listener(update));
    
    // Notify wildcard listeners
    this.updateListeners.get('*')?.forEach(listener => listener(update));
  }

  /**
   * Add update to history
   */
  private addToHistory(key: ContextKey, update: ContextUpdate): void {
    const history = this.versionHistory.get(key) || [];
    history.unshift(update);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.pop();
    }
    
    this.versionHistory.set(key, history);
  }

  /**
   * Broadcast update to other agents
   */
  private broadcastUpdate(key: ContextKey, context: SharedContext): void {
    agentBus.broadcast(TOPICS.CONTEXT_UPDATE, {
      key,
      value: context
    });
  }

  /**
   * Deep merge two values
   */
  private deepMerge(local: ContextValue, remote: ContextValue): ContextValue {
    if (typeof local !== 'object' || local === null || typeof remote !== 'object' || remote === null) {
      return remote;
    }

    const merged = { ...local as Record<string, unknown> };
    
    for (const key of Object.keys(remote as Record<string, unknown>)) {
      const localValue = (local as Record<string, unknown>)[key];
      const remoteValue = (remote as Record<string, unknown>)[key];

      if (typeof localValue === 'object' && localValue !== null && 
          typeof remoteValue === 'object' && remoteValue !== null) {
        (merged as Record<string, unknown>)[key] = this.deepMerge(localValue, remoteValue);
      } else {
        (merged as Record<string, unknown>)[key] = remoteValue;
      }
    }

    return merged;
  }

  /**
   * Check for differences
   */
  hasChanged(key: ContextKey, expectedVersion: ContextVersion): boolean {
    const context = this.context.get(key);
    return !context || context.version > expectedVersion;
  }

  /**
   * Get keys matching pattern
   */
  getKeysByPattern(pattern: string): ContextKey[] {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.context.keys()).filter(key => regex.test(key));
  }

  /**
   * Get stats
   */
  getStats(): { size: number; historySize: number; strategiesCount: number } {
    return {
      size: this.context.size,
      historySize: Array.from(this.versionHistory.values()).reduce((sum, h) => sum + h.length, 0),
      strategiesCount: this.mergeStrategies.size
    };
  }
}

// Singleton instance
export const sharedContextStore = new SharedContextStore();

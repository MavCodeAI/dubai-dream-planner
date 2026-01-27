// Agent Bus - Event-driven message passing between agents
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
  ttl?: number; // Time to live in milliseconds
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  source: string;
  version: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  tags?: string[];
}

export interface AgentSubscription {
  agentId: AgentId;
  topics: string[];
  handler: MessageHandler;
  priority: number;
}

export type MessageHandler = (message: AgentMessage) => Promise<AgentMessage | void>;

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

// ==================== Agent Bus Class ====================

class AgentBus {
  private agents: Map<AgentId, AgentInfo> = new Map();
  private subscriptions: Map<string, Set<AgentSubscription>> = new Map();
  private messageQueue: AgentMessage[] = [];
  private deadLetterQueue: AgentMessage[] = [];
  private listeners: Set<(message: AgentMessage) => void> = new Set();
  private maxQueueSize = 1000;
  private processing = false;

  constructor() {
    // Start message processing loop
    this.startProcessing();
  }

  /**
   * Register an agent with the bus
   */
  registerAgent(agent: AgentInfo): void {
    this.agents.set(agent.id, {
      ...agent,
      lastSeen: new Date(),
      status: 'online'
    });
    console.log(`Agent registered: ${agent.name} (${agent.id})`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: AgentId): void {
    this.agents.delete(agentId);
    // Clean up subscriptions
    this.subscriptions.forEach((subs, topic) => {
      this.subscriptions.set(topic, new Set(
        Array.from(subs).filter(s => s.agentId !== agentId)
      ));
    });
    console.log(`Agent unregistered: ${agentId}`);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: AgentId, status: AgentInfo['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastSeen = new Date();
    }
  }

  /**
   * Send a message to a specific agent
   */
  async send(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<AgentMessage> {
    const fullMessage: AgentMessage = {
      ...message,
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    return this.routeMessage(fullMessage);
  }

  /**
   * Send a request and wait for response
   */
  async request(
    to: AgentId,
    topic: string,
    payload: Record<string, unknown>,
    options?: { timeout?: number; priority?: MessagePriority }
  ): Promise<AgentMessage> {
    const correlationId = 'corr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const tempAgentId = 'temp_' + Date.now();
    
    const message = await this.send({
      from: tempAgentId,
      to,
      type: 'request',
      priority: options?.priority || 'normal',
      topic,
      payload,
      correlationId
    });

    // Wait for response
    return this.waitForResponse(tempAgentId, correlationId, options?.timeout || 30000);
  }

  /**
   * Broadcast a message to all agents subscribed to a topic
   */
  async broadcast(topic: string, payload: Record<string, unknown>, from?: AgentId): Promise<void> {
    const message: AgentMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      from: from || 'system',
      to: 'broadcast',
      type: 'broadcast',
      priority: 'normal',
      topic,
      payload,
      timestamp: new Date()
    };

    this.routeMessage(message);
  }

  /**
   * Subscribe to topics
   */
  subscribe(agentId: AgentId, topics: string[], handler: MessageHandler, priority = 0): void {
    topics.forEach(topic => {
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Set());
      }
      
      this.subscriptions.get(topic)!.add({
        agentId,
        topics,
        handler,
        priority
      });
    });
  }

  /**
   * Unsubscribe from topics
   */
  unsubscribe(agentId: AgentId, topics?: string[]): void {
    if (topics) {
      topics.forEach(topic => {
        this.subscriptions.get(topic)?.forEach(sub => {
          if (sub.agentId === agentId) {
            this.subscriptions.get(topic)!.delete(sub);
          }
        });
      });
    } else {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subs, topic) => {
        this.subscriptions.set(topic, new Set(
          Array.from(subs).filter(s => s.agentId !== agentId)
        ));
      });
    }
  }

  /**
   * Route message to appropriate handlers
   */
  private async routeMessage(message: AgentMessage): Promise<AgentMessage> {
    // Add to queue
    this.messageQueue.push(message);
    if (this.messageQueue.length > this.maxQueueSize) {
      this.deadLetterQueue.push(this.messageQueue.shift()!);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(message));

    // Get subscribers for the topic
    const subscribers = this.getSubscribers(message.topic);
    
    if (subscribers.length === 0 && message.to !== 'broadcast') {
      // No subscribers, add to dead letter queue
      this.deadLetterQueue.push(message);
      console.warn(`No subscribers for topic: ${message.topic}`);
      return message;
    }

    // Process message based on type
    if (message.type === 'request' && message.to !== 'broadcast') {
      // Direct request, send to specific agent
      const subscriber = subscribers.find(s => s.agentId === message.to);
      if (subscriber) {
        await this.processMessage(subscriber, message);
      }
    } else if (message.type === 'broadcast') {
      // Broadcast to all subscribers
      await Promise.all(
        subscribers.map(sub => this.processMessage(sub, message))
      );
    } else {
      // Regular message, send to all matching subscribers
      await Promise.all(
        subscribers.map(sub => this.processMessage(sub, message))
      );
    }

    return message;
  }

  /**
   * Get subscribers for a topic
   */
  private getSubscribers(topic: string): AgentSubscription[] {
    const directSubs = this.subscriptions.get(topic) || new Set();
    const wildcardSubs = this.subscriptions.get('*') || new Set();
    
    // Also check for hierarchical topics
    const hierarchicalSubs = new Set<AgentSubscription>();
    this.subscriptions.forEach((subs, pattern) => {
      if (this.topicMatches(pattern, topic)) {
        subs.forEach(s => hierarchicalSubs.add(s));
      }
    });

    return Array.from(new Set([...directSubs, ...wildcardSubs, ...hierarchicalSubs]))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if a topic pattern matches a topic
   */
  private topicMatches(pattern: string, topic: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('.*')) {
      const base = pattern.slice(0, -2);
      return topic.startsWith(base + '.');
    }
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return topic.endsWith('.' + suffix);
    }
    return pattern === topic;
  }

  /**
   * Process a message with a subscriber
   */
  private async processMessage(subscription: AgentSubscription, message: AgentMessage): Promise<void> {
    try {
      const result = await subscription.handler(message);
      
      // If handler returns a response, send it back
      if (result && message.replyTo) {
        await this.send({
          ...result,
          to: message.from,
          replyTo: message.id
        });
      }
    } catch (error) {
      console.error(`Error processing message for ${subscription.agentId}:`, error);
    }
  }

  /**
   * Wait for a response message
   */
  private waitForResponse(agentId: string, correlationId: string, timeout: number): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(agentId);
        reject(new Error(`Timeout waiting for response: ${correlationId}`));
      }, timeout);

      // Create temp handler
      const handler = async (message: AgentMessage) => {
        if (message.correlationId === correlationId && message.type === 'response') {
          clearTimeout(timer);
          this.unsubscribe(agentId);
          resolve(message);
        }
      };

      // Subscribe to all topics
      this.subscribe(agentId, ['*'], handler);
    });
  }

  /**
   * Start message processing loop
   */
  private startProcessing(): void {
    this.processing = true;
    this.processQueue();
  }

  /**
   * Process queued messages
   */
  private async processQueue(): Promise<void> {
    while (this.processing && this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      
      // Check TTL
      if (message.ttl && Date.now() - message.timestamp.getTime() > message.ttl) {
        this.deadLetterQueue.push(message);
        continue;
      }

      // Process message
      await this.routeMessage(message);
    }

    // Schedule next processing
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Subscribe to all messages (for debugging/monitoring)
   */
  subscribeToAll(listener: (message: AgentMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get agent info
   */
  getAgent(agentId: AgentId): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get online agents
   */
  getOnlineAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).filter(a => a.status === 'online');
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): AgentMessage[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry dead letter message
   */
  async retryDeadLetter(message: AgentMessage): Promise<void> {
    const index = this.deadLetterQueue.findIndex(m => m.id === message.id);
    if (index >= 0) {
      this.deadLetterQueue.splice(index, 1);
      await this.routeMessage(message);
    }
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Get queue stats
   */
  getStats(): { queueSize: number; deadLetterSize: number; agentCount: number; onlineAgents: number } {
    const onlineCount = Array.from(this.agents.values()).filter(a => a.status === 'online').length;
    return {
      queueSize: this.messageQueue.length,
      deadLetterSize: this.deadLetterQueue.length,
      agentCount: this.agents.size,
      onlineAgents: onlineCount
    };
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    this.processing = false;
    this.listeners.clear();
    this.agents.clear();
    this.subscriptions.clear();
    this.messageQueue = [];
    this.deadLetterQueue = [];
  }
}

// Singleton instance
export const agentBus = new AgentBus();

// Pre-defined agent IDs
export const AGENTS = {
  ORCHESTRATOR: 'agent_orchestrator',
  PLANNING: 'agent_planning',
  WEATHER: 'agent_weather',
  ACTIVITY: 'agent_activity',
  BUDGET: 'agent_budget',
  BOOKING: 'agent_booking',
  NOTIFICATION: 'agent_notification',
  CONTEXT: 'agent_context'
} as const;

// Pre-defined topics
export const TOPICS = {
  TRIP_PLANNING: 'trip.planning',
  ITINERARY_UPDATE: 'trip.itinerary.update',
  WEATHER_REQUEST: 'weather.request',
  WEATHER_UPDATE: 'weather.update',
  ACTIVITY_SEARCH: 'activity.search',
  ACTIVITY_RECOMMENDATION: 'activity.recommendation',
  BUDGET_ANALYSIS: 'budget.analysis',
  BUDGET_ALERT: 'budget.alert',
  BOOKING_REQUEST: 'booking.request',
  BOOKING_CONFIRMATION: 'booking.confirmation',
  NOTIFICATION_SEND: 'notification.send',
  CONTEXT_UPDATE: 'context.update',
  CONTEXT_REQUEST: 'context.request'
} as const;

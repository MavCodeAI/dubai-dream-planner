// Dynamic Agent Router - Spawn specialized agents based on complexity and route intents
import { agentBus, AGENTS } from './communication/agent-bus';
import type { AgentId } from './communication/agent-bus';

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

export interface AgentSpawnConfig {
  type: AgentType;
  maxInstances: number;
  timeout: number;
  priority: number;
  capabilities: string[];
}

export interface ActiveAgent {
  id: AgentId;
  type: AgentType;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'busy';
  currentTask?: string;
}

// ==================== Complexity Indicators ====================

// @ts-ignore - reserved for future complexity analysis
const COMPLEXITY_INDICATORS = {
  simple: {
    maxKeywords: 2,
    maxEstimatedSteps: 3,
    keywords: ['what', 'show', 'list', 'weather', 'time']
  },
  moderate: {
    maxKeywords: 4,
    maxEstimatedSteps: 6,
    keywords: ['plan', 'suggest', 'recommend', 'find', 'search']
  },
  complex: {
    maxKeywords: 6,
    maxEstimatedSteps: 10,
    keywords: ['itinerary', 'schedule', 'multi-day', 'family', 'budget']
  },
  very_complex: {
    maxKeywords: 99,
    maxEstimatedSteps: 99,
    keywords: ['complete', 'comprehensive', 'detailed', 'full trip', 'custom']
  }
};

const AGENT_REQUIREMENTS: Record<string, AgentType[]> = {
  weather: ['weather'],
  activities: ['activity'],
  budget: ['budget', 'general'],
  booking: ['booking', 'general'],
  itinerary: ['planning', 'activity', 'budget'],
  recommendations: ['activity', 'planning'],
  flights: ['booking', 'general'],
  hotels: ['booking', 'general'],
  restaurants: ['activity', 'general']
};

// ==================== Dynamic Agent Router Class ====================

class DynamicAgentRouter {
  private activeAgents: Map<AgentId, ActiveAgent> = new Map();
  private agentConfigs: Map<AgentType, AgentSpawnConfig> = new Map();
  // @ts-ignore - reserved for async routing
  private pendingRequests: Map<string, { timestamp: Date; resolve: (decision: RoutingDecision) => void }> = new Map();
  private listeners: Set<(decision: RoutingDecision) => void> = new Set();

  constructor() {
    // Initialize agent configurations
    this.initializeAgentConfigs();
  }

  /**
   * Initialize default agent configurations
   */
  private initializeAgentConfigs(): void {
    const configs: AgentSpawnConfig[] = [
      {
        type: 'planning',
        maxInstances: 2,
        timeout: 60000,
        priority: 10,
        capabilities: ['itinerary', 'scheduling', 'coordination']
      },
      {
        type: 'weather',
        maxInstances: 1,
        timeout: 30000,
        priority: 5,
        capabilities: ['weather', 'forecasts', 'alerts']
      },
      {
        type: 'activity',
        maxInstances: 3,
        timeout: 30000,
        priority: 7,
        capabilities: ['activities', 'attractions', 'events']
      },
      {
        type: 'budget',
        maxInstances: 1,
        timeout: 30000,
        priority: 5,
        capabilities: ['budget', 'cost', 'pricing']
      },
      {
        type: 'booking',
        maxInstances: 2,
        timeout: 60000,
        priority: 8,
        capabilities: ['booking', 'reservation', 'payment']
      },
      {
        type: 'general',
        maxInstances: 5,
        timeout: 30000,
        priority: 1,
        capabilities: ['general', 'chat', 'responses']
      }
    ];

    configs.forEach(config => this.agentConfigs.set(config.type, config));
  }

  /**
   * Analyze intent complexity
   */
  analyzeIntent(message: string, _context?: Record<string, unknown>): IntentAnalysis {
    const keywords = this.extractKeywords(message.toLowerCase());
    const wordCount = message.split(/\s+/).length;
    
    // Determine complexity
    let complexity: IntentComplexity = 'simple';
    
    if (wordCount > 50 || keywords.length > 6) {
      complexity = 'very_complex';
    } else if (wordCount > 25 || keywords.length > 4) {
      complexity = 'complex';
    } else if (wordCount > 10 || keywords.length > 2) {
      complexity = 'moderate';
    }

    // Check for explicit complexity indicators
    const veryComplexIndicators = ['complete trip', 'full itinerary', 'detailed plan', 'comprehensive'];
    if (veryComplexIndicators.some(i => message.toLowerCase().includes(i))) {
      complexity = 'very_complex';
    }

    const complexIndicators = ['multi-day', 'several days', 'multiple activities'];
    if (complexIndicators.some(i => message.toLowerCase().includes(i))) {
      complexity = 'complex';
    }

    // Determine required agents
    const requiredAgents = this.determineRequiredAgents(keywords, message);

    // Check if parallel processing is needed
    const requiresParallel = 
      requiredAgents.length > 2 || 
      (requiredAgents.includes('weather') && requiredAgents.includes('activity'));

    // Check if external API is needed
    const requiresExternalApi = 
      keywords.includes('booking') || 
      keywords.includes('reservation') ||
      keywords.includes('weather') ||
      keywords.includes('flights');

    // Estimate steps
    const estimatedSteps = this.estimateSteps(complexity, requiredAgents.length);

    return {
      complexity,
      requiredAgents,
      estimatedSteps,
      requiresParallel,
      requiresExternalApi,
      keywords
    };
  }

  /**
   * Route an intent to appropriate agents
   */
  async routeIntent(
    message: string,
    intentAnalysis?: IntentAnalysis
  ): Promise<RoutingDecision> {
    const analysis = intentAnalysis || this.analyzeIntent(message);
    
    // Determine primary agent
    const primaryAgent = this.selectPrimaryAgent(analysis);
    
    // Determine supporting agents
    const supportingAgents = this.selectSupportingAgents(analysis, primaryAgent);
    
    // Determine parallel agents
    const parallelAgents = this.selectParallelAgents(analysis);
    
    // Select fallback agent
    const fallbackAgent = AGENTS.ORCHESTRATOR;
    
    // Determine strategy
    const strategy = this.determineStrategy(analysis, parallelAgents);
    
    // Estimate cost and time
    const { estimatedCost, estimatedTime } = this.estimateResourceUsage(analysis, strategy);

    const decision: RoutingDecision = {
      primaryAgent,
      supportingAgents,
      parallelAgents,
      fallbackAgent,
      strategy,
      estimatedCost,
      estimatedTime
    };

    // Notify listeners
    this.listeners.forEach(listener => listener(decision));

    return decision;
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(message: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'want', 'need', 'to', 'for', 'in', 'with', 'my']);
    return message
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Determine required agents based on keywords
   */
  private determineRequiredAgents(keywords: string[], message: string): AgentType[] {
    const required = new Set<AgentType>();
    const lowerMessage = message.toLowerCase();

    // Check each requirement category
    for (const [category, agents] of Object.entries(AGENT_REQUIREMENTS)) {
      if (lowerMessage.includes(category)) {
        agents.forEach(agent => required.add(agent as AgentType));
      }
    }

    // Check for general intent
    if (required.size === 0) {
      required.add('general');
    }

    // Always add planning for complex trips
    if (keywords.some(k => ['trip', 'itinerary', 'plan', 'schedule'].includes(k))) {
      required.add('planning');
    }

    return Array.from(required);
  }

  /**
   * Estimate steps based on complexity and agents
   */
  private estimateSteps(complexity: IntentComplexity, agentCount: number): number {
    const baseSteps = {
      simple: 2,
      moderate: 5,
      complex: 8,
      very_complex: 15
    };

    return baseSteps[complexity] + (agentCount - 1) * 2;
  }

  /**
   * Select primary agent
   */
  private selectPrimaryAgent(analysis: IntentAnalysis): AgentId {
    // Check for existing idle agents
    for (const agentType of analysis.requiredAgents) {
      const idleAgent = this.findIdleAgent(agentType);
      if (idleAgent) {
        return idleAgent;
      }
    }

    // Create new agent instance
    return this.spawnAgent(analysis.requiredAgents[0]);
  }

  /**
   * Select supporting agents
   */
  private selectSupportingAgents(analysis: IntentAnalysis, _primaryAgent: AgentId): AgentId[] {
    return analysis.requiredAgents.slice(1).map(agentType => {
      const idleAgent = this.findIdleAgent(agentType);
      return idleAgent || this.spawnAgent(agentType);
    });
  }

  /**
   * Select parallel agents
   */
  private selectParallelAgents(analysis: IntentAnalysis): AgentId[] {
    if (!analysis.requiresParallel) return [];

    return analysis.requiredAgents
      .filter(agentType => {
        const config = this.agentConfigs.get(agentType);
        const activeCount = this.countActiveAgents(agentType);
        return !config || activeCount < config.maxInstances;
      })
      .map(agentType => this.spawnAgent(agentType));
  }

  /**
   * Determine routing strategy
   */
  private determineStrategy(analysis: IntentAnalysis, parallelAgents: AgentId[]): RoutingDecision['strategy'] {
    if (analysis.requiresParallel && parallelAgents.length > 1) {
      return 'parallel';
    }
    
    if (analysis.requiredAgents.length > 3) {
      return 'hybrid';
    }
    
    if (analysis.requiredAgents.length > 1) {
      return 'sequential';
    }
    
    return 'single';
  }

  /**
   * Estimate resource usage
   */
  private estimateResourceUsage(
    analysis: IntentAnalysis,
    strategy: RoutingDecision['strategy']
  ): { estimatedCost: number; estimatedTime: number } {
    const baseCost = { simple: 1, moderate: 3, complex: 5, very_complex: 10 };
    const baseTime = { simple: 1000, moderate: 5000, complex: 15000, very_complex: 60000 };

    let costMultiplier = 1;
    let timeMultiplier = 1;

    switch (strategy) {
      case 'parallel':
        costMultiplier = analysis.requiredAgents.length * 0.8;
        timeMultiplier = 0.6;
        break;
      case 'sequential':
        costMultiplier = analysis.requiredAgents.length;
        timeMultiplier = analysis.requiredAgents.length;
        break;
      case 'hybrid':
        costMultiplier = analysis.requiredAgents.length * 0.7;
        timeMultiplier = analysis.requiredAgents.length * 0.5;
        break;
    }

    return {
      estimatedCost: baseCost[analysis.complexity] * costMultiplier,
      estimatedTime: baseTime[analysis.complexity] * timeMultiplier
    };
  }

  /**
   * Spawn a new agent instance
   */
  private spawnAgent(agentType: AgentType): AgentId {
    const config = this.agentConfigs.get(agentType);
    if (!config) {
      // Select fallback agent
    return AGENTS.ORCHESTRATOR;
    }

    const agentId = `agent_${agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const instanceNumber = this.countActiveAgents(agentType) + 1;

    if (instanceNumber > config.maxInstances) {
      // Reuse least active agent
      return this.findLeastActiveAgent(agentType) || AGENTS.ORCHESTRATOR;
    }

    const agent: ActiveAgent = {
      id: agentId,
      type: agentType,
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'active'
    };

    this.activeAgents.set(agentId, agent);

    // Register agent with bus
    agentBus.registerAgent({
      id: agentId,
      name: `${agentType}_agent_${instanceNumber}`,
      type: agentType,
      version: '1.0.0',
      status: 'online',
      capabilities: config.capabilities,
      lastSeen: new Date()
    });

    console.log(`Agent spawned: ${agentId} (${agentType})`);
    return agentId;
  }

  /**
   * Find idle agent of a type
   */
  private findIdleAgent(agentType: AgentType): AgentId | undefined {
    for (const [id, agent] of this.activeAgents) {
      if (agent.type === agentType && agent.status === 'idle') {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Find least active agent
   */
  private findLeastActiveAgent(agentType: AgentType): AgentId | undefined {
    let leastActive: AgentId | undefined;
    let minActivity = Infinity;

    for (const [id, agent] of this.activeAgents) {
      if (agent.type === agentType && agent.lastActivity.getTime() < minActivity) {
        minActivity = agent.lastActivity.getTime();
        leastActive = id;
      }
    }

    return leastActive;
  }

  /**
   * Count active agents of a type
   */
  private countActiveAgents(agentType: AgentType): number {
    return Array.from(this.activeAgents.values()).filter(a => a.type === agentType).length;
  }

  /**
   * Update agent activity
   */
  updateAgentActivity(agentId: AgentId, task?: string): void {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      agent.lastActivity = new Date();
      agent.currentTask = task;
      agent.status = task ? 'busy' : 'idle';
    }
  }

  /**
   * Terminate agent
   */
  terminateAgent(agentId: AgentId): void {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      agentBus.unregisterAgent(agentId);
      this.activeAgents.delete(agentId);
      console.log(`Agent terminated: ${agentId}`);
    }
  }

  /**
   * Terminate idle agents
   */
  terminateIdleAgents(maxIdleTime = 300000): void {
    const now = Date.now();
    
    for (const [id, agent] of this.activeAgents) {
      if (agent.status === 'idle' && now - agent.lastActivity.getTime() > maxIdleTime) {
        this.terminateAgent(id);
      }
    }
  }

  /**
   * Subscribe to routing decisions
   */
  subscribe(listener: (decision: RoutingDecision) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get active agents
   */
  getActiveAgents(): ActiveAgent[] {
    return Array.from(this.activeAgents.values());
  }

  /**
   * Get agent stats
   */
  getStats(): { totalAgents: number; byType: Record<AgentType, number>; busy: number; idle: number } {
    const agents = Array.from(this.activeAgents.values());
    const byType: Record<string, number> = {};
    
    agents.forEach(agent => {
      byType[agent.type] = (byType[agent.type] || 0) + 1;
    });

    return {
      totalAgents: agents.length,
      byType: byType as Record<AgentType, number>,
      busy: agents.filter(a => a.status === 'busy').length,
      idle: agents.filter(a => a.status === 'idle').length
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.activeAgents.forEach((_, id) => this.terminateAgent(id));
    this.listeners.clear();
  }
}

// Singleton instance
export const dynamicAgentRouter = new DynamicAgentRouter();

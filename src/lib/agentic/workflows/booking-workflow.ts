// Booking Workflow Manager - Multi-step transaction manager for bookings, confirmations, and modifications
import { Action, actionAgent, ActionParams } from '../agents/action-agent';

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

export interface WorkflowConfig {
  maxRetries: number;
  timeout: number; // milliseconds
  autoProgress: boolean;
  requireConfirmation: boolean;
}

// ==================== Default Workflow Steps ====================

const BOOKING_STEPS: Omit<WorkflowStep, 'id' | 'status' | 'completedAt'>[] = [
  { name: 'Select Activity', data: {} },
  { name: 'Choose Date & Time', data: {} },
  { name: 'Enter Details', data: {} },
  { name: 'Review & Confirm', data: {} },
  { name: 'Process Payment', data: {} },
  { name: 'Confirmation', data: {} }
];

const CANCELLATION_STEPS: Omit<WorkflowStep, 'id' | 'status' | 'completedAt'>[] = [
  { name: 'Verify Booking', data: {} },
  { name: 'Check Cancellation Policy', data: {} },
  { name: 'Confirm Cancellation', data: {} },
  { name: 'Process Refund', data: {} },
  { name: 'Final Confirmation', data: {} }
];

const MODIFICATION_STEPS: Omit<WorkflowStep, 'id' | 'status' | 'completedAt'>[] = [
  { name: 'Verify Current Booking', data: {} },
  { name: 'Select Changes', data: {} },
  { name: 'Check Availability', data: {} },
  { name: 'Confirm Changes', data: {} },
  { name: 'Update Confirmation', data: {} }
];

// ==================== Booking Workflow Manager Class ====================

class BookingWorkflowManager {
  private workflows: Map<string, BookingWorkflow> = new Map();
  private listeners: Set<(workflow: BookingWorkflow) => void> = new Set();
  private config: WorkflowConfig;

  constructor(config?: Partial<WorkflowConfig>) {
    this.config = {
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 300000, // 5 minutes
      autoProgress: config?.autoProgress !== false,
      requireConfirmation: config?.requireConfirmation !== false
    };
  }

  /**
   * Create a new booking workflow
   */
  createBookingWorkflow(params: ActionParams): BookingWorkflow {
    const workflow = this.createWorkflow('booking', params);
    workflow.steps = BOOKING_STEPS.map(step => this.createStep(step));
    return workflow;
  }

  /**
   * Create a new cancellation workflow
   */
  createCancellationWorkflow(params: ActionParams): BookingWorkflow {
    const workflow = this.createWorkflow('cancellation', params);
    workflow.steps = CANCELLATION_STEPS.map(step => this.createStep(step));
    return workflow;
  }

  /**
   * Create a new modification workflow
   */
  createModificationWorkflow(params: ActionParams): BookingWorkflow {
    const workflow = this.createWorkflow('modification', params);
    workflow.steps = MODIFICATION_STEPS.map(step => this.createStep(step));
    return workflow;
  }

  /**
   * Create a base workflow
   */
  private createWorkflow(type: WorkflowType, params: ActionParams): BookingWorkflow {
    const workflow: BookingWorkflow = {
      id: 'wf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      status: 'initiated',
      steps: [],
      currentStepIndex: 0,
      params,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);
    this.notifyListeners(workflow);
    return workflow;
  }

  /**
   * Create a workflow step
   */
  private createStep(template: Omit<WorkflowStep, 'id' | 'status' | 'completedAt'>): WorkflowStep {
    return {
      id: 'step_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      ...template,
      status: 'pending'
    };
  }

  /**
   * Start a workflow
   */
  async startWorkflow(workflowId: string): Promise<BookingWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'collecting_info';
    this.updateWorkflow(workflow);
    
    // Auto-progress to first step if enabled
    if (this.config.autoProgress) {
      await this.progressWorkflow(workflowId);
    }

    return workflow;
  }

  /**
   * Progress workflow to next step
   */
  async progressWorkflow(workflowId: string): Promise<BookingWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Mark current step as completed
    const currentStep = workflow.steps[workflow.currentStepIndex];
    if (currentStep) {
      currentStep.status = 'completed';
      currentStep.completedAt = new Date();
    }

    // Move to next step
    workflow.currentStepIndex++;
    
    if (workflow.currentStepIndex >= workflow.steps.length) {
      // All steps completed
      return this.completeWorkflow(workflowId);
    }

    const nextStep = workflow.steps[workflow.currentStepIndex];
    if (nextStep) {
      nextStep.status = 'in_progress';
    }

    workflow.status = this.getWorkflowStatus(workflow);
    workflow.updatedAt = new Date();
    
    this.updateWorkflow(workflow);
    return workflow;
  }

  /**
   * Update step data
   */
  updateStepData(workflowId: string, stepIndex: number, data: Record<string, unknown>): BookingWorkflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const step = workflow.steps[stepIndex];
    if (step) {
      step.data = { ...step.data, ...data };
    }

    this.updateWorkflow(workflow);
    return workflow;
  }

  /**
   * Skip a step
   */
  skipStep(workflowId: string, stepIndex: number): BookingWorkflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const step = workflow.steps[stepIndex];
    if (step) {
      step.status = 'completed';
      step.completedAt = new Date();
      step.error = 'Skipped by user';
    }

    this.updateWorkflow(workflow);
    return workflow;
  }

  /**
   * Fail a step
   */
  failStep(workflowId: string, stepIndex: number, error: string): BookingWorkflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const step = workflow.steps[stepIndex];
    if (step) {
      step.status = 'failed';
      step.error = error;
    }

    workflow.status = 'failed';
    workflow.updatedAt = new Date();
    
    this.updateWorkflow(workflow);
    return workflow;
  }

  /**
   * Complete workflow and execute action
   */
  async completeWorkflow(workflowId: string): Promise<BookingWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'processing';
    workflow.updatedAt = new Date();
    this.updateWorkflow(workflow);

    try {
      // Execute the appropriate action
      let action: Action;
      
      switch (workflow.type) {
        case 'booking':
          action = await actionAgent.createAction('book', workflow.params);
          break;
        case 'cancellation':
          action = await actionAgent.createAction('cancel', workflow.params);
          break;
        case 'modification':
          action = await actionAgent.createAction('modify', workflow.params);
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflow.type}`);
      }

      workflow.actionId = action.id;
      workflow.result = {
        success: action.result?.success || false,
        confirmationNumber: action.result?.confirmationNumber,
        error: action.result?.error
      };

      workflow.status = workflow.result.success ? 'completed' : 'failed';
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    workflow.updatedAt = new Date();
    this.updateWorkflow(workflow);
    return workflow;
  }

  /**
   * Cancel workflow
   */
  cancelWorkflow(workflowId: string): BookingWorkflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'cancelled';
    workflow.updatedAt = new Date();
    
    this.updateWorkflow(workflow);
    return workflow;
  }

  /**
   * Retry failed workflow
   */
  async retryWorkflow(workflowId: string): Promise<BookingWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== 'failed') {
      throw new Error('Can only retry failed workflows');
    }

    // Reset to initial state
    workflow.status = 'initiated';
    workflow.currentStepIndex = 0;
    workflow.steps.forEach(step => {
      step.status = 'pending';
      step.completedAt = undefined;
      step.error = undefined;
    });
    
    workflow.updatedAt = new Date();
    this.updateWorkflow(workflow);

    return this.startWorkflow(workflowId);
  }

  /**
   * Get workflow status based on current state
   */
  private getWorkflowStatus(workflow: BookingWorkflow): WorkflowStatus {
    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    const progress = completedSteps / workflow.steps.length;

    if (progress < 0.25) return 'collecting_info';
    if (progress < 0.5) return 'validating';
    if (progress < 0.75) return 'processing';
    if (progress < 1) return 'confirming';
    return 'completed';
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): BookingWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): BookingWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflows by status
   */
  getWorkflowsByStatus(status: WorkflowStatus): BookingWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.status === status);
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): BookingWorkflow[] {
    const activeStatuses: WorkflowStatus[] = [
      'initiated', 'collecting_info', 'validating', 'processing', 'confirming'
    ];
    return Array.from(this.workflows.values()).filter(w => activeStatuses.includes(w.status));
  }

  /**
   * Subscribe to workflow updates
   */
  subscribe(listener: (workflow: BookingWorkflow) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(workflow: BookingWorkflow): void {
    this.listeners.forEach(listener => listener(workflow));
  }

  /**
   * Update workflow and notify
   */
  private updateWorkflow(workflow: BookingWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    this.notifyListeners(workflow);
    this.persistWorkflows();
  }

  /**
   * Persist workflows
   */
  private persistWorkflows(): void {
    try {
      const workflows = Array.from(this.workflows.values());
      localStorage.setItem('booking_workflows', JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to persist workflows:', error);
    }
  }

  /**
   * Load persisted workflows
   */
  loadPersistedWorkflows(): void {
    try {
      const stored = localStorage.getItem('booking_workflows');
      if (stored) {
        const workflows = JSON.parse(stored);
        workflows.forEach((w: BookingWorkflow) => {
          this.workflows.set(w.id, {
            ...w,
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.updatedAt),
            steps: w.steps.map(s => ({
              ...s,
              completedAt: s.completedAt ? new Date(s.completedAt) : undefined
            }))
          });
        });
      }
    } catch (error) {
      console.error('Failed to load persisted workflows:', error);
    }
  }

  /**
   * Calculate progress percentage
   */
  getProgress(workflowId: string): number {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return 0;

    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / workflow.steps.length) * 100);
  }
}

// Singleton instance
export const bookingWorkflowManager = new BookingWorkflowManager();

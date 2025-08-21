import { Workflow } from '../types';
import { WorkflowRepository, ExecutionLogRepository, ExecutionLog } from '../repositories';

export interface WorkflowStatus {
  workflow: Workflow;
  lastExecution?: ExecutionLog;
  executionCount: number;
  successRate: number;
}

export class WorkflowService {
  private workflowRepo: WorkflowRepository;
  private executionLogRepo: ExecutionLogRepository;

  constructor() {
    this.workflowRepo = new WorkflowRepository();
    this.executionLogRepo = new ExecutionLogRepository();
  }

  async createWorkflow(workflowData: Omit<Workflow, 'id'>): Promise<Workflow> {
    return this.workflowRepo.create(workflowData);
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.workflowRepo.findById(id);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return this.workflowRepo.findAll();
  }

  async getActiveWorkflows(): Promise<Workflow[]> {
    return this.workflowRepo.findByStatus('active');
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    return this.workflowRepo.update(id, updates);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflowRepo.delete(id);
  }

  async getWorkflowStatus(id: string): Promise<WorkflowStatus | null> {
    const workflow = await this.workflowRepo.findById(id);
    if (!workflow) {
      return null;
    }

    const executionLogs = await this.executionLogRepo.findByWorkflowId(id);
    const lastExecution = executionLogs.length > 0 ? executionLogs[0] : undefined;
    const executionCount = executionLogs.length;
    const successCount = executionLogs.filter(log => log.status === 'success').length;
    const successRate = executionCount > 0 ? (successCount / executionCount) * 100 : 0;

    return {
      workflow,
      lastExecution,
      executionCount,
      successRate
    };
  }

  async getAllWorkflowStatuses(): Promise<WorkflowStatus[]> {
    const workflows = await this.workflowRepo.findAll();
    const statuses = await Promise.all(
      workflows.map(workflow => this.getWorkflowStatus(workflow.id))
    );

    return statuses.filter((status): status is WorkflowStatus => status !== null);
  }

  async getWorkflowHistory(id: string, limit?: number): Promise<ExecutionLog[]> {
    return this.executionLogRepo.getWorkflowHistory(id, limit);
  }

  async logWorkflowExecution(log: Omit<ExecutionLog, 'id'>): Promise<ExecutionLog> {
    return this.executionLogRepo.create(log);
  }

  async getRecentExecutions(limit?: number): Promise<ExecutionLog[]> {
    return this.executionLogRepo.findRecent(limit);
  }

  async getFailedExecutions(): Promise<ExecutionLog[]> {
    return this.executionLogRepo.findByStatus('error');
  }

  async getRunningExecutions(): Promise<ExecutionLog[]> {
    return this.executionLogRepo.findByStatus('running');
  }

  async pauseWorkflow(id: string): Promise<Workflow | null> {
    return this.workflowRepo.update(id, { status: 'paused' });
  }

  async resumeWorkflow(id: string): Promise<Workflow | null> {
    return this.workflowRepo.update(id, { status: 'active' });
  }

  async markWorkflowAsError(id: string): Promise<Workflow | null> {
    return this.workflowRepo.update(id, { status: 'error' });
  }
}
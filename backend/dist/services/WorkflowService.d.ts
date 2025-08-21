import { Workflow } from '../types';
import { ExecutionLog } from '../repositories';
export interface WorkflowStatus {
    workflow: Workflow;
    lastExecution?: ExecutionLog;
    executionCount: number;
    successRate: number;
}
export declare class WorkflowService {
    private workflowRepo;
    private executionLogRepo;
    constructor();
    createWorkflow(workflowData: Omit<Workflow, 'id'>): Promise<Workflow>;
    getWorkflow(id: string): Promise<Workflow | null>;
    getAllWorkflows(): Promise<Workflow[]>;
    getActiveWorkflows(): Promise<Workflow[]>;
    updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    getWorkflowStatus(id: string): Promise<WorkflowStatus | null>;
    getAllWorkflowStatuses(): Promise<WorkflowStatus[]>;
    getWorkflowHistory(id: string, limit?: number): Promise<ExecutionLog[]>;
    logWorkflowExecution(log: Omit<ExecutionLog, 'id'>): Promise<ExecutionLog>;
    getRecentExecutions(limit?: number): Promise<ExecutionLog[]>;
    getFailedExecutions(): Promise<ExecutionLog[]>;
    getRunningExecutions(): Promise<ExecutionLog[]>;
    pauseWorkflow(id: string): Promise<Workflow | null>;
    resumeWorkflow(id: string): Promise<Workflow | null>;
    markWorkflowAsError(id: string): Promise<Workflow | null>;
}
//# sourceMappingURL=WorkflowService.d.ts.map
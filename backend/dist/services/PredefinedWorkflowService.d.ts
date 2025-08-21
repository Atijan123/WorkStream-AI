import { Workflow } from '../types';
import { WorkflowScheduler } from '../scheduler/WorkflowScheduler';
export interface PredefinedWorkflowDefinition {
    name: string;
    description: string;
    trigger: {
        type: 'cron' | 'manual' | 'event';
        schedule?: string;
    };
    actions: any[];
    status: 'active' | 'paused' | 'error';
}
export declare class PredefinedWorkflowService {
    private workflowService;
    private scheduler;
    constructor(scheduler?: WorkflowScheduler);
    /**
     * Get all predefined workflow definitions
     */
    getPredefinedWorkflows(): PredefinedWorkflowDefinition[];
    /**
     * Initialize all predefined workflows
     */
    initializePredefinedWorkflows(): Promise<{
        created: number;
        updated: number;
        errors: string[];
    }>;
    /**
     * Reset all predefined workflows (delete and recreate)
     */
    resetPredefinedWorkflows(): Promise<{
        deleted: number;
        created: number;
        errors: string[];
    }>;
    /**
     * Get status of all predefined workflows
     */
    getPredefinedWorkflowStatuses(): Promise<Array<{
        name: string;
        exists: boolean;
        workflow?: Workflow;
        scheduled?: boolean;
    }>>;
    /**
     * Test a predefined workflow by executing it manually
     */
    testPredefinedWorkflow(workflowName: string): Promise<any>;
}
//# sourceMappingURL=PredefinedWorkflowService.d.ts.map
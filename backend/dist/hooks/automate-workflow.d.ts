import { BaseHook, HookContext, HookResult } from './base';
import { WorkflowService } from '../services/WorkflowService';
import { WorkflowScheduler } from '../scheduler/WorkflowScheduler';
/**
 * Hook that processes natural language workflow descriptions
 * and generates workflow specifications and backend code
 */
export declare class AutomateWorkflowHook extends BaseHook {
    private workflowService;
    private scheduler?;
    name: string;
    description: string;
    constructor(workflowService: WorkflowService, scheduler?: WorkflowScheduler | undefined);
    private getWebSocketService;
    execute(context: HookContext): Promise<HookResult>;
    private parseWorkflowRequest;
    private extractWorkflowName;
    private cleanWorkflowName;
    private extractTrigger;
    private extractActions;
    private generateDescription;
    private describeCronSchedule;
    private describeAction;
}
//# sourceMappingURL=automate-workflow.d.ts.map
import { BaseHook, HookContext, HookResult } from '../hooks';
import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
import { WorkflowService } from './WorkflowService';
import { WorkflowScheduler } from '../scheduler/WorkflowScheduler';
/**
 * Registry for managing and executing Kiro hooks
 */
export declare class HookRegistry {
    private featureRequestRepo;
    private workflowService?;
    private scheduler?;
    private hooks;
    constructor(featureRequestRepo: FeatureRequestRepository, workflowService?: WorkflowService | undefined, scheduler?: WorkflowScheduler | undefined);
    private registerDefaultHooks;
    registerHook(hook: BaseHook): void;
    getHook(name: string): BaseHook | undefined;
    listHooks(): Array<{
        name: string;
        description: string;
    }>;
    executeHook(hookName: string, context: HookContext): Promise<HookResult>;
}
//# sourceMappingURL=HookRegistry.d.ts.map
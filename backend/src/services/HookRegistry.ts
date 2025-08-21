import { BaseHook, HookContext, HookResult } from '../hooks/base';
import { EvolveUIHook } from '../hooks/evolve-ui';
import { AutomateWorkflowHook } from '../hooks/automate-workflow';
import { SpecManager } from './SpecManager';
import { ComponentGenerator } from './ComponentGenerator';
import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
import { WorkflowService } from './WorkflowService';
import { WorkflowScheduler } from '../scheduler/WorkflowScheduler';

/**
 * Registry for managing and executing Kiro hooks
 */
export class HookRegistry {
  private hooks: Map<string, BaseHook> = new Map();

  constructor(
    private featureRequestRepo: FeatureRequestRepository,
    private workflowService?: WorkflowService,
    private scheduler?: WorkflowScheduler
  ) {
    this.registerDefaultHooks();
  }

  private registerDefaultHooks(): void {
    const specManager = new SpecManager();
    const componentGenerator = new ComponentGenerator();
    
    const evolveUIHook = new EvolveUIHook(
      specManager,
      componentGenerator,
      this.featureRequestRepo
    );
    
    this.registerHook(evolveUIHook);

    // Register AutomateWorkflow hook if dependencies are available
    if (this.workflowService) {
      const automateWorkflowHook = new AutomateWorkflowHook(
        this.workflowService,
        this.scheduler
      );
      
      this.registerHook(automateWorkflowHook);
    }
  }

  registerHook(hook: BaseHook): void {
    this.hooks.set(hook.name, hook);
  }

  getHook(name: string): BaseHook | undefined {
    return this.hooks.get(name);
  }

  listHooks(): Array<{ name: string; description: string }> {
    return Array.from(this.hooks.values()).map(hook => ({
      name: hook.name,
      description: hook.description
    }));
  }

  async executeHook(hookName: string, context: HookContext): Promise<HookResult> {
    const hook = this.getHook(hookName);
    
    if (!hook) {
      return {
        success: false,
        message: `Hook '${hookName}' not found`
      };
    }

    try {
      return await hook.execute(context);
    } catch (error) {
      console.error(`Hook execution failed for '${hookName}':`, error);
      return {
        success: false,
        message: `Hook execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}
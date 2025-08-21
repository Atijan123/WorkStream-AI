import * as cron from 'node-cron';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { WorkflowService } from '../services/WorkflowService';
import { Workflow } from '../types';

export interface ScheduledTask {
  workflowId: string;
  cronExpression: string;
  task: cron.ScheduledTask;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface SchedulerStats {
  totalScheduledWorkflows: number;
  activeScheduledWorkflows: number;
  runningExecutions: number;
  lastSchedulerStart?: Date;
}

export class WorkflowScheduler {
  private workflowEngine: WorkflowEngine;
  private workflowService: WorkflowService;
  private scheduledTasks: Map<string, ScheduledTask>;
  private isStarted: boolean;
  private startTime?: Date;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
    this.workflowService = new WorkflowService();
    this.scheduledTasks = new Map();
    this.isStarted = false;
  }

  /**
   * Start the scheduler and load all cron-based workflows
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.warn('⚠️ Scheduler is already started');
      return;
    }

    console.log('🚀 Starting workflow scheduler...');
    
    try {
      // Load all active workflows with cron triggers
      const workflows = await this.workflowService.getActiveWorkflows();
      const cronWorkflows = workflows.filter(w => w.trigger.type === 'cron' && w.trigger.schedule);

      console.log(`📅 Found ${cronWorkflows.length} cron-based workflows to schedule`);

      // Schedule each workflow
      for (const workflow of cronWorkflows) {
        await this.scheduleWorkflow(workflow);
      }

      this.isStarted = true;
      this.startTime = new Date();
      console.log(`✅ Scheduler started successfully with ${this.scheduledTasks.size} scheduled workflows`);
    } catch (error) {
      console.error('❌ Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler and cancel all scheduled tasks
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      console.warn('⚠️ Scheduler is not running');
      return;
    }

    console.log('🛑 Stopping workflow scheduler...');

    // Cancel all scheduled tasks
    for (const [workflowId, scheduledTask] of this.scheduledTasks) {
      scheduledTask.task.stop();
      console.log(`⏹️ Cancelled scheduled task for workflow: ${workflowId}`);
    }

    this.scheduledTasks.clear();
    this.isStarted = false;
    this.startTime = undefined;
    console.log('✅ Scheduler stopped successfully');
  }

  /**
   * Schedule a single workflow
   */
  async scheduleWorkflow(workflow: Workflow): Promise<boolean> {
    if (workflow.trigger.type !== 'cron' || !workflow.trigger.schedule) {
      console.warn(`⚠️ Workflow ${workflow.id} is not a cron-based workflow`);
      return false;
    }

    if (workflow.status !== 'active') {
      console.warn(`⚠️ Workflow ${workflow.id} is not active (status: ${workflow.status})`);
      return false;
    }

    // Validate cron expression
    if (!cron.validate(workflow.trigger.schedule)) {
      console.error(`❌ Invalid cron expression for workflow ${workflow.id}: ${workflow.trigger.schedule}`);
      return false;
    }

    // Remove existing schedule if it exists
    if (this.scheduledTasks.has(workflow.id)) {
      await this.unscheduleWorkflow(workflow.id);
    }

    try {
      // Create scheduled task
      const task = cron.schedule(workflow.trigger.schedule, async () => {
        await this.executeScheduledWorkflow(workflow.id);
      }, {
        scheduled: false, // Don't start immediately
        timezone: 'UTC'
      });

      const scheduledTask: ScheduledTask = {
        workflowId: workflow.id,
        cronExpression: workflow.trigger.schedule,
        task,
        isRunning: false,
        nextRun: this.getNextRunTime(workflow.trigger.schedule)
      };

      this.scheduledTasks.set(workflow.id, scheduledTask);

      // Start the task
      task.start();

      console.log(`📅 Scheduled workflow "${workflow.name}" (${workflow.id}) with cron: ${workflow.trigger.schedule}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to schedule workflow ${workflow.id}:`, error);
      return false;
    }
  }

  /**
   * Unschedule a workflow
   */
  async unscheduleWorkflow(workflowId: string): Promise<boolean> {
    const scheduledTask = this.scheduledTasks.get(workflowId);
    if (!scheduledTask) {
      console.warn(`⚠️ No scheduled task found for workflow: ${workflowId}`);
      return false;
    }

    scheduledTask.task.stop();
    this.scheduledTasks.delete(workflowId);
    console.log(`⏹️ Unscheduled workflow: ${workflowId}`);
    return true;
  }

  /**
   * Reschedule a workflow (useful when workflow is updated)
   */
  async rescheduleWorkflow(workflow: Workflow): Promise<boolean> {
    await this.unscheduleWorkflow(workflow.id);
    return await this.scheduleWorkflow(workflow);
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeScheduledWorkflow(workflowId: string): Promise<void> {
    const scheduledTask = this.scheduledTasks.get(workflowId);
    if (!scheduledTask) {
      console.error(`❌ Scheduled task not found for workflow: ${workflowId}`);
      return;
    }

    if (scheduledTask.isRunning) {
      console.warn(`⚠️ Workflow ${workflowId} is already running, skipping execution`);
      return;
    }

    scheduledTask.isRunning = true;
    scheduledTask.lastRun = new Date();
    scheduledTask.nextRun = this.getNextRunTime(scheduledTask.cronExpression);

    console.log(`⏰ Executing scheduled workflow: ${workflowId}`);

    try {
      const result = await this.workflowEngine.executeWorkflow(workflowId);
      
      if (result.success) {
        console.log(`✅ Scheduled workflow ${workflowId} completed successfully in ${result.duration}ms`);
      } else {
        console.error(`❌ Scheduled workflow ${workflowId} failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error executing scheduled workflow ${workflowId}:`, error);
    } finally {
      scheduledTask.isRunning = false;
    }
  }

  /**
   * Get the next run time for a cron expression
   */
  private getNextRunTime(cronExpression: string): Date | undefined {
    try {
      // Parse cron expression and calculate next run
      // This is a simplified implementation - in production you might want to use a more robust library
      const task = cron.schedule(cronExpression, () => {}, { scheduled: false });
      
      // Since node-cron doesn't expose next run time directly, we'll estimate
      // For now, we'll just return a time 1 minute from now as a placeholder
      // In a real implementation, you'd use a library like 'cron-parser'
      return new Date(Date.now() + 60000);
    } catch (error) {
      console.error('Error calculating next run time:', error);
      return undefined;
    }
  }

  /**
   * Get all scheduled tasks
   */
  getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }

  /**
   * Get scheduled task for a specific workflow
   */
  getScheduledTask(workflowId: string): ScheduledTask | undefined {
    return this.scheduledTasks.get(workflowId);
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    const scheduledTasks = Array.from(this.scheduledTasks.values());
    const runningExecutions = this.workflowEngine.getRunningExecutions();

    return {
      totalScheduledWorkflows: scheduledTasks.length,
      activeScheduledWorkflows: scheduledTasks.filter(task => !task.isRunning).length,
      runningExecutions: runningExecutions.length,
      lastSchedulerStart: this.startTime
    };
  }

  /**
   * Reload all workflows from database (useful after workflow changes)
   */
  async reloadWorkflows(): Promise<void> {
    if (!this.isStarted) {
      console.warn('⚠️ Scheduler is not running, cannot reload workflows');
      return;
    }

    console.log('🔄 Reloading workflows...');

    // Stop all current tasks
    for (const [workflowId, scheduledTask] of this.scheduledTasks) {
      scheduledTask.task.stop();
    }
    this.scheduledTasks.clear();

    // Reload workflows
    const workflows = await this.workflowService.getActiveWorkflows();
    const cronWorkflows = workflows.filter(w => w.trigger.type === 'cron' && w.trigger.schedule);

    for (const workflow of cronWorkflows) {
      await this.scheduleWorkflow(workflow);
    }

    console.log(`✅ Reloaded ${this.scheduledTasks.size} scheduled workflows`);
  }

  /**
   * Manually trigger a scheduled workflow (outside of its schedule)
   */
  async triggerWorkflow(workflowId: string): Promise<boolean> {
    const scheduledTask = this.scheduledTasks.get(workflowId);
    if (!scheduledTask) {
      console.error(`❌ No scheduled task found for workflow: ${workflowId}`);
      return false;
    }

    console.log(`🔧 Manually triggering scheduled workflow: ${workflowId}`);
    await this.executeScheduledWorkflow(workflowId);
    return true;
  }
}
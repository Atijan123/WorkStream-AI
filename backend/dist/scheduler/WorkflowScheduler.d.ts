import * as cron from 'node-cron';
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
export declare class WorkflowScheduler {
    private workflowEngine;
    private workflowService;
    private scheduledTasks;
    private isStarted;
    private startTime?;
    constructor();
    /**
     * Start the scheduler and load all cron-based workflows
     */
    start(): Promise<void>;
    /**
     * Stop the scheduler and cancel all scheduled tasks
     */
    stop(): Promise<void>;
    /**
     * Schedule a single workflow
     */
    scheduleWorkflow(workflow: Workflow): Promise<boolean>;
    /**
     * Unschedule a workflow
     */
    unscheduleWorkflow(workflowId: string): Promise<boolean>;
    /**
     * Reschedule a workflow (useful when workflow is updated)
     */
    rescheduleWorkflow(workflow: Workflow): Promise<boolean>;
    /**
     * Execute a scheduled workflow
     */
    private executeScheduledWorkflow;
    /**
     * Get the next run time for a cron expression
     */
    private getNextRunTime;
    /**
     * Get all scheduled tasks
     */
    getScheduledTasks(): ScheduledTask[];
    /**
     * Get scheduled task for a specific workflow
     */
    getScheduledTask(workflowId: string): ScheduledTask | undefined;
    /**
     * Check if scheduler is running
     */
    isRunning(): boolean;
    /**
     * Get scheduler statistics
     */
    getStats(): SchedulerStats;
    /**
     * Reload all workflows from database (useful after workflow changes)
     */
    reloadWorkflows(): Promise<void>;
    /**
     * Manually trigger a scheduled workflow (outside of its schedule)
     */
    triggerWorkflow(workflowId: string): Promise<boolean>;
}
//# sourceMappingURL=WorkflowScheduler.d.ts.map
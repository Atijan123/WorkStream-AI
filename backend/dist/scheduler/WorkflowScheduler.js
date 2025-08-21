"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowScheduler = void 0;
const cron = __importStar(require("node-cron"));
const WorkflowEngine_1 = require("../engine/WorkflowEngine");
const WorkflowService_1 = require("../services/WorkflowService");
class WorkflowScheduler {
    constructor() {
        this.workflowEngine = new WorkflowEngine_1.WorkflowEngine();
        this.workflowService = new WorkflowService_1.WorkflowService();
        this.scheduledTasks = new Map();
        this.isStarted = false;
    }
    /**
     * Start the scheduler and load all cron-based workflows
     */
    async start() {
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
        }
        catch (error) {
            console.error('❌ Failed to start scheduler:', error);
            throw error;
        }
    }
    /**
     * Stop the scheduler and cancel all scheduled tasks
     */
    async stop() {
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
    async scheduleWorkflow(workflow) {
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
            const scheduledTask = {
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
        }
        catch (error) {
            console.error(`❌ Failed to schedule workflow ${workflow.id}:`, error);
            return false;
        }
    }
    /**
     * Unschedule a workflow
     */
    async unscheduleWorkflow(workflowId) {
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
    async rescheduleWorkflow(workflow) {
        await this.unscheduleWorkflow(workflow.id);
        return await this.scheduleWorkflow(workflow);
    }
    /**
     * Execute a scheduled workflow
     */
    async executeScheduledWorkflow(workflowId) {
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
            }
            else {
                console.error(`❌ Scheduled workflow ${workflowId} failed: ${result.error}`);
            }
        }
        catch (error) {
            console.error(`❌ Error executing scheduled workflow ${workflowId}:`, error);
        }
        finally {
            scheduledTask.isRunning = false;
        }
    }
    /**
     * Get the next run time for a cron expression
     */
    getNextRunTime(cronExpression) {
        try {
            // Parse cron expression and calculate next run
            // This is a simplified implementation - in production you might want to use a more robust library
            const task = cron.schedule(cronExpression, () => { }, { scheduled: false });
            // Since node-cron doesn't expose next run time directly, we'll estimate
            // For now, we'll just return a time 1 minute from now as a placeholder
            // In a real implementation, you'd use a library like 'cron-parser'
            return new Date(Date.now() + 60000);
        }
        catch (error) {
            console.error('Error calculating next run time:', error);
            return undefined;
        }
    }
    /**
     * Get all scheduled tasks
     */
    getScheduledTasks() {
        return Array.from(this.scheduledTasks.values());
    }
    /**
     * Get scheduled task for a specific workflow
     */
    getScheduledTask(workflowId) {
        return this.scheduledTasks.get(workflowId);
    }
    /**
     * Check if scheduler is running
     */
    isRunning() {
        return this.isStarted;
    }
    /**
     * Get scheduler statistics
     */
    getStats() {
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
    async reloadWorkflows() {
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
    async triggerWorkflow(workflowId) {
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
exports.WorkflowScheduler = WorkflowScheduler;
//# sourceMappingURL=WorkflowScheduler.js.map
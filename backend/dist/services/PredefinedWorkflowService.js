"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredefinedWorkflowService = void 0;
const WorkflowService_1 = require("./WorkflowService");
const WorkflowScheduler_1 = require("../scheduler/WorkflowScheduler");
class PredefinedWorkflowService {
    constructor(scheduler) {
        this.workflowService = new WorkflowService_1.WorkflowService();
        this.scheduler = scheduler || new WorkflowScheduler_1.WorkflowScheduler();
    }
    /**
     * Get all predefined workflow definitions
     */
    getPredefinedWorkflows() {
        return [
            {
                name: 'Daily Sales Report',
                description: 'Generate and email daily sales report at 8 AM',
                trigger: {
                    type: 'cron',
                    schedule: '0 8 * * *' // Every day at 8 AM
                },
                actions: [
                    {
                        type: 'fetch_data',
                        parameters: {
                            url: 'https://api.company.com/sales/daily',
                            method: 'GET',
                            headers: {
                                'Authorization': 'Bearer ${SALES_API_TOKEN}',
                                'Content-Type': 'application/json'
                            },
                            storeAs: 'salesData'
                        }
                    },
                    {
                        type: 'generate_report',
                        parameters: {
                            format: 'json',
                            template: 'Daily Sales Report - {{date}}\n\nTotal Sales: ${{totalSales}}\nTotal Orders: {{totalOrders}}\nTop Product: {{topProduct}}',
                            storeAs: 'salesReport'
                        }
                    },
                    {
                        type: 'send_email',
                        parameters: {
                            to: ['sales@company.com', 'management@company.com'],
                            subject: 'Daily Sales Report - {{date}}',
                            body: '{{salesReport}}',
                            attachments: []
                        }
                    },
                    {
                        type: 'log_result',
                        parameters: {
                            message: 'Daily sales report generated and sent successfully',
                            level: 'info'
                        }
                    }
                ],
                status: 'active'
            },
            {
                name: 'Hourly System Health Check',
                description: 'Monitor system health metrics every hour',
                trigger: {
                    type: 'cron',
                    schedule: '0 * * * *' // Every hour at minute 0
                },
                actions: [
                    {
                        type: 'check_system_metrics',
                        parameters: {
                            thresholds: {
                                cpu: 80, // Alert if CPU usage > 80%
                                memory: 85 // Alert if memory usage > 85%
                            },
                            storeAs: 'systemMetrics'
                        }
                    },
                    {
                        type: 'log_result',
                        parameters: {
                            message: 'System health check completed - CPU: {{systemMetrics.cpu_usage}}%, Memory: {{systemMetrics.memory_usage}}%',
                            level: 'info',
                            data: '{{systemMetrics}}'
                        }
                    }
                ],
                status: 'active'
            }
        ];
    }
    /**
     * Initialize all predefined workflows
     */
    async initializePredefinedWorkflows() {
        const predefinedWorkflows = this.getPredefinedWorkflows();
        const results = {
            created: 0,
            updated: 0,
            errors: []
        };
        console.log(`🔧 Initializing ${predefinedWorkflows.length} predefined workflows...`);
        for (const workflowDef of predefinedWorkflows) {
            try {
                // Check if workflow already exists by name
                const existingWorkflows = await this.workflowService.getAllWorkflows();
                const existingWorkflow = existingWorkflows.find(w => w.name === workflowDef.name);
                if (existingWorkflow) {
                    // Update existing workflow
                    const updated = await this.workflowService.updateWorkflow(existingWorkflow.id, {
                        description: workflowDef.description,
                        trigger: workflowDef.trigger,
                        actions: workflowDef.actions,
                        status: workflowDef.status
                    });
                    if (updated) {
                        console.log(`✅ Updated predefined workflow: ${workflowDef.name}`);
                        results.updated++;
                        // Reschedule if it's a cron workflow
                        if (workflowDef.trigger.type === 'cron' && workflowDef.trigger.schedule) {
                            await this.scheduler.rescheduleWorkflow(updated);
                        }
                    }
                    else {
                        throw new Error('Failed to update workflow');
                    }
                }
                else {
                    // Create new workflow
                    const created = await this.workflowService.createWorkflow({
                        name: workflowDef.name,
                        description: workflowDef.description,
                        trigger: workflowDef.trigger,
                        actions: workflowDef.actions,
                        status: workflowDef.status
                    });
                    console.log(`✅ Created predefined workflow: ${workflowDef.name} (${created.id})`);
                    results.created++;
                    // Schedule if it's a cron workflow
                    if (workflowDef.trigger.type === 'cron' && workflowDef.trigger.schedule) {
                        await this.scheduler.scheduleWorkflow(created);
                    }
                }
            }
            catch (error) {
                const errorMessage = `Failed to initialize workflow "${workflowDef.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`❌ ${errorMessage}`);
                results.errors.push(errorMessage);
            }
        }
        console.log(`🎉 Predefined workflows initialization complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);
        return results;
    }
    /**
     * Reset all predefined workflows (delete and recreate)
     */
    async resetPredefinedWorkflows() {
        const predefinedWorkflows = this.getPredefinedWorkflows();
        const results = {
            deleted: 0,
            created: 0,
            errors: []
        };
        console.log(`🔄 Resetting ${predefinedWorkflows.length} predefined workflows...`);
        // Delete existing predefined workflows
        const existingWorkflows = await this.workflowService.getAllWorkflows();
        const predefinedNames = predefinedWorkflows.map(w => w.name);
        for (const workflow of existingWorkflows) {
            if (predefinedNames.includes(workflow.name)) {
                try {
                    // Unschedule first
                    await this.scheduler.unscheduleWorkflow(workflow.id);
                    // Delete workflow
                    const deleted = await this.workflowService.deleteWorkflow(workflow.id);
                    if (deleted) {
                        console.log(`🗑️ Deleted existing predefined workflow: ${workflow.name}`);
                        results.deleted++;
                    }
                    else {
                        throw new Error('Delete operation returned false');
                    }
                }
                catch (error) {
                    const errorMessage = `Failed to delete workflow "${workflow.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`❌ ${errorMessage}`);
                    results.errors.push(errorMessage);
                }
            }
        }
        // Create all predefined workflows
        for (const workflowDef of predefinedWorkflows) {
            try {
                const created = await this.workflowService.createWorkflow({
                    name: workflowDef.name,
                    description: workflowDef.description,
                    trigger: workflowDef.trigger,
                    actions: workflowDef.actions,
                    status: workflowDef.status
                });
                console.log(`✅ Created predefined workflow: ${workflowDef.name} (${created.id})`);
                results.created++;
                // Schedule if it's a cron workflow
                if (workflowDef.trigger.type === 'cron' && workflowDef.trigger.schedule) {
                    await this.scheduler.scheduleWorkflow(created);
                }
            }
            catch (error) {
                const errorMessage = `Failed to create workflow "${workflowDef.name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`❌ ${errorMessage}`);
                results.errors.push(errorMessage);
            }
        }
        console.log(`🎉 Predefined workflows reset complete: ${results.deleted} deleted, ${results.created} created, ${results.errors.length} errors`);
        return results;
    }
    /**
     * Get status of all predefined workflows
     */
    async getPredefinedWorkflowStatuses() {
        const predefinedWorkflows = this.getPredefinedWorkflows();
        const existingWorkflows = await this.workflowService.getAllWorkflows();
        const scheduledTasks = this.scheduler.getScheduledTasks();
        return predefinedWorkflows.map(predefinedDef => {
            const existingWorkflow = existingWorkflows.find(w => w.name === predefinedDef.name);
            const isScheduled = existingWorkflow ?
                scheduledTasks.some(task => task.workflowId === existingWorkflow.id) :
                false;
            return {
                name: predefinedDef.name,
                exists: !!existingWorkflow,
                workflow: existingWorkflow,
                scheduled: isScheduled
            };
        });
    }
    /**
     * Test a predefined workflow by executing it manually
     */
    async testPredefinedWorkflow(workflowName) {
        const existingWorkflows = await this.workflowService.getAllWorkflows();
        const workflow = existingWorkflows.find(w => w.name === workflowName);
        if (!workflow) {
            throw new Error(`Predefined workflow "${workflowName}" not found`);
        }
        console.log(`🧪 Testing predefined workflow: ${workflowName}`);
        // If it's scheduled, trigger it manually
        const scheduledTask = this.scheduler.getScheduledTask(workflow.id);
        if (scheduledTask) {
            return await this.scheduler.triggerWorkflow(workflow.id);
        }
        else {
            // For non-scheduled workflows, we would need to execute them directly
            // This would require access to the WorkflowEngine
            throw new Error(`Workflow "${workflowName}" is not scheduled and cannot be tested through scheduler`);
        }
    }
}
exports.PredefinedWorkflowService = PredefinedWorkflowService;
//# sourceMappingURL=PredefinedWorkflowService.js.map
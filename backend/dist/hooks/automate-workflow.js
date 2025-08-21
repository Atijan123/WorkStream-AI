"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomateWorkflowHook = void 0;
const index_1 = require("./index");
const WebSocketService_1 = require("../services/WebSocketService");
/**
 * Hook that processes natural language workflow descriptions
 * and generates workflow specifications and backend code
 */
class AutomateWorkflowHook extends index_1.BaseHook {
    constructor(workflowService, scheduler) {
        super();
        this.workflowService = workflowService;
        this.scheduler = scheduler;
        this.name = 'automate_workflow';
        this.description = 'Processes natural language workflow descriptions and generates workflow specifications';
    }
    getWebSocketService() {
        try {
            return WebSocketService_1.WebSocketService.getInstance();
        }
        catch (error) {
            console.warn('WebSocket service not available in AutomateWorkflowHook');
            return null;
        }
    }
    async execute(context) {
        try {
            console.log(`🤖 Processing workflow request: "${context.request}"`);
            // Parse the natural language request into workflow specification
            const workflowSpec = await this.parseWorkflowRequest(context.request);
            // Create the workflow in the database
            const createdWorkflow = await this.workflowService.createWorkflow(workflowSpec);
            // Schedule the workflow if it has a cron trigger
            if (this.scheduler && workflowSpec.trigger.type === 'cron') {
                await this.scheduler.scheduleWorkflow(createdWorkflow);
            }
            // Emit WebSocket event for workflow creation
            const webSocketService = this.getWebSocketService();
            webSocketService?.emitDashboardDataUpdate({
                type: 'workflows',
                data: await this.workflowService.getAllWorkflows()
            });
            return {
                success: true,
                message: `Successfully created workflow "${workflowSpec.name}" with ${workflowSpec.actions.length} actions`,
                changes: [
                    `Created workflow: ${workflowSpec.name}`,
                    `Trigger: ${workflowSpec.trigger.type}${workflowSpec.trigger.schedule ? ` (${workflowSpec.trigger.schedule})` : ''}`,
                    `Actions: ${workflowSpec.actions.map(a => a.type).join(', ')}`
                ]
            };
        }
        catch (error) {
            console.error('AutomateWorkflow hook execution failed:', error);
            // Emit WebSocket event for error
            const webSocketService = this.getWebSocketService();
            webSocketService?.emitDashboardDataUpdate({
                type: 'workflows',
                data: { error: `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}` }
            });
            return {
                success: false,
                message: `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    async parseWorkflowRequest(request) {
        const lowercaseRequest = request.toLowerCase();
        // Extract workflow name
        const name = this.extractWorkflowName(request);
        // Extract trigger information
        const trigger = this.extractTrigger(lowercaseRequest);
        // Extract actions
        const actions = this.extractActions(lowercaseRequest);
        // Generate description
        const description = this.generateDescription(request, trigger, actions);
        return {
            name,
            description,
            trigger,
            actions,
            status: 'active'
        };
    }
    extractWorkflowName(request) {
        // Try to extract a meaningful name from the request
        const namePatterns = [
            /(?:create|build|make)\s+(?:a\s+)?(?:workflow\s+)?(?:called|named)\s+"([^"]+)"/i,
            /(?:create|build|make)\s+(?:a\s+)?(?:workflow\s+)?(?:to\s+)?(.+?)(?:\s+(?:every|daily|hourly|at))/i,
            /^(.+?)(?:\s+(?:with|at)\s+)/i, // Match up to "with" or "at"
            /^(.+?)(?:\s+(?:every|daily|hourly))/i
        ];
        for (const pattern of namePatterns) {
            const match = request.match(pattern);
            if (match) {
                return this.cleanWorkflowName(match[1]);
            }
        }
        // Fallback: generate name from first few words, but limit to reasonable length
        const words = request.split(' ').slice(0, 6);
        return this.cleanWorkflowName(words.join(' '));
    }
    cleanWorkflowName(name) {
        return name
            .replace(/[^\w\s-]/g, '')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    extractTrigger(request) {
        // Check for cron-like patterns
        if (request.includes('every day') || request.includes('daily')) {
            const timeMatch = request.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?/i);
            if (timeMatch) {
                const hour = parseInt(timeMatch[1]);
                const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                return {
                    type: 'cron',
                    schedule: `${minute} ${hour} * * *`
                };
            }
            return {
                type: 'cron',
                schedule: '0 9 * * *' // Default to 9 AM daily
            };
        }
        if (request.includes('every hour') || request.includes('hourly')) {
            return {
                type: 'cron',
                schedule: '0 * * * *' // Every hour at minute 0
            };
        }
        if (request.includes('every minute')) {
            return {
                type: 'cron',
                schedule: '* * * * *' // Every minute
            };
        }
        // Check for specific cron patterns
        const cronMatch = request.match(/every\s+(\d+)\s+(minutes?|hours?|days?)/i);
        if (cronMatch) {
            const interval = parseInt(cronMatch[1]);
            const unit = cronMatch[2].toLowerCase();
            if (unit.startsWith('minute')) {
                return {
                    type: 'cron',
                    schedule: `*/${interval} * * * *`
                };
            }
            else if (unit.startsWith('hour')) {
                return {
                    type: 'cron',
                    schedule: `0 */${interval} * * *`
                };
            }
            else if (unit.startsWith('day')) {
                return {
                    type: 'cron',
                    schedule: `0 9 */${interval} * *`
                };
            }
        }
        // Check for weekly patterns
        if (request.includes('weekly') || request.includes('every week')) {
            return {
                type: 'cron',
                schedule: '0 9 * * 1' // Every Monday at 9 AM
            };
        }
        // Default to manual trigger
        return {
            type: 'manual'
        };
    }
    extractActions(request) {
        const actions = [];
        // Check for data fetching
        if (request.includes('fetch') || request.includes('get data') || request.includes('retrieve')) {
            const urlMatch = request.match(/(?:from|at)\s+(https?:\/\/[^\s]+)/i);
            actions.push({
                type: 'fetch_data',
                parameters: {
                    url: urlMatch ? urlMatch[1] : 'https://api.example.com/data',
                    method: 'GET',
                    storeAs: 'fetchedData'
                }
            });
        }
        // Check for email sending
        if (request.includes('email') || request.includes('send') || request.includes('notify')) {
            const emailMatch = request.match(/(?:to|email)\s+([^\s@]+@[^\s@]+\.[^\s@]+)/i);
            const subjectMatch = request.match(/(?:subject|about|regarding)\s+"([^"]+)"/i);
            actions.push({
                type: 'send_email',
                parameters: {
                    to: emailMatch ? [emailMatch[1]] : ['user@example.com'],
                    subject: subjectMatch ? subjectMatch[1] : 'Automated Workflow Notification',
                    body: 'This is an automated message from your workflow.',
                    storeAs: 'emailResult'
                }
            });
        }
        // Check for system monitoring
        if (request.includes('system') || request.includes('health') || request.includes('monitor') || request.includes('check')) {
            actions.push({
                type: 'check_system_metrics',
                parameters: {
                    thresholds: {
                        cpu: 80,
                        memory: 85
                    },
                    storeAs: 'systemMetrics'
                }
            });
        }
        // Check for report generation
        if (request.includes('report') || request.includes('generate') || request.includes('create report')) {
            const formatMatch = request.match(/(?:as|in)\s+(json|csv|text)/i);
            actions.push({
                type: 'generate_report',
                parameters: {
                    format: formatMatch ? formatMatch[1].toLowerCase() : 'json',
                    template: 'Automated Report - {{date}}\n\nData: {{data}}',
                    storeAs: 'generatedReport'
                }
            });
        }
        // Always add a log action to track execution
        actions.push({
            type: 'log_result',
            parameters: {
                message: 'Workflow executed successfully',
                level: 'info'
            }
        });
        // If no specific actions were detected, add a basic log action
        if (actions.length === 1) {
            actions.unshift({
                type: 'log_result',
                parameters: {
                    message: `Executing workflow: ${request}`,
                    level: 'info'
                }
            });
        }
        return actions;
    }
    generateDescription(request, trigger, actions) {
        const triggerDesc = trigger.type === 'cron'
            ? `Runs ${this.describeCronSchedule(trigger.schedule)}`
            : 'Runs manually';
        const actionDesc = actions
            .filter(a => a.type !== 'log_result')
            .map(a => this.describeAction(a))
            .join(', ');
        return `${triggerDesc}. ${actionDesc || 'Performs custom workflow actions'}.`;
    }
    describeCronSchedule(schedule) {
        const parts = schedule.split(' ');
        if (schedule === '0 * * * *')
            return 'every hour';
        if (schedule === '* * * * *')
            return 'every minute';
        if (schedule.includes('0 9 * * *'))
            return 'daily at 9 AM';
        if (schedule.includes('* * *'))
            return 'daily';
        if (schedule.includes('* * 1'))
            return 'weekly on Monday';
        return `on schedule: ${schedule}`;
    }
    describeAction(action) {
        switch (action.type) {
            case 'fetch_data':
                return 'fetches data from API';
            case 'send_email':
                return 'sends email notification';
            case 'check_system_metrics':
                return 'monitors system health';
            case 'generate_report':
                return 'generates report';
            default:
                return 'performs action';
        }
    }
}
exports.AutomateWorkflowHook = AutomateWorkflowHook;
//# sourceMappingURL=automate-workflow.js.map
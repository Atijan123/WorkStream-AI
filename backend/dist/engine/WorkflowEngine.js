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
exports.WorkflowEngine = void 0;
const WorkflowService_1 = require("../services/WorkflowService");
const SystemMetricsRepository_1 = require("../repositories/SystemMetricsRepository");
const WebSocketService_1 = require("../services/WebSocketService");
const os = __importStar(require("os"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class WorkflowEngine {
    constructor() {
        this.workflowService = new WorkflowService_1.WorkflowService();
        this.systemMetricsRepo = new SystemMetricsRepository_1.SystemMetricsRepository();
        this.runningExecutions = new Map();
        this.webSocketService = null;
        // Get WebSocket service instance if available
        try {
            this.webSocketService = WebSocketService_1.WebSocketService.getInstance();
        }
        catch (error) {
            console.warn('WebSocket service not available in WorkflowEngine');
        }
    }
    async executeWorkflow(workflowId) {
        const startTime = Date.now();
        const executionId = `exec_${workflowId}_${Date.now()}`;
        try {
            const workflow = await this.workflowService.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error(`Workflow ${workflowId} not found`);
            }
            if (workflow.status !== 'active') {
                throw new Error(`Workflow ${workflowId} is not active (status: ${workflow.status})`);
            }
            const context = {
                workflowId,
                executionId,
                startTime: new Date(),
                variables: {}
            };
            this.runningExecutions.set(executionId, context);
            // Log execution start
            await this.workflowService.logWorkflowExecution({
                workflow_id: workflowId,
                status: 'running',
                message: `Started execution ${executionId}`,
                execution_time: context.startTime,
                duration_ms: 0
            });
            // Emit WebSocket event for workflow start
            this.webSocketService?.emitWorkflowStatusUpdate({
                workflowId,
                status: 'running',
                message: `Started execution ${executionId}`
            });
            // Execute all actions in sequence
            const results = [];
            for (let i = 0; i < workflow.actions.length; i++) {
                const action = workflow.actions[i];
                try {
                    const result = await this.executeAction(action, context);
                    results.push(result);
                    if (!result.success) {
                        throw new Error(`Action ${i + 1} failed: ${result.error}`);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    results.push({
                        success: false,
                        error: errorMessage,
                        duration: 0
                    });
                    throw error;
                }
            }
            const duration = Date.now() - startTime;
            // Log successful execution
            await this.workflowService.logWorkflowExecution({
                workflow_id: workflowId,
                status: 'success',
                message: `Completed execution ${executionId} successfully`,
                execution_time: context.startTime,
                duration_ms: duration
            });
            // Emit WebSocket event for workflow success
            this.webSocketService?.emitWorkflowStatusUpdate({
                workflowId,
                status: 'success',
                message: `Completed execution ${executionId} successfully`
            });
            this.runningExecutions.delete(executionId);
            return {
                success: true,
                data: { results, executionId },
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Log failed execution
            await this.workflowService.logWorkflowExecution({
                workflow_id: workflowId,
                status: 'error',
                message: `Failed execution ${executionId}: ${errorMessage}`,
                execution_time: new Date(),
                duration_ms: duration
            });
            // Emit WebSocket event for workflow error
            this.webSocketService?.emitWorkflowStatusUpdate({
                workflowId,
                status: 'error',
                message: `Failed execution ${executionId}: ${errorMessage}`
            });
            // Mark workflow as error if it fails repeatedly
            await this.handleWorkflowError(workflowId);
            this.runningExecutions.delete(executionId);
            return {
                success: false,
                error: errorMessage,
                duration
            };
        }
    }
    async executeAction(action, context) {
        const startTime = Date.now();
        try {
            let result;
            switch (action.type) {
                case 'fetch_data':
                    result = await this.handleFetchData(action.parameters, context);
                    break;
                case 'generate_report':
                    result = await this.handleGenerateReport(action.parameters, context);
                    break;
                case 'send_email':
                    result = await this.handleSendEmail(action.parameters, context);
                    break;
                case 'check_system_metrics':
                    result = await this.handleCheckSystemMetrics(action.parameters, context);
                    break;
                case 'log_result':
                    result = await this.handleLogResult(action.parameters, context);
                    break;
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }
            const duration = Date.now() - startTime;
            return {
                success: true,
                data: result,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage,
                duration
            };
        }
    }
    async handleFetchData(parameters, context) {
        const { url, method = 'GET', headers = {}, body } = parameters;
        if (!url) {
            throw new Error('URL parameter is required for fetch_data action');
        }
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        // Store data in context for use by subsequent actions
        if (parameters.storeAs) {
            context.variables[parameters.storeAs] = data;
        }
        return data;
    }
    async handleGenerateReport(parameters, context) {
        const { template, data, format = 'json', outputPath } = parameters;
        // Use data from context if not provided directly
        const reportData = data || context.variables;
        let report;
        switch (format) {
            case 'json':
                report = JSON.stringify(reportData, null, 2);
                break;
            case 'csv':
                report = this.generateCSV(reportData);
                break;
            case 'text':
                report = this.generateTextReport(reportData, template);
                break;
            default:
                throw new Error(`Unsupported report format: ${format}`);
        }
        // Save to file if outputPath is specified
        if (outputPath) {
            const fullPath = path.resolve(outputPath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, report);
        }
        // Store report in context
        if (parameters.storeAs) {
            context.variables[parameters.storeAs] = report;
        }
        return {
            format,
            content: report,
            path: outputPath,
            size: report.length
        };
    }
    async handleSendEmail(parameters, context) {
        const { to, subject, body, attachments } = parameters;
        if (!to || !subject || !body) {
            throw new Error('to, subject, and body parameters are required for send_email action');
        }
        // For now, we'll simulate email sending by logging
        // In a real implementation, you would integrate with an email service like SendGrid, AWS SES, etc.
        const emailData = {
            to: Array.isArray(to) ? to : [to],
            subject,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            attachments: attachments || [],
            timestamp: new Date().toISOString()
        };
        console.log('📧 Email sent:', emailData);
        // Store email data in context
        if (parameters.storeAs) {
            context.variables[parameters.storeAs] = emailData;
        }
        return emailData;
    }
    async handleCheckSystemMetrics(parameters, context) {
        const metrics = {
            cpu_usage: this.getCPUUsage(),
            memory_usage: this.getMemoryUsage(),
            timestamp: new Date()
        };
        // Store metrics in database
        await this.systemMetricsRepo.create(metrics);
        // Store metrics in context
        if (parameters.storeAs) {
            context.variables[parameters.storeAs] = metrics;
        }
        // Check thresholds if specified
        if (parameters.thresholds) {
            const alerts = [];
            if (parameters.thresholds.cpu && metrics.cpu_usage > parameters.thresholds.cpu) {
                alerts.push(`CPU usage ${metrics.cpu_usage}% exceeds threshold ${parameters.thresholds.cpu}%`);
            }
            if (parameters.thresholds.memory && metrics.memory_usage > parameters.thresholds.memory) {
                alerts.push(`Memory usage ${metrics.memory_usage}% exceeds threshold ${parameters.thresholds.memory}%`);
            }
            if (alerts.length > 0) {
                console.warn('⚠️ System alerts:', alerts);
                return { ...metrics, alerts };
            }
        }
        return metrics;
    }
    async handleLogResult(parameters, context) {
        const { message, level = 'info', data } = parameters;
        const logEntry = {
            level,
            message: typeof message === 'string' ? message : JSON.stringify(message),
            data: data || context.variables,
            timestamp: new Date().toISOString(),
            workflowId: context.workflowId,
            executionId: context.executionId
        };
        // Log to console with appropriate level
        switch (level) {
            case 'error':
                console.error('🔴', logEntry);
                break;
            case 'warn':
                console.warn('🟡', logEntry);
                break;
            case 'info':
            default:
                console.log('🔵', logEntry);
                break;
        }
        return logEntry;
    }
    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - ~~(100 * idle / total);
        return Math.max(0, Math.min(100, usage));
    }
    getMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        return Math.round((usedMem / totalMem) * 100);
    }
    generateCSV(data) {
        if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
            ];
            return csvRows.join('\n');
        }
        return '';
    }
    generateTextReport(data, template) {
        if (template) {
            // Simple template replacement
            return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return data[key] || match;
            });
        }
        // Default text format
        return Object.entries(data)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');
    }
    async handleWorkflowError(workflowId) {
        // Get recent failed executions for this workflow
        const recentLogs = await this.workflowService.getWorkflowHistory(workflowId, 5);
        const recentFailures = recentLogs.filter(log => log.status === 'error');
        // If more than 3 failures in recent history, mark workflow as error
        if (recentFailures.length >= 3) {
            await this.workflowService.markWorkflowAsError(workflowId);
            console.error(`🚨 Workflow ${workflowId} marked as error due to repeated failures`);
        }
    }
    getRunningExecutions() {
        return Array.from(this.runningExecutions.values());
    }
    async stopExecution(executionId) {
        if (this.runningExecutions.has(executionId)) {
            this.runningExecutions.delete(executionId);
            return true;
        }
        return false;
    }
}
exports.WorkflowEngine = WorkflowEngine;
//# sourceMappingURL=WorkflowEngine.js.map
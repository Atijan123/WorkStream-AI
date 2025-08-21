import { Workflow, WorkflowAction } from '../types';
import { WorkflowService } from '../services/WorkflowService';
import { SystemMetricsRepository } from '../repositories/SystemMetricsRepository';
import { WebSocketService } from '../services/WebSocketService';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  startTime: Date;
  variables: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export class WorkflowEngine {
  private workflowService: WorkflowService;
  private systemMetricsRepo: SystemMetricsRepository;
  private runningExecutions: Map<string, WorkflowExecutionContext>;
  private webSocketService: WebSocketService | null;

  constructor() {
    this.workflowService = new WorkflowService();
    this.systemMetricsRepo = new SystemMetricsRepository();
    this.runningExecutions = new Map();
    this.webSocketService = null;
    
    // Get WebSocket service instance if available
    try {
      this.webSocketService = WebSocketService.getInstance();
    } catch (error) {
      console.warn('WebSocket service not available in WorkflowEngine');
    }
  }

  async executeWorkflow(workflowId: string): Promise<ActionResult> {
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

      const context: WorkflowExecutionContext = {
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
      const results: ActionResult[] = [];
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        try {
          const result = await this.executeAction(action, context);
          results.push(result);
          
          if (!result.success) {
            throw new Error(`Action ${i + 1} failed: ${result.error}`);
          }
        } catch (error) {
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

    } catch (error) {
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

  private async executeAction(action: WorkflowAction, context: WorkflowExecutionContext): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
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
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
        duration
      };
    }
  }

  private async handleFetchData(parameters: Record<string, any>, context: WorkflowExecutionContext): Promise<any> {
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

  private async handleGenerateReport(parameters: Record<string, any>, context: WorkflowExecutionContext): Promise<any> {
    const { template, data, format = 'json', outputPath } = parameters;
    
    // Use data from context if not provided directly
    const reportData = data || context.variables;
    
    let report: string;
    
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

  private async handleSendEmail(parameters: Record<string, any>, context: WorkflowExecutionContext): Promise<any> {
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

  private async handleCheckSystemMetrics(parameters: Record<string, any>, context: WorkflowExecutionContext): Promise<any> {
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

  private async handleLogResult(parameters: Record<string, any>, context: WorkflowExecutionContext): Promise<any> {
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

  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return Math.max(0, Math.min(100, usage));
  }

  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return Math.round((usedMem / totalMem) * 100);
  }

  private generateCSV(data: any): string {
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

  private generateTextReport(data: any, template?: string): string {
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

  private async handleWorkflowError(workflowId: string): Promise<void> {
    // Get recent failed executions for this workflow
    const recentLogs = await this.workflowService.getWorkflowHistory(workflowId, 5);
    const recentFailures = recentLogs.filter(log => log.status === 'error');
    
    // If more than 3 failures in recent history, mark workflow as error
    if (recentFailures.length >= 3) {
      await this.workflowService.markWorkflowAsError(workflowId);
      console.error(`🚨 Workflow ${workflowId} marked as error due to repeated failures`);
    }
  }

  getRunningExecutions(): WorkflowExecutionContext[] {
    return Array.from(this.runningExecutions.values());
  }

  async stopExecution(executionId: string): Promise<boolean> {
    if (this.runningExecutions.has(executionId)) {
      this.runningExecutions.delete(executionId);
      return true;
    }
    return false;
  }
}
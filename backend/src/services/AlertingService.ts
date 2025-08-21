import { LoggingService } from './LoggingService';
import { WebSocketService } from './WebSocketService';

export interface Alert {
  id: string;
  type: 'system' | 'workflow' | 'feature' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  type: Alert['type'];
  condition: (data: any) => boolean;
  severity: Alert['severity'];
  cooldownMs: number; // Minimum time between alerts of the same type
  enabled: boolean;
}

export interface AlertingConfig {
  maxAlerts: number;
  defaultCooldownMs: number;
  enableWebSocketNotifications: boolean;
  enableEmailNotifications: boolean;
  emailRecipients: string[];
}

export class AlertingService {
  private static instance: AlertingService;
  private logger: LoggingService;
  private webSocketService: WebSocketService | null;
  private alerts: Alert[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map();
  private config: AlertingConfig;

  private constructor(config?: Partial<AlertingConfig>) {
    this.logger = LoggingService.getInstance();
    this.config = {
      maxAlerts: 1000,
      defaultCooldownMs: 5 * 60 * 1000, // 5 minutes
      enableWebSocketNotifications: true,
      enableEmailNotifications: false,
      emailRecipients: [],
      ...config
    };

    try {
      this.webSocketService = WebSocketService.getInstance();
    } catch (error) {
      this.logger.warn('WebSocket service not available for alerting', { component: 'AlertingService' });
      this.webSocketService = null;
    }

    this.setupDefaultRules();
  }

  static getInstance(config?: Partial<AlertingConfig>): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService(config);
    }
    return AlertingService.instance;
  }

  private setupDefaultRules(): void {
    // System resource alerts
    this.addRule({
      id: 'high_cpu_usage',
      name: 'High CPU Usage',
      type: 'system',
      condition: (data: { cpuUsage: number }) => data.cpuUsage > 80,
      severity: 'high',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
      enabled: true
    });

    this.addRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      type: 'system',
      condition: (data: { memoryUsage: number }) => data.memoryUsage > 85,
      severity: 'high',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
      enabled: true
    });

    this.addRule({
      id: 'critical_cpu_usage',
      name: 'Critical CPU Usage',
      type: 'system',
      condition: (data: { cpuUsage: number }) => data.cpuUsage > 95,
      severity: 'critical',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      enabled: true
    });

    this.addRule({
      id: 'critical_memory_usage',
      name: 'Critical Memory Usage',
      type: 'system',
      condition: (data: { memoryUsage: number }) => data.memoryUsage > 95,
      severity: 'critical',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      enabled: true
    });

    // Workflow alerts
    this.addRule({
      id: 'workflow_failure',
      name: 'Workflow Execution Failed',
      type: 'workflow',
      condition: (data: { status: string }) => data.status === 'error',
      severity: 'medium',
      cooldownMs: 2 * 60 * 1000, // 2 minutes
      enabled: true
    });

    this.addRule({
      id: 'workflow_timeout',
      name: 'Workflow Execution Timeout',
      type: 'workflow',
      condition: (data: { duration: number }) => data.duration > 5 * 60 * 1000, // 5 minutes
      severity: 'medium',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      enabled: true
    });

    // Feature request alerts
    this.addRule({
      id: 'feature_request_failure',
      name: 'Feature Request Processing Failed',
      type: 'feature',
      condition: (data: { status: string }) => data.status === 'failed',
      severity: 'low',
      cooldownMs: 1 * 60 * 1000, // 1 minute
      enabled: true
    });

    // Error rate alerts
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      type: 'error',
      condition: (data: { errorRate: number }) => data.errorRate > 0.1, // 10% error rate
      severity: 'high',
      cooldownMs: 15 * 60 * 1000, // 15 minutes
      enabled: true
    });
  }

  addRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.info(`Alert rule added: ${rule.name}`, { 
      component: 'AlertingService',
      metadata: { ruleId: rule.id, type: rule.type, severity: rule.severity }
    });
  }

  removeRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.logger.info(`Alert rule removed: ${ruleId}`, { component: 'AlertingService' });
    }
    return removed;
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    
    this.logger.info(`Alert rule updated: ${ruleId}`, { 
      component: 'AlertingService',
      metadata: { updates }
    });
    
    return true;
  }

  checkConditions(type: Alert['type'], data: any): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled || rule.type !== type) continue;

      try {
        if (rule.condition(data)) {
          this.triggerAlert(rule, data);
        }
      } catch (error) {
        this.logger.error(`Error evaluating alert rule ${ruleId}`, error instanceof Error ? error : new Error(String(error)), {
          component: 'AlertingService',
          metadata: { ruleId, data }
        });
      }
    }
  }

  private triggerAlert(rule: AlertRule, data: any): void {
    // Check cooldown
    const lastAlertTime = this.lastAlertTimes.get(rule.id);
    const now = new Date();
    
    if (lastAlertTime) {
      const timeSinceLastAlert = now.getTime() - lastAlertTime.getTime();
      if (timeSinceLastAlert < rule.cooldownMs) {
        return; // Still in cooldown period
      }
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, data),
      timestamp: now,
      resolved: false,
      metadata: { ruleId: rule.id, triggerData: data }
    };

    this.addAlert(alert);
    this.lastAlertTimes.set(rule.id, now);
  }

  private generateAlertMessage(rule: AlertRule, data: any): string {
    switch (rule.id) {
      case 'high_cpu_usage':
        return `CPU usage is ${data.cpuUsage.toFixed(1)}% (threshold: 80%)`;
      case 'high_memory_usage':
        return `Memory usage is ${data.memoryUsage.toFixed(1)}% (threshold: 85%)`;
      case 'critical_cpu_usage':
        return `CPU usage is critically high at ${data.cpuUsage.toFixed(1)}% (threshold: 95%)`;
      case 'critical_memory_usage':
        return `Memory usage is critically high at ${data.memoryUsage.toFixed(1)}% (threshold: 95%)`;
      case 'workflow_failure':
        return `Workflow ${data.workflowId || 'unknown'} failed: ${data.message || 'Unknown error'}`;
      case 'workflow_timeout':
        return `Workflow ${data.workflowId || 'unknown'} took ${Math.round(data.duration / 1000)}s to complete (threshold: 5 minutes)`;
      case 'feature_request_failure':
        return `Feature request ${data.requestId || 'unknown'} failed: ${data.message || 'Unknown error'}`;
      case 'high_error_rate':
        return `Error rate is ${(data.errorRate * 100).toFixed(1)}% (threshold: 10%)`;
      default:
        return `Alert condition met for ${rule.name}`;
    }
  }

  private addAlert(alert: Alert): void {
    this.alerts.unshift(alert);

    // Limit the number of stored alerts
    if (this.alerts.length > this.config.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.config.maxAlerts);
    }

    this.logger.warn(`Alert triggered: ${alert.title}`, {
      component: 'AlertingService',
      metadata: {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message
      }
    });

    // Send notifications
    this.sendNotifications(alert);
  }

  private sendNotifications(alert: Alert): void {
    // WebSocket notification
    if (this.config.enableWebSocketNotifications && this.webSocketService) {
      this.webSocketService.broadcast('alert', {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp
      });
    }

    // Email notification (placeholder - would integrate with email service)
    if (this.config.enableEmailNotifications && this.config.emailRecipients.length > 0) {
      this.sendEmailAlert(alert);
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // This is a placeholder for email integration
    // In a real implementation, you would integrate with an email service like SendGrid, AWS SES, etc.
    this.logger.info(`Email alert would be sent to ${this.config.emailRecipients.join(', ')}`, {
      component: 'AlertingService',
      metadata: {
        alertId: alert.id,
        recipients: this.config.emailRecipients,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        body: alert.message
      }
    });
  }

  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    this.logger.info(`Alert resolved: ${alert.title}`, {
      component: 'AlertingService',
      metadata: {
        alertId,
        resolvedBy,
        duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
      }
    });

    // Notify via WebSocket
    if (this.config.enableWebSocketNotifications && this.webSocketService) {
      this.webSocketService.broadcast('alertResolved', {
        id: alert.id,
        resolvedAt: alert.resolvedAt,
        resolvedBy
      });
    }

    return true;
  }

  getAlerts(options?: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    resolved?: boolean;
    limit?: number;
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (options?.type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === options.type);
    }

    if (options?.severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === options.severity);
    }

    if (options?.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(a => a.resolved === options.resolved);
    }

    if (options?.limit) {
      filteredAlerts = filteredAlerts.slice(0, options.limit);
    }

    return filteredAlerts;
  }

  getAlertStats(): {
    total: number;
    unresolved: number;
    bySeverity: Record<Alert['severity'], number>;
    byType: Record<Alert['type'], number>;
  } {
    const stats = {
      total: this.alerts.length,
      unresolved: this.alerts.filter(a => !a.resolved).length,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } as Record<Alert['severity'], number>,
      byType: { system: 0, workflow: 0, feature: 0, error: 0 } as Record<Alert['type'], number>
    };

    for (const alert of this.alerts) {
      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type]++;
    }

    return stats;
  }

  // System health checks
  checkSystemHealth(cpuUsage: number, memoryUsage: number): void {
    this.checkConditions('system', { cpuUsage, memoryUsage });
  }

  checkWorkflowHealth(workflowId: string, status: string, duration: number, message?: string): void {
    this.checkConditions('workflow', { workflowId, status, duration, message });
  }

  checkFeatureRequestHealth(requestId: string, status: string, message?: string): void {
    this.checkConditions('feature', { requestId, status, message });
  }

  checkErrorRate(errorRate: number): void {
    this.checkConditions('error', { errorRate });
  }

  // Configuration
  updateConfig(newConfig: Partial<AlertingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Alerting configuration updated', {
      component: 'AlertingService',
      metadata: newConfig
    });
  }

  getConfig(): AlertingConfig {
    return { ...this.config };
  }

  getRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  // Cleanup old alerts
  cleanupOldAlerts(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number { // Default: 7 days
    const cutoff = new Date(Date.now() - maxAgeMs);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    
    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      this.logger.info(`Cleaned up ${removedCount} old alerts`, { component: 'AlertingService' });
    }
    
    return removedCount;
  }
}
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
    cooldownMs: number;
    enabled: boolean;
}
export interface AlertingConfig {
    maxAlerts: number;
    defaultCooldownMs: number;
    enableWebSocketNotifications: boolean;
    enableEmailNotifications: boolean;
    emailRecipients: string[];
}
export declare class AlertingService {
    private static instance;
    private logger;
    private webSocketService;
    private alerts;
    private alertRules;
    private lastAlertTimes;
    private config;
    private constructor();
    static getInstance(config?: Partial<AlertingConfig>): AlertingService;
    private setupDefaultRules;
    addRule(rule: AlertRule): void;
    removeRule(ruleId: string): boolean;
    updateRule(ruleId: string, updates: Partial<AlertRule>): boolean;
    checkConditions(type: Alert['type'], data: any): void;
    private triggerAlert;
    private generateAlertMessage;
    private addAlert;
    private sendNotifications;
    private sendEmailAlert;
    resolveAlert(alertId: string, resolvedBy?: string): boolean;
    getAlerts(options?: {
        type?: Alert['type'];
        severity?: Alert['severity'];
        resolved?: boolean;
        limit?: number;
    }): Alert[];
    getAlertStats(): {
        total: number;
        unresolved: number;
        bySeverity: Record<Alert['severity'], number>;
        byType: Record<Alert['type'], number>;
    };
    checkSystemHealth(cpuUsage: number, memoryUsage: number): void;
    checkWorkflowHealth(workflowId: string, status: string, duration: number, message?: string): void;
    checkFeatureRequestHealth(requestId: string, status: string, message?: string): void;
    checkErrorRate(errorRate: number): void;
    updateConfig(newConfig: Partial<AlertingConfig>): void;
    getConfig(): AlertingConfig;
    getRules(): AlertRule[];
    cleanupOldAlerts(maxAgeMs?: number): number;
}
//# sourceMappingURL=AlertingService.d.ts.map
export declare class SystemMonitoringService {
    private systemMetricsRepo;
    private webSocketService;
    private logger;
    private alertingService;
    private monitoringInterval;
    private isMonitoring;
    private metricsHistory;
    private maxHistorySize;
    constructor();
    /**
     * Start monitoring system metrics
     * @param intervalMs Monitoring interval in milliseconds (default: 60000 = 1 minute)
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop monitoring system metrics
     */
    stopMonitoring(): void;
    /**
     * Collect current system metrics and emit via WebSocket
     */
    private collectAndEmitMetrics;
    /**
     * Collect current system metrics
     */
    private collectSystemMetrics;
    /**
     * Get current system metrics without storing them
     */
    getCurrentMetrics(): {
        cpu_usage: number;
        memory_usage: number;
    };
    /**
     * Check if monitoring is currently active
     */
    isMonitoringActive(): boolean;
    /**
     * Get recent metrics history
     */
    getMetricsHistory(limit?: number): Array<{
        cpu_usage: number;
        memory_usage: number;
        timestamp: Date;
    }>;
    /**
     * Get system health summary
     */
    getHealthSummary(): {
        current: {
            cpu_usage: number;
            memory_usage: number;
            timestamp: Date;
        } | null;
        average24h: {
            cpu_usage: number;
            memory_usage: number;
        } | null;
        alerts: {
            active: number;
            total: number;
        };
        status: 'healthy' | 'warning' | 'critical';
    };
    /**
     * Force a metrics collection (useful for testing or manual triggers)
     */
    collectMetricsNow(): Promise<{
        cpu_usage: number;
        memory_usage: number;
    }>;
}
//# sourceMappingURL=SystemMonitoringService.d.ts.map
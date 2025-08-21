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
exports.SystemMonitoringService = void 0;
const os = __importStar(require("os"));
const SystemMetricsRepository_1 = require("../repositories/SystemMetricsRepository");
const WebSocketService_1 = require("./WebSocketService");
const LoggingService_1 = require("./LoggingService");
const AlertingService_1 = require("./AlertingService");
class SystemMonitoringService {
    constructor() {
        this.monitoringInterval = null;
        this.isMonitoring = false;
        this.metricsHistory = [];
        this.maxHistorySize = 1000;
        this.systemMetricsRepo = new SystemMetricsRepository_1.SystemMetricsRepository();
        this.logger = LoggingService_1.LoggingService.getInstance();
        this.alertingService = AlertingService_1.AlertingService.getInstance();
        this.webSocketService = null;
        // Get WebSocket service instance if available
        try {
            this.webSocketService = WebSocketService_1.WebSocketService.getInstance();
        }
        catch (error) {
            this.logger.warn('WebSocket service not available in SystemMonitoringService', { component: 'SystemMonitoringService' });
        }
    }
    /**
     * Start monitoring system metrics
     * @param intervalMs Monitoring interval in milliseconds (default: 60000 = 1 minute)
     */
    startMonitoring(intervalMs = 60000) {
        if (this.isMonitoring) {
            this.logger.info('System monitoring is already running', { component: 'SystemMonitoringService' });
            return;
        }
        this.logger.info(`Starting system monitoring with ${intervalMs}ms interval`, {
            component: 'SystemMonitoringService',
            metadata: { intervalMs }
        });
        this.isMonitoring = true;
        // Collect initial metrics
        this.collectAndEmitMetrics();
        // Set up periodic collection
        this.monitoringInterval = setInterval(() => {
            this.collectAndEmitMetrics();
        }, intervalMs);
    }
    /**
     * Stop monitoring system metrics
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            this.logger.info('System monitoring is not running', { component: 'SystemMonitoringService' });
            return;
        }
        this.logger.info('Stopping system monitoring', { component: 'SystemMonitoringService' });
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    /**
     * Collect current system metrics and emit via WebSocket
     */
    async collectAndEmitMetrics() {
        try {
            const metrics = await this.logger.measureAsync('collect_system_metrics', async () => this.collectSystemMetrics(), 'SystemMonitoringService');
            // Store in database
            await this.logger.measureAsync('store_system_metrics', async () => this.systemMetricsRepo.create(metrics), 'SystemMonitoringService');
            // Add to history
            this.metricsHistory.unshift({
                cpu_usage: metrics.cpu_usage,
                memory_usage: metrics.memory_usage,
                timestamp: new Date()
            });
            // Limit history size
            if (this.metricsHistory.length > this.maxHistorySize) {
                this.metricsHistory = this.metricsHistory.slice(0, this.maxHistorySize);
            }
            // Check for alerts
            this.alertingService.checkSystemHealth(metrics.cpu_usage, metrics.memory_usage);
            // Emit via WebSocket
            this.webSocketService?.emitSystemMetricsUpdate({
                cpuUsage: metrics.cpu_usage,
                memoryUsage: metrics.memory_usage,
                timestamp: new Date()
            });
            // Log metrics for debugging
            this.logger.logSystemMetrics(metrics.cpu_usage, metrics.memory_usage);
            this.logger.debug(`System metrics collected - CPU: ${metrics.cpu_usage.toFixed(1)}%, Memory: ${metrics.memory_usage.toFixed(1)}%`, {
                component: 'SystemMonitoringService',
                metadata: { cpuUsage: metrics.cpu_usage, memoryUsage: metrics.memory_usage }
            });
        }
        catch (error) {
            this.logger.error('Failed to collect system metrics', error instanceof Error ? error : new Error(String(error)), {
                component: 'SystemMonitoringService'
            });
        }
    }
    /**
     * Collect current system metrics
     */
    collectSystemMetrics() {
        // Get memory usage
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        // Get CPU usage (simplified - using load average as proxy)
        const loadAverage = os.loadavg();
        const cpuCount = os.cpus().length;
        // Use 1-minute load average normalized by CPU count
        const cpuUsage = Math.min((loadAverage[0] / cpuCount) * 100, 100);
        return {
            cpu_usage: Math.round(cpuUsage * 10) / 10, // Round to 1 decimal place
            memory_usage: Math.round(memoryUsage * 10) / 10 // Round to 1 decimal place
        };
    }
    /**
     * Get current system metrics without storing them
     */
    getCurrentMetrics() {
        return this.collectSystemMetrics();
    }
    /**
     * Check if monitoring is currently active
     */
    isMonitoringActive() {
        return this.isMonitoring;
    }
    /**
     * Get recent metrics history
     */
    getMetricsHistory(limit = 100) {
        return this.metricsHistory.slice(0, limit);
    }
    /**
     * Get system health summary
     */
    getHealthSummary() {
        const current = this.metricsHistory[0] || null;
        // Calculate 24h average
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent24h = this.metricsHistory.filter(m => m.timestamp > twentyFourHoursAgo);
        let average24h = null;
        if (recent24h.length > 0) {
            const avgCpu = recent24h.reduce((sum, m) => sum + m.cpu_usage, 0) / recent24h.length;
            const avgMemory = recent24h.reduce((sum, m) => sum + m.memory_usage, 0) / recent24h.length;
            average24h = { cpu_usage: avgCpu, memory_usage: avgMemory };
        }
        // Get alert stats
        const alertStats = this.alertingService.getAlertStats();
        const systemAlerts = this.alertingService.getAlerts({ type: 'system', resolved: false });
        // Determine status
        let status = 'healthy';
        if (current) {
            if (current.cpu_usage > 95 || current.memory_usage > 95) {
                status = 'critical';
            }
            else if (current.cpu_usage > 80 || current.memory_usage > 85) {
                status = 'warning';
            }
        }
        // Check for critical alerts
        const criticalAlerts = systemAlerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
            status = 'critical';
        }
        else if (systemAlerts.length > 0) {
            status = 'warning';
        }
        return {
            current,
            average24h,
            alerts: {
                active: systemAlerts.length,
                total: alertStats.byType.system
            },
            status
        };
    }
    /**
     * Force a metrics collection (useful for testing or manual triggers)
     */
    async collectMetricsNow() {
        const metrics = this.collectSystemMetrics();
        try {
            await this.systemMetricsRepo.create(metrics);
            this.logger.info('Manual metrics collection completed', {
                component: 'SystemMonitoringService',
                metadata: { cpuUsage: metrics.cpu_usage, memoryUsage: metrics.memory_usage }
            });
        }
        catch (error) {
            this.logger.error('Failed to store manually collected metrics', error instanceof Error ? error : new Error(String(error)), {
                component: 'SystemMonitoringService'
            });
        }
        return metrics;
    }
}
exports.SystemMonitoringService = SystemMonitoringService;
//# sourceMappingURL=SystemMonitoringService.js.map
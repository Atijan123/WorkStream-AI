import * as os from 'os';
import { SystemMetricsRepository } from '../repositories/SystemMetricsRepository';
import { WebSocketService } from './WebSocketService';
import { LoggingService } from './LoggingService';
import { AlertingService } from './AlertingService';

export class SystemMonitoringService {
  private systemMetricsRepo: SystemMetricsRepository;
  private webSocketService: WebSocketService | null;
  private logger: LoggingService;
  private alertingService: AlertingService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private metricsHistory: Array<{ cpu_usage: number; memory_usage: number; timestamp: Date }> = [];
  private maxHistorySize = 1000;

  constructor() {
    this.systemMetricsRepo = new SystemMetricsRepository();
    this.logger = LoggingService.getInstance();
    this.alertingService = AlertingService.getInstance();
    this.webSocketService = null;
    
    // Get WebSocket service instance if available
    try {
      this.webSocketService = WebSocketService.getInstance();
    } catch (error) {
      this.logger.warn('WebSocket service not available in SystemMonitoringService', { component: 'SystemMonitoringService' });
    }
  }

  /**
   * Start monitoring system metrics
   * @param intervalMs Monitoring interval in milliseconds (default: 60000 = 1 minute)
   */
  startMonitoring(intervalMs: number = 60000): void {
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
  stopMonitoring(): void {
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
  private async collectAndEmitMetrics(): Promise<void> {
    try {
      const metrics = await this.logger.measureAsync(
        'collect_system_metrics',
        async () => this.collectSystemMetrics(),
        'SystemMonitoringService'
      );
      
      // Store in database
      await this.logger.measureAsync(
        'store_system_metrics',
        async () => this.systemMetricsRepo.create(metrics),
        'SystemMonitoringService'
      );

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
    } catch (error) {
      this.logger.error('Failed to collect system metrics', error instanceof Error ? error : new Error(String(error)), {
        component: 'SystemMonitoringService'
      });
    }
  }

  /**
   * Collect current system metrics
   */
  private collectSystemMetrics(): { cpu_usage: number; memory_usage: number } {
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
  getCurrentMetrics(): { cpu_usage: number; memory_usage: number } {
    return this.collectSystemMetrics();
  }

  /**
   * Check if monitoring is currently active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get recent metrics history
   */
  getMetricsHistory(limit: number = 100): Array<{ cpu_usage: number; memory_usage: number; timestamp: Date }> {
    return this.metricsHistory.slice(0, limit);
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    current: { cpu_usage: number; memory_usage: number; timestamp: Date } | null;
    average24h: { cpu_usage: number; memory_usage: number } | null;
    alerts: { active: number; total: number };
    status: 'healthy' | 'warning' | 'critical';
  } {
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
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (current) {
      if (current.cpu_usage > 95 || current.memory_usage > 95) {
        status = 'critical';
      } else if (current.cpu_usage > 80 || current.memory_usage > 85) {
        status = 'warning';
      }
    }

    // Check for critical alerts
    const criticalAlerts = systemAlerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (systemAlerts.length > 0) {
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
  async collectMetricsNow(): Promise<{ cpu_usage: number; memory_usage: number }> {
    const metrics = this.collectSystemMetrics();
    
    try {
      await this.systemMetricsRepo.create(metrics);
      this.logger.info('Manual metrics collection completed', {
        component: 'SystemMonitoringService',
        metadata: { cpuUsage: metrics.cpu_usage, memoryUsage: metrics.memory_usage }
      });
    } catch (error) {
      this.logger.error('Failed to store manually collected metrics', error instanceof Error ? error : new Error(String(error)), {
        component: 'SystemMonitoringService'
      });
    }

    return metrics;
  }
}
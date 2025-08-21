import { Router } from 'express';
import { systemMonitoringService, alertingService, logger } from '../index';

const router = Router();

// Get system health summary
router.get('/health', async (req, res) => {
  try {
    const healthSummary = systemMonitoringService.getHealthSummary();
    res.json(healthSummary);
  } catch (error) {
    logger.error('Failed to get health summary', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to get health summary' });
  }
});

// Get system metrics history
router.get('/metrics', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const metrics = systemMonitoringService.getMetricsHistory(limit);
    res.json({ metrics, count: metrics.length });
  } catch (error) {
    logger.error('Failed to get metrics history', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to get metrics history' });
  }
});

// Force metrics collection
router.post('/metrics/collect', async (req, res) => {
  try {
    const metrics = await systemMonitoringService.collectMetricsNow();
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error('Failed to collect metrics', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { type, severity, resolved, limit } = req.query;
    
    const options: any = {};
    if (type) options.type = type;
    if (severity) options.severity = severity;
    if (resolved !== undefined) options.resolved = resolved === 'true';
    if (limit) options.limit = parseInt(limit as string);

    const alerts = alertingService.getAlerts(options);
    const stats = alertingService.getAlertStats();
    
    res.json({ alerts, stats });
  } catch (error) {
    logger.error('Failed to get alerts', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Resolve alert
router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy } = req.body;
    
    const success = alertingService.resolveAlert(alertId, resolvedBy);
    
    if (success) {
      res.json({ success: true, message: 'Alert resolved successfully' });
    } else {
      res.status(404).json({ error: 'Alert not found or already resolved' });
    }
  } catch (error) {
    logger.error('Failed to resolve alert', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId,
      metadata: { alertId: req.params.alertId }
    });
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get alert rules
router.get('/alert-rules', async (req, res) => {
  try {
    const rules = alertingService.getRules();
    res.json({ rules });
  } catch (error) {
    logger.error('Failed to get alert rules', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to get alert rules' });
  }
});

// Update alert rule
router.put('/alert-rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const success = alertingService.updateRule(ruleId, updates);
    
    if (success) {
      res.json({ success: true, message: 'Alert rule updated successfully' });
    } else {
      res.status(404).json({ error: 'Alert rule not found' });
    }
  } catch (error) {
    logger.error('Failed to update alert rule', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId,
      metadata: { ruleId: req.params.ruleId, updates: req.body }
    });
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

// Get recent logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const level = req.query.level as any;
    
    const logs = await logger.getRecentLogs(limit, level);
    res.json({ logs, count: logs.length });
  } catch (error) {
    logger.error('Failed to get logs', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Get monitoring configuration
router.get('/config', async (req, res) => {
  try {
    const loggingConfig = logger.getConfig();
    const alertingConfig = alertingService.getConfig();
    
    res.json({
      logging: loggingConfig,
      alerting: alertingConfig,
      monitoring: {
        isActive: systemMonitoringService.isMonitoringActive()
      }
    });
  } catch (error) {
    logger.error('Failed to get monitoring config', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId
    });
    res.status(500).json({ error: 'Failed to get monitoring config' });
  }
});

// Update monitoring configuration
router.put('/config', async (req, res) => {
  try {
    const { logging, alerting } = req.body;
    
    if (logging) {
      logger.updateConfig(logging);
    }
    
    if (alerting) {
      alertingService.updateConfig(alerting);
    }
    
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    logger.error('Failed to update monitoring config', error instanceof Error ? error : new Error(String(error)), {
      component: 'MonitoringAPI',
      requestId: (req as any).requestId,
      metadata: { updates: req.body }
    });
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
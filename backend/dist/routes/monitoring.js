"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// Get system health summary
router.get('/health', async (req, res) => {
    try {
        const healthSummary = index_1.systemMonitoringService.getHealthSummary();
        res.json(healthSummary);
    }
    catch (error) {
        index_1.logger.error('Failed to get health summary', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to get health summary' });
    }
});
// Get system metrics history
router.get('/metrics', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const metrics = index_1.systemMonitoringService.getMetricsHistory(limit);
        res.json({ metrics, count: metrics.length });
    }
    catch (error) {
        index_1.logger.error('Failed to get metrics history', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to get metrics history' });
    }
});
// Force metrics collection
router.post('/metrics/collect', async (req, res) => {
    try {
        const metrics = await index_1.systemMonitoringService.collectMetricsNow();
        res.json({ success: true, metrics });
    }
    catch (error) {
        index_1.logger.error('Failed to collect metrics', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to collect metrics' });
    }
});
// Get alerts
router.get('/alerts', async (req, res) => {
    try {
        const { type, severity, resolved, limit } = req.query;
        const options = {};
        if (type)
            options.type = type;
        if (severity)
            options.severity = severity;
        if (resolved !== undefined)
            options.resolved = resolved === 'true';
        if (limit)
            options.limit = parseInt(limit);
        const alerts = index_1.alertingService.getAlerts(options);
        const stats = index_1.alertingService.getAlertStats();
        res.json({ alerts, stats });
    }
    catch (error) {
        index_1.logger.error('Failed to get alerts', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});
// Resolve alert
router.post('/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { resolvedBy } = req.body;
        const success = index_1.alertingService.resolveAlert(alertId, resolvedBy);
        if (success) {
            res.json({ success: true, message: 'Alert resolved successfully' });
        }
        else {
            res.status(404).json({ error: 'Alert not found or already resolved' });
        }
    }
    catch (error) {
        index_1.logger.error('Failed to resolve alert', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId,
            metadata: { alertId: req.params.alertId }
        });
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});
// Get alert rules
router.get('/alert-rules', async (req, res) => {
    try {
        const rules = index_1.alertingService.getRules();
        res.json({ rules });
    }
    catch (error) {
        index_1.logger.error('Failed to get alert rules', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to get alert rules' });
    }
});
// Update alert rule
router.put('/alert-rules/:ruleId', async (req, res) => {
    try {
        const { ruleId } = req.params;
        const updates = req.body;
        const success = index_1.alertingService.updateRule(ruleId, updates);
        if (success) {
            res.json({ success: true, message: 'Alert rule updated successfully' });
        }
        else {
            res.status(404).json({ error: 'Alert rule not found' });
        }
    }
    catch (error) {
        index_1.logger.error('Failed to update alert rule', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId,
            metadata: { ruleId: req.params.ruleId, updates: req.body }
        });
        res.status(500).json({ error: 'Failed to update alert rule' });
    }
});
// Get recent logs
router.get('/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const level = req.query.level;
        const logs = await index_1.logger.getRecentLogs(limit, level);
        res.json({ logs, count: logs.length });
    }
    catch (error) {
        index_1.logger.error('Failed to get logs', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to get logs' });
    }
});
// Get monitoring configuration
router.get('/config', async (req, res) => {
    try {
        const loggingConfig = index_1.logger.getConfig();
        const alertingConfig = index_1.alertingService.getConfig();
        res.json({
            logging: loggingConfig,
            alerting: alertingConfig,
            monitoring: {
                isActive: index_1.systemMonitoringService.isMonitoringActive()
            }
        });
    }
    catch (error) {
        index_1.logger.error('Failed to get monitoring config', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId
        });
        res.status(500).json({ error: 'Failed to get monitoring config' });
    }
});
// Update monitoring configuration
router.put('/config', async (req, res) => {
    try {
        const { logging, alerting } = req.body;
        if (logging) {
            index_1.logger.updateConfig(logging);
        }
        if (alerting) {
            index_1.alertingService.updateConfig(alerting);
        }
        res.json({ success: true, message: 'Configuration updated successfully' });
    }
    catch (error) {
        index_1.logger.error('Failed to update monitoring config', error instanceof Error ? error : new Error(String(error)), {
            component: 'MonitoringAPI',
            requestId: req.requestId,
            metadata: { updates: req.body }
        });
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});
exports.default = router;
//# sourceMappingURL=monitoring.js.map
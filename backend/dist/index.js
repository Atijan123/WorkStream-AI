"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemMonitoringService = exports.webSocketService = exports.alertingService = exports.logger = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const init_1 = require("./database/init");
const WebSocketService_1 = require("./services/WebSocketService");
const SystemMonitoringService_1 = require("./services/SystemMonitoringService");
const LoggingService_1 = require("./services/LoggingService");
const AlertingService_1 = require("./services/AlertingService");
const workflows_1 = __importDefault(require("./routes/workflows"));
const features_1 = __importDefault(require("./routes/features"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const hooks_1 = __importDefault(require("./routes/hooks"));
const monitoring_1 = __importDefault(require("./routes/monitoring"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const PORT = process.env.PORT || 3001;
// Initialize services
const logger = LoggingService_1.LoggingService.getInstance({
    logLevel: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE !== 'false',
    logDirectory: process.env.LOG_DIRECTORY || './logs'
});
exports.logger = logger;
const alertingService = AlertingService_1.AlertingService.getInstance({
    enableEmailNotifications: process.env.ENABLE_EMAIL_ALERTS === 'true',
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
});
exports.alertingService = alertingService;
const webSocketService = WebSocketService_1.WebSocketService.getInstance(httpServer);
exports.webSocketService = webSocketService;
const systemMonitoringService = new SystemMonitoringService_1.SystemMonitoringService();
exports.systemMonitoringService = systemMonitoringService;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, LoggingService_1.requestLoggingMiddleware)(logger));
// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const healthSummary = systemMonitoringService.getHealthSummary();
        const alertStats = alertingService.getAlertStats();
        res.json({
            status: healthSummary.status,
            timestamp: new Date().toISOString(),
            system: healthSummary,
            alerts: alertStats,
            services: {
                monitoring: systemMonitoringService.isMonitoringActive(),
                websocket: !!webSocketService,
                logging: true,
                alerting: true
            }
        });
    }
    catch (error) {
        logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
// API Routes
app.use('/api/workflows', workflows_1.default);
app.use('/api/features', features_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/hooks', hooks_1.default);
app.use('/api/monitoring', monitoring_1.default);
// Initialize database and start server
async function startServer() {
    try {
        await logger.measureAsync('database_initialization', async () => {
            await (0, init_1.initializeDatabase)();
        });
        logger.info('Database initialized successfully');
        // Start system monitoring
        systemMonitoringService.startMonitoring(30000); // Monitor every 30 seconds
        logger.info('System monitoring started');
        // Clean up old alerts periodically (every hour)
        setInterval(() => {
            alertingService.cleanupOldAlerts();
        }, 60 * 60 * 1000);
        httpServer.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`, {
                component: 'Server',
                metadata: { port: PORT, environment: process.env.NODE_ENV || 'development' }
            });
            logger.info('WebSocket server ready for connections');
        });
    }
    catch (error) {
        logger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
    }
}
// Graceful shutdown handling
async function gracefulShutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`);
    try {
        // Stop monitoring
        systemMonitoringService.stopMonitoring();
        // Flush logs
        await logger.shutdown();
        // Close server
        httpServer.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
        // Force exit after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
    catch (error) {
        logger.error('Error during shutdown', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
    }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', new Error(String(reason)), {
        metadata: { promise: promise.toString() }
    });
});
startServer();
//# sourceMappingURL=index.js.map
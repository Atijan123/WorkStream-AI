import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initializeDatabase } from './database/init';
import { WebSocketService } from './services/WebSocketService';
import { SystemMonitoringService } from './services/SystemMonitoringService';
import { LoggingService, requestLoggingMiddleware } from './services/LoggingService';
import { AlertingService } from './services/AlertingService';
import workflowRoutes from './routes/workflows';
import featureRoutes from './routes/features';
import dashboardRoutes from './routes/dashboard';
import hookRoutes from './routes/hooks';
import monitoringRoutes from './routes/monitoring';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Export app and server for testing
export { app, httpServer };

// Initialize services
const logger = LoggingService.getInstance({
  logLevel: process.env.LOG_LEVEL as any || 'info',
  logToFile: process.env.LOG_TO_FILE !== 'false',
  logDirectory: process.env.LOG_DIRECTORY || './logs'
});

const alertingService = AlertingService.getInstance({
  enableEmailNotifications: process.env.ENABLE_EMAIL_ALERTS === 'true',
  emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || []
});

const webSocketService = WebSocketService.getInstance(httpServer);
const systemMonitoringService = new SystemMonitoringService();

export { logger, alertingService, webSocketService, systemMonitoringService };

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLoggingMiddleware(logger));

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
  } catch (error) {
    logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hooks', hookRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Initialize database and start server
async function startServer() {
  try {
    await logger.measureAsync('database_initialization', async () => {
      await initializeDatabase();
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
  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
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
  } catch (error) {
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
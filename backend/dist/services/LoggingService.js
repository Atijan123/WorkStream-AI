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
exports.requestLoggingMiddleware = exports.LoggingService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class LoggingService {
    constructor(config) {
        this.logBuffer = [];
        this.flushInterval = null;
        this.config = {
            logLevel: 'info',
            logToFile: true,
            logToConsole: true,
            logDirectory: path.join(process.cwd(), 'logs'),
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            includeStack: false,
            ...config
        };
        this.initializeLogging();
    }
    static getInstance(config) {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService(config);
        }
        return LoggingService.instance;
    }
    async initializeLogging() {
        if (this.config.logToFile) {
            try {
                await fs.mkdir(this.config.logDirectory, { recursive: true });
            }
            catch (error) {
                console.error('Failed to create log directory:', error);
                this.config.logToFile = false;
            }
        }
        // Set up periodic flushing of log buffer
        this.flushInterval = setInterval(() => {
            this.flushLogs();
        }, 5000); // Flush every 5 seconds
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const configLevelIndex = levels.indexOf(this.config.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= configLevelIndex;
    }
    formatLogEntry(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        const component = entry.component ? `[${entry.component}]` : '';
        const userId = entry.userId ? `{user:${entry.userId}}` : '';
        const requestId = entry.requestId ? `{req:${entry.requestId}}` : '';
        let logLine = `${timestamp} ${level} ${component}${userId}${requestId} ${entry.message}`;
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            logLine += ` | ${JSON.stringify(entry.metadata)}`;
        }
        if (entry.stack && this.config.includeStack) {
            logLine += `\n${entry.stack}`;
        }
        return logLine;
    }
    async writeToFile(entry) {
        if (!this.config.logToFile)
            return;
        const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
        const logFilePath = path.join(this.config.logDirectory, logFileName);
        const logLine = this.formatLogEntry(entry) + '\n';
        try {
            await fs.appendFile(logFilePath, logLine);
            // Check file size and rotate if necessary
            const stats = await fs.stat(logFilePath);
            if (stats.size > this.config.maxFileSize) {
                await this.rotateLogFile(logFilePath);
            }
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    async rotateLogFile(currentLogPath) {
        const dir = path.dirname(currentLogPath);
        const baseName = path.basename(currentLogPath, '.log');
        try {
            // Rotate existing files
            for (let i = this.config.maxFiles - 1; i > 0; i--) {
                const oldFile = path.join(dir, `${baseName}.${i}.log`);
                const newFile = path.join(dir, `${baseName}.${i + 1}.log`);
                try {
                    await fs.access(oldFile);
                    if (i === this.config.maxFiles - 1) {
                        await fs.unlink(oldFile); // Delete oldest file
                    }
                    else {
                        await fs.rename(oldFile, newFile);
                    }
                }
                catch (error) {
                    // File doesn't exist, continue
                }
            }
            // Move current file to .1
            const rotatedFile = path.join(dir, `${baseName}.1.log`);
            await fs.rename(currentLogPath, rotatedFile);
        }
        catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }
    writeToConsole(entry) {
        if (!this.config.logToConsole)
            return;
        const formattedEntry = this.formatLogEntry(entry);
        switch (entry.level) {
            case 'debug':
                console.debug(formattedEntry);
                break;
            case 'info':
                console.info(formattedEntry);
                break;
            case 'warn':
                console.warn(formattedEntry);
                break;
            case 'error':
                console.error(formattedEntry);
                break;
        }
    }
    async flushLogs() {
        if (this.logBuffer.length === 0)
            return;
        const logsToFlush = [...this.logBuffer];
        this.logBuffer = [];
        for (const entry of logsToFlush) {
            if (this.config.logToFile) {
                await this.writeToFile(entry);
            }
        }
    }
    log(level, message, metadata) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date(),
            level,
            message,
            ...metadata
        };
        // Add stack trace for errors
        if (level === 'error' && !entry.stack) {
            entry.stack = new Error().stack;
        }
        // Write to console immediately
        this.writeToConsole(entry);
        // Buffer for file writing
        if (this.config.logToFile) {
            this.logBuffer.push(entry);
        }
    }
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }
    info(message, metadata) {
        this.log('info', message, metadata);
    }
    warn(message, metadata) {
        this.log('warn', message, metadata);
    }
    error(message, error, metadata) {
        this.log('error', message, {
            ...metadata,
            stack: error?.stack || new Error().stack
        });
    }
    // Structured logging methods
    logRequest(method, url, statusCode, duration, userId, requestId) {
        this.info(`${method} ${url} ${statusCode} ${duration}ms`, {
            component: 'HTTP',
            userId,
            requestId,
            metadata: { method, url, statusCode, duration }
        });
    }
    logWorkflowExecution(workflowId, status, duration, message, error) {
        const level = status === 'error' ? 'error' : 'info';
        this.log(level, `Workflow ${workflowId} ${status}${message ? `: ${message}` : ''}`, {
            component: 'WorkflowEngine',
            metadata: { workflowId, status, duration },
            stack: error?.stack
        });
    }
    logFeatureRequest(requestId, status, description, generatedFiles) {
        this.info(`Feature request ${requestId} ${status}`, {
            component: 'FeatureRequest',
            metadata: { requestId, status, description, generatedFiles }
        });
    }
    logSystemMetrics(cpuUsage, memoryUsage) {
        this.debug('System metrics collected', {
            component: 'SystemMonitoring',
            metadata: { cpuUsage, memoryUsage }
        });
    }
    logDatabaseOperation(operation, table, duration, error) {
        const level = error ? 'error' : 'debug';
        this.log(level, `Database ${operation} on ${table} ${error ? 'failed' : 'completed'} in ${duration}ms`, {
            component: 'Database',
            metadata: { operation, table, duration },
            stack: error?.stack
        });
    }
    // Get recent logs for monitoring dashboard
    async getRecentLogs(limit = 100, level) {
        // In a production system, you might want to read from log files or a database
        // For now, we'll return from memory buffer
        let logs = [...this.logBuffer];
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        return logs
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    // Performance monitoring
    async measureAsync(operation, fn, component, metadata) {
        const start = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.debug(`Starting ${operation}`, { component, requestId, metadata });
        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.info(`Completed ${operation} in ${duration}ms`, {
                component,
                requestId,
                metadata: { ...metadata, duration, success: true }
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            const err = error instanceof Error ? error : new Error(String(error));
            this.error(`Failed ${operation} after ${duration}ms: ${err.message}`, err, {
                component,
                requestId,
                metadata: { ...metadata, duration, success: false }
            });
            throw error;
        }
    }
    measure(operation, fn, component, metadata) {
        const start = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.debug(`Starting ${operation}`, { component, requestId, metadata });
        try {
            const result = fn();
            const duration = Date.now() - start;
            this.info(`Completed ${operation} in ${duration}ms`, {
                component,
                requestId,
                metadata: { ...metadata, duration, success: true }
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            const err = error instanceof Error ? error : new Error(String(error));
            this.error(`Failed ${operation} after ${duration}ms: ${err.message}`, err, {
                component,
                requestId,
                metadata: { ...metadata, duration, success: false }
            });
            throw error;
        }
    }
    // Cleanup
    async shutdown() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        // Flush remaining logs
        await this.flushLogs();
    }
    // Configuration updates
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.LoggingService = LoggingService;
// Express middleware for request logging
const requestLoggingMiddleware = (logger) => {
    return (req, res, next) => {
        const start = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Add request ID to request object for use in other middleware
        req.requestId = requestId;
        // Log request start
        logger.debug(`${req.method} ${req.url} started`, {
            component: 'HTTP',
            requestId,
            metadata: {
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            }
        });
        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const duration = Date.now() - start;
            logger.logRequest(req.method, req.url, res.statusCode, duration, req.userId, // Assuming you have user authentication middleware
            requestId);
            originalEnd.call(this, chunk, encoding);
        };
        next();
    };
};
exports.requestLoggingMiddleware = requestLoggingMiddleware;
//# sourceMappingURL=LoggingService.js.map
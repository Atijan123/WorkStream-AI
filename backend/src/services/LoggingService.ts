import * as fs from 'fs/promises';
import * as path from 'path';

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  component?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface LoggingConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logToConsole: boolean;
  logDirectory: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  includeStack: boolean;
}

export class LoggingService {
  private static instance: LoggingService;
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<LoggingConfig>) {
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

  static getInstance(config?: Partial<LoggingConfig>): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(config);
    }
    return LoggingService.instance;
  }

  private async initializeLogging(): Promise<void> {
    if (this.config.logToFile) {
      try {
        await fs.mkdir(this.config.logDirectory, { recursive: true });
      } catch (error) {
        console.error('Failed to create log directory:', error);
        this.config.logToFile = false;
      }
    }

    // Set up periodic flushing of log buffer
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 5000); // Flush every 5 seconds
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
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

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.logToFile) return;

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
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogFile(currentLogPath: string): Promise<void> {
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
          } else {
            await fs.rename(oldFile, newFile);
          }
        } catch (error) {
          // File doesn't exist, continue
        }
      }
      
      // Move current file to .1
      const rotatedFile = path.join(dir, `${baseName}.1.log`);
      await fs.rename(currentLogPath, rotatedFile);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.logToConsole) return;

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

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    for (const entry of logsToFlush) {
      if (this.config.logToFile) {
        await this.writeToFile(entry);
      }
    }
  }

  log(level: LogEntry['level'], message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
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

  debug(message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void {
    this.log('error', message, {
      ...metadata,
      stack: error?.stack || new Error().stack
    });
  }

  // Structured logging methods
  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string, requestId?: string): void {
    this.info(`${method} ${url} ${statusCode} ${duration}ms`, {
      component: 'HTTP',
      userId,
      requestId,
      metadata: { method, url, statusCode, duration }
    });
  }

  logWorkflowExecution(workflowId: string, status: string, duration: number, message?: string, error?: Error): void {
    const level = status === 'error' ? 'error' : 'info';
    this.log(level, `Workflow ${workflowId} ${status}${message ? `: ${message}` : ''}`, {
      component: 'WorkflowEngine',
      metadata: { workflowId, status, duration },
      stack: error?.stack
    });
  }

  logFeatureRequest(requestId: string, status: string, description: string, generatedFiles?: string[]): void {
    this.info(`Feature request ${requestId} ${status}`, {
      component: 'FeatureRequest',
      metadata: { requestId, status, description, generatedFiles }
    });
  }

  logSystemMetrics(cpuUsage: number, memoryUsage: number): void {
    this.debug('System metrics collected', {
      component: 'SystemMonitoring',
      metadata: { cpuUsage, memoryUsage }
    });
  }

  logDatabaseOperation(operation: string, table: string, duration: number, error?: Error): void {
    const level = error ? 'error' : 'debug';
    this.log(level, `Database ${operation} on ${table} ${error ? 'failed' : 'completed'} in ${duration}ms`, {
      component: 'Database',
      metadata: { operation, table, duration },
      stack: error?.stack
    });
  }

  // Get recent logs for monitoring dashboard
  async getRecentLogs(limit: number = 100, level?: LogEntry['level']): Promise<LogEntry[]> {
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
  async measureAsync<T>(
    operation: string, 
    fn: () => Promise<T>, 
    component?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
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
    } catch (error) {
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

  measure<T>(
    operation: string, 
    fn: () => T, 
    component?: string,
    metadata?: Record<string, any>
  ): T {
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
    } catch (error) {
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
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining logs
    await this.flushLogs();
  }

  // Configuration updates
  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoggingConfig {
    return { ...this.config };
  }
}

// Express middleware for request logging
export const requestLoggingMiddleware = (logger: LoggingService) => {
  return (req: any, res: any, next: any) => {
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
    res.end = function(chunk: any, encoding: any) {
      const duration = Date.now() - start;
      
      logger.logRequest(
        req.method,
        req.url,
        res.statusCode,
        duration,
        req.userId, // Assuming you have user authentication middleware
        requestId
      );
      
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};
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
    maxFileSize: number;
    maxFiles: number;
    includeStack: boolean;
}
export declare class LoggingService {
    private static instance;
    private config;
    private logBuffer;
    private flushInterval;
    private constructor();
    static getInstance(config?: Partial<LoggingConfig>): LoggingService;
    private initializeLogging;
    private shouldLog;
    private formatLogEntry;
    private writeToFile;
    private rotateLogFile;
    private writeToConsole;
    private flushLogs;
    log(level: LogEntry['level'], message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void;
    debug(message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void;
    info(message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void;
    warn(message: string, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void;
    error(message: string, error?: Error, metadata?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>): void;
    logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string, requestId?: string): void;
    logWorkflowExecution(workflowId: string, status: string, duration: number, message?: string, error?: Error): void;
    logFeatureRequest(requestId: string, status: string, description: string, generatedFiles?: string[]): void;
    logSystemMetrics(cpuUsage: number, memoryUsage: number): void;
    logDatabaseOperation(operation: string, table: string, duration: number, error?: Error): void;
    getRecentLogs(limit?: number, level?: LogEntry['level']): Promise<LogEntry[]>;
    measureAsync<T>(operation: string, fn: () => Promise<T>, component?: string, metadata?: Record<string, any>): Promise<T>;
    measure<T>(operation: string, fn: () => T, component?: string, metadata?: Record<string, any>): T;
    shutdown(): Promise<void>;
    updateConfig(newConfig: Partial<LoggingConfig>): void;
    getConfig(): LoggingConfig;
}
export declare const requestLoggingMiddleware: (logger: LoggingService) => (req: any, res: any, next: any) => void;
//# sourceMappingURL=LoggingService.d.ts.map
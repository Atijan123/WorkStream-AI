import { WebSocketService } from './services/WebSocketService';
import { SystemMonitoringService } from './services/SystemMonitoringService';
import { LoggingService } from './services/LoggingService';
import { AlertingService } from './services/AlertingService';
declare const app: import("express-serve-static-core").Express;
declare const httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export { app, httpServer };
declare const logger: LoggingService;
declare const alertingService: AlertingService;
declare const webSocketService: WebSocketService;
declare const systemMonitoringService: SystemMonitoringService;
export { logger, alertingService, webSocketService, systemMonitoringService };
//# sourceMappingURL=index.d.ts.map
import { Server as HttpServer } from 'http';
export interface WebSocketEvents {
    workflowStatusUpdate: {
        workflowId: string;
        status: string;
        message?: string;
    };
    featureRequestUpdate: {
        requestId: string;
        status: string;
        message?: string;
        generatedFiles?: string[];
    };
    systemMetricsUpdate: {
        cpuUsage: number;
        memoryUsage: number;
        timestamp: Date;
    };
    dashboardDataUpdate: {
        type: 'workflows' | 'features' | 'metrics';
        data: any;
    };
}
export declare class WebSocketService {
    private io;
    private static instance;
    constructor(httpServer: HttpServer);
    static getInstance(httpServer?: HttpServer): WebSocketService;
    private setupEventHandlers;
    emitWorkflowStatusUpdate(data: WebSocketEvents['workflowStatusUpdate']): void;
    emitFeatureRequestUpdate(data: WebSocketEvents['featureRequestUpdate']): void;
    emitSystemMetricsUpdate(data: WebSocketEvents['systemMetricsUpdate']): void;
    emitDashboardDataUpdate(data: WebSocketEvents['dashboardDataUpdate']): void;
    getConnectedClientsCount(): Promise<number>;
    broadcast(event: string, data: any): void;
    sendToRoom(room: string, event: string, data: any): void;
}
//# sourceMappingURL=WebSocketService.d.ts.map
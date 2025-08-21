import { Server as SocketIOServer } from 'socket.io';
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

export class WebSocketService {
  private io: SocketIOServer;
  private static instance: WebSocketService;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  static getInstance(httpServer?: HttpServer): WebSocketService {
    if (!WebSocketService.instance && httpServer) {
      WebSocketService.instance = new WebSocketService(httpServer);
    }
    return WebSocketService.instance;
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join-dashboard', () => {
        socket.join('dashboard');
        console.log(`Client ${socket.id} joined dashboard room`);
      });

      socket.on('leave-dashboard', () => {
        socket.leave('dashboard');
        console.log(`Client ${socket.id} left dashboard room`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Emit workflow status updates
  emitWorkflowStatusUpdate(data: WebSocketEvents['workflowStatusUpdate']): void {
    this.io.to('dashboard').emit('workflowStatusUpdate', data);
  }

  // Emit feature request updates
  emitFeatureRequestUpdate(data: WebSocketEvents['featureRequestUpdate']): void {
    this.io.to('dashboard').emit('featureRequestUpdate', data);
  }

  // Emit system metrics updates
  emitSystemMetricsUpdate(data: WebSocketEvents['systemMetricsUpdate']): void {
    this.io.to('dashboard').emit('systemMetricsUpdate', data);
  }

  // Emit general dashboard data updates
  emitDashboardDataUpdate(data: WebSocketEvents['dashboardDataUpdate']): void {
    this.io.to('dashboard').emit('dashboardDataUpdate', data);
  }

  // Get connected clients count
  getConnectedClientsCount(): Promise<number> {
    return new Promise((resolve) => {
      this.io.in('dashboard').allSockets().then((sockets) => {
        resolve(sockets.size);
      });
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Send to specific room
  sendToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }
}
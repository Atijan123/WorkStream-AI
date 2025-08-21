"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
class WebSocketService {
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"]
            }
        });
        this.setupEventHandlers();
    }
    static getInstance(httpServer) {
        if (!WebSocketService.instance && httpServer) {
            WebSocketService.instance = new WebSocketService(httpServer);
        }
        return WebSocketService.instance;
    }
    setupEventHandlers() {
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
    emitWorkflowStatusUpdate(data) {
        this.io.to('dashboard').emit('workflowStatusUpdate', data);
    }
    // Emit feature request updates
    emitFeatureRequestUpdate(data) {
        this.io.to('dashboard').emit('featureRequestUpdate', data);
    }
    // Emit system metrics updates
    emitSystemMetricsUpdate(data) {
        this.io.to('dashboard').emit('systemMetricsUpdate', data);
    }
    // Emit general dashboard data updates
    emitDashboardDataUpdate(data) {
        this.io.to('dashboard').emit('dashboardDataUpdate', data);
    }
    // Get connected clients count
    getConnectedClientsCount() {
        return new Promise((resolve) => {
            this.io.in('dashboard').allSockets().then((sockets) => {
                resolve(sockets.size);
            });
        });
    }
    // Broadcast to all connected clients
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    // Send to specific room
    sendToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=WebSocketService.js.map
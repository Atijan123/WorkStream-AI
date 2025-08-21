import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketEvents {
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

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onWorkflowStatusUpdate?: (data: WebSocketEvents['workflowStatusUpdate']) => void;
  onFeatureRequestUpdate?: (data: WebSocketEvents['featureRequestUpdate']) => void;
  onSystemMetricsUpdate?: (data: WebSocketEvents['systemMetricsUpdate']) => void;
  onDashboardDataUpdate?: (data: WebSocketEvents['dashboardDataUpdate']) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    onWorkflowStatusUpdate,
    onFeatureRequestUpdate,
    onSystemMetricsUpdate,
    onDashboardDataUpdate,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      socketRef.current = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        retries: 3
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        socket.emit('join-dashboard');
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        onError?.(error);
      });

      // Event listeners
      if (onWorkflowStatusUpdate) {
        socket.on('workflowStatusUpdate', onWorkflowStatusUpdate);
      }

      if (onFeatureRequestUpdate) {
        socket.on('featureRequestUpdate', onFeatureRequestUpdate);
      }

      if (onSystemMetricsUpdate) {
        socket.on('systemMetricsUpdate', onSystemMetricsUpdate);
      }

      if (onDashboardDataUpdate) {
        socket.on('dashboardDataUpdate', onDashboardDataUpdate);
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-dashboard');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const reconnect = () => {
    disconnect();
    setTimeout(connect, 1000);
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    reconnect,
    socket: socketRef.current
  };
};
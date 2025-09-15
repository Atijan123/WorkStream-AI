export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'cron' | 'manual' | 'event';
    schedule?: string;
  };
  actions: WorkflowAction[];
  status: 'active' | 'paused' | 'error';
}

export interface WorkflowAction {
  type: 'fetch_data' | 'generate_report' | 'send_email' | 'check_system_metrics' | 'log_result';
  parameters: Record<string, any>;
}

export interface FeatureRequest {
  id: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  generatedComponents?: string[];
}

export interface SystemMetrics {
  id?: number;
  cpu_usage: number;
  memory_usage: number;
  timestamp: Date;
}

export interface GeneratedFeature {
  id: string;
  name: string;
  componentName: string;
  filePath: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
}

export interface DashboardData {
  recentFeatureRequests: FeatureRequest[];
  featureRequestStats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  systemMetrics: {
    latest: SystemMetrics | null;
    averageLast24Hours: { cpu_usage: number; memory_usage: number } | null;
    recentHistory: SystemMetrics[];
  };
  features: GeneratedFeature[];
}

export interface WorkflowStatus {
  workflow: Workflow;
  lastExecution?: {
    status: 'success' | 'error' | 'running';
    timestamp: Date;
    message?: string;
  };
}
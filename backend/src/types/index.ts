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

export interface EvolutionLog {
  id: string;
  type: 'ui_evolution' | 'workflow_creation';
  description: string;
  timestamp: Date;
  changes: string[];
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
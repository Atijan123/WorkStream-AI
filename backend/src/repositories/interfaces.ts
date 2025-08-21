import { Workflow, WorkflowAction, FeatureRequest, SystemMetrics } from '../types';

export interface WorkflowRepository {
  create(workflow: Omit<Workflow, 'id'>): Promise<Workflow>;
  findById(id: string): Promise<Workflow | null>;
  findAll(): Promise<Workflow[]>;
  findByStatus(status: string): Promise<Workflow[]>;
  update(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
  delete(id: string): Promise<boolean>;
}

export interface ExecutionLog {
  id?: number;
  workflow_id: string;
  status: 'success' | 'error' | 'running';
  message: string;
  execution_time: Date;
  duration_ms?: number;
}

export interface ExecutionLogRepository {
  create(log: Omit<ExecutionLog, 'id'>): Promise<ExecutionLog>;
  findByWorkflowId(workflowId: string): Promise<ExecutionLog[]>;
  findByStatus(status: string): Promise<ExecutionLog[]>;
  findRecent(limit?: number): Promise<ExecutionLog[]>;
  getWorkflowHistory(workflowId: string, limit?: number): Promise<ExecutionLog[]>;
}

export interface FeatureRequestRepository {
  create(request: Omit<FeatureRequest, 'id' | 'timestamp'>): Promise<FeatureRequest>;
  findById(id: string): Promise<FeatureRequest | null>;
  findAll(): Promise<FeatureRequest[]>;
  findByStatus(status: FeatureRequest['status']): Promise<FeatureRequest[]>;
  update(id: string, updates: Partial<FeatureRequest>): Promise<FeatureRequest | null>;
  delete(id: string): Promise<boolean>;
  getRecentRequests(limit?: number): Promise<FeatureRequest[]>;
}

export interface SystemMetricsRepository {
  create(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics>;
  findById(id: number): Promise<SystemMetrics | null>;
  findAll(): Promise<SystemMetrics[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<SystemMetrics[]>;
  getLatest(): Promise<SystemMetrics | null>;
  getRecentMetrics(limit?: number): Promise<SystemMetrics[]>;
  getAverageMetrics(hours: number): Promise<{ cpu_usage: number; memory_usage: number } | null>;
  deleteOlderThan(date: Date): Promise<number>;
}
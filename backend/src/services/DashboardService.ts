import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
import { SystemMetricsRepository } from '../repositories/SystemMetricsRepository';
import { FeatureRequest, SystemMetrics } from '../types';

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
}

export class DashboardService {
  private featureRequestRepo: FeatureRequestRepository;
  private systemMetricsRepo: SystemMetricsRepository;

  constructor() {
    this.featureRequestRepo = new FeatureRequestRepository();
    this.systemMetricsRepo = new SystemMetricsRepository();
  }

  async getDashboardData(): Promise<DashboardData> {
    // Get recent feature requests
    const recentFeatureRequests = await this.featureRequestRepo.getRecentRequests(10);

    // Get feature request statistics
    const allRequests = await this.featureRequestRepo.findAll();
    const featureRequestStats = {
      total: allRequests.length,
      pending: allRequests.filter(req => req.status === 'pending').length,
      processing: allRequests.filter(req => req.status === 'processing').length,
      completed: allRequests.filter(req => req.status === 'completed').length,
      failed: allRequests.filter(req => req.status === 'failed').length
    };

    // Get system metrics
    const latestMetrics = await this.systemMetricsRepo.getLatest();
    const averageMetrics = await this.systemMetricsRepo.getAverageMetrics(24);
    const recentMetricsHistory = await this.systemMetricsRepo.getRecentMetrics(20);

    return {
      recentFeatureRequests,
      featureRequestStats,
      systemMetrics: {
        latest: latestMetrics,
        averageLast24Hours: averageMetrics,
        recentHistory: recentMetricsHistory
      }
    };
  }

  async recordSystemMetrics(cpuUsage: number, memoryUsage: number): Promise<SystemMetrics> {
    return await this.systemMetricsRepo.create({
      cpu_usage: cpuUsage,
      memory_usage: memoryUsage
    });
  }

  async submitFeatureRequest(description: string): Promise<FeatureRequest> {
    return await this.featureRequestRepo.create({
      description,
      status: 'pending'
    });
  }

  async updateFeatureRequestStatus(
    id: string, 
    status: FeatureRequest['status'], 
    generatedComponents?: string[]
  ): Promise<FeatureRequest | null> {
    return await this.featureRequestRepo.update(id, {
      status,
      generatedComponents
    });
  }

  async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    return await this.systemMetricsRepo.deleteOlderThan(cutoffDate);
  }
}
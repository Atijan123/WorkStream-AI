import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
import { SystemMetricsRepository } from '../repositories/SystemMetricsRepository';
import { FeatureRequest, SystemMetrics, GeneratedFeature } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

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

    // Get generated features
    const features = await this.getGeneratedFeatures();

    return {
      recentFeatureRequests,
      featureRequestStats,
      systemMetrics: {
        latest: latestMetrics,
        averageLast24Hours: averageMetrics,
        recentHistory: recentMetricsHistory
      },
      features
    };
  }

  private async getGeneratedFeatures(): Promise<GeneratedFeature[]> {
    const features: GeneratedFeature[] = [];
    
    try {
      // Determine the correct path to the generated components
      const projectRoot = process.cwd().includes('backend') 
        ? path.join(process.cwd(), '..') 
        : process.cwd();
      const generatedDir = path.join(projectRoot, 'frontend', 'src', 'components', 'generated');
      
      // Check if directory exists
      try {
        await fs.access(generatedDir);
      } catch {
        console.log('Generated components directory not found:', generatedDir);
        return features;
      }

      const files = await fs.readdir(generatedDir);
      const componentFiles = files.filter(file => 
        file.endsWith('.tsx') && 
        !file.endsWith('.test.tsx') &&
        !file.includes('Widget') // Exclude old widget components
      );

      for (const file of componentFiles) {
        try {
          const filePath = path.join(generatedDir, file);
          const stats = await fs.stat(filePath);
          const componentName = file.replace('.tsx', '');
          
          // Read the file to get description from comments
          const content = await fs.readFile(filePath, 'utf-8');
          const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
          const description = descriptionMatch ? descriptionMatch[1] : `Generated component: ${componentName}`;

          features.push({
            id: componentName.toLowerCase(),
            name: componentName,
            componentName,
            filePath: `./generated/${componentName}`,
            description,
            status: 'active',
            createdAt: stats.birthtime
          });
        } catch (error) {
          console.error(`Error processing component file ${file}:`, error);
          // Add as error status component
          const componentName = file.replace('.tsx', '');
          features.push({
            id: componentName.toLowerCase(),
            name: componentName,
            componentName,
            filePath: `./generated/${componentName}`,
            description: `Error loading component: ${componentName}`,
            status: 'error',
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error scanning generated features:', error);
    }

    return features.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
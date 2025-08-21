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
        averageLast24Hours: {
            cpu_usage: number;
            memory_usage: number;
        } | null;
        recentHistory: SystemMetrics[];
    };
}
export declare class DashboardService {
    private featureRequestRepo;
    private systemMetricsRepo;
    constructor();
    getDashboardData(): Promise<DashboardData>;
    recordSystemMetrics(cpuUsage: number, memoryUsage: number): Promise<SystemMetrics>;
    submitFeatureRequest(description: string): Promise<FeatureRequest>;
    updateFeatureRequestStatus(id: string, status: FeatureRequest['status'], generatedComponents?: string[]): Promise<FeatureRequest | null>;
    cleanupOldMetrics(daysToKeep?: number): Promise<number>;
}
//# sourceMappingURL=DashboardService.d.ts.map
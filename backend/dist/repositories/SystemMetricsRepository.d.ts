import { SystemMetrics } from '../types';
import { SystemMetricsRepository as ISystemMetricsRepository } from './interfaces';
export declare class SystemMetricsRepository implements ISystemMetricsRepository {
    private db;
    constructor();
    create(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics>;
    findById(id: number): Promise<SystemMetrics | null>;
    findAll(): Promise<SystemMetrics[]>;
    findByTimeRange(startTime: Date, endTime: Date): Promise<SystemMetrics[]>;
    getLatest(): Promise<SystemMetrics | null>;
    getRecentMetrics(limit?: number): Promise<SystemMetrics[]>;
    getAverageMetrics(hours: number): Promise<{
        cpu_usage: number;
        memory_usage: number;
    } | null>;
    deleteOlderThan(date: Date): Promise<number>;
    private mapRowToSystemMetrics;
}
//# sourceMappingURL=SystemMetricsRepository.d.ts.map
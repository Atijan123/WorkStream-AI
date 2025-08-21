"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const FeatureRequestRepository_1 = require("../repositories/FeatureRequestRepository");
const SystemMetricsRepository_1 = require("../repositories/SystemMetricsRepository");
class DashboardService {
    constructor() {
        this.featureRequestRepo = new FeatureRequestRepository_1.FeatureRequestRepository();
        this.systemMetricsRepo = new SystemMetricsRepository_1.SystemMetricsRepository();
    }
    async getDashboardData() {
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
    async recordSystemMetrics(cpuUsage, memoryUsage) {
        return await this.systemMetricsRepo.create({
            cpu_usage: cpuUsage,
            memory_usage: memoryUsage
        });
    }
    async submitFeatureRequest(description) {
        return await this.featureRequestRepo.create({
            description,
            status: 'pending'
        });
    }
    async updateFeatureRequestStatus(id, status, generatedComponents) {
        return await this.featureRequestRepo.update(id, {
            status,
            generatedComponents
        });
    }
    async cleanupOldMetrics(daysToKeep = 30) {
        const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
        return await this.systemMetricsRepo.deleteOlderThan(cutoffDate);
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=DashboardService.js.map
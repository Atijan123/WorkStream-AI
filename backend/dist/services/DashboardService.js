"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const FeatureRequestRepository_1 = require("../repositories/FeatureRequestRepository");
const SystemMetricsRepository_1 = require("../repositories/SystemMetricsRepository");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
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
    async getGeneratedFeatures() {
        const features = [];
        try {
            // Determine the correct path to the generated components
            const projectRoot = process.cwd().includes('backend')
                ? path.join(process.cwd(), '..')
                : process.cwd();
            const generatedDir = path.join(projectRoot, 'frontend', 'src', 'components', 'generated');
            // Check if directory exists
            try {
                await fs.access(generatedDir);
            }
            catch {
                console.log('Generated components directory not found:', generatedDir);
                return features;
            }
            const files = await fs.readdir(generatedDir);
            const componentFiles = files.filter(file => file.endsWith('.tsx') &&
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
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error scanning generated features:', error);
        }
        return features.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
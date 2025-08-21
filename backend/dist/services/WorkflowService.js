"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const repositories_1 = require("../repositories");
class WorkflowService {
    constructor() {
        this.workflowRepo = new repositories_1.WorkflowRepository();
        this.executionLogRepo = new repositories_1.ExecutionLogRepository();
    }
    async createWorkflow(workflowData) {
        return this.workflowRepo.create(workflowData);
    }
    async getWorkflow(id) {
        return this.workflowRepo.findById(id);
    }
    async getAllWorkflows() {
        return this.workflowRepo.findAll();
    }
    async getActiveWorkflows() {
        return this.workflowRepo.findByStatus('active');
    }
    async updateWorkflow(id, updates) {
        return this.workflowRepo.update(id, updates);
    }
    async deleteWorkflow(id) {
        return this.workflowRepo.delete(id);
    }
    async getWorkflowStatus(id) {
        const workflow = await this.workflowRepo.findById(id);
        if (!workflow) {
            return null;
        }
        const executionLogs = await this.executionLogRepo.findByWorkflowId(id);
        const lastExecution = executionLogs.length > 0 ? executionLogs[0] : undefined;
        const executionCount = executionLogs.length;
        const successCount = executionLogs.filter(log => log.status === 'success').length;
        const successRate = executionCount > 0 ? (successCount / executionCount) * 100 : 0;
        return {
            workflow,
            lastExecution,
            executionCount,
            successRate
        };
    }
    async getAllWorkflowStatuses() {
        const workflows = await this.workflowRepo.findAll();
        const statuses = await Promise.all(workflows.map(workflow => this.getWorkflowStatus(workflow.id)));
        return statuses.filter((status) => status !== null);
    }
    async getWorkflowHistory(id, limit) {
        return this.executionLogRepo.getWorkflowHistory(id, limit);
    }
    async logWorkflowExecution(log) {
        return this.executionLogRepo.create(log);
    }
    async getRecentExecutions(limit) {
        return this.executionLogRepo.findRecent(limit);
    }
    async getFailedExecutions() {
        return this.executionLogRepo.findByStatus('error');
    }
    async getRunningExecutions() {
        return this.executionLogRepo.findByStatus('running');
    }
    async pauseWorkflow(id) {
        return this.workflowRepo.update(id, { status: 'paused' });
    }
    async resumeWorkflow(id) {
        return this.workflowRepo.update(id, { status: 'active' });
    }
    async markWorkflowAsError(id) {
        return this.workflowRepo.update(id, { status: 'error' });
    }
}
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=WorkflowService.js.map
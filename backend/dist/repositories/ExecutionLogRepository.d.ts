import { ExecutionLog, ExecutionLogRepository as IExecutionLogRepository } from './interfaces';
export declare class ExecutionLogRepository implements IExecutionLogRepository {
    private db;
    constructor();
    create(log: Omit<ExecutionLog, 'id'>): Promise<ExecutionLog>;
    findByWorkflowId(workflowId: string): Promise<ExecutionLog[]>;
    findByStatus(status: string): Promise<ExecutionLog[]>;
    findRecent(limit?: number): Promise<ExecutionLog[]>;
    getWorkflowHistory(workflowId: string, limit?: number): Promise<ExecutionLog[]>;
    private mapRowToExecutionLog;
}
//# sourceMappingURL=ExecutionLogRepository.d.ts.map
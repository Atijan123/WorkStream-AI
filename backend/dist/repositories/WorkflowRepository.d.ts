import { Workflow } from '../types';
import { WorkflowRepository as IWorkflowRepository } from './interfaces';
export declare class WorkflowRepository implements IWorkflowRepository {
    private db;
    constructor();
    create(workflow: Omit<Workflow, 'id'>): Promise<Workflow>;
    findById(id: string): Promise<Workflow | null>;
    findAll(): Promise<Workflow[]>;
    findByStatus(status: string): Promise<Workflow[]>;
    update(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    delete(id: string): Promise<boolean>;
    private mapRowToWorkflow;
}
//# sourceMappingURL=WorkflowRepository.d.ts.map
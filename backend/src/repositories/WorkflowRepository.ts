import { v4 as uuidv4 } from 'uuid';
import { Workflow } from '../types';
import { WorkflowRepository as IWorkflowRepository } from './interfaces';
import { DatabaseConnection } from '../database/connection';

interface WorkflowRow {
  id: string;
  name: string;
  description: string;
  spec: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class WorkflowRepository implements IWorkflowRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async create(workflow: Omit<Workflow, 'id'>): Promise<Workflow> {
    const id = uuidv4();
    const spec = JSON.stringify({
      trigger: workflow.trigger,
      actions: workflow.actions
    });

    const sql = `
      INSERT INTO workflows (id, name, description, spec, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      workflow.name,
      workflow.description,
      spec,
      workflow.status
    ]);

    const created = await this.findById(id);
    if (!created) {
      throw new Error('Failed to create workflow');
    }

    return created;
  }

  async findById(id: string): Promise<Workflow | null> {
    const sql = 'SELECT * FROM workflows WHERE id = ?';
    const row = await this.db.get<WorkflowRow>(sql, [id]);

    if (!row) {
      return null;
    }

    return this.mapRowToWorkflow(row);
  }

  async findAll(): Promise<Workflow[]> {
    const sql = 'SELECT * FROM workflows ORDER BY created_at DESC';
    const rows = await this.db.all<WorkflowRow>(sql);

    return rows.map(row => this.mapRowToWorkflow(row));
  }

  async findByStatus(status: string): Promise<Workflow[]> {
    const sql = 'SELECT * FROM workflows WHERE status = ? ORDER BY created_at DESC';
    const rows = await this.db.all<WorkflowRow>(sql, [status]);

    return rows.map(row => this.mapRowToWorkflow(row));
  }

  async update(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }

    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }

    if (updates.trigger !== undefined || updates.actions !== undefined) {
      const spec = JSON.stringify({
        trigger: updates.trigger || existing.trigger,
        actions: updates.actions || existing.actions
      });
      updateFields.push('spec = ?');
      updateValues.push(spec);
    }

    if (updateFields.length === 0) {
      return existing;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const sql = `UPDATE workflows SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.db.run(sql, updateValues);

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM workflows WHERE id = ?';
    const result = await this.db.run(sql, [id]);

    return result.changes > 0;
  }

  private mapRowToWorkflow(row: WorkflowRow): Workflow {
    const spec = JSON.parse(row.spec);
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: spec.trigger,
      actions: spec.actions,
      status: row.status as 'active' | 'paused' | 'error'
    };
  }
}
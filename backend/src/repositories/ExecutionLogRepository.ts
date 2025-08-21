import { ExecutionLog, ExecutionLogRepository as IExecutionLogRepository } from './interfaces';
import { DatabaseConnection } from '../database/connection';

interface ExecutionLogRow {
  id: number;
  workflow_id: string;
  status: string;
  message: string;
  execution_time: string;
  duration_ms: number | null;
}

export class ExecutionLogRepository implements IExecutionLogRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async create(log: Omit<ExecutionLog, 'id'>): Promise<ExecutionLog> {
    const sql = `
      INSERT INTO execution_logs (workflow_id, status, message, execution_time, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await this.db.run(sql, [
      log.workflow_id,
      log.status,
      log.message,
      log.execution_time.toISOString(),
      log.duration_ms || null
    ]);

    const created = await this.db.get<ExecutionLogRow>(
      'SELECT * FROM execution_logs WHERE id = ?',
      [result.lastID]
    );

    if (!created) {
      throw new Error('Failed to create execution log');
    }

    return this.mapRowToExecutionLog(created);
  }

  async findByWorkflowId(workflowId: string): Promise<ExecutionLog[]> {
    const sql = `
      SELECT * FROM execution_logs 
      WHERE workflow_id = ? 
      ORDER BY execution_time DESC
    `;
    
    const rows = await this.db.all<ExecutionLogRow>(sql, [workflowId]);
    return rows.map(row => this.mapRowToExecutionLog(row));
  }

  async findByStatus(status: string): Promise<ExecutionLog[]> {
    const sql = `
      SELECT * FROM execution_logs 
      WHERE status = ? 
      ORDER BY execution_time DESC
    `;
    
    const rows = await this.db.all<ExecutionLogRow>(sql, [status]);
    return rows.map(row => this.mapRowToExecutionLog(row));
  }

  async findRecent(limit: number = 50): Promise<ExecutionLog[]> {
    const sql = `
      SELECT * FROM execution_logs 
      ORDER BY execution_time DESC 
      LIMIT ?
    `;
    
    const rows = await this.db.all<ExecutionLogRow>(sql, [limit]);
    return rows.map(row => this.mapRowToExecutionLog(row));
  }

  async getWorkflowHistory(workflowId: string, limit: number = 100): Promise<ExecutionLog[]> {
    const sql = `
      SELECT * FROM execution_logs 
      WHERE workflow_id = ? 
      ORDER BY execution_time DESC 
      LIMIT ?
    `;
    
    const rows = await this.db.all<ExecutionLogRow>(sql, [workflowId, limit]);
    return rows.map(row => this.mapRowToExecutionLog(row));
  }

  private mapRowToExecutionLog(row: ExecutionLogRow): ExecutionLog {
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      status: row.status as 'success' | 'error' | 'running',
      message: row.message,
      execution_time: new Date(row.execution_time),
      duration_ms: row.duration_ms || undefined
    };
  }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionLogRepository = void 0;
const connection_1 = require("../database/connection");
class ExecutionLogRepository {
    constructor() {
        this.db = connection_1.DatabaseConnection.getInstance();
    }
    async create(log) {
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
        const created = await this.db.get('SELECT * FROM execution_logs WHERE id = ?', [result.lastID]);
        if (!created) {
            throw new Error('Failed to create execution log');
        }
        return this.mapRowToExecutionLog(created);
    }
    async findByWorkflowId(workflowId) {
        const sql = `
      SELECT * FROM execution_logs 
      WHERE workflow_id = ? 
      ORDER BY execution_time DESC
    `;
        const rows = await this.db.all(sql, [workflowId]);
        return rows.map(row => this.mapRowToExecutionLog(row));
    }
    async findByStatus(status) {
        const sql = `
      SELECT * FROM execution_logs 
      WHERE status = ? 
      ORDER BY execution_time DESC
    `;
        const rows = await this.db.all(sql, [status]);
        return rows.map(row => this.mapRowToExecutionLog(row));
    }
    async findRecent(limit = 50) {
        const sql = `
      SELECT * FROM execution_logs 
      ORDER BY execution_time DESC 
      LIMIT ?
    `;
        const rows = await this.db.all(sql, [limit]);
        return rows.map(row => this.mapRowToExecutionLog(row));
    }
    async getWorkflowHistory(workflowId, limit = 100) {
        const sql = `
      SELECT * FROM execution_logs 
      WHERE workflow_id = ? 
      ORDER BY execution_time DESC 
      LIMIT ?
    `;
        const rows = await this.db.all(sql, [workflowId, limit]);
        return rows.map(row => this.mapRowToExecutionLog(row));
    }
    mapRowToExecutionLog(row) {
        return {
            id: row.id,
            workflow_id: row.workflow_id,
            status: row.status,
            message: row.message,
            execution_time: new Date(row.execution_time),
            duration_ms: row.duration_ms || undefined
        };
    }
}
exports.ExecutionLogRepository = ExecutionLogRepository;
//# sourceMappingURL=ExecutionLogRepository.js.map
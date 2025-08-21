"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMetricsRepository = void 0;
const connection_1 = require("../database/connection");
class SystemMetricsRepository {
    constructor() {
        this.db = connection_1.DatabaseConnection.getInstance();
    }
    async create(metrics) {
        const sql = `
      INSERT INTO system_metrics (cpu_usage, memory_usage)
      VALUES (?, ?)
    `;
        const result = await this.db.run(sql, [
            metrics.cpu_usage,
            metrics.memory_usage
        ]);
        const created = await this.findById(result.lastID);
        if (!created) {
            throw new Error('Failed to create system metrics');
        }
        return created;
    }
    async findById(id) {
        const sql = 'SELECT * FROM system_metrics WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row) {
            return null;
        }
        return this.mapRowToSystemMetrics(row);
    }
    async findAll() {
        const sql = 'SELECT * FROM system_metrics ORDER BY timestamp DESC';
        const rows = await this.db.all(sql);
        return rows.map(row => this.mapRowToSystemMetrics(row));
    }
    async findByTimeRange(startTime, endTime) {
        const sql = `
      SELECT * FROM system_metrics 
      WHERE timestamp BETWEEN ? AND ? 
      ORDER BY timestamp ASC
    `;
        const rows = await this.db.all(sql, [
            startTime.toISOString(),
            endTime.toISOString()
        ]);
        return rows.map(row => this.mapRowToSystemMetrics(row));
    }
    async getLatest() {
        const sql = 'SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT 1';
        const row = await this.db.get(sql);
        if (!row) {
            return null;
        }
        return this.mapRowToSystemMetrics(row);
    }
    async getRecentMetrics(limit = 10) {
        const sql = 'SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT ?';
        const rows = await this.db.all(sql, [limit]);
        return rows.map(row => this.mapRowToSystemMetrics(row));
    }
    async getAverageMetrics(hours) {
        const sql = `
      SELECT 
        AVG(cpu_usage) as avg_cpu,
        AVG(memory_usage) as avg_memory
      FROM system_metrics 
      WHERE timestamp >= datetime('now', '-${hours} hours')
    `;
        const result = await this.db.get(sql);
        if (!result || result.avg_cpu === null || result.avg_memory === null) {
            return null;
        }
        return {
            cpu_usage: Math.round(result.avg_cpu * 100) / 100, // Round to 2 decimal places
            memory_usage: Math.round(result.avg_memory * 100) / 100
        };
    }
    async deleteOlderThan(date) {
        const sql = 'DELETE FROM system_metrics WHERE timestamp < ?';
        const result = await this.db.run(sql, [date.toISOString()]);
        return result.changes;
    }
    mapRowToSystemMetrics(row) {
        return {
            id: row.id,
            cpu_usage: row.cpu_usage,
            memory_usage: row.memory_usage,
            timestamp: new Date(row.timestamp)
        };
    }
}
exports.SystemMetricsRepository = SystemMetricsRepository;
//# sourceMappingURL=SystemMetricsRepository.js.map
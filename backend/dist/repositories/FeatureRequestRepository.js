"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureRequestRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class FeatureRequestRepository {
    constructor() {
        this.db = connection_1.DatabaseConnection.getInstance();
    }
    async create(request) {
        const id = (0, uuid_1.v4)();
        const generatedFiles = request.generatedComponents ? JSON.stringify(request.generatedComponents) : null;
        const sql = `
      INSERT INTO feature_requests (id, description, status, generated_files)
      VALUES (?, ?, ?, ?)
    `;
        await this.db.run(sql, [
            id,
            request.description,
            request.status,
            generatedFiles
        ]);
        const created = await this.findById(id);
        if (!created) {
            throw new Error('Failed to create feature request');
        }
        return created;
    }
    async findById(id) {
        const sql = 'SELECT * FROM feature_requests WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row) {
            return null;
        }
        return this.mapRowToFeatureRequest(row);
    }
    async findAll() {
        const sql = 'SELECT * FROM feature_requests ORDER BY created_at DESC';
        const rows = await this.db.all(sql);
        return rows.map(row => this.mapRowToFeatureRequest(row));
    }
    async findByStatus(status) {
        const sql = 'SELECT * FROM feature_requests WHERE status = ? ORDER BY created_at DESC';
        const rows = await this.db.all(sql, [status]);
        return rows.map(row => this.mapRowToFeatureRequest(row));
    }
    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }
        const updateFields = [];
        const updateValues = [];
        if (updates.description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(updates.description);
        }
        if (updates.status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(updates.status);
            // Set completed_at when status changes to completed
            if (updates.status === 'completed') {
                updateFields.push('completed_at = CURRENT_TIMESTAMP');
            }
        }
        if (updates.generatedComponents !== undefined) {
            updateFields.push('generated_files = ?');
            updateValues.push(updates.generatedComponents ? JSON.stringify(updates.generatedComponents) : null);
        }
        if (updateFields.length === 0) {
            return existing;
        }
        updateValues.push(id);
        const sql = `UPDATE feature_requests SET ${updateFields.join(', ')} WHERE id = ?`;
        await this.db.run(sql, updateValues);
        return this.findById(id);
    }
    async delete(id) {
        const sql = 'DELETE FROM feature_requests WHERE id = ?';
        const result = await this.db.run(sql, [id]);
        return result.changes > 0;
    }
    async getRecentRequests(limit = 10) {
        const sql = 'SELECT * FROM feature_requests ORDER BY created_at DESC LIMIT ?';
        const rows = await this.db.all(sql, [limit]);
        return rows.map(row => this.mapRowToFeatureRequest(row));
    }
    mapRowToFeatureRequest(row) {
        return {
            id: row.id,
            description: row.description,
            status: row.status,
            timestamp: new Date(row.created_at),
            generatedComponents: row.generated_files ? JSON.parse(row.generated_files) : undefined
        };
    }
}
exports.FeatureRequestRepository = FeatureRequestRepository;
//# sourceMappingURL=FeatureRequestRepository.js.map
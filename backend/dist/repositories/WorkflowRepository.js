"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class WorkflowRepository {
    constructor() {
        this.db = connection_1.DatabaseConnection.getInstance();
    }
    async create(workflow) {
        const id = (0, uuid_1.v4)();
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
    async findById(id) {
        const sql = 'SELECT * FROM workflows WHERE id = ?';
        const row = await this.db.get(sql, [id]);
        if (!row) {
            return null;
        }
        return this.mapRowToWorkflow(row);
    }
    async findAll() {
        const sql = 'SELECT * FROM workflows ORDER BY created_at DESC';
        const rows = await this.db.all(sql);
        return rows.map(row => this.mapRowToWorkflow(row));
    }
    async findByStatus(status) {
        const sql = 'SELECT * FROM workflows WHERE status = ? ORDER BY created_at DESC';
        const rows = await this.db.all(sql, [status]);
        return rows.map(row => this.mapRowToWorkflow(row));
    }
    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }
        const updateFields = [];
        const updateValues = [];
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
    async delete(id) {
        const sql = 'DELETE FROM workflows WHERE id = ?';
        const result = await this.db.run(sql, [id]);
        return result.changes > 0;
    }
    mapRowToWorkflow(row) {
        const spec = JSON.parse(row.spec);
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            trigger: spec.trigger,
            actions: spec.actions,
            status: row.status
        };
    }
}
exports.WorkflowRepository = WorkflowRepository;
//# sourceMappingURL=WorkflowRepository.js.map
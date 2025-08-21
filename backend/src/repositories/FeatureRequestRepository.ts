import { v4 as uuidv4 } from 'uuid';
import { FeatureRequest } from '../types';
import { FeatureRequestRepository as IFeatureRequestRepository } from './interfaces';
import { DatabaseConnection } from '../database/connection';

interface FeatureRequestRow {
  id: string;
  description: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  generated_files: string | null;
}

export class FeatureRequestRepository implements IFeatureRequestRepository {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async create(request: Omit<FeatureRequest, 'id' | 'timestamp'>): Promise<FeatureRequest> {
    const id = uuidv4();
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

  async findById(id: string): Promise<FeatureRequest | null> {
    const sql = 'SELECT * FROM feature_requests WHERE id = ?';
    const row = await this.db.get<FeatureRequestRow>(sql, [id]);

    if (!row) {
      return null;
    }

    return this.mapRowToFeatureRequest(row);
  }

  async findAll(): Promise<FeatureRequest[]> {
    const sql = 'SELECT * FROM feature_requests ORDER BY created_at DESC';
    const rows = await this.db.all<FeatureRequestRow>(sql);

    return rows.map(row => this.mapRowToFeatureRequest(row));
  }

  async findByStatus(status: FeatureRequest['status']): Promise<FeatureRequest[]> {
    const sql = 'SELECT * FROM feature_requests WHERE status = ? ORDER BY created_at DESC';
    const rows = await this.db.all<FeatureRequestRow>(sql, [status]);

    return rows.map(row => this.mapRowToFeatureRequest(row));
  }

  async update(id: string, updates: Partial<FeatureRequest>): Promise<FeatureRequest | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

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

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM feature_requests WHERE id = ?';
    const result = await this.db.run(sql, [id]);

    return result.changes > 0;
  }

  async getRecentRequests(limit: number = 10): Promise<FeatureRequest[]> {
    const sql = 'SELECT * FROM feature_requests ORDER BY created_at DESC LIMIT ?';
    const rows = await this.db.all<FeatureRequestRow>(sql, [limit]);

    return rows.map(row => this.mapRowToFeatureRequest(row));
  }

  private mapRowToFeatureRequest(row: FeatureRequestRow): FeatureRequest {
    return {
      id: row.id,
      description: row.description,
      status: row.status as FeatureRequest['status'],
      timestamp: new Date(row.created_at),
      generatedComponents: row.generated_files ? JSON.parse(row.generated_files) : undefined
    };
  }
}
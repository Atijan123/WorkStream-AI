import { FeatureRequest } from '../types';
import { FeatureRequestRepository as IFeatureRequestRepository } from './interfaces';
export declare class FeatureRequestRepository implements IFeatureRequestRepository {
    private db;
    constructor();
    create(request: Omit<FeatureRequest, 'id' | 'timestamp'>): Promise<FeatureRequest>;
    findById(id: string): Promise<FeatureRequest | null>;
    findAll(): Promise<FeatureRequest[]>;
    findByStatus(status: FeatureRequest['status']): Promise<FeatureRequest[]>;
    update(id: string, updates: Partial<FeatureRequest>): Promise<FeatureRequest | null>;
    delete(id: string): Promise<boolean>;
    getRecentRequests(limit?: number): Promise<FeatureRequest[]>;
    private mapRowToFeatureRequest;
}
//# sourceMappingURL=FeatureRequestRepository.d.ts.map
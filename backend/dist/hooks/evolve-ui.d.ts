import { BaseHook, HookContext, HookResult } from './base';
import { SpecManager } from '../services/SpecManager';
import { ComponentGenerator } from '../services/ComponentGenerator';
import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
/**
 * Hook that processes natural language UI feature requests
 * and generates React components dynamically
 */
export declare class EvolveUIHook extends BaseHook {
    private specManager;
    private componentGenerator;
    private featureRequestRepo;
    private fastMode;
    name: string;
    description: string;
    constructor(specManager: SpecManager, componentGenerator: ComponentGenerator, featureRequestRepo: FeatureRequestRepository, fastMode?: boolean);
    private getWebSocketService;
    execute(context: HookContext): Promise<HookResult>;
    private parseFeatureRequest;
    private generateComponentName;
    private extractProps;
    private extractStyling;
}
//# sourceMappingURL=evolve-ui.d.ts.map
import { BaseHook, HookContext, HookResult } from './index';
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
    name: string;
    description: string;
    constructor(specManager: SpecManager, componentGenerator: ComponentGenerator, featureRequestRepo: FeatureRequestRepository);
    private getWebSocketService;
    execute(context: HookContext): Promise<HookResult>;
    private parseFeatureRequest;
    private extractProps;
    private extractStyling;
}
//# sourceMappingURL=evolve-ui.d.ts.map
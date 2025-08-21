interface AppSpec {
    app_name: string;
    description: string;
    tech_stack: {
        frontend: string;
        backend: string;
        database: string;
        styles: string;
    };
    features: Record<string, string>;
    workflows: Array<{
        id: string;
        name: string;
        description: string;
        trigger: {
            type: string;
            schedule?: string;
        };
        actions: Array<{
            type: string;
            [key: string]: any;
        }>;
    }>;
}
interface ParsedFeatureRequest {
    name: string;
    componentType: string;
    description: string;
    props: Record<string, any>;
    styling: Record<string, string>;
}
/**
 * Manages the application specification file
 */
export declare class SpecManager {
    private specPath;
    constructor();
    loadSpec(): Promise<AppSpec>;
    saveSpec(spec: AppSpec): Promise<void>;
    addFeature(featureRequest: ParsedFeatureRequest): Promise<string[]>;
    private generateFeatureDescription;
    addWorkflow(workflowSpec: any): Promise<string[]>;
}
export {};
//# sourceMappingURL=SpecManager.d.ts.map
/**
 * Kiro Hook System
 * Handles natural language processing for UI evolution and workflow automation
 */
export interface HookContext {
    request: string;
    userId?: string;
    timestamp: Date;
}
export interface HookResult {
    success: boolean;
    message: string;
    changes?: string[];
    generatedFiles?: string[];
}
export declare abstract class BaseHook {
    abstract name: string;
    abstract description: string;
    abstract execute(context: HookContext): Promise<HookResult>;
}
export * from './evolve-ui';
export * from './automate-workflow';
//# sourceMappingURL=index.d.ts.map
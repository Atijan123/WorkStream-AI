/**
 * Base Hook Interface and Types
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
//# sourceMappingURL=base.d.ts.map
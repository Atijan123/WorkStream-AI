"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookRegistry = void 0;
const evolve_ui_1 = require("../hooks/evolve-ui");
const automate_workflow_1 = require("../hooks/automate-workflow");
const SpecManager_1 = require("./SpecManager");
const ComponentGenerator_1 = require("./ComponentGenerator");
/**
 * Registry for managing and executing Kiro hooks
 */
class HookRegistry {
    constructor(featureRequestRepo, workflowService, scheduler) {
        this.featureRequestRepo = featureRequestRepo;
        this.workflowService = workflowService;
        this.scheduler = scheduler;
        this.hooks = new Map();
        this.registerDefaultHooks();
    }
    registerDefaultHooks() {
        const specManager = new SpecManager_1.SpecManager();
        const componentGenerator = new ComponentGenerator_1.ComponentGenerator();
        const evolveUIHook = new evolve_ui_1.EvolveUIHook(specManager, componentGenerator, this.featureRequestRepo);
        this.registerHook(evolveUIHook);
        // Register AutomateWorkflow hook if dependencies are available
        if (this.workflowService) {
            const automateWorkflowHook = new automate_workflow_1.AutomateWorkflowHook(this.workflowService, this.scheduler);
            this.registerHook(automateWorkflowHook);
        }
    }
    registerHook(hook) {
        this.hooks.set(hook.name, hook);
    }
    getHook(name) {
        return this.hooks.get(name);
    }
    listHooks() {
        return Array.from(this.hooks.values()).map(hook => ({
            name: hook.name,
            description: hook.description
        }));
    }
    async executeHook(hookName, context) {
        const hook = this.getHook(hookName);
        if (!hook) {
            return {
                success: false,
                message: `Hook '${hookName}' not found`
            };
        }
        try {
            return await hook.execute(context);
        }
        catch (error) {
            console.error(`Hook execution failed for '${hookName}':`, error);
            return {
                success: false,
                message: `Hook execution failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
}
exports.HookRegistry = HookRegistry;
//# sourceMappingURL=HookRegistry.js.map
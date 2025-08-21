"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const HookRegistry_1 = require("../services/HookRegistry");
const FeatureRequestRepository_1 = require("../repositories/FeatureRequestRepository");
const WorkflowService_1 = require("../services/WorkflowService");
const WorkflowScheduler_1 = require("../scheduler/WorkflowScheduler");
const router = (0, express_1.Router)();
// Initialize hook registry
let hookRegistry;
const initializeHookRegistry = async () => {
    if (!hookRegistry) {
        const featureRequestRepo = new FeatureRequestRepository_1.FeatureRequestRepository();
        const workflowService = new WorkflowService_1.WorkflowService();
        const scheduler = new WorkflowScheduler_1.WorkflowScheduler();
        hookRegistry = new HookRegistry_1.HookRegistry(featureRequestRepo, workflowService, scheduler);
    }
    return hookRegistry;
};
/**
 * GET /api/hooks
 * List all available hooks
 */
router.get('/', async (req, res) => {
    try {
        const registry = await initializeHookRegistry();
        const hooks = registry.listHooks();
        res.json({ hooks });
    }
    catch (error) {
        console.error('Error listing hooks:', error);
        res.status(500).json({ error: 'Failed to list hooks' });
    }
});
/**
 * POST /api/hooks/:hookName/execute
 * Execute a specific hook
 */
router.post('/:hookName/execute', async (req, res) => {
    try {
        const { hookName } = req.params;
        const { request, userId } = req.body;
        if (!request) {
            return res.status(400).json({ error: 'Request content is required' });
        }
        const registry = await initializeHookRegistry();
        const result = await registry.executeHook(hookName, {
            request,
            userId,
            timestamp: new Date()
        });
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error executing hook:', error);
        res.status(500).json({ error: 'Failed to execute hook' });
    }
});
/**
 * POST /api/hooks/evolve-ui
 * Convenience endpoint for UI evolution requests
 */
router.post('/evolve-ui', async (req, res) => {
    try {
        const { request, userId } = req.body;
        if (!request) {
            return res.status(400).json({ error: 'Feature request is required' });
        }
        const registry = await initializeHookRegistry();
        const result = await registry.executeHook('evolve_ui', {
            request,
            userId,
            timestamp: new Date()
        });
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error processing UI evolution request:', error);
        res.status(500).json({ error: 'Failed to process UI evolution request' });
    }
});
/**
 * POST /api/hooks/automate-workflow
 * Convenience endpoint for workflow automation requests
 */
router.post('/automate-workflow', async (req, res) => {
    try {
        const { request, userId } = req.body;
        if (!request) {
            return res.status(400).json({ error: 'Workflow description is required' });
        }
        const registry = await initializeHookRegistry();
        const result = await registry.executeHook('automate_workflow', {
            request,
            userId,
            timestamp: new Date()
        });
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error processing workflow automation request:', error);
        res.status(500).json({ error: 'Failed to process workflow automation request' });
    }
});
exports.default = router;
//# sourceMappingURL=hooks.js.map
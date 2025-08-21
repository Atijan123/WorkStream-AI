import { Router, Request, Response } from 'express';
import { HookRegistry } from '../services/HookRegistry';
import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
import { WorkflowService } from '../services/WorkflowService';
import { WorkflowScheduler } from '../scheduler/WorkflowScheduler';

const router = Router();

// Initialize hook registry
let hookRegistry: HookRegistry;

const initializeHookRegistry = async () => {
  if (!hookRegistry) {
    const featureRequestRepo = new FeatureRequestRepository();
    const workflowService = new WorkflowService();
    const scheduler = new WorkflowScheduler();
    
    hookRegistry = new HookRegistry(
      featureRequestRepo,
      workflowService,
      scheduler
    );
  }
  return hookRegistry;
};

/**
 * GET /api/hooks
 * List all available hooks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const registry = await initializeHookRegistry();
    const hooks = registry.listHooks();
    res.json({ hooks });
  } catch (error) {
    console.error('Error listing hooks:', error);
    res.status(500).json({ error: 'Failed to list hooks' });
  }
});

/**
 * POST /api/hooks/:hookName/execute
 * Execute a specific hook
 */
router.post('/:hookName/execute', async (req: Request, res: Response) => {
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
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error executing hook:', error);
    res.status(500).json({ error: 'Failed to execute hook' });
  }
});

/**
 * POST /api/hooks/evolve-ui
 * Convenience endpoint for UI evolution requests
 */
router.post('/evolve-ui', async (req: Request, res: Response) => {
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
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing UI evolution request:', error);
    res.status(500).json({ error: 'Failed to process UI evolution request' });
  }
});

/**
 * POST /api/hooks/automate-workflow
 * Convenience endpoint for workflow automation requests
 */
router.post('/automate-workflow', async (req: Request, res: Response) => {
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
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error processing workflow automation request:', error);
    res.status(500).json({ error: 'Failed to process workflow automation request' });
  }
});

export default router;
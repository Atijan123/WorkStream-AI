import { Router, Request, Response } from 'express';
import { WorkflowService } from '../services/WorkflowService';
import { Workflow } from '../types';

const router = Router();
const workflowService = new WorkflowService();

// GET /api/workflows - List all workflows
router.get('/', async (req: Request, res: Response) => {
  try {
    const workflows = await workflowService.getAllWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflows',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/workflows - Create a new workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const workflowData: Omit<Workflow, 'id'> = req.body;
    
    // Validate required fields
    if (!workflowData.name || !workflowData.description || !workflowData.trigger || !workflowData.actions) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'description', 'trigger', 'actions']
      });
    }

    // Validate trigger type
    if (!['cron', 'manual', 'event'].includes(workflowData.trigger.type)) {
      return res.status(400).json({
        error: 'Invalid trigger type',
        validTypes: ['cron', 'manual', 'event']
      });
    }

    // Validate cron schedule if trigger type is cron
    if (workflowData.trigger.type === 'cron' && !workflowData.trigger.schedule) {
      return res.status(400).json({
        error: 'Schedule is required for cron trigger type'
      });
    }

    // Validate actions
    if (!Array.isArray(workflowData.actions) || workflowData.actions.length === 0) {
      return res.status(400).json({
        error: 'At least one action is required'
      });
    }

    const validActionTypes = ['fetch_data', 'generate_report', 'send_email', 'check_system_metrics', 'log_result'];
    for (const action of workflowData.actions) {
      if (!validActionTypes.includes(action.type)) {
        return res.status(400).json({
          error: `Invalid action type: ${action.type}`,
          validTypes: validActionTypes
        });
      }
    }

    // Set default status if not provided
    const workflowToCreate = {
      ...workflowData,
      status: workflowData.status || 'active' as const
    };

    const workflow = await workflowService.createWorkflow(workflowToCreate);
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ 
      error: 'Failed to create workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/workflows/:id/logs - Get execution history for a specific workflow
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    // Validate limit parameter
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be a positive integer.'
      });
    }

    // Check if workflow exists
    const workflow = await workflowService.getWorkflow(id);
    if (!workflow) {
      return res.status(404).json({
        error: 'Workflow not found'
      });
    }

    const logs = await workflowService.getWorkflowHistory(id, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching workflow logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflow logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
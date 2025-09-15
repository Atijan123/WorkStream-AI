import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';
import { HookRegistry } from '../services/HookRegistry';
import { WorkflowService } from '../services/WorkflowService';
import { WorkflowScheduler } from '../scheduler/WorkflowScheduler';

const router = Router();
const dashboardService = new DashboardService();
const featureRequestRepo = new FeatureRequestRepository();

// Initialize hook registry for automatic processing
let hookRegistry: HookRegistry;

const initializeHookRegistry = async () => {
  if (!hookRegistry) {
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

// POST /api/features/request - Submit a new feature request
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    // Validate required fields
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Description is required and must be a non-empty string'
      });
    }

    // Validate description length (reasonable limits)
    if (description.length > 2000) {
      return res.status(400).json({
        error: 'Description must be less than 2000 characters'
      });
    }

    // Submit the feature request to the database
    const featureRequest = await dashboardService.submitFeatureRequest(description.trim());
    
    // Automatically trigger the evolve_ui hook to process the request
    try {
      const registry = await initializeHookRegistry();
      
      // Process in background for faster response
      setImmediate(async () => {
        try {
          const result = await registry.executeHook('evolve_ui', {
            request: description.trim(),
            userId: req.body.userId || 'anonymous',
            timestamp: new Date()
          });
          console.log('Feature request processed:', result.success ? 'SUCCESS' : 'FAILED');
        } catch (bgError) {
          console.error('Background processing error:', bgError);
        }
      });
      
      // Return immediately for faster UX
      res.status(201).json({
        featureRequest,
        processing: {
          success: true,
          message: 'Feature request submitted and is being processed in the background'
        }
      });
    } catch (hookError) {
      console.error('Error initializing hook registry:', hookError);
      // Still return the feature request even if auto-processing fails
      res.status(201).json({
        featureRequest,
        processing: {
          success: false,
          message: `Feature request submitted but auto-processing setup failed: ${hookError instanceof Error ? hookError.message : String(hookError)}`
        }
      });
    }
  } catch (error) {
    console.error('Error submitting feature request:', error);
    res.status(500).json({
      error: 'Failed to submit feature request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/features/requests - Get feature request history
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query;

    // Validate limit parameter
    let parsedLimit: number | undefined;
    if (limit) {
      parsedLimit = parseInt(limit as string);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          error: 'Invalid limit parameter. Must be a positive integer between 1 and 100.'
        });
      }
    }

    // Validate status parameter
    if (status && !['pending', 'processing', 'completed', 'failed'].includes(status as string)) {
      return res.status(400).json({
        error: 'Invalid status parameter',
        validStatuses: ['pending', 'processing', 'completed', 'failed']
      });
    }

    let requests;
    if (status) {
      requests = await featureRequestRepo.findByStatus(status as any);
      // Apply limit if specified
      if (parsedLimit && requests) {
        requests = requests.slice(0, parsedLimit);
      }
    } else if (parsedLimit) {
      requests = await featureRequestRepo.getRecentRequests(parsedLimit);
    } else {
      requests = await featureRequestRepo.findAll();
    }

    res.json(requests);
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    res.status(500).json({
      error: 'Failed to fetch feature requests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/features/requests/:id - Update a feature request
router.patch('/requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, generatedComponents } = req.body;

    // Validate ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid request ID'
      });
    }

    // Validate status if provided
    if (status && !['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status parameter',
        validStatuses: ['pending', 'processing', 'completed', 'failed']
      });
    }

    // Build update object
    const updates: any = {};
    if (status) updates.status = status;
    if (generatedComponents) updates.generatedComponents = generatedComponents;

    // Update the feature request
    const updatedRequest = await featureRequestRepo.update(id, updates);

    if (!updatedRequest) {
      return res.status(404).json({
        error: 'Feature request not found'
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating feature request:', error);
    res.status(500).json({
      error: 'Failed to update feature request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
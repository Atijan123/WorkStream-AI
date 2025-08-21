import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { FeatureRequestRepository } from '../repositories/FeatureRequestRepository';

const router = Router();
const dashboardService = new DashboardService();
const featureRequestRepo = new FeatureRequestRepository();

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

    const featureRequest = await dashboardService.submitFeatureRequest(description.trim());
    res.status(201).json(featureRequest);
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

export default router;
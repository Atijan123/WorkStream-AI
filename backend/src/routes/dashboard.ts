import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

const router = Router();
const dashboardService = new DashboardService();

// GET /api/dashboard/data - Get aggregated dashboard data
router.get('/data', async (req: Request, res: Response) => {
  try {
    const dashboardData = await dashboardService.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
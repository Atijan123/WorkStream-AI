"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardService_1 = require("../services/DashboardService");
const router = (0, express_1.Router)();
const dashboardService = new DashboardService_1.DashboardService();
// GET /api/dashboard/data - Get aggregated dashboard data
router.get('/data', async (req, res) => {
    try {
        const dashboardData = await dashboardService.getDashboardData();
        res.json(dashboardData);
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map
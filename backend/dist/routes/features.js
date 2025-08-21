"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardService_1 = require("../services/DashboardService");
const FeatureRequestRepository_1 = require("../repositories/FeatureRequestRepository");
const router = (0, express_1.Router)();
const dashboardService = new DashboardService_1.DashboardService();
const featureRequestRepo = new FeatureRequestRepository_1.FeatureRequestRepository();
// POST /api/features/request - Submit a new feature request
router.post('/request', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error submitting feature request:', error);
        res.status(500).json({
            error: 'Failed to submit feature request',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/features/requests - Get feature request history
router.get('/requests', async (req, res) => {
    try {
        const { status, limit } = req.query;
        // Validate limit parameter
        let parsedLimit;
        if (limit) {
            parsedLimit = parseInt(limit);
            if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
                return res.status(400).json({
                    error: 'Invalid limit parameter. Must be a positive integer between 1 and 100.'
                });
            }
        }
        // Validate status parameter
        if (status && !['pending', 'processing', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status parameter',
                validStatuses: ['pending', 'processing', 'completed', 'failed']
            });
        }
        let requests;
        if (status) {
            requests = await featureRequestRepo.findByStatus(status);
            // Apply limit if specified
            if (parsedLimit && requests) {
                requests = requests.slice(0, parsedLimit);
            }
        }
        else if (parsedLimit) {
            requests = await featureRequestRepo.getRecentRequests(parsedLimit);
        }
        else {
            requests = await featureRequestRepo.findAll();
        }
        res.json(requests);
    }
    catch (error) {
        console.error('Error fetching feature requests:', error);
        res.status(500).json({
            error: 'Failed to fetch feature requests',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=features.js.map
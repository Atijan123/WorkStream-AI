#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabaseScript = main;
const init_1 = require("../database/init");
const LoggingService_1 = require("../services/LoggingService");
const PredefinedWorkflowService_1 = require("../services/PredefinedWorkflowService");
const logger = LoggingService_1.LoggingService.getInstance({
    logLevel: 'info',
    logToConsole: true,
    logToFile: false
});
async function main() {
    try {
        logger.info('Starting database initialization...', { component: 'DatabaseInit' });
        // Initialize database schema
        await (0, init_1.initializeDatabase)();
        logger.info('Database schema initialized successfully', { component: 'DatabaseInit' });
        // Initialize predefined workflows
        const predefinedWorkflowService = new PredefinedWorkflowService_1.PredefinedWorkflowService();
        await predefinedWorkflowService.initializePredefinedWorkflows();
        logger.info('Predefined workflows initialized successfully', { component: 'DatabaseInit' });
        logger.info('Database initialization completed successfully', { component: 'DatabaseInit' });
        process.exit(0);
    }
    catch (error) {
        logger.error('Database initialization failed', error instanceof Error ? error : new Error(String(error)), {
            component: 'DatabaseInit'
        });
        process.exit(1);
    }
}
// Handle command line execution
if (require.main === module) {
    main();
}
//# sourceMappingURL=initializeDatabase.js.map
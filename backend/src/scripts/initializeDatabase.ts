#!/usr/bin/env node

import { initializeDatabase } from '../database/init';
import { LoggingService } from '../services/LoggingService';
import { PredefinedWorkflowService } from '../services/PredefinedWorkflowService';

const logger = LoggingService.getInstance({
  logLevel: 'info',
  logToConsole: true,
  logToFile: false
});

async function main() {
  try {
    logger.info('Starting database initialization...', { component: 'DatabaseInit' });
    
    // Initialize database schema
    await initializeDatabase();
    logger.info('Database schema initialized successfully', { component: 'DatabaseInit' });
    
    // Initialize predefined workflows
    const predefinedWorkflowService = new PredefinedWorkflowService();
    await predefinedWorkflowService.initializePredefinedWorkflows();
    logger.info('Predefined workflows initialized successfully', { component: 'DatabaseInit' });
    
    logger.info('Database initialization completed successfully', { component: 'DatabaseInit' });
    process.exit(0);
  } catch (error) {
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

export { main as initializeDatabaseScript };
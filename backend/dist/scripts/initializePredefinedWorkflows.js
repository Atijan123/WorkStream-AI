#!/usr/bin/env node
"use strict";
/**
 * Script to initialize predefined workflows
 * This can be run standalone or imported and used programmatically
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePredefinedWorkflows = initializePredefinedWorkflows;
const PredefinedWorkflowService_1 = require("../services/PredefinedWorkflowService");
const WorkflowScheduler_1 = require("../scheduler/WorkflowScheduler");
const init_1 = require("../database/init");
async function main() {
    try {
        console.log('🚀 Starting predefined workflows initialization...');
        // Initialize database
        await (0, init_1.initializeDatabase)();
        console.log('✅ Database initialized');
        // Create scheduler and start it
        const scheduler = new WorkflowScheduler_1.WorkflowScheduler();
        await scheduler.start();
        console.log('✅ Scheduler started');
        // Initialize predefined workflows
        const predefinedService = new PredefinedWorkflowService_1.PredefinedWorkflowService(scheduler);
        const result = await predefinedService.initializePredefinedWorkflows();
        console.log('\n📊 Initialization Summary:');
        console.log(`   Created: ${result.created} workflows`);
        console.log(`   Updated: ${result.updated} workflows`);
        console.log(`   Errors: ${result.errors.length} errors`);
        if (result.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            result.errors.forEach(error => console.log(`   - ${error}`));
        }
        // Show status of all predefined workflows
        const statuses = await predefinedService.getPredefinedWorkflowStatuses();
        console.log('\n📋 Predefined Workflow Status:');
        statuses.forEach(status => {
            const statusIcon = status.exists ? '✅' : '❌';
            const scheduledIcon = status.scheduled ? '⏰' : '⏸️';
            console.log(`   ${statusIcon} ${status.name} ${status.exists ? scheduledIcon : ''}`);
        });
        console.log('\n🎉 Predefined workflows initialization complete!');
        // Keep the process running to maintain scheduler
        console.log('🔄 Scheduler is running. Press Ctrl+C to stop.');
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down...');
            await scheduler.stop();
            console.log('✅ Scheduler stopped');
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down...');
            await scheduler.stop();
            console.log('✅ Scheduler stopped');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to initialize predefined workflows:', error);
        process.exit(1);
    }
}
// Export for programmatic use
async function initializePredefinedWorkflows() {
    await (0, init_1.initializeDatabase)();
    const scheduler = new WorkflowScheduler_1.WorkflowScheduler();
    await scheduler.start();
    const predefinedService = new PredefinedWorkflowService_1.PredefinedWorkflowService(scheduler);
    return await predefinedService.initializePredefinedWorkflows();
}
// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Unhandled error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=initializePredefinedWorkflows.js.map
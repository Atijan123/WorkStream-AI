"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolveUIHook = void 0;
const index_1 = require("./index");
const WebSocketService_1 = require("../services/WebSocketService");
/**
 * Hook that processes natural language UI feature requests
 * and generates React components dynamically
 */
class EvolveUIHook extends index_1.BaseHook {
    constructor(specManager, componentGenerator, featureRequestRepo) {
        super();
        this.specManager = specManager;
        this.componentGenerator = componentGenerator;
        this.featureRequestRepo = featureRequestRepo;
        this.name = 'evolve_ui';
        this.description = 'Processes natural language UI feature requests and generates React components';
    }
    getWebSocketService() {
        try {
            return WebSocketService_1.WebSocketService.getInstance();
        }
        catch (error) {
            console.warn('WebSocket service not available in EvolveUIHook');
            return null;
        }
    }
    async execute(context) {
        const webSocketService = this.getWebSocketService();
        try {
            // Log the feature request
            const createdRequest = await this.featureRequestRepo.create({
                description: context.request,
                status: 'processing'
            });
            // Emit WebSocket event for processing start
            webSocketService?.emitFeatureRequestUpdate({
                requestId: createdRequest.id,
                status: 'processing',
                message: 'Processing feature request...'
            });
            // Parse the natural language request
            const parsedRequest = await this.parseFeatureRequest(context.request);
            // Update the spec with new feature
            const specUpdates = await this.specManager.addFeature(parsedRequest);
            // Generate React components
            const generatedComponents = await this.componentGenerator.generateComponents(parsedRequest);
            // Update feature request status
            await this.featureRequestRepo.update(createdRequest.id, {
                status: 'completed',
                generatedComponents: generatedComponents.map(c => c.filePath)
            });
            // Emit WebSocket event for completion
            webSocketService?.emitFeatureRequestUpdate({
                requestId: createdRequest.id,
                status: 'completed',
                message: `Successfully generated ${generatedComponents.length} components`,
                generatedFiles: generatedComponents.map(c => c.filePath)
            });
            return {
                success: true,
                message: `Successfully generated ${generatedComponents.length} components for feature: ${parsedRequest.name}`,
                changes: specUpdates,
                generatedFiles: generatedComponents.map(c => c.filePath)
            };
        }
        catch (error) {
            console.error('EvolveUI hook execution failed:', error);
            // Update feature request status to failed
            let requestId = 'unknown';
            try {
                // Try to create a failed request if we don't have one yet
                const failedRequest = await this.featureRequestRepo.create({
                    description: context.request,
                    status: 'failed'
                });
                requestId = failedRequest.id;
            }
            catch (updateError) {
                console.error('Failed to create failed feature request:', updateError);
            }
            // Emit WebSocket event for error
            webSocketService?.emitFeatureRequestUpdate({
                requestId,
                status: 'failed',
                message: `Failed to process UI evolution request: ${error instanceof Error ? error.message : String(error)}`
            });
            return {
                success: false,
                message: `Failed to process UI evolution request: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    async parseFeatureRequest(request) {
        // Simple natural language parsing logic
        // In a real implementation, this would use more sophisticated NLP
        const lowercaseRequest = request.toLowerCase();
        let componentType = 'widget';
        let name = 'custom-feature';
        let description = request;
        // Detect component type from keywords
        if (lowercaseRequest.includes('chart') || lowercaseRequest.includes('graph')) {
            componentType = 'chart';
            name = 'custom-chart';
        }
        else if (lowercaseRequest.includes('table') || lowercaseRequest.includes('list')) {
            componentType = 'table';
            name = 'custom-table';
        }
        else if (lowercaseRequest.includes('form') || lowercaseRequest.includes('input')) {
            componentType = 'form';
            name = 'custom-form';
        }
        else if (lowercaseRequest.includes('button') || lowercaseRequest.includes('action')) {
            componentType = 'button';
            name = 'custom-button';
        }
        // Extract name if mentioned
        const nameMatch = request.match(/(?:create|add|build)\s+(?:a\s+)?(.+?)(?:\s+(?:component|widget|feature))?$/i);
        if (nameMatch) {
            name = nameMatch[1].toLowerCase().replace(/\s+/g, '-');
        }
        return {
            name,
            componentType,
            description,
            props: this.extractProps(request),
            styling: this.extractStyling(request)
        };
    }
    extractProps(request) {
        const props = {};
        // Extract data source
        if (request.includes('data from') || request.includes('show data')) {
            const dataMatch = request.match(/(?:data from|show data from)\s+([^\s,]+)/i);
            if (dataMatch) {
                props.dataSource = dataMatch[1];
            }
        }
        // Extract title
        const titleMatch = request.match(/(?:title|called|named)\s+"([^"]+)"/i);
        if (titleMatch) {
            props.title = titleMatch[1];
        }
        return props;
    }
    extractStyling(request) {
        const styling = {};
        // Extract colors
        const colorMatch = request.match(/(?:color|colored)\s+(blue|red|green|yellow|purple|pink|gray)/i);
        if (colorMatch) {
            styling.primaryColor = colorMatch[1];
        }
        // Extract size
        const sizeMatch = request.match(/(?:size|sized)\s+(small|medium|large|xl)/i);
        if (sizeMatch) {
            styling.size = sizeMatch[1];
        }
        return styling;
    }
}
exports.EvolveUIHook = EvolveUIHook;
//# sourceMappingURL=evolve-ui.js.map
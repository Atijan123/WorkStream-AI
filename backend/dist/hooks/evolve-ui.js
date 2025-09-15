"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolveUIHook = void 0;
const base_1 = require("./base");
const FastComponentGenerator_1 = require("../services/FastComponentGenerator");
const WebSocketService_1 = require("../services/WebSocketService");
/**
 * Hook that processes natural language UI feature requests
 * and generates React components dynamically
 */
class EvolveUIHook extends base_1.BaseHook {
    constructor(specManager, componentGenerator, featureRequestRepo, fastMode = true) {
        super();
        this.specManager = specManager;
        this.componentGenerator = componentGenerator;
        this.featureRequestRepo = featureRequestRepo;
        this.fastMode = fastMode;
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
            // Generate React components (use fast generator for speed)
            const generator = this.fastMode ? new FastComponentGenerator_1.FastComponentGenerator() : this.componentGenerator;
            const generatedComponents = await generator.generateComponents(parsedRequest);
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
        const lowercaseRequest = request.toLowerCase();
        let componentType = 'widget';
        let name = 'custom-feature';
        let description = request;
        // Enhanced component type detection
        if (lowercaseRequest.includes('chart') || lowercaseRequest.includes('graph') ||
            lowercaseRequest.includes('visualization') || lowercaseRequest.includes('plot')) {
            componentType = 'chart';
            name = this.generateComponentName(request, 'chart');
        }
        else if (lowercaseRequest.includes('table') || lowercaseRequest.includes('list') ||
            lowercaseRequest.includes('data') || lowercaseRequest.includes('rows')) {
            componentType = 'table';
            name = this.generateComponentName(request, 'table');
        }
        else if (lowercaseRequest.includes('form') || lowercaseRequest.includes('input') ||
            lowercaseRequest.includes('submit') || lowercaseRequest.includes('field')) {
            componentType = 'form';
            name = this.generateComponentName(request, 'form');
        }
        else if (lowercaseRequest.includes('button') || lowercaseRequest.includes('action') ||
            lowercaseRequest.includes('click')) {
            componentType = 'button';
            name = this.generateComponentName(request, 'button');
        }
        else {
            name = this.generateComponentName(request, 'widget');
        }
        return {
            name,
            componentType,
            description,
            props: this.extractProps(request),
            styling: this.extractStyling(request)
        };
    }
    generateComponentName(request, type) {
        // Extract meaningful words from the request
        const words = request.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 &&
            !['the', 'and', 'for', 'with', 'that', 'this', 'want', 'need', 'create', 'add', 'build', 'make'].includes(word));
        // Take the first few meaningful words
        const nameWords = words.slice(0, 3);
        if (nameWords.length > 0) {
            return nameWords.join('-') + '-' + type;
        }
        return `custom-${type}-${Date.now()}`;
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
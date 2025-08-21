"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecManager = void 0;
const fs = __importStar(require("fs/promises"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
/**
 * Manages the application specification file
 */
class SpecManager {
    constructor() {
        this.specPath = path.join(process.cwd(), '.kiro', 'spec.yaml');
    }
    async loadSpec() {
        try {
            const specContent = await fs.readFile(this.specPath, 'utf-8');
            return yaml.load(specContent);
        }
        catch (error) {
            throw new Error(`Failed to load spec file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async saveSpec(spec) {
        try {
            const yamlContent = yaml.dump(spec, {
                indent: 2,
                lineWidth: 80,
                noRefs: true
            });
            await fs.writeFile(this.specPath, yamlContent, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to save spec file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async addFeature(featureRequest) {
        const spec = await this.loadSpec();
        const changes = [];
        // Generate feature key and description
        const featureKey = `${featureRequest.name.replace(/\s+/g, '_')}_${featureRequest.componentType}`;
        const featureDescription = this.generateFeatureDescription(featureRequest);
        // Add feature to spec
        spec.features[featureKey] = featureDescription;
        changes.push(`Added feature: ${featureKey}`);
        // Save updated spec
        await this.saveSpec(spec);
        return changes;
    }
    generateFeatureDescription(request) {
        let description = `A ${request.componentType} component that ${request.description.toLowerCase()}`;
        if (request.props.title) {
            description += ` with title "${request.props.title}"`;
        }
        if (request.props.dataSource) {
            description += ` displaying data from ${request.props.dataSource}`;
        }
        if (request.styling.primaryColor) {
            description += ` styled with ${request.styling.primaryColor} color theme`;
        }
        if (request.styling.size) {
            description += ` in ${request.styling.size} size`;
        }
        description += '.';
        return description;
    }
    async addWorkflow(workflowSpec) {
        const spec = await this.loadSpec();
        const changes = [];
        // Add workflow to spec
        spec.workflows.push(workflowSpec);
        changes.push(`Added workflow: ${workflowSpec.name}`);
        // Save updated spec
        await this.saveSpec(spec);
        return changes;
    }
}
exports.SpecManager = SpecManager;
//# sourceMappingURL=SpecManager.js.map
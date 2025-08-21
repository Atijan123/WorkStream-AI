import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';

interface AppSpec {
  app_name: string;
  description: string;
  tech_stack: {
    frontend: string;
    backend: string;
    database: string;
    styles: string;
  };
  features: Record<string, string>;
  workflows: Array<{
    id: string;
    name: string;
    description: string;
    trigger: {
      type: string;
      schedule?: string;
    };
    actions: Array<{
      type: string;
      [key: string]: any;
    }>;
  }>;
}

interface ParsedFeatureRequest {
  name: string;
  componentType: string;
  description: string;
  props: Record<string, any>;
  styling: Record<string, string>;
}

/**
 * Manages the application specification file
 */
export class SpecManager {
  private specPath: string;

  constructor() {
    this.specPath = path.join(process.cwd(), '.kiro', 'spec.yaml');
  }

  async loadSpec(): Promise<AppSpec> {
    try {
      const specContent = await fs.readFile(this.specPath, 'utf-8');
      return yaml.load(specContent) as AppSpec;
    } catch (error) {
      throw new Error(`Failed to load spec file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveSpec(spec: AppSpec): Promise<void> {
    try {
      const yamlContent = yaml.dump(spec, { 
        indent: 2,
        lineWidth: 80,
        noRefs: true 
      });
      await fs.writeFile(this.specPath, yamlContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save spec file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addFeature(featureRequest: ParsedFeatureRequest): Promise<string[]> {
    const spec = await this.loadSpec();
    const changes: string[] = [];

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

  private generateFeatureDescription(request: ParsedFeatureRequest): string {
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

  async addWorkflow(workflowSpec: any): Promise<string[]> {
    const spec = await this.loadSpec();
    const changes: string[] = [];

    // Add workflow to spec
    spec.workflows.push(workflowSpec);
    changes.push(`Added workflow: ${workflowSpec.name}`);

    // Save updated spec
    await this.saveSpec(spec);

    return changes;
  }
}
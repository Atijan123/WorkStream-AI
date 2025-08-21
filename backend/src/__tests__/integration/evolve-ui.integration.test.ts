import { EvolveUIHook } from '../../hooks/evolve-ui';
import { SpecManager } from '../../services/SpecManager';
import { ComponentGenerator } from '../../services/ComponentGenerator';
import { FeatureRequestRepository } from '../../repositories/FeatureRequestRepository';
import { HookContext } from '../../hooks';
import * as fs from 'fs/promises';

// Mock file system operations
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('EvolveUI Integration Test', () => {
  let hook: EvolveUIHook;
  let specManager: SpecManager;
  let componentGenerator: ComponentGenerator;
  let featureRequestRepo: FeatureRequestRepository;

  beforeEach(() => {
    // Mock file system operations
    mockFs.readFile.mockResolvedValue('mock spec content');
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.access.mockRejectedValue(new Error('Directory does not exist'));
    mockFs.mkdir.mockResolvedValue(undefined);

    // Create real instances (they will use mocked fs)
    specManager = new SpecManager();
    componentGenerator = new ComponentGenerator();
    featureRequestRepo = new FeatureRequestRepository();
    
    hook = new EvolveUIHook(specManager, componentGenerator, featureRequestRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should demonstrate basic hook functionality', async () => {
    const context: HookContext = {
      request: 'Create a simple chart showing sales data',
      userId: 'test-user',
      timestamp: new Date()
    };

    // Mock yaml operations
    const yaml = require('js-yaml');
    jest.spyOn(yaml, 'load').mockReturnValue({
      app_name: 'Test App',
      description: 'Test',
      tech_stack: { frontend: 'react', backend: 'node', database: 'sqlite', styles: 'tailwindcss' },
      features: {},
      workflows: []
    });
    jest.spyOn(yaml, 'dump').mockReturnValue('updated spec content');

    // Mock database operations
    const mockCreate = jest.spyOn(featureRequestRepo, 'create').mockResolvedValue({
      id: 'test-id',
      description: context.request,
      status: 'processing',
      timestamp: context.timestamp
    });
    const mockUpdate = jest.spyOn(featureRequestRepo, 'update').mockResolvedValue({
      id: 'test-id',
      description: context.request,
      status: 'completed',
      timestamp: context.timestamp,
      generatedComponents: ['test-component.tsx']
    });

    // Execute the hook
    const result = await hook.execute(context);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully generated');
    expect(mockCreate).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockFs.writeFile).toHaveBeenCalled(); // Component files written
  });
});
interface ParsedFeatureRequest {
    name: string;
    componentType: string;
    description: string;
    props: Record<string, any>;
    styling: Record<string, string>;
}
interface GeneratedComponent {
    name: string;
    filePath: string;
    content: string;
}
/**
 * Generates React components based on parsed feature requests
 */
export declare class ComponentGenerator {
    private componentsDir;
    constructor();
    generateComponents(request: ParsedFeatureRequest): Promise<GeneratedComponent[]>;
    private ensureDirectoryExists;
    private generateMainComponent;
    private generateTestComponent;
    private generateComponentContent;
    private generateTestContent;
    private generatePropsInterface;
    private generatePropsDestructuring;
    private generateComponentByType;
    private generateChartComponent;
    private generateTableComponent;
    private generateFormComponent;
    private generateButtonComponent;
    private generateWidgetComponent;
    private generateStyling;
    private generateTestProps;
    private generateTestAssertions;
    private updateAppComponent;
    private findMatchingClosingTag;
    private generateDefaultProps;
    private generateSampleChartData;
    private generateSampleTableData;
    private toPascalCase;
    private inferPropType;
}
export {};
//# sourceMappingURL=ComponentGenerator.d.ts.map
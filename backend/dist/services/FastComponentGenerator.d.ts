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
 * Fast, lightweight component generator for quick feature request processing
 */
export declare class FastComponentGenerator {
    private componentsDir;
    constructor();
    generateComponents(request: ParsedFeatureRequest): Promise<GeneratedComponent[]>;
    private ensureDirectoryExists;
    private generateMainComponent;
    private generateFastComponentContent;
    private generateSimpleComponent;
    private generateCounterWidget;
    private generateSimpleChart;
    private generateSimpleTable;
    private generateSimpleForm;
    private generateSimpleButton;
    private generateWeatherWidget;
    private generateNotesWidget;
    private generateGenericWidget;
    private getBasicStyling;
    private toPascalCase;
}
export {};
//# sourceMappingURL=FastComponentGenerator.d.ts.map
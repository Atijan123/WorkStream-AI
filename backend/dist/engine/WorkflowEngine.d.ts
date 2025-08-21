export interface WorkflowExecutionContext {
    workflowId: string;
    executionId: string;
    startTime: Date;
    variables: Record<string, any>;
}
export interface ActionResult {
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
}
export declare class WorkflowEngine {
    private workflowService;
    private systemMetricsRepo;
    private runningExecutions;
    private webSocketService;
    constructor();
    executeWorkflow(workflowId: string): Promise<ActionResult>;
    private executeAction;
    private handleFetchData;
    private handleGenerateReport;
    private handleSendEmail;
    private handleCheckSystemMetrics;
    private handleLogResult;
    private getCPUUsage;
    private getMemoryUsage;
    private generateCSV;
    private generateTextReport;
    private handleWorkflowError;
    getRunningExecutions(): WorkflowExecutionContext[];
    stopExecution(executionId: string): Promise<boolean>;
}
//# sourceMappingURL=WorkflowEngine.d.ts.map
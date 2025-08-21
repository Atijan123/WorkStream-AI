import sqlite3 from 'sqlite3';
export declare class DatabaseConnection {
    private static instance;
    private db;
    protected constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<sqlite3.Database>;
    run(sql: string, params?: any[]): Promise<{
        lastID: number;
        changes: number;
    }>;
    get<T>(sql: string, params?: any[]): Promise<T | undefined>;
    all<T>(sql: string, params?: any[]): Promise<T[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=connection.d.ts.map
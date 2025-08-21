import sqlite3 from 'sqlite3';
export declare class TestDatabaseConnection {
    private testDb;
    connect(): Promise<sqlite3.Database>;
    run(sql: string, params?: any[]): Promise<{
        lastID: number;
        changes: number;
    }>;
    get<T>(sql: string, params?: any[]): Promise<T | undefined>;
    all<T>(sql: string, params?: any[]): Promise<T[]>;
    setupTestTables(): Promise<void>;
    close(): Promise<void>;
}
export declare function setupTestDatabase(): Promise<TestDatabaseConnection>;
export declare function setupTestDb(): Promise<void>;
export declare function cleanupTestDb(): Promise<void>;
//# sourceMappingURL=testDb.d.ts.map
#!/usr/bin/env node
interface Migration {
    version: number;
    name: string;
    up: string;
    down: string;
}
declare class MigrationRunner {
    private db;
    private migrationsDir;
    constructor(dbPath: string, migrationsDir: string);
    initialize(): Promise<void>;
    getAppliedMigrations(): Promise<number[]>;
    loadMigrations(): Promise<Migration[]>;
    runMigration(migration: Migration): Promise<void>;
    rollbackMigration(migration: Migration): Promise<void>;
    migrate(): Promise<void>;
    rollback(steps?: number): Promise<void>;
    close(): void;
}
export { MigrationRunner };
//# sourceMappingURL=migrate.d.ts.map
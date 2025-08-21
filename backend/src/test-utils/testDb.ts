import sqlite3 from 'sqlite3';

export class TestDatabaseConnection {
  private testDb: sqlite3.Database | null = null;

  public async connect(): Promise<sqlite3.Database> {
    if (this.testDb) {
      return this.testDb;
    }

    return new Promise((resolve, reject) => {
      // Use in-memory database for tests
      this.testDb = new sqlite3.Database(':memory:', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.testDb!);
        }
      });
    });
  }

  public async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  public async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  public async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  public async setupTestTables(): Promise<void> {
    const createTables = `
      -- Workflows table
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        spec TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Execution logs
      CREATE TABLE IF NOT EXISTS execution_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_id TEXT,
        status TEXT,
        message TEXT,
        execution_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_ms INTEGER,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      );

      -- Feature requests
      CREATE TABLE IF NOT EXISTS feature_requests (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        generated_files TEXT
      );

      -- System metrics
      CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpu_usage REAL,
        memory_usage REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const db = await this.connect();
    return new Promise((resolve, reject) => {
      db.exec(createTables, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async close(): Promise<void> {
    if (this.testDb) {
      return new Promise((resolve, reject) => {
        this.testDb!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.testDb = null;
            resolve();
          }
        });
      });
    }
  }
}

export async function setupTestDatabase(): Promise<TestDatabaseConnection> {
  const testDb = new TestDatabaseConnection();
  await testDb.setupTestTables();
  return testDb;
}

// Global test database instance
let globalTestDb: TestDatabaseConnection | null = null;

export async function setupTestDb(): Promise<void> {
  if (globalTestDb) {
    await globalTestDb.close();
  }
  globalTestDb = new TestDatabaseConnection();
  await globalTestDb.setupTestTables();
  
  // Mock the DatabaseConnection.getInstance() to return our test database
  const { DatabaseConnection } = require('../database/connection');
  jest.spyOn(DatabaseConnection, 'getInstance').mockReturnValue(globalTestDb);
}

export async function cleanupTestDb(): Promise<void> {
  if (globalTestDb) {
    await globalTestDb.close();
    globalTestDb = null;
  }
  jest.restoreAllMocks();
}
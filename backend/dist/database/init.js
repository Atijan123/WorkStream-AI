"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../data/database.sqlite');
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3_1.default.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
            // Create tables
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
            db.exec(createTables, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Database tables created successfully');
                db.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    });
}
//# sourceMappingURL=init.js.map
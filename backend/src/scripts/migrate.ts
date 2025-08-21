#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import { Database } from 'sqlite3';
import { LoggingService } from '../services/LoggingService';

const logger = LoggingService.getInstance({
  logLevel: 'info',
  logToConsole: true,
  logToFile: false
});

interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

class MigrationRunner {
  private db: Database;
  private migrationsDir: string;

  constructor(dbPath: string, migrationsDir: string) {
    this.db = new Database(dbPath);
    this.migrationsDir = migrationsDir;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getAppliedMigrations(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT version FROM migrations ORDER BY version', (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.version));
      });
    });
  }

  async loadMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];
    
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const match = file.match(/^(\d+)_(.+)\.sql$/);
        if (!match) continue;

        const version = parseInt(match[1]);
        const name = match[2];
        const filePath = path.join(this.migrationsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Split up and down migrations
        const parts = content.split('-- DOWN');
        const up = parts[0].replace('-- UP', '').trim();
        const down = parts[1] ? parts[1].trim() : '';

        migrations.push({ version, name, up, down });
      }
    } catch (error) {
      logger.warn('No migrations directory found or error reading migrations', {
        component: 'MigrationRunner',
        metadata: { migrationsDir: this.migrationsDir }
      });
    }

    return migrations.sort((a, b) => a.version - b.version);
  }

  async runMigration(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        this.db.exec(migration.up, (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          this.db.run(
            'INSERT INTO migrations (version, name) VALUES (?, ?)',
            [migration.version, migration.name],
            (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }

              this.db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
              });
            }
          );
        });
      });
    });
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.version}_${migration.name} has no down migration`);
    }

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        this.db.exec(migration.down, (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          this.db.run(
            'DELETE FROM migrations WHERE version = ?',
            [migration.version],
            (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }

              this.db.run('COMMIT', (err) => {
                if (err) reject(err);
                else resolve();
              });
            }
          );
        });
      });
    });
  }

  async migrate(): Promise<void> {
    await this.initialize();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await this.loadMigrations();
    
    const pendingMigrations = availableMigrations.filter(
      migration => !appliedMigrations.includes(migration.version)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations', { component: 'MigrationRunner' });
      return;
    }

    logger.info(`Running ${pendingMigrations.length} pending migrations`, {
      component: 'MigrationRunner',
      metadata: { count: pendingMigrations.length }
    });

    for (const migration of pendingMigrations) {
      logger.info(`Running migration ${migration.version}_${migration.name}`, {
        component: 'MigrationRunner',
        metadata: { version: migration.version, name: migration.name }
      });
      
      await this.runMigration(migration);
      
      logger.info(`Completed migration ${migration.version}_${migration.name}`, {
        component: 'MigrationRunner',
        metadata: { version: migration.version, name: migration.name }
      });
    }

    logger.info('All migrations completed successfully', { component: 'MigrationRunner' });
  }

  async rollback(steps: number = 1): Promise<void> {
    await this.initialize();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await this.loadMigrations();
    
    const migrationsToRollback = appliedMigrations
      .sort((a, b) => b - a) // Descending order
      .slice(0, steps)
      .map(version => availableMigrations.find(m => m.version === version))
      .filter(Boolean) as Migration[];

    if (migrationsToRollback.length === 0) {
      logger.info('No migrations to rollback', { component: 'MigrationRunner' });
      return;
    }

    logger.info(`Rolling back ${migrationsToRollback.length} migrations`, {
      component: 'MigrationRunner',
      metadata: { count: migrationsToRollback.length }
    });

    for (const migration of migrationsToRollback) {
      logger.info(`Rolling back migration ${migration.version}_${migration.name}`, {
        component: 'MigrationRunner',
        metadata: { version: migration.version, name: migration.name }
      });
      
      await this.rollbackMigration(migration);
      
      logger.info(`Rolled back migration ${migration.version}_${migration.name}`, {
        component: 'MigrationRunner',
        metadata: { version: migration.version, name: migration.name }
      });
    }

    logger.info('Rollback completed successfully', { component: 'MigrationRunner' });
  }

  close(): void {
    this.db.close();
  }
}

async function main() {
  const command = process.argv[2];
  const dbPath = process.env.DATABASE_PATH || './data/database.sqlite';
  const migrationsDir = process.env.MIGRATIONS_DIR || './migrations';
  
  const runner = new MigrationRunner(dbPath, migrationsDir);

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await runner.migrate();
        break;
      
      case 'down':
      case 'rollback':
        const steps = parseInt(process.argv[3]) || 1;
        await runner.rollback(steps);
        break;
      
      case 'status':
        await runner.initialize();
        const applied = await runner.getAppliedMigrations();
        const available = await runner.loadMigrations();
        const pending = available.filter(m => !applied.includes(m.version));
        
        logger.info('Migration status', {
          component: 'MigrationRunner',
          metadata: {
            applied: applied.length,
            pending: pending.length,
            total: available.length
          }
        });
        
        if (pending.length > 0) {
          logger.info('Pending migrations:', {
            component: 'MigrationRunner',
            metadata: { pending: pending.map(m => `${m.version}_${m.name}`) }
          });
        }
        break;
      
      default:
        logger.info('Usage: migrate [up|down|status] [steps]', { component: 'MigrationRunner' });
        logger.info('  up/migrate: Run pending migrations', { component: 'MigrationRunner' });
        logger.info('  down/rollback [steps]: Rollback migrations (default: 1)', { component: 'MigrationRunner' });
        logger.info('  status: Show migration status', { component: 'MigrationRunner' });
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration failed', error instanceof Error ? error : new Error(String(error)), {
      component: 'MigrationRunner'
    });
    process.exit(1);
  } finally {
    runner.close();
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

export { MigrationRunner };
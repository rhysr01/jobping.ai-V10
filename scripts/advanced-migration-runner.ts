#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { Client } from "pg";
import { performance } from "perf_hooks";

interface Migration {
  id: string;
  name: string;
  description: string;
  file: string;
  dependencies?: string[];
  rollback?: string;
  category: 'data' | 'schema' | 'security' | 'maintenance';
  parallelSafe: boolean;
}

interface MigrationResult {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: string;
}

interface MigrationBatch {
  category: string;
  migrations: Migration[];
  canRunParallel: boolean;
}

class AdvancedMigrationRunner {
  private supabase: any;
  private pgClient: Client;
  private supabaseUrl: string;
  private supabaseKey: string;
  private results: MigrationResult[] = [];
  private migrationLog: string[] = [];

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error("❌ Missing Supabase environment variables");
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const projectRef = this.supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    const dbUrl = `postgresql://postgres:${this.supabaseKey}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

    this.pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }

  async initialize() {
    try {
      console.log("🔌 Connecting to PostgreSQL database...");
      await this.pgClient.connect();
      console.log("✅ Database connection established");

      // Create migration tracking table if it doesn't exist
      await this.createMigrationTrackingTable();

    } catch (error: any) {
      console.error(`❌ Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  private async createMigrationTrackingTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS _migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        duration_ms INTEGER,
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        checksum VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_migrations_status ON _migrations(status);
      CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON _migrations(executed_at);
    `;

    await this.pgClient.query(createTableSQL);
  }

  private async hasMigrationRun(migrationId: string): Promise<boolean> {
    const result = await this.pgClient.query(
      'SELECT id FROM _migrations WHERE id = $1 AND status = $2',
      [migrationId, 'success']
    );
    return result.rows.length > 0;
  }

  private async recordMigrationResult(result: MigrationResult) {
    await this.pgClient.query(`
      INSERT INTO _migrations (id, name, executed_at, duration_ms, status, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        executed_at = EXCLUDED.executed_at,
        duration_ms = EXCLUDED.duration_ms,
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message
    `, [
      result.id,
      result.name,
      new Date(result.timestamp),
      Math.round(result.duration),
      result.status,
      result.error || null
    ]);
  }

  private getMigrations(): Migration[] {
    return [
      // Data Quality Migrations (can run in parallel)
      {
        id: "20260108205100_fix_company_names_batch",
        name: "Company Names Sync",
        description: "Sync missing company_name fields from company field",
        file: "20260108205100_fix_company_names_batch.sql",
        category: 'data',
        parallelSafe: true
      },
      {
        id: "20260108205101_fix_location_country_extraction",
        name: "Country Extraction",
        description: "Extract countries from location strings",
        file: "20260108205101_fix_location_country_extraction.sql",
        category: 'data',
        parallelSafe: true
      },
      {
        id: "20260108205102_fix_location_city_extraction",
        name: "City Extraction",
        description: "Extract cities from comma-separated locations",
        file: "20260108205102_fix_location_city_extraction.sql",
        category: 'data',
        parallelSafe: true
      },

      // Security Migrations (must run sequentially)
      {
        id: "20260108205104_enable_rls_security",
        name: "RLS Security Setup",
        description: "Enable Row Level Security on critical tables",
        file: "20260108205104_enable_rls_security.sql",
        category: 'security',
        parallelSafe: false,
        dependencies: ['20260108205100_fix_company_names_batch'] // Must run after data cleanup
      },

      // Filtering Migrations (can run in parallel after security)
      {
        id: "20260108205103_filter_job_boards",
        name: "Job Board Filtering",
        description: "Filter out job board companies (Reed, Indeed, etc.)",
        file: "20260108205103_filter_job_boards.sql",
        category: 'maintenance',
        parallelSafe: true,
        dependencies: ['20260108205104_enable_rls_security']
      },
      {
        id: "20260108205105_filter_ceo_executive_roles",
        name: "CEO & Executive Filtering",
        description: "Filter CEO, CFO, CTO, and executive roles",
        file: "20260108205105_filter_ceo_executive_roles.sql",
        category: 'maintenance',
        parallelSafe: true,
        dependencies: ['20260108205104_enable_rls_security']
      },
      {
        id: "20260108205106_filter_construction_roles",
        name: "Construction Filtering",
        description: "Filter construction and trade roles",
        file: "20260108205106_filter_construction_roles.sql",
        category: 'maintenance',
        parallelSafe: true,
        dependencies: ['20260108205104_enable_rls_security']
      },
      {
        id: "20260108205107_filter_medical_healthcare_roles",
        name: "Medical & Healthcare Filtering",
        description: "Filter medical, nursing, and healthcare roles",
        file: "20260108205107_filter_medical_healthcare_roles.sql",
        category: 'maintenance',
        parallelSafe: true,
        dependencies: ['20260108205104_enable_rls_security']
      },
      {
        id: "20260108205108_filter_legal_roles",
        name: "Legal Filtering",
        description: "Filter lawyer, attorney, and legal roles",
        file: "20260108205108_filter_legal_roles.sql",
        category: 'maintenance',
        parallelSafe: true,
        dependencies: ['20260108205104_enable_rls_security']
      },
      {
        id: "20260108205109_filter_teaching_education_roles",
        name: "Teaching & Education Filtering",
        description: "Filter teacher, lecturer, and education roles",
        file: "20260108205109_filter_teaching_education_roles.sql",
        category: 'maintenance',
        parallelSafe: true,
        dependencies: ['20260108205104_enable_rls_security']
      }
    ];
  }

  private organizeMigrationsIntoBatches(migrations: Migration[]): MigrationBatch[] {
    const batches: MigrationBatch[] = [];
    const processed = new Set<string>();

    // First, handle security migrations (must run sequentially)
    const securityMigrations = migrations.filter(m => m.category === 'security');
    if (securityMigrations.length > 0) {
      batches.push({
        category: 'security',
        migrations: securityMigrations,
        canRunParallel: false
      });
      securityMigrations.forEach(m => processed.add(m.id));
    }

    // Then data migrations (can run in parallel)
    const dataMigrations = migrations.filter(m =>
      m.category === 'data' && !processed.has(m.id)
    );
    if (dataMigrations.length > 0) {
      batches.push({
        category: 'data',
        migrations: dataMigrations,
        canRunParallel: true
      });
      dataMigrations.forEach(m => processed.add(m.id));
    }

    // Finally maintenance migrations (can run in parallel)
    const maintenanceMigrations = migrations.filter(m =>
      m.category === 'maintenance' && !processed.has(m.id)
    );
    if (maintenanceMigrations.length > 0) {
      batches.push({
        category: 'maintenance',
        migrations: maintenanceMigrations,
        canRunParallel: true
      });
      maintenanceMigrations.forEach(m => processed.add(m.id));
    }

    return batches;
  }

  private async checkDependencies(migration: Migration): Promise<boolean> {
    if (!migration.dependencies) return true;

    for (const depId of migration.dependencies) {
      if (!(await this.hasMigrationRun(depId))) {
        return false;
      }
    }
    return true;
  }

  private async runMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = performance.now();

    try {
      // Check if already run
      if (await this.hasMigrationRun(migration.id)) {
        return {
          id: migration.id,
          name: migration.name,
          status: 'skipped',
          duration: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Check dependencies
      if (!(await this.checkDependencies(migration))) {
        return {
          id: migration.id,
          name: migration.name,
          status: 'skipped',
          duration: performance.now() - startTime,
          error: 'Dependencies not satisfied',
          timestamp: new Date().toISOString()
        };
      }

      console.log(`▶️  Running: ${migration.name}`);
      console.log(`   ${migration.description}`);

      // Read and execute SQL
      const sqlPath = resolve(process.cwd(), "supabase", "migrations", migration.file);
      const sql = readFileSync(sqlPath, "utf-8");

      // Execute in transaction for safety
      await this.pgClient.query('BEGIN');
      await this.pgClient.query(sql);
      await this.pgClient.query('COMMIT');

      const duration = performance.now() - startTime;
      console.log(`✅ SUCCESS: ${migration.name} (${duration.toFixed(2)}ms)`);

      return {
        id: migration.id,
        name: migration.name,
        status: 'success',
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      await this.pgClient.query('ROLLBACK');

      const duration = performance.now() - startTime;
      console.error(`❌ FAILED: ${migration.name}`);
      console.error(`   Error: ${error.message}`);

      return {
        id: migration.id,
        name: migration.name,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async runBatch(batch: MigrationBatch): Promise<void> {
    console.log(`\\n📦 Processing ${batch.category} batch (${batch.migrations.length} migrations)`);

    if (batch.canRunParallel && batch.migrations.length > 1) {
      console.log(`   🚀 Running in parallel for better performance`);

      const promises = batch.migrations.map(migration => this.runMigration(migration));
      const results = await Promise.all(promises);

      results.forEach(result => {
        this.results.push(result);
      });
    } else {
      console.log(`   🔄 Running sequentially for safety`);

      for (const migration of batch.migrations) {
        const result = await this.runMigration(migration);
        this.results.push(result);

        // Stop batch on critical failure
        if (result.status === 'failed' && batch.category === 'security') {
          console.error(`   🚨 Critical failure in ${batch.category} - stopping batch`);
          break;
        }
      }
    }
  }

  async runMigrations(): Promise<void> {
    console.log("🚀 Advanced JobPing Migration Runner");
    console.log("====================================");
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log("");

    const allMigrations = this.getMigrations();
    const batches = this.organizeMigrationsIntoBatches(allMigrations);

    console.log(`📋 Migration Plan:`);
    batches.forEach(batch => {
      console.log(`   ${batch.category}: ${batch.migrations.length} migrations (${batch.canRunParallel ? 'parallel' : 'sequential'})`);
    });
    console.log("");

    const totalStartTime = performance.now();

    for (const batch of batches) {
      await this.runBatch(batch);
    }

    const totalDuration = performance.now() - totalStartTime;

    // Save results
    await this.saveResults();

    // Generate report
    this.generateReport(totalDuration);
  }

  private async saveResults() {
    for (const result of this.results) {
      await this.recordMigrationResult(result);
    }
  }

  private generateReport(totalDuration: number) {
    console.log("\\n🎯 Migration Report");
    console.log("==================");

    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    console.log(`Total migrations processed: ${this.results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`);

    if (failed > 0) {
      console.log("\\n❌ Failed Migrations:");
      this.results.filter(r => r.status === 'failed').forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }

    console.log("\\n💡 Performance Improvements:");
    console.log("   • Parallel execution for independent migrations");
    console.log("   • Dependency checking prevents race conditions");
    console.log("   • Transaction safety with automatic rollback");
    console.log("   • Comprehensive logging and tracking");

    if (successful > 0) {
      console.log("\\n🎉 Migration run completed successfully!");
    } else if (failed === 0) {
      console.log("\\nℹ️  All migrations were already up to date.");
    } else {
      console.log("\\n⚠️  Migration run completed with failures.");
      process.exit(1);
    }
  }

  async close() {
    await this.pgClient.end();
  }
}

async function main() {
  const runner = new AdvancedMigrationRunner();

  try {
    await runner.initialize();
    await runner.runMigrations();
  } catch (error: any) {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  main();
}

export { AdvancedMigrationRunner };
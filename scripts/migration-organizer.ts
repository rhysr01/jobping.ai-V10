#!/usr/bin/env tsx

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join, extname } from "path";

interface MigrationFile {
  filename: string;
  timestamp: string;
  category: string;
  description: string;
  size: number;
}

class MigrationOrganizer {
  private migrationDir: string;
  private organizedDir: string;

  constructor() {
    this.migrationDir = resolve(process.cwd(), "supabase", "migrations");
    this.organizedDir = resolve(process.cwd(), "supabase", "migrations_organized");
  }

  analyzeMigrations(): MigrationFile[] {
    console.log("🔍 Analyzing Migration Files");
    console.log("===========================");

    const files = readdirSync(this.migrationDir)
      .filter(file => file.endsWith('.sql'))
      .map(filename => {
        const filePath = join(this.migrationDir, filename);
        const stats = require('fs').statSync(filePath);
        const content = readFileSync(filePath, 'utf-8');

        // Extract timestamp and description from filename
        const timestampMatch = filename.match(/^(\d{14})/);
        const timestamp = timestampMatch ? timestampMatch[1] : 'unknown';

        // Categorize based on content analysis
        let category = 'unknown';
        if (content.includes('RLS') || content.includes('POLICY') || content.includes('GRANT')) {
          category = 'security';
        } else if (content.includes('CREATE TABLE') || content.includes('ALTER TABLE') || content.includes('CREATE INDEX')) {
          category = 'schema';
        } else if (content.includes('UPDATE jobs') || content.includes('filtered_reason') || content.includes('is_active')) {
          category = 'maintenance';
        } else if (content.includes('company_name') || content.includes('location') || content.includes('categories')) {
          category = 'data_quality';
        }

        // Extract description from filename or content
        let description = filename.replace(/^\d+_/g, '').replace(/\.sql$/, '').replace(/_/g, ' ');

        return {
          filename,
          timestamp,
          category,
          description,
          size: stats.size
        };
      })
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    console.log(`Found ${files.length} migration files`);
    return files;
  }

  generateReport(files: MigrationFile[]): void {
    console.log("\\n📊 Migration Analysis Report");
    console.log("============================");

    // Category breakdown
    const categories = files.reduce((acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\\n📁 Category Breakdown:");
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} files`);
    });

    // Size analysis
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    console.log(`\\n💾 Total Size: ${(totalSize / 1024).toFixed(2)} KB`);

    // Timeline analysis
    const timeline = files.reduce((acc, file) => {
      if (file.timestamp !== 'unknown') {
        const year = file.timestamp.substring(0, 4);
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    console.log("\\n📅 Timeline:");
    Object.entries(timeline)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([year, count]) => {
        console.log(`   ${year}: ${count} migrations`);
      });

    // Identify issues
    console.log("\\n⚠️  Issues Found:");
    const issues = [];

    // Check for duplicate timestamps
    const timestamps = files.map(f => f.timestamp).filter(t => t !== 'unknown');
    const duplicates = timestamps.filter((t, i) => timestamps.indexOf(t) !== i);
    if (duplicates.length > 0) {
      issues.push(`Duplicate timestamps: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check for very large files
    const largeFiles = files.filter(f => f.size > 50000); // 50KB
    if (largeFiles.length > 0) {
      issues.push(`${largeFiles.length} files larger than 50KB (may be too complex)`);
    }

    // Check for unknown categories
    const unknownCount = categories.unknown || 0;
    if (unknownCount > 0) {
      issues.push(`${unknownCount} files with unknown category`);
    }

    if (issues.length === 0) {
      console.log("   ✅ No major issues found");
    } else {
      issues.forEach(issue => console.log(`   • ${issue}`));
    }
  }

  organizeFiles(files: MigrationFile[]): void {
    console.log("\\n📦 Organizing Migration Files");
    console.log("=============================");

    // Create organized directory structure
    const categories = ['schema', 'data_quality', 'security', 'maintenance', 'unknown'];

    categories.forEach(category => {
      const categoryDir = join(this.organizedDir, category);
      try {
        mkdirSync(categoryDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    });

    // Copy files to organized structure
    let organizedCount = 0;
    files.forEach(file => {
      const sourcePath = join(this.migrationDir, file.filename);
      const destPath = join(this.organizedDir, file.category, file.filename);

      try {
        const content = readFileSync(sourcePath, 'utf-8');
        writeFileSync(destPath, content);
        organizedCount++;
        console.log(`   📄 ${file.filename} → ${file.category}/`);
      } catch (error: any) {
        console.error(`   ❌ Failed to organize ${file.filename}: ${error.message}`);
      }
    });

    console.log(`\\n✅ Organized ${organizedCount} migration files`);

    // Generate README
    this.generateReadme(files);
  }

  private generateReadme(files: MigrationFile[]): void {
    const readme = `# Migration Organization

This directory contains organized migration files, categorized by purpose.

## Categories

### Schema Migrations
Database structure changes (tables, indexes, constraints)
- Located in: \`schema/\`
- Files: ${files.filter(f => f.category === 'schema').length}

### Data Quality Migrations
Data cleanup and normalization operations
- Located in: \`data_quality/\`
- Files: ${files.filter(f => f.category === 'data_quality').length}

### Security Migrations
Row Level Security (RLS), permissions, and access controls
- Located in: \`security/\`
- Files: ${files.filter(f => f.category === 'security').length}

### Maintenance Migrations
Ongoing data maintenance and filtering operations
- Located in: \`maintenance/\`
- Files: ${files.filter(f => f.category === 'maintenance').length}

## Execution Order

Migrations should be executed in chronological order within each category:

1. **Schema** (first - establishes database structure)
2. **Security** (second - sets up access controls)
3. **Data Quality** (third - cleans existing data)
4. **Maintenance** (ongoing - filters and maintains data quality)

## Best Practices

- Always backup before running migrations
- Test migrations on staging environment first
- Run schema/security migrations sequentially
- Data quality/maintenance migrations can run in parallel
- Monitor execution time and success/failure rates

## Recent Migrations

${files.slice(-10).map(f => `- ${f.timestamp}: ${f.description} (${f.category})`).join('\\n')}

---

*Generated on: ${new Date().toISOString()}*
*Total migrations: ${files.length}*
`;

    writeFileSync(join(this.organizedDir, 'README.md'), readme);
    console.log("   📝 Generated README.md with migration documentation");
  }

  generateCleanupScript(): void {
    console.log("\\n🧹 Generating Cleanup Script");
    console.log("===========================");

    const cleanupScript = `#!/bin/bash

# Migration Cleanup Script
# This script helps manage and clean up migration files

echo "🧹 Migration Cleanup Utility"
echo "==========================="

MIGRATION_DIR="supabase/migrations"
BACKUP_DIR="supabase/migrations_backup_\$(date +%Y%m%d_%H%M%S)"

# Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r "$MIGRATION_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup created in: $BACKUP_DIR"

echo ""
echo "Available cleanup options:"
echo "1. Remove duplicate migrations (same timestamp)"
echo "2. Archive old maintenance migrations (>6 months)"
echo "3. Compress large migration files"
echo "4. Validate migration file integrity"
echo "5. Generate migration dependency graph"
echo ""
echo "Run with: ./cleanup-migrations.sh <option_number>"
`;

    const cleanupScriptPath = join(process.cwd(), 'scripts', 'cleanup-migrations.sh');
    writeFileSync(cleanupScriptPath, cleanupScript);
    console.log("   ✅ Generated cleanup script: scripts/cleanup-migrations.sh");
  }

  run(): void {
    const files = this.analyzeMigrations();
    this.generateReport(files);
    this.organizeFiles(files);
    this.generateCleanupScript();

    console.log("\\n🎉 Migration Organization Complete!");
    console.log("==================================");
    console.log("✅ Analyzed all migration files");
    console.log("✅ Generated organization report");
    console.log("✅ Organized files by category");
    console.log("✅ Created documentation");
    console.log("✅ Generated cleanup utilities");
    console.log("");
    console.log("📂 Organized files available in: supabase/migrations_organized/");
    console.log("📋 See README.md for detailed information");
  }
}

async function main() {
  const organizer = new MigrationOrganizer();
  organizer.run();
}

if (require.main === module) {
  main();
}

export { MigrationOrganizer };
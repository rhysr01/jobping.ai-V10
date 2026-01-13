#!/bin/bash

# Migration Cleanup Script
# This script helps manage and clean up migration files

echo "🧹 Migration Cleanup Utility"
echo "==========================="

MIGRATION_DIR="supabase/migrations"
BACKUP_DIR="supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)"

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

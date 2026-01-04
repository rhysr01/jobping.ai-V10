#!/bin/bash
# JobPing Repository Consolidation Script
# Run with --dry-run first to preview changes

set -e  # Exit on error

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No files will be moved"
fi

echo "🧹 JobPing Repository Consolidation"
echo "===================================="

# Function to safely move files
safe_move() {
    local src="$1"
    local dest="$2"
    if [ -e "$src" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo "  [DRY RUN] Would move: $src -> $dest"
        else
            mkdir -p "$(dirname "$dest")"
            mv "$src" "$dest"
            echo "  ✅ Moved: $src -> $dest"
        fi
    fi
}

# Function to safely remove directories
safe_rmdir() {
    local dir="$1"
    if [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo "  [DRY RUN] Would remove empty directory: $dir"
        else
            rmdir "$dir"
            echo "  ✅ Removed empty directory: $dir"
        fi
    fi
}

# 1. Create new documentation structure
echo ""
echo "📁 Creating documentation structure..."
if [ "$DRY_RUN" = false ]; then
    mkdir -p docs/archive/legacy-sql
    mkdir -p docs/guides
    mkdir -p docs/status
    echo "  ✅ Created directory structure"
else
    echo "  [DRY RUN] Would create: docs/archive/legacy-sql, docs/guides, docs/status"
fi

# 2. Move root-level status/fix/report markdown files
echo ""
echo "📄 Moving root-level markdown files to docs/status..."
for file in *SUMMARY.md *COMPLETE.md *FIXES.md *REPORT.md *STRATEGY.md *PROGRESS.md *APPLIED.md *VERIFICATION.md *SERVICES*.md; do
    if [ -f "$file" ]; then
        safe_move "$file" "docs/status/$file"
    fi
done

# Move specific root files
safe_move "IMPROVEMENTS_SUMMARY.md" "docs/status/IMPROVEMENTS_SUMMARY.md"
safe_move "CODE_SMELL_REPORT.md" "docs/status/CODE_SMELL_REPORT.md"
safe_move "STRATIFIED_MATCHING_IMPLEMENTATION.md" "docs/status/STRATIFIED_MATCHING_IMPLEMENTATION.md"
safe_move "TEST_CLEANUP_STRATEGY.md" "docs/status/TEST_CLEANUP_STRATEGY.md"
safe_move "TESTING_PRINCIPLES.md" "docs/status/TESTING_PRINCIPLES.md"

# 3. Consolidate migrations
echo ""
echo "🗄️  Archiving legacy migrations..."
if [ -d "migrations" ] && [ "$(ls -A migrations/*.sql 2>/dev/null)" ]; then
    for sql_file in migrations/*.sql; do
        if [ -f "$sql_file" ]; then
            safe_move "$sql_file" "docs/archive/legacy-sql/$(basename "$sql_file")"
        fi
    done
    safe_rmdir "migrations"
else
    echo "  ℹ️  No legacy migrations found or directory already empty"
fi

# 4. Clean up loose files
echo ""
echo "🧼 Cleaning up loose files..."
safe_move "delete_rhys_emails.sql" "scripts/delete_rhys_emails.sql"
if [ -f "current-scripts.json" ]; then
    safe_move "current-scripts.json" "scripts/reference-scripts-to-port.json"
    echo "  ⚠️  Review scripts/reference-scripts-to-port.json and port useful scripts to package.json"
fi

# 5. Remove empty directories
echo ""
echo "🗑️  Removing empty directories..."
safe_rmdir "services"

# 6. Organize docs/ into subdirectories
echo ""
echo "📚 Organizing documentation..."
# Move migration-related docs to guides (they're still relevant)
if [ "$DRY_RUN" = false ]; then
    # These are guides, not status reports
    for guide in docs/MIGRATION_RUN_ORDER.md docs/MIGRATION_EXPLANATION.md docs/PRODUCTION_GUIDE.md docs/RUNBOOK.md docs/CONTRIBUTING.md; do
        if [ -f "$guide" ]; then
            safe_move "$guide" "docs/guides/$(basename "$guide")"
        fi
    done
else
    echo "  [DRY RUN] Would move guide files to docs/guides/"
fi

# Create README in docs/ to explain structure
if [ "$DRY_RUN" = false ]; then
    cat > docs/README.md << 'EOF'
# JobPing Documentation

## Structure

- **`guides/`** - Active documentation for how to run, deploy, and operate JobPing
  - `PRODUCTION_GUIDE.md` - Production deployment and configuration
  - `RUNBOOK.md` - Operational procedures and incident response
  - `MIGRATION_RUN_ORDER.md` - Database migration execution order
  - `MIGRATION_EXPLANATION.md` - Understanding Supabase migrations
  - `CONTRIBUTING.md` - Contribution guidelines

- **`status/`** - Historical status reports, audit logs, and fix summaries
  - These are snapshots of project state at various points in time
  - Useful for understanding historical context but not active guides

- **`archive/`** - Archived legacy files
  - `legacy-sql/` - Old SQL migration scripts (superseded by `supabase/migrations/`)

## Quick Links

- Start here: [`guides/PRODUCTION_GUIDE.md`](./guides/PRODUCTION_GUIDE.md)
- Operations: [`guides/RUNBOOK.md`](./guides/RUNBOOK.md)
- Handoff: [`../HANDOFF.md`](../HANDOFF.md)
- Main README: [`../README.md`](../README.md)
EOF
    echo "  ✅ Created docs/README.md"
else
    echo "  [DRY RUN] Would create docs/README.md"
fi

echo ""
echo "✨ Consolidation complete!"
if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "⚠️  This was a dry run. Review the changes above, then run without --dry-run to apply."
else
    echo ""
    echo "📋 Next steps:"
    echo "  1. Review scripts/reference-scripts-to-port.json"
    echo "  2. Port useful scripts to package.json"
    echo "  3. Update any hardcoded paths in code/docs that reference old locations"
    echo "  4. Commit changes: git add . && git commit -m 'chore: consolidate repo structure for handoff'"
fi


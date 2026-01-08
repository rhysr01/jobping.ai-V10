#!/bin/bash

# Ultra-Safe Maintenance Migration Runner
# Run these one at a time to avoid Supabase timeouts

echo "🛠️  JobPing Maintenance Migration Runner"
echo "========================================"
echo ""

# Function to run a migration with error checking
run_migration() {
    local migration_name="$1"
    local description="$2"

    echo "▶️  Running: $description"
    echo "   Migration: $migration_name"

    if npx supabase db push; then
        echo "✅ SUCCESS: $description"
        echo ""
    else
        echo "❌ FAILED: $description"
        echo "   You may need to:"
        echo "   - Check your internet connection"
        echo "   - Verify Supabase credentials"
        echo "   - Try running again"
        echo ""
        exit 1
    fi
}

echo "📋 Available Migrations:"
echo "1. Fix Company Names (1000 rows batch)"
echo "2. Extract Countries from Location Names"
echo "3. Extract Cities from Comma-separated Locations"
echo "4. Filter Job Board Companies"
echo "5. Enable RLS Security"
echo ""

# Run migrations one by one
run_migration "20260108205100_fix_company_names_batch.sql" "Company Names Sync"
run_migration "20260108205101_fix_location_country_extraction.sql" "Country Extraction"
run_migration "20260108205102_fix_location_city_extraction.sql" "City Extraction"
run_migration "20260108205103_filter_job_boards.sql" "Job Board Filtering"
run_migration "20260108205104_enable_rls_security.sql" "RLS Security Setup"

echo "🎉 All maintenance migrations completed successfully!"
echo ""
echo "📊 To verify results, run the verification queries:"
echo "   supabase/migrations/20260108204908_daily_maintenance_verification_queries.sql"
echo ""
echo "💡 Note: You can run individual migrations by setting SUPABASE_MIGRATION=filename.sql"

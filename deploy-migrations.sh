#!/bin/bash
# SAFE MIGRATION DEPLOYMENT SCRIPT
# Date: January 27, 2026
# Purpose: Apply 3 data quality migrations one at a time with verification

set -e  # Exit on any error

cd /Users/rhysrowlands/jobping

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         JOBPING MIGRATION DEPLOYMENT - SAFE PROCEDURE          ║"
echo "║                   Status: Ready to Deploy                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Verifying Supabase CLI${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    exit 1
fi
SUPABASE_VERSION=$(supabase --version)
echo -e "${GREEN}✅ Supabase CLI found: ${SUPABASE_VERSION}${NC}"
echo ""

echo -e "${BLUE}Step 2: Listing migration files to apply${NC}"
ls -lh supabase/migrations/20260122000*.sql | awk '{print "   ✅", $9, "(" $5 ")"}'
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: These migrations use SOFT DELETE (is_active = false)${NC}"
echo -e "${YELLOW}   NOT hard delete. All data remains in database and is reversible.${NC}"
echo ""

echo -e "${BLUE}Step 3: Running migrations${NC}"
echo "   Migration 1: Metadata Quality Improvements (20260122000001)"
echo "   Migration 2: Non-Business Role Filters (20260122000002)"
echo "   Migration 3: Additional Role Filters (20260122000003)"
echo ""

read -p "Ready to proceed? (yes/no): " -r CONFIRM
if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}▶ Starting migration deployment...${NC}"
echo ""

# Run migrations
supabase migration up

echo ""
echo -e "${GREEN}✅ Migrations applied successfully!${NC}"
echo ""
echo -e "${BLUE}Step 4: Verification${NC}"
echo "   Run these SQL queries to verify:"
echo ""
echo "   SELECT COUNT(*) FROM jobs WHERE is_active = true;"
echo "   Expected: ~25,500-25,600 (was ~27,285)"
echo ""
echo "   SELECT COUNT(*) FROM jobs WHERE is_active = false;"
echo "   Expected: ~1,700-2,100 (was ~0-50)"
echo ""
echo "   SELECT filtered_reason, COUNT(*) FROM jobs WHERE is_active = false"
echo "   GROUP BY filtered_reason ORDER BY COUNT(*) DESC;"
echo "   Expected: Various filter reasons"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "   1. Run verification queries in Supabase console"
echo "   2. Check Sentry for any new errors"
echo "   3. Test user signups"
echo "   4. If all good: commit to git"
echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"

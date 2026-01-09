#!/bin/bash
# JobPing Status Checker
# Quick overview of scraping system health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
echo "🏥 JobPing System Status Check"
echo "================================"

# Check if scraping is running
echo ""
log_info "🔍 Checking for running processes..."
if pgrep -f "real-job-runner\|daily-scrape" > /dev/null; then
    log_success "Scraping process is currently running"
    ps aux | grep -E "(real-job-runner|daily-scrape)" | grep -v grep | while read line; do
        echo "  $line"
    done
else
    log_info "No scraping process currently running"
fi

# Check database connectivity
echo ""
log_info "💾 Checking database connection..."
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

supabase.from('jobs').select('count', { count: 'exact', head: true }).then(({ count, error }) => {
    if (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
    console.log('✅ Database connected -', count, 'total jobs');
}).catch(err => {
    console.error('❌ Connection test failed:', err.message);
    process.exit(1);
});
" 2>/dev/null

# Check recent jobs
echo ""
log_info "📊 Recent job activity..."
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentJobs() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Jobs in last hour
        const { count: lastHour, error: hourError } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: false })
            .gte('created_at', oneHourAgo.toISOString());

        // Jobs in last 24 hours
        const { count: lastDay, error: dayError } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: false })
            .gte('created_at', oneDayAgo.toISOString());

        // Total jobs
        const { count: total, error: totalError } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: false });

        if (hourError || dayError || totalError) {
            console.error('❌ Error fetching job counts');
            return;
        }

        console.log(\`📈 Jobs in last hour: \${lastHour}\`);
        console.log(\`📈 Jobs in last 24 hours: \${lastDay}\`);
        console.log(\`📊 Total jobs in database: \${total}\`);

        // Check latest job
        const { data: latest, error: latestError } = await supabase
            .from('jobs')
            .select('created_at, source, title')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!latestError && latest && latest.length > 0) {
            const latestJob = latest[0];
            const timeDiff = Math.round((now - new Date(latestJob.created_at)) / (1000 * 60));
            console.log(\`🕐 Latest job: \${timeDiff} minutes ago from \${latestJob.source}\`);
        }

    } catch (error) {
        console.error('❌ Status check failed:', error.message);
    }
}

checkRecentJobs();
" 2>/dev/null

# Check log files
echo ""
log_info "📝 Recent log files..."
if ls daily-scrape-*.log 1> /dev/null 2>&1; then
    echo "Recent scraping logs:"
    ls -la daily-scrape-*.log | head -5 | while read line; do
        echo "  $line"
    done
else
    log_warning "No scraping log files found"
fi

# Check disk space
echo ""
log_info "💽 Disk space..."
df -h "$PROJECT_DIR" | tail -1 | awk '{print "  Available:", $4, "Used:", $3}'

# Check memory
echo ""
log_info "🧠 Memory usage..."
if command -v free &> /dev/null; then
    free -h | grep "^Mem:" | awk '{print "  Used:", $3, "Available:", $4}'
elif command -v vm_stat &> /dev/null; then
    # macOS
    vm_stat | grep "Pages free" | awk '{print "  Free memory pages:", $3}'
fi

echo ""
log_info "✅ Status check complete!"
echo ""
echo "💡 Quick actions:"
echo "  • Run scraping: ./daily-scrape.sh"
echo "  • Check this status again: ./check-status.sh"
echo "  • View logs: tail -f daily-scrape-*.log"
echo "  • Stop scraping: pkill -f real-job-runner"

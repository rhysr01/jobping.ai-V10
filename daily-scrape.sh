#!/bin/bash
# JobPing Daily Scraping Script
# Run this twice daily: morning and evening

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_DIR/daily-scrape-$(date +%Y%m%d-%H%M%S).log"
PID_FILE="$PROJECT_DIR/scraper.pid"

# Logging functions
log_info() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] ✅${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ❌${NC} $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Check if another instance is running
check_running() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            log_error "Another scraping process is already running (PID: $OLD_PID)"
            log_error "Please wait for it to complete or kill it manually: kill $OLD_PID"
            exit 1
        else
            log_warning "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
    echo $$ > "$PID_FILE"
}

# Pre-flight checks
preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "Not in project directory. Please run from the jobping root directory."
        exit 1
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi

    log_success "Node.js version: $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi

    log_success "npm version: $(npm --version)"

    # Check Python (for JobSpy)
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 is not installed or not in PATH"
        exit 1
    fi

    log_success "Python3 version: $(python3 --version)"

    # Check if JobSpy is installed
    if ! python3 -c "import jobspy" 2>/dev/null; then
        log_warning "JobSpy not installed. Installing..."
        python3 -m pip install python-jobspy || {
            log_error "Failed to install JobSpy"
            exit 1
        }
    fi

    log_success "JobSpy is available"

    # Check environment file
    if [ ! -f ".env.local" ]; then
        log_error ".env.local file not found. Please create it with your API keys."
        log_info "Required environment variables:"
        log_info "  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
        log_info "  - SUPABASE_SERVICE_ROLE_KEY"
        log_info "  - ADZUNA_APP_ID and ADZUNA_APP_KEY (optional)"
        log_info "  - REED_API_KEY (optional)"
        log_info "  - JOOBLE_API_KEY (optional)"
        log_info "  - CAREERJET_API_KEY (optional)"
        exit 1
    fi

    log_success "Environment file found"

    # Test Supabase connection
    log_info "Testing Supabase connection..."
    node -e "
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }
    const supabase = createClient(url, key);
    supabase.from('jobs').select('count', { count: 'exact', head: true }).then(({ count, error }) => {
        if (error) {
            console.error('Supabase connection failed:', error.message);
            process.exit(1);
        }
        console.log('✅ Supabase connected successfully');
    }).catch(err => {
        console.error('Connection test failed:', err.message);
        process.exit(1);
    });
    " 2>&1 | tee -a "$LOG_FILE"

    if [ $? -ne 0 ]; then
        log_error "Supabase connection test failed"
        exit 1
    fi

    log_success "All pre-flight checks passed!"
}

# Run the scraping
run_scraping() {
    log_info "Starting JobPing scraping cycle..."
    log_info "Log file: $LOG_FILE"

    # Set environment variables
    export NODE_ENV=production
    export GITHUB_ACTIONS=false  # Ensure we're not in CI mode

    # Run the scraper
    START_TIME=$(date +%s)
    log_info "🚀 Starting scraping at $(date)"

    # Run with timeout (2 hours max) - compatible with macOS and Linux
    if command -v timeout &> /dev/null; then
        # Linux
        timeout 7200 node automation/real-job-runner.cjs --single-run 2>&1 | tee -a "$LOG_FILE"
    else
        # macOS - use a simple timeout implementation
        node automation/real-job-runner.cjs --single-run 2>&1 | tee -a "$LOG_FILE" &
        SCRAPER_PID=$!
        # Wait up to 2 hours (7200 seconds)
        for i in {1..7200}; do
            if ! kill -0 $SCRAPER_PID 2>/dev/null; then
                break
            fi
            sleep 1
        done
        # Kill if still running
        if kill -0 $SCRAPER_PID 2>/dev/null; then
            log_warning "Scraping timed out after 2 hours, killing process"
            kill $SCRAPER_PID 2>/dev/null || true
            wait $SCRAPER_PID 2>/dev/null || true
        fi
    fi

    EXIT_CODE=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [ $EXIT_CODE -eq 0 ]; then
        log_success "Scraping completed successfully in $(($DURATION / 60)) minutes $(($DURATION % 60)) seconds"
    elif [ $EXIT_CODE -eq 124 ]; then
        log_warning "Scraping timed out after 2 hours"
    else
        log_error "Scraping failed with exit code $EXIT_CODE"
        return $EXIT_CODE
    fi
}

# Generate summary report
generate_report() {
    log_info "Generating daily report..."

    # Count jobs added today
    TODAY=$(date +%Y-%m-%d)
    node -e "
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    async function generateReport() {
        try {
            // Jobs added today
            const { count: todayJobs, error: todayError } = await supabase
                .from('jobs')
                .select('id', { count: 'exact', head: false })
                .gte('created_at', '$TODAY');

            if (todayError) throw todayError;

            // Total jobs
            const { count: totalJobs, error: totalError } = await supabase
                .from('jobs')
                .select('id', { count: 'exact', head: false });

            if (totalError) throw totalError;

            // Recent jobs by source
            const { data: recentJobs, error: recentError } = await supabase
                .from('jobs')
                .select('source')
                .gte('created_at', '$TODAY')
                .limit(1000);

            if (recentError) throw recentError;

            const sourceCounts = recentJobs.reduce((acc, job) => {
                acc[job.source] = (acc[job.source] || 0) + 1;
                return acc;
            }, {});

            console.log('📊 Daily Scraping Report');
            console.log('========================');
            console.log(\`📅 Date: \${new Date().toLocaleDateString()}\`);
            console.log(\`📈 Jobs added today: \${todayJobs}\`);
            console.log(\`📊 Total jobs in database: \${totalJobs}\`);
            console.log('');
            console.log('📋 Jobs by source today:');
            Object.entries(sourceCounts)
                .sort(([,a], [,b]) => b - a)
                .forEach(([source, count]) => {
                    console.log(\`  • \${source}: \${count} jobs\`);
                });

        } catch (error) {
            console.error('❌ Report generation failed:', error.message);
            process.exit(1);
        }
    }

    generateReport();
    " 2>&1 | tee -a "$LOG_FILE"
}

# Main execution
main() {
    echo ""
    log_info "🏁 Starting JobPing Daily Scraping"
    log_info "=================================="

    check_running
    preflight_checks
    run_scraping
    generate_report

    log_success "🎉 Daily scraping session completed!"
    log_info "Log saved to: $LOG_FILE"

    log_info "\n🧠 Triggering automated embedding refresh..."
    node -e "
    require('dotenv').config({ path: '.env.local' });
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const targetUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/process-embedding-queue`
        : `http://localhost:${process.env.PORT || 3000}/api/process-embedding-queue`;

    if (!process.env.CRON_SECRET) {
        console.error('❌ CRITICAL: CRON_SECRET is not set. Cannot securely trigger embedding queue.');
        process.exit(1);
    }

    console.log(`Calling embedding API endpoint: ${targetUrl}`);
    execAsync(`curl -s -X POST -H \"Content-Type: application/json\" -H \"Authorization: Bearer ${process.env.CRON_SECRET}\" \"${targetUrl}\"`)
        .then(({ stdout, stderr }) => {
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('✅ Embedding refresh trigger successful.');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Embedding refresh trigger failed:', error.message);
            process.exit(1);
        });
    " 2>&1 | tee -a "$LOG_FILE"

}

# Run main function
main "$@"

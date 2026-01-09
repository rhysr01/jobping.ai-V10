#!/bin/bash
# JobPing Control Center
# Unified interface for all JobPing operations

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_help() {
    echo ""
    echo -e "${BLUE}🎯 JobPing Control Center${NC}"
    echo "=========================="
    echo ""
    echo "Daily Operations:"
    echo "  scrape    - Run daily scraping (twice daily recommended)"
    echo "  status    - Check system status and recent activity"
    echo "  schedule  - Show schedule reminders and next run times"
    echo ""
    echo "Maintenance:"
    echo "  logs      - Show recent log files"
    echo "  clean     - Clean old log files (keep last 7 days)"
    echo "  test      - Run system health tests"
    echo ""
    echo "Emergency:"
    echo "  stop      - Stop any running scraping processes"
    echo "  reset     - Complete system reset"
    echo ""
    echo "Usage: ./jobping.sh <command>"
    echo "Example: ./jobping.sh scrape"
    echo ""
}

run_scrape() {
    echo -e "${GREEN}🚀 Starting JobPing daily scraping...${NC}"
    ./daily-scrape.sh
}

run_status() {
    echo -e "${BLUE}📊 Checking JobPing system status...${NC}"
    ./check-status.sh
}

run_schedule() {
    echo -e "${BLUE}📅 JobPing schedule reminder...${NC}"
    ./schedule-reminder.sh
}

show_logs() {
    echo -e "${BLUE}📝 Recent JobPing log files:${NC}"
    echo ""

    if ls daily-scrape-*.log 1> /dev/null 2>&1; then
        ls -la daily-scrape-*.log | head -10
        echo ""
        echo -e "${YELLOW}💡 View latest log:${NC}"
        LATEST_LOG=$(ls -t daily-scrape-*.log | head -1)
        echo "  tail -f $LATEST_LOG"
    else
        echo "No scraping logs found. Run './jobping.sh scrape' to create logs."
    fi
}

clean_logs() {
    echo -e "${BLUE}🧹 Cleaning old JobPing log files...${NC}"

    # Keep logs for last 7 days
    if ls daily-scrape-*.log 1> /dev/null 2>&1; then
        find . -name "daily-scrape-*.log" -mtime +7 -delete -print
        echo -e "${GREEN}✅ Old logs cleaned (kept last 7 days)${NC}"
    else
        echo "No log files to clean."
    fi
}

run_tests() {
    echo -e "${BLUE}🧪 Running JobPing system tests...${NC}"
    echo ""

    # Test Node.js
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js:$(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js not found${NC}"
    fi

    # Test npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm:$(npm --version)${NC}"
    else
        echo -e "${RED}❌ npm not found${NC}"
    fi

    # Test Python
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✅ Python3:$(python3 --version)${NC}"
    else
        echo -e "${RED}❌ Python3 not found${NC}"
    fi

    # Test JobSpy
    if python3 -c "import jobspy" 2>/dev/null; then
        echo -e "${GREEN}✅ JobSpy available${NC}"
    else
        echo -e "${RED}❌ JobSpy not available${NC}"
    fi

    # Test environment
    if [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ Environment file exists${NC}"
    else
        echo -e "${RED}❌ .env.local not found${NC}"
    fi

    # Test database
    if node -e "
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    supabase.from('jobs').select('count', { count: 'exact', head: true }).then(({ count, error }) => {
        if (error) {
            console.log('❌ Database connection failed');
            process.exit(1);
        }
        console.log('✅ Database connected');
        process.exit(0);
    }).catch(() => {
        console.log('❌ Database test failed');
        process.exit(1);
    });
    " 2>/dev/null; then
        echo -e "${GREEN}✅ Database connection${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
    fi

    echo ""
    echo -e "${GREEN}🎉 System tests complete!${NC}"
}

stop_processes() {
    echo -e "${YELLOW}🛑 Stopping JobPing processes...${NC}"

    # Stop scraping processes
    if pgrep -f "real-job-runner\|daily-scrape" > /dev/null; then
        pkill -f "real-job-runner\|daily-scrape"
        echo -e "${GREEN}✅ Scraping processes stopped${NC}"
    else
        echo "No scraping processes running"
    fi

    # Remove PID file
    if [ -f "scraper.pid" ]; then
        rm -f scraper.pid
        echo -e "${GREEN}✅ PID file cleaned${NC}"
    fi
}

reset_system() {
    echo -e "${RED}🔄 Performing complete JobPing system reset...${NC}"

    # Stop all processes
    stop_processes

    # Clean logs
    clean_logs

    # Remove temporary files
    rm -f *.tmp
    rm -f *.log.tmp

    echo -e "${GREEN}✅ System reset complete${NC}"
    echo ""
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo "  1. Check status: ./jobping.sh status"
    echo "  2. Run scraping: ./jobping.sh scrape"
}

# Main command handler
case "${1:-help}" in
    scrape)
        run_scrape
        ;;
    status)
        run_status
        ;;
    schedule)
        run_schedule
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_logs
        ;;
    test)
        run_tests
        ;;
    stop)
        stop_processes
        ;;
    reset)
        reset_system
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

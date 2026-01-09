#!/bin/bash
# JobPing Schedule Reminder
# Run this to get reminders about when to run scraping

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}📅 JobPing Daily Schedule Reminder${NC}"
echo "===================================="

# Current time
CURRENT_HOUR=$(date +%H)
CURRENT_MIN=$(date +%M)
CURRENT_TIME="$CURRENT_HOUR:$CURRENT_MIN"

echo -e "${BLUE}🕐 Current time: $(date +'%H:%M %Z')${NC}"
echo ""

# Define schedule (9 AM and 7 PM)
MORNING_HOUR=9
EVENING_HOUR=19

# Check if it's time to run
if [ "$CURRENT_HOUR" -eq "$MORNING_HOUR" ] && [ "$CURRENT_MIN" -lt 30 ]; then
    echo -e "${GREEN}🎯 MORNING SCRAPING TIME!${NC}"
    echo -e "${GREEN}▶️  Run: ./daily-scrape.sh${NC}"
    echo ""
    echo "This will scrape fresh jobs for the morning."
elif [ "$CURRENT_HOUR" -eq "$EVENING_HOUR" ] && [ "$CURRENT_MIN" -lt 30 ]; then
    echo -e "${GREEN}🎯 EVENING SCRAPING TIME!${NC}"
    echo -e "${GREEN}▶️  Run: ./daily-scrape.sh${NC}"
    echo ""
    echo "This will ensure fresh data throughout the day."
else
    # Calculate next run time
    if [ "$CURRENT_HOUR" -lt "$MORNING_HOUR" ]; then
        NEXT_RUN="9:00 AM"
        HOURS_LEFT=$((MORNING_HOUR - CURRENT_HOUR))
        MINS_LEFT=$((60 - CURRENT_MIN))
        if [ "$MINS_LEFT" -eq 60 ]; then
            MINS_LEFT=0
            HOURS_LEFT=$((HOURS_LEFT + 1))
        fi
    elif [ "$CURRENT_HOUR" -lt "$EVENING_HOUR" ]; then
        NEXT_RUN="7:00 PM"
        HOURS_LEFT=$((EVENING_HOUR - CURRENT_HOUR))
        MINS_LEFT=$((60 - CURRENT_MIN))
        if [ "$MINS_LEFT" -eq 60 ]; then
            MINS_LEFT=0
            HOURS_LEFT=$((HOURS_LEFT + 1))
        fi
    else
        NEXT_RUN="9:00 AM tomorrow"
        HOURS_LEFT=$((24 - CURRENT_HOUR + MORNING_HOUR))
        MINS_LEFT=$((60 - CURRENT_MIN))
        if [ "$MINS_LEFT" -eq 60 ]; then
            MINS_LEFT=0
            HOURS_LEFT=$((HOURS_LEFT + 1))
        fi
    fi

    echo -e "${BLUE}📋 Schedule Status:${NC}"
    echo "  ✅ Morning scraping: 9:00 AM daily"
    echo "  ✅ Evening scraping: 7:00 PM daily"
    echo ""
    echo -e "${YELLOW}⏰ Next scraping run: $NEXT_RUN${NC}"

    if [ "$HOURS_LEFT" -eq 0 ]; then
        echo -e "${YELLOW}   (in $MINS_LEFT minutes)${NC}"
    else
        echo -e "${YELLOW}   (in $HOURS_LEFT hours $MINS_LEFT minutes)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📊 Quick Stats:${NC}"

# Run status check (quiet mode)
STATS=$(./check-status.sh 2>/dev/null | grep -E "(Jobs in last|Total jobs|Latest job)" | head -3)

if [ -n "$STATS" ]; then
    echo "$STATS"
else
    echo "  Run ./check-status.sh for full statistics"
fi

echo ""
echo -e "${BLUE}💡 Quick Actions:${NC}"
echo "  • Run scraping now: ./daily-scrape.sh"
echo "  • Check status: ./check-status.sh"
echo "  • View this reminder: ./schedule-reminder.sh"
echo ""
echo -e "${GREEN}🎯 Keep your job data fresh with twice-daily scraping!${NC}"

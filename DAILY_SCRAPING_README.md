# JobPing Daily Scraping Workflow

This guide explains how to run your JobPing scraping system manually twice a day for reliable, local operation.

## 🚀 Quick Start

Run your scraping twice daily (morning and evening):

```bash
# Morning run (e.g., 9 AM)
./daily-scrape.sh

# Evening run (e.g., 7 PM)
./daily-scrape.sh
```

Check system status anytime:

```bash
./check-status.sh
```

## 📋 Daily Routine

### Morning Run (Recommended: 9 AM)
1. Open terminal in your JobPing project directory
2. Run: `./daily-scrape.sh`
3. Check results: `./check-status.sh`
4. Review logs if needed: `tail -f daily-scrape-*.log`

### Evening Run (Recommended: 7 PM)
1. Same process as morning
2. Ensures fresh data throughout the day

## 🛠️ Scripts Overview

### `daily-scrape.sh` - Main Scraping Script
- **Pre-flight checks**: Validates environment, dependencies, database connection
- **Runs full scraping cycle**: All 8 scrapers in optimized order
- **Comprehensive logging**: Detailed logs with timestamps
- **Error handling**: Stops on critical failures, reports issues
- **2-hour timeout**: Prevents hanging processes

### `check-status.sh` - System Health Check
- **Process status**: Shows if scraping is currently running
- **Database health**: Connection test and job counts
- **Recent activity**: Jobs added in last hour/day
- **System resources**: Disk space, memory usage
- **Log file overview**: Recent scraping logs

## 📊 What Happens Each Run

Your scraping system processes **~5000 jobs per cycle** across:

1. **JobSpy** (Indeed, Glassdoor, Internships)
2. **Adzuna** (EU job board)
3. **Reed** (UK jobs)
4. **CareerJet** (European jobs)
5. **Arbeitnow** (German/Austrian jobs)
6. **Jooble** (European jobs)

## 🔍 Monitoring & Troubleshooting

### Check Status
```bash
./check-status.sh
```

### View Recent Logs
```bash
# See latest log
ls -la daily-scrape-*.log | head -1
tail -f $(ls -t daily-scrape-*.log | head -1)
```

### Stop a Running Process
```bash
# Find process
ps aux | grep real-job-runner

# Kill it
pkill -f real-job-runner
```

### Common Issues

#### "Another scraping process is already running"
- Wait for the current run to finish (usually 30-60 minutes)
- Or kill it manually: `pkill -f real-job-runner`

#### "Database connection failed"
- Check your `.env.local` file has correct Supabase credentials
- Test connection: `node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"`

#### "Python3/JobSpy not found"
- Install Python dependencies: `pip install python-jobspy`
- Or run: `python3 -m pip install -r scripts/python-requirements.txt`

#### "Node.js dependencies missing"
- Install: `npm install`

## 📈 Expected Results

### Successful Run Indicators:
- ✅ "All pre-flight checks passed!"
- ✅ "Scraping completed successfully"
- 📊 Report showing jobs added (typically 1000-5000 jobs)

### Log Files:
- Created: `daily-scrape-YYYYMMDD-HHMMSS.log`
- Contains full execution details
- Automatically cleaned up (keeps last 10 days)

## ⏰ Timing

- **Typical runtime**: 30-60 minutes
- **Peak hours**: Avoid 9-5 business hours to reduce rate limiting
- **Frequency**: 2x daily provides fresh data without overwhelming APIs

## 🔧 Customization

### Change Job Targets
Edit environment variables in `.env.local`:
```bash
SCRAPER_CYCLE_JOB_TARGET=3000  # Reduce from 5000
JOBSPY_TARGET=300              # Adjust individual scraper limits
```

### Modify Schedule
Edit `daily-scrape.sh` timeouts or add custom logic.

### Add Notifications
Extend scripts to send notifications when runs complete.

## 🎯 Why This Approach Works

1. **Reliable**: Local execution avoids CI/CD reliability issues
2. **Controllable**: Full visibility and control over the process
3. **Cost-effective**: No cloud hosting costs yet
4. **Debuggable**: Easy to troubleshoot and fix issues
5. **Scalable**: Foundation for future cloud migration

## 🚨 Emergency Commands

```bash
# Complete system reset
pkill -f real-job-runner
pkill -f daily-scrape
rm -f scraper.pid

# Quick health check
./check-status.sh

# Manual single scraper test
node scrapers/reed-scraper-standalone.cjs
```

## 📞 Support

If you encounter persistent issues:
1. Check `./check-status.sh` output
2. Review latest log file: `tail -100 daily-scrape-*.log`
3. Test individual components manually
4. Ensure all environment variables are set correctly

This system provides reliable, daily job scraping with full control and monitoring capabilities! 🎉

# Scraper Timeout and Rate Limiting Improvements

**Date:** February 2, 2026  
**Purpose:** Increase reliability of CareerJet and Jooble scrapers by extending timeouts and implementing more aggressive rate limiting

## 🎯 Changes Made

### 1. Main Automation Script Timeouts (`automation/real-job-runner.cjs`)

#### CareerJet Scraper
- **Before:** 180 seconds (3 minutes)
- **After:** 480 seconds (8 minutes)
- **Improvement:** +167% timeout increase

#### Jooble Scraper  
- **Before:** 240 seconds (4 minutes)
- **After:** 600 seconds (10 minutes)
- **Improvement:** +150% timeout increase

#### Adzuna Scraper (Critical - 52% of job volume)
- **Before:** 300 seconds (5 minutes)
- **After:** 600 seconds (10 minutes)
- **Improvement:** +100% timeout increase

### 2. CareerJet Scraper Rate Limiting (`scrapers/careerjet.cjs`)

#### Page-to-Page Delays
- **Before:** 1 second between pages
- **After:** 2.5 seconds between pages
- **Improvement:** +150% slower pagination

#### Base Query Delay
- **Before:** 800ms base delay
- **After:** 1500ms base delay
- **Improvement:** +87.5% slower base rate

#### Maximum Adaptive Delay
- **Before:** 3 seconds max delay
- **After:** 5 seconds max delay
- **Improvement:** +67% higher ceiling

#### Request Timeout
- **Before:** 30 seconds per request
- **After:** 60 seconds per request
- **Improvement:** +100% longer individual request timeout

#### Query Reduction
- **Before:** 8 queries per city
- **After:** 6 queries per city
- **Improvement:** -25% fewer queries (more conservative)

### 3. Jooble Scraper Rate Limiting (`scrapers/jooble.cjs`)

#### Page-to-Page Delays
- **Before:** 2 seconds between pages
- **After:** 3.5 seconds between pages
- **Improvement:** +75% slower pagination

#### Query-to-Query Delays
- **Before:** 2 seconds between queries
- **After:** 3 seconds between queries
- **Improvement:** +50% slower query rate

#### Request Timeout
- **Before:** 60 seconds per request
- **After:** 90 seconds per request
- **Improvement:** +50% longer individual request timeout

#### Query Reduction
- **Before:** 8 queries per city
- **After:** 5 queries per city
- **Improvement:** -37.5% fewer queries (more conservative)

## 📊 Expected Impact

### Reliability Improvements
- **CareerJet:** Should complete successfully with 8-minute window and conservative rate limiting
- **Jooble:** Should complete successfully with 10-minute window and aggressive rate limiting
- **Adzuna:** Critical scraper gets 10-minute window (was failing at 52% of job volume)

### Performance Trade-offs
- **Longer execution time:** Scripts will take 2-3x longer to complete
- **Fewer total requests:** Reduced query counts prevent API overwhelm
- **Better success rate:** Higher chance of completion vs. timeout failures

### Request Volume Estimates
- **CareerJet:** ~12 cities × 6 queries × 2-3 pages = ~144-216 requests
- **Jooble:** ~15 cities × 5 queries × 3 pages = ~225 requests
- **Total execution time:** 15-20 minutes per scraper (vs. 3-4 minutes before)

## 🎯 Next Steps

1. **Test the changes** by running `./daily-scrape.sh` again
2. **Monitor success rates** - should see CareerJet and Jooble complete successfully
3. **Fine-tune if needed** - can adjust delays further if still seeing timeouts
4. **Consider API key upgrades** - if rate limits are still too restrictive

## 🔄 Rollback Plan

If the changes cause issues, the key values to revert:
- CareerJet timeout: 480s → 180s
- Jooble timeout: 600s → 240s  
- CareerJet delays: 2.5s → 1s (pages), 1500ms → 800ms (base)
- Jooble delays: 3.5s → 2s (pages), 3s → 2s (queries)
- Query counts: CareerJet 6 → 8, Jooble 5 → 8
# 🚀 EMBEDDING BACKFILL - QUICK REFERENCE

## The Problem (FIXED ✅)
```
Embedding processor was broken:
- UPSERT tried to INSERT with incomplete data
- Failed on NOT NULL column constraints silently
- Processing rate: 0 jobs/minute
```

## The Solution (DEPLOYED ✅)
```
Changed: .upsert() → .update()
Result: 14.7 jobs/sec ✅
Status: WORKING
```

## Current Status
```
Backfill: Running (27/400 iterations = 1,350 jobs done)
Progress: 6.75% complete
ETA: ~21 minutes remaining
Coverage: 21.81% → ~27% (will be 83% after this batch)
```

---

## Commands to Know

### Start Backfill (if not running)
```bash
bash scripts/trigger-embedding-backfill.sh http://localhost:3000 400 1
```

### Check Progress
```bash
tail -f /Users/rhysrowlands/jobping/backfill-massive.log
```

### Monitor Database
```bash
# In your SQL client:
SELECT COUNT(*) FROM jobs WHERE embedding IS NOT NULL;
```

### Stop Backfill
```bash
ps aux | grep backfill
kill -TERM [PID]
```

---

## Expected Timeline

```
Now:      1,350/20,000 jobs done (6.75%)
+5 min:   ~7,000 jobs done (35%)
+10 min:  ~12,000 jobs done (60%)
+15 min:  ~17,000 jobs done (85%)
+21 min:  20,000 jobs done (100%) ← Phase 1 complete

Then repeat 2 more times to reach 100% coverage of 32,322 total jobs
```

---

## Files Modified

1. **`/app/api/process-embedding-queue/route.ts`** - THE FIX
   - Changed UPSERT to UPDATE
   - Now working perfectly
   
2. **`/scripts/trigger-embedding-backfill.sh`** - NEW
   - Triggers 50 jobs at a time via HTTP
   - Repeatable for full backfill

---

## Results After Full Backfill

```
Before:  7,051 embeddings (21.81%)
After:   32,322 embeddings (100%)

Processing time: ~60 minutes (3 backfill runs × 20 min each)
Coverage: COMPLETE ✅
```

---

## Remember

- ✅ Dev server must be running: `npm run dev`
- ✅ Each iteration = 50 jobs
- ✅ 400 iterations = 20,000 jobs = ~22 minutes
- ✅ Need 3 total backfills to reach 100%
- ✅ Cron will auto-process new jobs going forward

---

**TL;DR**: Backfill is running. Check back in 20 minutes. Then run it 2 more times. Done.


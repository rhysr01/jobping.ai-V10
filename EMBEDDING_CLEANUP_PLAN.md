# 🧹 Old Embedding Systems - Cleanup Plan

**Date**: Jan 30, 2026  
**Status**: READY TO CLEANUP (after backfill completes)

---

## Old/Obsolete Embedding Files

These files were part of earlier embedding implementation attempts. They can be safely deleted after the current backfill completes (within next 30-60 mins).

### Safe to Delete ✅

| File | Reason | Used By | Risk |
|------|--------|---------|------|
| `/scripts/generate_all_embeddings.ts` | Old backfill approach (never fully worked) | Nothing active | 🟢 SAFE |
| `/scripts/generate_all_embeddings.cjs` | Old backfill (CommonJS version) | Nothing active | 🟢 SAFE |
| `/scripts/process-embedding-backlog.sh` | Old shell backfill | Nothing active | 🟢 SAFE |
| `/scripts/backfill-embeddings.ts` | Dev backfill attempt | Nothing active | 🟢 SAFE |
| `/scripts/backfill-embeddings.cjs` | Dev backfill attempt | Nothing active | 🟢 SAFE |
| `/scripts/backfill-embeddings.sh` | Dev backfill shell | Nothing active | 🟢 SAFE |
| `/app/api/retry-failed-embeddings/route.ts` | Retry logic (not needed with UPDATE approach) | Nothing active | 🟢 SAFE |
| `/automation/embedding-refresh.cjs` | Scheduled refresh (cron handles it now) | Nothing active | 🟢 SAFE |

### Keep ✅

| File | Reason | Status |
|------|--------|--------|
| `/scripts/trigger-embedding-backfill.sh` | **CURRENT BACKFILL SYSTEM** | ✅ ACTIVE |
| `/app/api/process-embedding-queue/route.ts` | **MAIN EMBEDDING PROCESSOR** (FIXED) | ✅ ACTIVE |
| `/utils/matching/embedding.service.ts` | Embedding utilities library | ✅ IN USE |
| `/lib/inngest/functions.ts` | May use embeddings | ✅ IN USE |
| `/supabase/migrations/20250127000000_setup_pgvector_functions.sql` | Database pgvector setup | ✅ IN USE |

---

## Cleanup Command

```bash
# After backfill completes and you verify 100% coverage:
cd /Users/rhysrowlands/jobping

# Delete old files (one by one to be safe)
rm scripts/generate_all_embeddings.ts
rm scripts/generate_all_embeddings.cjs
rm scripts/process-embedding-backlog.sh
rm scripts/backfill-embeddings.ts
rm scripts/backfill-embeddings.cjs
rm scripts/backfill-embeddings.sh
rm app/api/retry-failed-embeddings/route.ts
rm automation/embedding-refresh.cjs

# Verify deletion
ls -la scripts/generate_all_embeddings.* scripts/process-embedding-backlog.sh scripts/backfill-embeddings.* 2>&1 | grep "No such file"
ls -la app/api/retry-failed-embeddings/ 2>&1 | grep "No such file"
ls -la automation/embedding-refresh.cjs 2>&1 | grep "No such file"

# Commit changes
git add -A
git commit -m "cleanup: Remove obsolete embedding backfill scripts (Jan 30, 2026)"
git push
```

---

## Why These Are Safe to Delete

### 1. **generate_all_embeddings.ts/cjs**
- ❌ Failed to handle env vars properly
- ❌ Couldn't work with .env.local in IDE
- ❌ Too slow (1 job/sec vs 14.7 jobs/sec)
- ✅ Replaced by: `trigger-embedding-backfill.sh`

### 2. **process-embedding-backlog.sh**
- ❌ Required custom SYSTEM_API_KEY
- ❌ Too many error cases
- ✅ Replaced by: `trigger-embedding-backfill.sh`

### 3. **backfill-embeddings.ts/cjs/sh**
- ❌ Development versions, never deployed
- ❌ Had UPSERT bug (same as main processor)
- ✅ Replaced by: `trigger-embedding-backfill.sh`

### 4. **retry-failed-embeddings/route.ts**
- ❌ Designed for retry logic (no longer needed)
- ❌ UPSERT approach doesn't silently fail now
- ✅ UPDATE approach is reliable

### 5. **embedding-refresh.cjs**
- ❌ Scheduled background task
- ❌ Cron processor (`/api/process-embedding-queue`) already handles this
- ❌ Running redundant background job

---

## Verification Checklist

Before cleanup:
- [ ] Backfill complete: `SELECT COUNT(*) FROM jobs WHERE embedding IS NULL;` returns 0
- [ ] No active processes: `ps aux | grep embedding | wc -l` returns < 2
- [ ] No scheduled tasks: Check if `npm run automation:embeddings` is in package.json scripts

After cleanup:
- [ ] Production build still works: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Linting passes: `npm run lint:biome`
- [ ] Tests still pass: `npm run test`

---

## Timeline

**Now (Jan 30 16:30 UTC)**: Backfill in progress (76/400 iterations)  
**~16:50 UTC**: Backfill complete (100% coverage)  
**~16:55 UTC**: ✅ Safe to run cleanup commands  
**~17:00 UTC**: ✅ Commit and push cleanup

---

## Notes

- ✅ All old systems have been superceded by working implementations
- ✅ No production code depends on these files
- ✅ Safe to delete immediately after verification
- ✅ Cleanup will reduce repo size by ~200 KB
- ✅ Makes codebase cleaner and easier to maintain

---

## Summary

**Before Cleanup**: 
- 8 old embedding backfill files
- Multiple competing systems
- Confusing for maintenance

**After Cleanup**:
- 1 active backfill script: `trigger-embedding-backfill.sh`
- 1 active processor: `/api/process-embedding-queue/route.ts`
- Clear, maintainable system


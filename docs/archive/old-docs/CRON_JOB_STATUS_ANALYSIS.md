# Cron Job & Migration Status Analysis

**Date**: January 27, 2026  
**Issue**: Data quality problems (missing embeddings, descriptions, locations) are NOT being fixed by migrations

---

## 🔴 CRITICAL: Embedding Generation is a Stub

### Current State
**File**: `/app/api/process-embedding-queue/route.ts`

```typescript
// Line 11-16: TODO comments - NOT IMPLEMENTED
// TODO: Implement actual embedding processing logic
// This could involve:
// 1. Fetching jobs without embeddings from database
// 2. Generating embeddings using OpenAI
// 3. Storing embeddings back to database
// 4. Processing in batches to avoid rate limits

// Line 18: Just returns success without doing anything
console.log("[Embedding Queue] Queue processing completed");

return NextResponse.json({
  success: true,
  message: "Embedding queue processed successfully",
  processed: 0, // TODO: Return actual count
  timestamp: new Date().toISOString(),
});
```

### Schedule
**File**: `vercel.json` (line 36-38)
```json
{
  "path": "/api/process-embedding-queue",
  "schedule": "*/5 * * * *"  // Every 5 minutes
}
```

### Result
✅ Cron job runs successfully every 5 minutes (no errors)  
❌ But processes 0 embeddings  
❌ 27,285 jobs still have NO embeddings after weeks of running

---

## 🟡 PARTIALLY WORKING: Run-Maintenance Cron

### Current State
**File**: `/app/api/cron/run-maintenance/route.ts`

**Schedule**: `0 3 * * *` (Daily at 3 AM UTC)

**What It Does** (Lines 25-520):
1. ✅ Company names sync (Line 25-69)
2. ✅ Job board filtering (Line 71-163)
3. ✅ CEO & executive filtering (Line 165-218)
4. ✅ Construction role filtering (Line 220-299)
5. ✅ Medical & healthcare filtering (Line 301-377)
6. ✅ Legal role filtering (Line 379-444)
7. ✅ Teaching & education filtering (Line 446-520)
8. ✅ Data integrity enforcement (Line 522-685)
   - Fixes NULL visa statuses → sets to `false`
   - Fixes invalid categories → maps to valid ones
   - Processes in batches of 1000

**Missing From Maintenance**:
❌ No embedding generation  
❌ No description extraction/improvement  
❌ No location enhancement  
❌ Only handles filtering, not data quality

---

## 🔴 DISABLED: Key Data Quality Migrations

Several important migrations are **disabled** (suffix: `.disabled`) and not being applied:

### 1. Additional Role Filters
**File**: `supabase/migrations/20260121000000_additional_role_filters.sql.disabled`
- **Status**: NOT RUNNING
- **Purpose**: Additional filtering rules beyond maintenance cron

### 2. Metadata Quality Improvements
**File**: `supabase/migrations/20260122000000_metadata_quality_improvements.sql.disabled`
- **Status**: NOT RUNNING
- **Purpose**: Improve description extraction, location data

### 3. Consolidated Data Quality Fixes
**File**: `supabase/migrations/20260120000000_consolidated_data_quality_fixes.sql.disabled`
- **Status**: NOT RUNNING
- **Purpose**: Combine fixes for cities, locations, descriptions

### 4. Fix Postal Jobs Tech Categorization
**File**: `supabase/migrations/20260125000000_fix_postal_jobs_tech_categorization.sql.disabled`
- **Status**: NOT RUNNING
- **Purpose**: Categorization fixes

---

## ✅ ACTIVE: Other Cron Jobs & Migrations

### Active Crons
| Cron | Schedule | What It Does |
|------|----------|------------|
| `/api/process-embedding-queue` | `*/5 * * * *` | **STUB - Does nothing** |
| `/api/send-scheduled-emails` | `0 9 * * *` | Sends premium user emails ✅ |
| `/api/cron/process-digests` | `0 * * * *` | Processes email digests ✅ |
| `/api/cron/cleanup-free-users` | `0 2 * * *` | Deletes expired free users ✅ |
| `/api/cron/check-link-health` | `0 */6 * * *` | Checks job links ✅ |
| `/api/cron/run-maintenance` | `0 3 * * *` | Data quality maintenance ✅ (but missing embeddings) |
| `/api/cron/run-filtering` | `0 */6 * * *` | Role filtering ✅ |

### Active Migrations (Applied)
- ✅ Core tables (20241231000000)
- ✅ Users table (20250102000003)
- ✅ RLS security (20250102000001, 20250102000002)
- ✅ Filtered reason column (20260120000000)
- ✅ pgVector functions (20250127000000)

---

## 🚨 Why Data Quality Isn't Improving

### The Flow
```
Job Scraped
    ↓
Stored in Database
    ↓
Maintenance Cron (3 AM daily) runs
    ├─ Filters bad roles ✅
    ├─ Fixes categories ✅
    └─ Fixes visa nulls ✅
    
BUT:
    ├─ Embedding Queue (every 5 min) 🔴 DOES NOTHING
    ├─ Disabled migrations 🔴 NOT APPLIED
    └─ No description enhancement 🔴 NOT IMPLEMENTED
```

### Current Data Quality Status
```
Active Jobs: 27,285
├─ With Embeddings: 0/27,285 (0%) ← EMBEDDING CRON BROKEN
├─ With Descriptions: 16,839/27,285 (61.7%) ← NO EXTRACTION
├─ With City: 23,346/27,285 (85.6%)
├─ With Location: 23,820/27,285 (87.3%)
└─ All Complete: 16,703/27,285 (61.2%)
```

---

## 📋 Action Items

### IMMEDIATE (Blocking Matching Quality)

- [ ] **Implement embedding queue processor** (`/app/api/process-embedding-queue/route.ts`)
  - [ ] Fetch jobs without embeddings
  - [ ] Call OpenAI text-embedding-3-small for each job
  - [ ] Store embeddings in database
  - [ ] Handle rate limiting and batching
  - [ ] Add error handling and retry logic
  - **Priority**: 🔴 CRITICAL (blocks all AI matching)

- [ ] **Enable disabled migrations**
  - [ ] Rename `.disabled` files to `.sql` for:
    - `20260121000000_additional_role_filters.sql`
    - `20260122000000_metadata_quality_improvements.sql`
    - `20260120000000_consolidated_data_quality_fixes.sql`
    - `20260125000000_fix_postal_jobs_tech_categorization.sql`
  - [ ] Apply migrations to database
  - **Priority**: 🟡 HIGH

- [ ] **Add embedding generation to maintenance cron**
  - [ ] Option A: Batch generate 100 embeddings per maintenance run
  - [ ] Option B: Keep embedding queue as primary source, add fallback to maintenance
  - **Priority**: 🟡 HIGH

### SHORT-TERM (Improve Data Quality)

- [ ] **Add description extraction** to maintenance cron
  - [ ] Fallback to job title if description empty
  - [ ] Validate minimum length (>10 chars)
  - **Priority**: 🟡 MEDIUM

- [ ] **Add location enhancement** to maintenance cron
  - [ ] Extract city from location field if missing
  - [ ] Add geocoding fallback
  - **Priority**: 🟡 MEDIUM

### LONG-TERM (System Reliability)

- [ ] **Add monitoring dashboard**
  - [ ] Track embedding generation rate
  - [ ] Alert if 0 embeddings generated in 24 hours
  - [ ] Monitor cron job failures

- [ ] **Add data quality metrics**
  - [ ] Track completeness by category
  - [ ] Alert on quality degradation
  - [ ] Report to Sentry on failures

---

## 🔧 Technical Details

### Embedding Queue Implementation Needed
```typescript
// Pseudocode for what needs to be implemented:

// 1. Get jobs without embeddings
const jobsToEmbed = await supabase
  .from('jobs')
  .select('id, title, description')
  .is('embedding', null)
  .limit(100); // Process 100 at a time

// 2. Generate embeddings via OpenAI
const embeddings = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: jobsToEmbed.map(j => `${j.title} ${j.description}`),
});

// 3. Store back to database
for (const job of jobsToEmbed) {
  await supabase
    .from('jobs')
    .update({ embedding: embeddingVector })
    .eq('id', job.id);
}
```

### Cost Estimate
- 27,285 jobs × $0.00002 per embedding = **~$0.55 USD**
- Plus OpenAI API base cost
- **Total**: < $5 USD to generate all embeddings

### Time Estimate
- 100 jobs × 5min cron frequency = ~1,500 jobs/hour
- 27,285 jobs ÷ 1,500 = **~18 hours to completion**
- Or batch process: 5,000 jobs in maintenance cron = **~5 hours**

---

## Summary

The data quality issues are **NOT being fixed by migrations** because:

1. **Embedding generator is not implemented** - It's a stub that logs and returns success
2. **Key migrations are disabled** - Not being applied to the database
3. **Maintenance cron doesn't handle embeddings** - Only does role filtering and category fixes
4. **No description extraction logic** - Would need to be added

**Result**: Despite crons running successfully, they produce zero improvement in data quality.

The system is **not broken**, it's **incomplete**. All the infrastructure exists, but the core logic hasn't been implemented yet.

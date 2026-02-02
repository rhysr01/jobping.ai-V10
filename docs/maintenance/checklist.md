# ✅ DATABASE QUALITY MAINTENANCE CHECKLIST

**Version**: 1.0  
**Status**: Active  
**Last Updated**: January 29, 2026

---

## 🔴 DAILY CHECKLIST (5 minutes)

- [ ] **Scraper Health**: All 16 data sources active?
- [ ] **Active Jobs**: Count > 27,000?
- [ ] **New Jobs**: Added in last 24 hours?
- [ ] **Database Connection**: Supabase accessible?
- [ ] **Any Critical Alerts**: Check dashboard
- [ ] **Log Errors**: Any migration failures?

**IF ANY RED FLAG**: Escalate to Tech Lead immediately

---

## 🟡 WEEKLY CHECKLIST (Monday morning - 30 minutes)

### Classification Quality
- [ ] Run accuracy test on 500 random jobs
- [ ] Verify accuracy ≥ 85%
- [ ] Check for false positives < 1%
- [ ] Verify seniority filter ≥ 98%

### Data Completeness
- [ ] Language coverage = 100%
- [ ] Visa data = 100%
- [ ] Work environment = 100%
- [ ] Active jobs > 27,000

### Scraper Performance
- [ ] All 16 sources active
- [ ] No duplicate rate > 2%
- [ ] No jobs with NULL descriptions
- [ ] Timestamp freshness < 24h

### Documentation
- [ ] Update metrics in deployment reports
- [ ] Check for any pending issues
- [ ] Review alert log

**Quality Score Target**: ≥ 90/100

---

## 🔵 MONTHLY CHECKLIST (First Monday - 2 hours)

### Full System Audit
- [ ] Run accuracy test on 5,000 jobs
- [ ] Database integrity check
- [ ] Check all constraints/relationships
- [ ] Verify RLS policies active
- [ ] Analyze embedding queue status

### Source Performance
- [ ] Review each scraper's last 100 jobs
- [ ] Check quality by source
- [ ] Identify any problematic sources
- [ ] Review scraper error rates

### Documentation
- [ ] Update TECHREF.md
- [ ] Update ALL_DATA_FIELDS_REPORT.md
- [ ] Create monthly metrics report
- [ ] Document any changes/issues

### Optimization
- [ ] Analyze slow queries
- [ ] Review index usage
- [ ] Check for missing indexes
- [ ] Plan optimizations for next month

**Output**: Monthly metrics report for stakeholders

---

## ⚠️ ALERT RESPONSE CHECKLIST

### If Classification Rate < 85%
- [ ] Check recent seniority filter changes
- [ ] Verify keywords are matching
- [ ] Review last 100 jobs
- [ ] Check scraper output quality
- [ ] Consider rollback of recent changes
- [ ] Escalate to Tech Lead

### If Language Coverage < 95%
- [ ] Query NULL language_requirements
- [ ] Check language migration status
- [ ] Run language repopulation
- [ ] Verify scraper language extraction
- [ ] Escalate to Lead Developer

### If Active Jobs < 27,000
- [ ] Check all 16 scrapers
- [ ] Verify database connection
- [ ] Check is_active flag consistency
- [ ] Review job deletion patterns
- [ ] Escalate to DevOps Engineer

### If False Positives > 1%
- [ ] Analyze misclassified jobs
- [ ] Review seniority filter
- [ ] Check for keyword collisions
- [ ] Plan keyword refinements
- [ ] Schedule Tech Lead review

---

## 📊 METRICS TO TRACK DAILY

```
PRIMARY METRICS:
  • Career Classification Rate (target: ≥85%)
  • Language Coverage (target: 100%)
  • Active Jobs Count (target: >27,000)
  • Data Quality Score (target: ≥90/100)

SECONDARY METRICS:
  • Seniority Filter Accuracy (target: ≥98%)
  • False Positive Rate (target: <1%)
  • Scraper Health (target: 16/16 active)
  • Data Freshness (target: <24h old)

TERTIARY METRICS:
  • Embedding Queue Status
  • Query Performance
  • Database Size
  • Error Rate by Source
```

---

## 🔧 QUICK FIXES

### Language Coverage Gap
```sql
-- Fill any NULL language_requirements with English
UPDATE jobs SET language_requirements = ARRAY['English']
WHERE language_requirements IS NULL;
```

### Classification Accuracy Drop
- Review recent keyword changes
- Run seniority filter test
- Check for scraper output quality issues
- Consider keyword rollback if accuracy < 85%

### Duplicate Jobs
```sql
-- Find duplicates
SELECT job_hash, COUNT(*) FROM jobs 
GROUP BY job_hash HAVING COUNT(*) > 1;
```

### Reset Alert System
- Check dashboard for active alerts
- Verify metrics are correct
- Acknowledge/dismiss resolved alerts

---

## 📞 WHO TO CONTACT

**Critical Issue** (Database down):
→ Tech Lead + DevOps Engineer (immediate)

**Classification Problem** (Accuracy dropped):
→ Lead Developer + Tech Lead (1 hour)

**Scraper Failing** (No new jobs):
→ DevOps Engineer + Lead Developer (1 hour)

**Language/Data Gap** (Coverage < 95%):
→ QA Engineer + Lead Developer (2 hours)

**Performance Degradation** (Slow queries):
→ Database Administrator + Tech Lead (2 hours)

---

## 📅 MONTHLY MEETING AGENDA

**When**: First Monday of month, 2:00 PM  
**Duration**: 1.5 hours  
**Attendees**: Tech Lead, Product Manager, QA Engineer, Developer

```
1. Metric Review (30 min)
   ├─ Classification rate trend
   ├─ Language coverage trend
   ├─ Quality score trend
   └─ Any alerts or issues

2. Scraper Analysis (20 min)
   ├─ Performance by source
   ├─ Quality by source
   └─ Issues and improvements

3. Classification Review (20 min)
   ├─ New keywords added
   ├─ False positive analysis
   └─ Seniority filter performance

4. Next Month Planning (20 min)
   ├─ Prioritize improvements
   ├─ Assign owners
   └─ Timeline and milestones
```

---

## 🎯 QUALITY STANDARDS SUMMARY

```
ACCEPTABLE RANGE:
  Classification Rate:    85-100%  (Alert if < 85%)
  Language Coverage:      95-100%  (Alert if < 95%)
  Active Jobs:            >27,000  (Alert if < 27k)
  False Positives:        <1%      (Alert if > 1%)
  Data Quality Score:     85-100   (Alert if < 85)
  Seniority Filter:       >98%     (Monitor if < 98%)

CRITICAL THRESHOLDS:
  Classification Rate:    < 85%  → CRITICAL
  Language Coverage:      < 95%  → CRITICAL
  Active Jobs:            < 25k  → CRITICAL
  False Positives:        > 2%   → CRITICAL
  Data Quality Score:     < 80   → CRITICAL
```

---

## 📋 IMPLEMENTATION STATUS

- [x] Database standards established
- [x] Quality metrics defined
- [x] Alert thresholds set
- [x] Monitoring plan created
- [ ] Dashboard built (TODO)
- [ ] Automated tests created (TODO)
- [ ] Alert notifications configured (TODO)
- [ ] Team training scheduled (TODO)
- [ ] Runbooks created (TODO)
- [ ] Escalation contacts confirmed (TODO)

---

**Version**: 1.0  
**Status**: Active  
**Review Date**: February 28, 2026  
**Maintenance Owner**: Tech Lead  
**Last Updated**: January 29, 2026


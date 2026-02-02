# 📋 DATABASE MAINTENANCE & GOVERNANCE STANDARDS

**Established**: January 29, 2026  
**Target Quality**: 90/100 (minimum 85/100)  
**Version**: 1.0

---

## 🎯 QUALITY STANDARDS TO MAINTAIN

### Core Metrics (Non-Negotiable)

| Metric | Current | Minimum | Check Frequency |
|---|---|---|---|
| **Career Classification Rate** | 85.67% | 85% | Daily |
| **Language Coverage** | 100% | 95% | Daily |
| **Visa Data Completeness** | 100% | 100% | Weekly |
| **Work Environment Data** | 100% | 100% | Weekly |
| **Active Jobs** | 98.86% | 95% | Daily |
| **False Positives** | 0% | <1% | Weekly |
| **Data Freshness** | <24h | <72h | Daily |
| **Seniority Detection** | 77.41% | 75% | Weekly |
| **Career Paths Covered** | 9/9 | 9/9 | Weekly |

### Data Quality Score Target
- **Current**: 90/100
- **Target**: Maintain 90+/100
- **Minimum Acceptable**: 85/100
- **Alert Threshold**: <87/100

---

## 📊 DAILY MONITORING CHECKLIST

### Morning Check (Start of Business Day)

```
☐ 1. SCRAPER HEALTH
   ├─ Verify all 16 data sources are active
   ├─ Check for any scraper errors in logs
   ├─ Confirm jobs added in last 24 hours
   └─ Alert if no new jobs added

☐ 2. DATABASE CONNECTIVITY
   ├─ Test Supabase connection
   ├─ Verify MCP integration working
   ├─ Check for any migration failures
   └─ Confirm read/write operations

☐ 3. ACTIVE JOB COUNT
   ├─ Query total active jobs
   ├─ Alert if drop below 27,000
   ├─ Verify is_active flag consistency
   └─ Check for unexpected inactive jobs

☐ 4. RECENT DATA QUALITY
   ├─ Sample 100 jobs added in last 24h
   ├─ Verify language data is populated
   ├─ Check career path classification
   ├─ Validate work environment field
   └─ Confirm no blank descriptions
```

### Afternoon Check (Mid-Day Review)

```
☐ 5. CLASSIFICATION ACCURACY
   ├─ Run classification accuracy test on 500 random jobs
   ├─ Verify seniority filter is working (98% target)
   ├─ Check for false positives in categorization
   ├─ Alert if accuracy drops below 85%
   └─ Review any "unsure" category trends

☐ 6. LANGUAGE DATA VALIDATION
   ├─ Verify 100% of jobs have language_requirements populated
   ├─ Check for NULL values in language_requirements
   ├─ Sample 100 jobs for language accuracy
   ├─ Confirm all 16 supported languages present in data
   └─ Alert if coverage drops below 95%

☐ 7. API PERFORMANCE
   ├─ Monitor query response times
   ├─ Check for slow queries
   ├─ Verify embedding queue status
   ├─ Alert if average query time >2 seconds
   └─ Review database logs for errors
```

### Evening Check (End of Day)

```
☐ 8. SUMMARY METRICS
   ├─ Calculate total classified vs unsure ratio
   ├─ Verify career path distribution (no extreme skews)
   ├─ Check for any job duplicates (hash validation)
   ├─ Confirm all timestamps are recent
   └─ Generate daily report

☐ 9. BACKUP VERIFICATION
   ├─ Confirm automated backups completed
   ├─ Verify backup size is reasonable
   ├─ Test restore procedure (weekly)
   └─ Document backup completion
```

---

## 📅 WEEKLY MAINTENANCE TASKS

### Monday

```
☐ COMPREHENSIVE HEALTH CHECK
  ├─ Run full database integrity check
  ├─ Verify all tables for corruption
  ├─ Check for orphaned records
  ├─ Validate foreign key relationships
  ├─ Confirm RLS policies are active
  └─ Review security logs
```

### Wednesday

```
☐ DATA QUALITY AUDIT
  ├─ Analyze classification accuracy on 1,000 random jobs
  ├─ Review category distribution for anomalies
  ├─ Check for trending patterns in "unsure" jobs
  ├─ Verify seniority filter accuracy (98% target)
  ├─ Validate language distribution
  └─ Generate quality report
```

### Friday

```
☐ PERFORMANCE ANALYSIS
  ├─ Review embedding queue status
  ├─ Check failed embeddings count
  ├─ Analyze query performance metrics
  ├─ Review database size growth
  ├─ Analyze scraper performance by source
  └─ Plan any optimizations needed
```

---

## 🔧 MONTHLY MAINTENANCE TASKS

### First Week

```
☐ FULL DATABASE VALIDATION
  ├─ Run complete classification accuracy test (5,000 jobs)
  ├─ Verify all data types and constraints
  ├─ Check data consistency across related tables
  ├─ Validate embedding quality sampling
  ├─ Review any schema drift
  └─ Document findings in TECHREF.md
```

### Second Week

```
☐ SCRAPER AUDIT
  ├─ Verify all 16 scrapers are functioning
  ├─ Check for job duplicate rates by source
  ├─ Review scraper error logs
  ├─ Validate job freshness by source
  ├─ Check for broken URLs or dead links
  └─ Update scraper configurations if needed
```

### Third Week

```
☐ OPTIMIZATION PASS
  ├─ Analyze slow queries
  ├─ Review index usage
  ├─ Check for missing indexes
  ├─ Optimize any inefficient migrations
  ├─ Clean up old logs
  └─ Archive old test data
```

### Fourth Week

```
☐ PLANNING & DOCUMENTATION
  ├─ Review all TODOs and pending tasks
  ├─ Update TECHREF.md with changes
  ├─ Document any issues encountered
  ├─ Plan next month's improvements
  ├─ Update data governance policies
  └─ Prepare metrics report for stakeholders
```

---

## ⚠️ ALERT THRESHOLDS & ACTIONS

### Critical Alerts (Immediate Action Required)

```
ALERT: Career Classification Rate < 85%
  ├─ Severity: CRITICAL
  ├─ Check: Seniority filter regression
  ├─ Check: Keywords not matching properly
  ├─ Action: Rollback recent keyword changes
  ├─ Action: Review scraper output quality
  └─ Escalation: 1 hour response time

ALERT: Language Coverage < 95%
  ├─ Severity: CRITICAL
  ├─ Check: Language migration issues
  ├─ Check: NULL values in language_requirements
  ├─ Action: Run language repopulation migration
  ├─ Action: Verify scraper language extraction
  └─ Escalation: 2 hour response time

ALERT: Active Jobs < 27,000
  ├─ Severity: CRITICAL
  ├─ Check: Scraper failures
  ├─ Check: Database connection issues
  ├─ Action: Check all 16 data sources
  ├─ Action: Review is_active flag logic
  └─ Escalation: 30 minute response time

ALERT: False Positive Rate > 1%
  ├─ Severity: HIGH
  ├─ Check: Seniority filter accuracy
  ├─ Check: Keyword collision issues
  ├─ Action: Analyze false positives
  ├─ Action: Refine keyword boundaries
  └─ Escalation: 4 hour response time
```

### Warning Alerts (Monitor & Plan Fix)

```
WARNING: Career Classification Rate 85-87%
  ├─ Severity: MEDIUM
  ├─ Action: Schedule review meeting
  ├─ Action: Identify root cause
  ├─ Escalation: 1 week to fix

WARNING: Language Coverage 95-99%
  ├─ Severity: MEDIUM
  ├─ Action: Identify gaps
  ├─ Action: Plan extraction improvements
  ├─ Escalation: 1 week to fix

WARNING: Embedding Failed > 20%
  ├─ Severity: MEDIUM
  ├─ Action: Analyze failure patterns
  ├─ Action: Schedule reprocessing
  ├─ Escalation: 1 week to address
```

---

## 🧪 TESTING & VALIDATION PROCEDURES

### New Job Ingestion Testing

```
Before deploying any scraper changes:

1. Test on sample of 100 jobs
   ├─ Verify career classification accuracy > 85%
   ├─ Check language data is populated
   ├─ Validate work environment field
   ├─ Confirm descriptions are complete
   └─ Verify no duplicate entries

2. Run classification accuracy test
   ├─ Ensure false positives < 1%
   ├─ Verify seniority filter 98% accuracy
   ├─ Check career path distribution is reasonable
   └─ Confirm no extreme outliers

3. Validate data quality
   ├─ Spot check 20 jobs manually
   ├─ Verify career path accuracy
   ├─ Check language requirements are accurate
   └─ Confirm all required fields present
```

### New Migration Testing

```
Before applying any database migration:

1. Test on staging/branch database
   ├─ Verify migration syntax is correct
   ├─ Test on subset of data first (100-1000 records)
   ├─ Measure execution time
   ├─ Verify rollback procedure works
   └─ Check for any side effects

2. Validate data integrity
   ├─ Confirm no data loss
   ├─ Verify relationships are intact
   ├─ Check data types are correct
   ├─ Validate constraints are enforced
   └─ Test query performance

3. Approval & Deployment
   ├─ Get approval from lead developer
   ├─ Deploy during low-traffic window
   ├─ Monitor for 2 hours after deployment
   ├─ Verify all metrics remain stable
   └─ Document any issues encountered
```

---

## 📚 DOCUMENTATION REQUIREMENTS

### Files to Maintain & Update

```
WEEKLY UPDATES:
  ├─ DEPLOYMENT_LANGUAGE_ENHANCEMENT.md - Update metrics
  ├─ ALL_DATA_FIELDS_REPORT.md - Update coverage percentages
  ├─ JOB_DATABASE_BREAKDOWN.md - Update breakdowns
  └─ TECHREF.md - Document any changes

MONTHLY UPDATES:
  ├─ MAINTENANCE_LOG.md - New entry with findings
  ├─ DATABASE_STANDARDS.md - This file if policies change
  └─ PERFORMANCE_METRICS.md - Trending data

ON ANY MAJOR CHANGE:
  ├─ Phase completion report (e.g., PHASE7_COMPLETE.md)
  ├─ Deployment report with metrics
  ├─ Update TECHREF.md with changes
  └─ Document lessons learned
```

### Runbooks to Create

```
REQUIRED RUNBOOKS:
  ├─ DATABASE_RECOVERY.md - How to restore from backup
  ├─ SCRAPER_TROUBLESHOOTING.md - How to debug scrapers
  ├─ MIGRATION_PROCESS.md - How to apply migrations safely
  ├─ ROLLBACK_PROCEDURE.md - How to undo changes
  ├─ ALERT_RESPONSE.md - How to respond to alerts
  └─ ESCALATION_PROCESS.md - Who to notify for issues
```

---

## 🔐 DATA GOVERNANCE POLICIES

### Data Quality Rules

```
1. CAREER CLASSIFICATION
   ├─ All jobs must have career path OR be marked "unsure"
   ├─ No NULL values in categories field
   ├─ Career paths must be from approved list (9 paths)
   └─ Seniority filter must maintain 98% accuracy

2. LANGUAGE REQUIREMENTS
   ├─ All jobs must have language_requirements populated
   ├─ Minimum 1 language per job
   ├─ Languages must be from supported list (36 languages)
   ├─ No invalid language codes
   └─ English must be present for 100% of jobs

3. WORK ENVIRONMENT
   ├─ All jobs must specify work environment
   ├─ Valid values: office, hybrid, remote, on-site
   ├─ Must be consistent with remote_possible flag
   └─ No NULL or invalid values

4. VISA INFORMATION
   ├─ All jobs must have visa_sponsored flag set
   ├─ Boolean value (true/false) only
   ├─ Must correlate with job description when possible
   └─ No NULL values
```

### Change Control Process

```
For any change to the database schema or classification logic:

1. PROPOSAL PHASE
   ├─ Document the change in detail
   ├─ Explain business justification
   ├─ Identify potential impact
   ├─ Get approval from 2+ team members
   └─ Create test plan

2. TESTING PHASE
   ├─ Test on branch database first
   ├─ Run complete test suite
   ├─ Verify metrics before/after
   ├─ Get sign-off from reviewer
   └─ Document findings

3. DEPLOYMENT PHASE
   ├─ Deploy during maintenance window
   ├─ Monitor closely for 2+ hours
   ├─ Verify all alerts are normal
   ├─ Have rollback plan ready
   └─ Document deployment details

4. VALIDATION PHASE
   ├─ Run full validation suite
   ├─ Compare metrics to baseline
   ├─ Get final approval
   ├─ Archive all documentation
   └─ Schedule post-deployment review
```

---

## 📈 MONITORING DASHBOARDS TO CREATE

### Real-Time Dashboard

```
SHOULD DISPLAY:
  ├─ Current job count (active)
  ├─ Classification accuracy (last 100 jobs)
  ├─ Language coverage percentage
  ├─ Last scrape time by source
  ├─ Active scraper status (all 16 sources)
  ├─ Embedding queue status
  ├─ Database performance metrics
  ├─ Alert status (any active alerts)
  └─ Data quality score (0-100)

REFRESH RATE: Every 5 minutes
UPDATE FREQUENCY: Real-time alerts only
```

### Weekly Report Dashboard

```
SHOULD INCLUDE:
  ├─ Classification accuracy trend (last 7 days)
  ├─ Jobs added per source (last 7 days)
  ├─ Language coverage trend
  ├─ Category distribution
  ├─ Seniority filter accuracy
  ├─ Error rates by source
  ├─ Query performance metrics
  ├─ Database size trend
  └─ Alert summary

DELIVERY: Every Monday morning
FORMAT: Email + Dashboard
```

---

## 🛠️ MAINTENANCE TOOLS TO BUILD

### Required Tools

```
1. CLASSIFICATION ACCURACY TEST
   Purpose: Test classification accuracy on N random jobs
   Frequency: Daily on 100 jobs, weekly on 1000
   Alert: If accuracy < 85%

2. LANGUAGE COVERAGE VALIDATOR
   Purpose: Verify 100% jobs have language_requirements
   Frequency: Daily
   Alert: If coverage < 95%

3. SCRAPER HEALTH MONITOR
   Purpose: Check all 16 scrapers are functioning
   Frequency: Hourly
   Alert: If scraper stops working

4. DUPLICATE DETECTOR
   Purpose: Find job duplicates via job_hash
   Frequency: Daily
   Alert: If duplicate rate > 2%

5. DATA QUALITY SCORER
   Purpose: Calculate overall data quality score
   Frequency: Daily
   Alert: If score < 85%

6. ALERT NOTIFIER
   Purpose: Send alerts to team
   Frequency: Immediate for critical alerts
   Channels: Slack, Email, Dashboard
```

---

## 📋 APPROVAL & SIGN-OFF PROCESS

### Who Approves What

```
CLASSIFICATION CHANGES:
  ├─ Keyword additions: Lead Developer
  ├─ Seniority filter changes: Tech Lead + Product Manager
  ├─ Career path structure changes: All stakeholders
  └─ Deployment: Tech Lead

MIGRATION DEPLOYMENTS:
  ├─ Database schema changes: Tech Lead
  ├─ Data migrations: Product Manager + Tech Lead
  ├─ Rollback: Tech Lead (can be emergency)
  └─ Post-deployment validation: QA Engineer

DOCUMENTATION UPDATES:
  ├─ TECHREF.md updates: Lead Developer
  ├─ Runbook creation: Tech Lead
  ├─ Policy changes: All stakeholders
  └─ Metrics reports: Product Manager
```

---

## 🚀 CONTINUOUS IMPROVEMENT PROCESS

### Monthly Review Meeting

```
ATTENDEES: Tech Lead, Product Manager, QA Engineer, Developer

AGENDA:
  1. Review metric trends (30 min)
     └─ Discuss any drops or anomalies
  
  2. Analysis of "unsure" jobs (30 min)
     └─ Identify new keywords or patterns
  
  3. Scraper performance review (20 min)
     └─ Discuss quality by source
  
  4. Technology debt discussion (20 min)
     └─ Identify optimizations needed
  
  5. Plan next month's work (30 min)
     └─ Prioritize improvements

OUTPUT: Meeting notes + action items
```

### Quarterly Retrospective

```
Review full quarter:
  ├─ Overall quality trends
  ├─ Lessons learned
  ├─ Process improvements
  ├─ Technology improvements
  ├─ Team feedback
  └─ Plan for next quarter
```

---

## 🎯 SUCCESS CRITERIA

### Database is Healthy When

✅ Career classification rate: 85%+  
✅ Language coverage: 100%  
✅ Active jobs: >27,000  
✅ False positives: <1%  
✅ Data freshness: <24 hours  
✅ All 16 scrapers active  
✅ Zero critical alerts  
✅ Data quality score: 90+/100  
✅ Classification accuracy test: 85%+  
✅ All documentation current  

### Database Needs Attention When

⚠️ Any critical alert triggered  
⚠️ Classification rate drops below 85%  
⚠️ Language coverage drops below 95%  
⚠️ Active jobs < 27,000  
⚠️ False positives > 1%  
⚠️ Data quality score < 85%  
⚠️ Any scraper inactive >24 hours  
⚠️ Query performance degrading  

---

## 📞 ESCALATION CONTACTS

```
CRITICAL DATABASE ISSUES:
  Primary: Tech Lead (immediate)
  Secondary: Lead Developer
  Escalation Time: 30 minutes

DATA QUALITY ISSUES:
  Primary: QA Engineer
  Secondary: Lead Developer
  Escalation Time: 2 hours

SCRAPER FAILURES:
  Primary: DevOps Engineer
  Secondary: Tech Lead
  Escalation Time: 1 hour

PERFORMANCE ISSUES:
  Primary: Database Administrator
  Secondary: Tech Lead
  Escalation Time: 2 hours
```

---

## ✅ IMPLEMENTATION CHECKLIST

To maintain our 90/100 quality standard:

- [ ] Set up daily monitoring checks
- [ ] Create dashboard for real-time metrics
- [ ] Build classification accuracy test tool
- [ ] Build language coverage validator tool
- [ ] Set up alert notifications (Slack/Email)
- [ ] Create runbooks for common issues
- [ ] Schedule weekly maintenance tasks
- [ ] Schedule monthly review meetings
- [ ] Document all policies in this file
- [ ] Train team on procedures
- [ ] Set up automated backups
- [ ] Create change control process
- [ ] Set up quarterly retrospectives

---

**Last Updated**: January 29, 2026  
**Version**: 1.0  
**Status**: Ready to Implement  
**Review Date**: February 28, 2026


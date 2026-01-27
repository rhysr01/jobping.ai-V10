# 📚 JobPing Documentation Guide

## Quick Reference

**New developers?** Start here:
1. **[README.md](README.md)** - 5 min overview
2. **[TECHREF.md](TECHREF.md)** - 30 min deep dive
3. **[TESTING.md](TESTING.md)** - 20 min testing guide
4. **[CONTRIBUTING.md](CONTRIBUTING.md)** - 10 min workflow

## Primary Documents (Root Level)

| Document | Size | Purpose | Read Time |
|----------|------|---------|-----------|
| **README.md** | 14 KB | Project overview, quick start, features | 5 min |
| **TECHREF.md** | 153 KB | Complete technical reference ⭐ | 60 min |
| **TESTING.md** | 54 KB | Testing strategy & MCP integration | 30 min |
| **TESTING_README.md** | 5.6 KB | Quick testing reference | 5 min |
| **CONTRIBUTING.md** | 6 KB | Development workflow & standards | 10 min |
| **SECURITY.md** | 3 KB | Security policy & vulnerability reporting | 5 min |
| **CODE_OF_CONDUCT.md** | 5.3 KB | Community guidelines | 3 min |
| **CHANGES.md** | 6.7 KB | Version history & changelog | 10 min |

## Supplementary Documents (docs/)

| Document | Purpose |
|----------|---------|
| `docs/CONSOLIDATION_COMPLETE.md` | Archive summary & file mappings |
| `docs/scraping.md` | Job scraping system technical details |
| `docs/troubleshooting.md` | Common issues & solutions |

## What's Inside TECHREF.md?

The comprehensive technical reference includes:

- **API Reference** - All endpoints, authentication, error handling
- **Architecture Deep Dive** - System design, data flows, components
- **Database Schema** - Tables, relationships, indexes, security
- **AI Matching Engine** - Algorithm, scoring, performance optimization
- **Component Architecture** - Frontend structure, patterns, hooks
- **Security** - Database security, authentication, data protection
- **Performance** - Frontend optimization, database performance, caching
- **Monitoring & Observability** - Metrics, dashboards, logging
- **Disaster Recovery** - Backup, recovery, business continuity

## Finding Information

### By Topic

| Looking For... | Start Here |
|---|---|
| API endpoints | TECHREF.md → API Reference |
| Database structure | TECHREF.md → Database Schema |
| Job matching algorithm | TECHREF.md → AI Matching Engine |
| React components | TECHREF.md → Component Architecture |
| Infrastructure setup | TECHREF.md → Deployment Architecture |
| How to test | TESTING.md |
| Quick test commands | TESTING_README.md |
| Scraping system | docs/scraping.md |
| Error fixes | docs/troubleshooting.md |
| Security policies | SECURITY.md + TECHREF.md (Security section) |
| How to contribute | CONTRIBUTING.md |
| Community rules | CODE_OF_CONDUCT.md |
| Version changes | CHANGES.md |

### By Role

**Product Managers:**
- Start: README.md
- Then: Key Features & Metrics sections

**Frontend Developers:**
- Start: README.md → TECHREF.md (Component Architecture)
- Then: TESTING.md → TESTING_README.md

**Backend Developers:**
- Start: TECHREF.md (API Reference, Database Schema, Architecture)
- Then: TESTING.md

**DevOps/Infrastructure:**
- Start: TECHREF.md (Deployment Architecture)
- Then: docs/troubleshooting.md

**QA/Testing:**
- Start: TESTING.md
- Then: TESTING_README.md

**Security:**
- Start: SECURITY.md
- Then: TECHREF.md (Security section)

## Archive Access

Old documentation has been preserved in `docs/archive/old-docs/` including:

- Legacy migration guides
- Historical bug investigation reports
- Old deployment checklists
- Superseded technical analyses

To restore: `cp docs/archive/old-docs/filename.md ./`

## Consolidation Details

**When:** January 27, 2026
**Result:** 75+ files → 10 primary + 4 supplementary + 52 archived
**Impact:** 85% reduction in root-level clutter
**Content Preserved:** 100% (nothing deleted, only organized)

See `docs/CONSOLIDATION_COMPLETE.md` for full details.

## Contributing Documentation

When adding new documentation:

1. **Core/Critical Content** → Add to TECHREF.md or TESTING.md
2. **Specialized Topics** → Create in `docs/` folder
3. **Historical/Temporary** → Archive in `docs/archive/`

## Document Relationships

```
README.md (Quick Start)
    ↓
    ├→ TECHREF.md (Deep Technical Details)
    │   ├→ API Reference
    │   ├→ Architecture
    │   ├→ Database Schema
    │   ├→ AI Engine
    │   ├→ Frontend
    │   ├→ Security
    │   └→ Performance
    │
    ├→ TESTING.md (Testing Strategy)
    │   ├→ TESTING_README.md (Quick Ref)
    │
    ├→ CONTRIBUTING.md (Development Workflow)
    │
    ├→ docs/scraping.md (Specialized Topic)
    │
    └→ SECURITY.md (Security Policy)
```

---

**Pro Tip:** Use Ctrl+F to search within documents. TECHREF.md has a comprehensive table of contents at the top.


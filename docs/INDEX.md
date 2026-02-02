# 📚 JobPing Documentation Index

This document provides a comprehensive guide to all JobPing documentation. For quick reference, start with the main documentation files in the root directory.

---

## 🎯 Start Here (Main Documentation)

| File | Purpose | Audience |
|------|---------|----------|
| **[README.md](../README.md)** | Project overview, quick start, features | Everyone (users, developers) |
| **[TECHREF.md](../TECHREF.md)** | Deep technical details, architecture, APIs | Developers, DevOps |
| **[DATA_SCRAPER.md](../DATA_SCRAPER.md)** | Job scraping system, data sources, metrics | Data engineers, DevOps |

---

## 🔧 Operational Documentation

Located in `/docs/maintenance/`, these files guide daily operations:

- **[checklist.md](./maintenance/checklist.md)** - Daily, weekly, monthly quality checks
- **[standards.md](./maintenance/standards.md)** - Database quality standards and metrics
- **[framework.md](./maintenance/framework.md)** - Complete maintenance framework guide

**When to use**: Use these when operating the platform (monitoring quality, running maintenance tasks, checking metrics).

---

## 📋 Project Documentation

| File | Purpose |
|------|---------|
| **[CONTRIBUTING.md](../CONTRIBUTING.md)** | How to contribute to JobPing |
| **[TESTING.md](../TESTING.md)** | Testing strategy and running tests |
| **[SECURITY.md](../SECURITY.md)** | Security practices and vulnerability reporting |
| **[CHANGES.md](../CHANGES.md)** | Recent changes and version history |
| **[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)** | Community code of conduct |

---

## 📦 Archived Documentation

All historical documentation is organized in `/docs/archive/`:

### Phases Archive (`/docs/archive/phases/`)
Contains all Phase 2-6D project completion reports and milestones from the career path categorization project (Jan 2026). These document completed work phases and are kept for historical reference.

**Purpose**: Historical record of project evolution and completion milestones.

### Analysis Archive (`/docs/archive/analysis/`)
Contains analysis reports from the career path categorization project:
- Keyword expansion reports
- Categorization accuracy analysis
- Job database breakdowns
- Implementation summaries

**Purpose**: Reference material for how categorization system was built and tested.

### Old Docs Archive (`/docs/archive/old-docs/`)
Legacy documentation from earlier versions of the system (pre-Jan 2026). Kept for historical context.

---

## 🗂️ Directory Structure

```
JobPing/
├── README.md              # Main project documentation
├── TECHREF.md             # Technical reference
├── DATA_SCRAPER.md        # Data scraping reference
├── TESTING.md             # Testing guide
├── CONTRIBUTING.md        # Contributing guide
├── SECURITY.md            # Security practices
├── CHANGES.md             # Changelog
├── CODE_OF_CONDUCT.md     # Code of conduct
│
└── docs/
    ├── INDEX.md           # This file
    ├── maintenance/       # Operational documentation
    │   ├── checklist.md
    │   ├── standards.md
    │   └── framework.md
    ├── scraping.md        # Scraping guide
    └── archive/           # Historical documentation
        ├── phases/        # Phase 2-6D completion reports
        ├── analysis/      # Categorization analysis
        ├── old-docs/      # Legacy documentation
        └── *.md           # Miscellaneous archived docs
```

---

## 🔍 Finding What You Need

### I want to...

- **Get started quickly** → Start with [README.md](../README.md)
- **Understand the architecture** → Read [TECHREF.md](../TECHREF.md)
- **Learn about data sources** → See [DATA_SCRAPER.md](../DATA_SCRAPER.md)
- **Check job quality metrics** → Go to [docs/maintenance/standards.md](./maintenance/standards.md)
- **Run daily checks** → Follow [docs/maintenance/checklist.md](./maintenance/checklist.md)
- **Contribute to the project** → See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Write tests** → Check [TESTING.md](../TESTING.md)
- **Report a security issue** → Read [SECURITY.md](../SECURITY.md)
- **Learn how categorization works** → See [docs/archive/analysis/](./archive/analysis/)

---

## 📊 Documentation Status

**Last Updated**: January 30, 2026  
**Consolidation**: ✅ Complete  
**Active Files**: 8 (root) + 3 (maintenance) + 1 (scraping)  
**Archived Files**: 50+ (historical phases and analysis)  

---

## 💡 Documentation Guidelines

When adding new documentation:

1. **User-facing or high-level?** → Add to root directory or update README.md
2. **Technical deep-dive?** → Add to TECHREF.md or create a new root .md file
3. **Operational/maintenance?** → Add to `/docs/maintenance/`
4. **Historical/completed phases?** → Archive to `/docs/archive/`
5. **Outdated/superseded?** → Move to `/docs/archive/old-docs/`

---

## 🤝 Support

For questions about documentation:
- Check the relevant file above
- Look in `docs/maintenance/` for operational questions
- Check `docs/archive/analysis/` for background on how systems were built
- See CONTRIBUTING.md for how to improve documentation



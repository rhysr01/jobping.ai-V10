# JobPing

> AI-powered job matching for early-career roles across Europe. Free instant matches or premium weekly emails.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Mobile-First](https://img.shields.io/badge/Mobile--First-Responsive-purple)](https://getjobping.com)
[![Production](https://img.shields.io/badge/Status-Live-green)](https://getjobping.com)
[![Audit](https://img.shields.io/badge/Code_Audit-94%2F100-success)](CODE_AUDIT_REPORT.md)

---

## 📚 Documentation Hub

### 🎯 Start Here
- **[README.md](README.md)** (this file) - Quick start and overview
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture, tech stack, and design patterns
- **[CODE_AUDIT_REPORT.md](CODE_AUDIT_REPORT.md)** - Complete code audit and production readiness (94/100 ⭐)

### 📖 Essential Guides
- **[HANDOFF.md](HANDOFF.md)** - Project handoff for new developers
- **[DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)** - Complete documentation navigation map
- **[docs/guides/PRODUCTION_GUIDE.md](docs/guides/PRODUCTION_GUIDE.md)** - Production deployment and configuration
- **[docs/guides/RUNBOOK.md](docs/guides/RUNBOOK.md)** - Operational procedures and incident response

### 🔧 Technical Documentation
- **[Utils/matching/README.md](Utils/matching/README.md)** - Matching engine architecture
- **[docs/PREVENT_MISSING_WORK_TYPE_CATEGORIES.md](docs/PREVENT_MISSING_WORK_TYPE_CATEGORIES.md)** - Data quality system
- **[docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)** - Contribution guidelines

---

## 📊 Production Status

**Live:** https://getjobping.com  
**Code Audit Score:** 94/100 ⭐  
**Status:** ✅ Production-Ready

**Key Metrics:**
- 47 API Routes | 166+ Test Files | 2,656-line Matching Engine
- TypeScript: 100% strict mode | Security: A+ grade
- Performance: N+1 queries optimized | LRU caching (60-80% hit rate)
- Mobile: 100% responsive (320px-4K) | Touch targets: 44px+ (WCAG AAA)
- Recent: 9 critical fixes | Mobile-first design | Production-ready UI

**👉 See [CODE_AUDIT_REPORT.md](CODE_AUDIT_REPORT.md) for complete production assessment**

---

## 🎨 Recent Improvements (2026)

### **Mobile-First Responsive Design** 📱
- **Senior Developer-Level Responsiveness**: Complete mobile optimization across all breakpoints (320px-4K)
- **Touch Targets**: All interactive elements meet 44px minimum (WCAG AAA compliant)
- **Mobile Signup Flow**: Optimized for mobile conversion (majority of traffic)
- **Responsive Typography**: Fluid scaling from `text-[2.5rem]` on mobile to `text-9xl` on 4K displays
- **Cross-Device Testing**: Verified on iPhone SE, iPad, desktop, and large displays

### **UI/UX Polish & Production Readiness** ✨
- **Code Quality**: 9 critical fixes implemented (removed 780+ lines dead code, fixed contrast issues)
- **Premium Email Showcase**: Integrated real job data from database, scrollable iPhone mockups
- **Pricing Component**: Redesigned with "Built by a student, priced for students" messaging
- **Signup Flow**: Updated hero messaging ("15 Jobs Per Week, 3× Weekly") and responsive forms
- **EU Job Stats**: Fixed city count display (21 cities across Europe)
- **Hero Section**: Improved mobile layout, touch-friendly CTAs, better typography scaling

### **Technical Enhancements**
- **Tailwind Config**: Added `brand-400` color, fixed shadow RGB values to match brand
- **Component Architecture**: Optimized for performance across devices
- **Accessibility**: Enhanced screen reader support and keyboard navigation

---

## What It Does

GetJobPing uses a **5-stage matching pipeline** combining SQL pre-filtering, AI semantic matching, and rule-based fallbacks:

```
SQL Pre-filter → AI Matching → Guaranteed Fallback → Custom Scan → Diversity Pass
(90% reduction)  (GPT-4o-mini)  (Rule-based)        (Historical)   (Variety)
     $0              ~$0.01          $0                Medium         $0
```

### Key Components
- **Matching Engine**: 2,656 lines of refactored TypeScript (from 2,797-line monolith)
- **8 Active Scrapers**: JobSpy, Adzuna, Reed, CareerJet, Arbeitnow, Jooble + others
- **LRU Caching**: 60-80% hit rate reduces AI costs by 60-80%
- **Background Jobs**: 2x daily scraping (8am, 6pm UTC), embedding refresh every 72 hours

**👉 See [ARCHITECTURE.md](ARCHITECTURE.md) for complete system design**

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 24+** (check with `node --version`)
- **Supabase account** - [Get one here](https://supabase.com)
- **Git** - For cloning repository

### Installation

```bash
# Clone repository
git clone <repository-url>
cd jobping

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local  # If .env.example exists, or create .env.local
```

### Minimum Environment Variables (Local Development)

Create `.env.local` with these **required** variables:

```bash
# Database (Supabase) - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Get from: Supabase Dashboard → Settings → API

# Email (Resend) - REQUIRED for signup/verification
RESEND_API_KEY=re_xxxxx
# Get from: https://resend.com/api-keys

# Security - REQUIRED
SYSTEM_API_KEY=your-10-char-key
INTERNAL_API_HMAC_SECRET=your-32-char-secret-minimum
# Generate secure random strings

# AI Matching (Optional - app works without it, but matching will be rule-based only)
OPENAI_API_KEY=sk-xxxxx
# Get from: https://platform.openai.com/api-keys
```

**Quick Setup:**
1. Create Supabase project → Copy URL and service_role key
2. Create Resend account → Copy API key
3. Generate random strings for security keys (32+ chars)
4. Add to `.env.local`

### Start Development

```bash
# Start Next.js dev server
npm run dev

# Visit http://localhost:3000
```

### Verify Setup

```bash
# Check environment variables are valid
npm run verify:env

# Run health check (after starting dev server)
curl http://localhost:3000/api/health

# Type check
npm run type-check
```

**👉 See [docs/guides/PRODUCTION_GUIDE.md](docs/guides/PRODUCTION_GUIDE.md) for complete production setup and all optional variables**

---

## 🛠 Tech Stack

### Core
- **Next.js 16** + **React 19** + **TypeScript** (100% typed, strict mode)
- **Supabase** (PostgreSQL + pgvector + RLS)
- **OpenAI GPT-4o-mini** (semantic matching with caching)

### Services
- **Resend** - Transactional email
- **Polar** - Subscription management (€5/month)
- **Sentry** - Error tracking (multi-runtime)
- **Vercel** - Hosting + edge network

### Job Sources (8 scrapers)
- JobSpy (LinkedIn, Indeed, Glassdoor), Adzuna, Reed, CareerJet, Arbeitnow, Jooble

**👉 See [ARCHITECTURE.md](ARCHITECTURE.md) for complete tech stack details**

---

## Development Commands

### Local Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Run production build locally
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
```

### Testing
```bash
npm test                    # Jest unit/integration tests
npm run test:coverage       # With coverage report
npm run test:e2e           # Playwright E2E tests
npm run pilot:smoke        # Production readiness smoke test
```

#### Test Coverage

📋 **[Testing Strategy Guide](./TESTING_STRATEGY.md)** - Reference before writing/modifying tests

**Overall Coverage:** 41.05% statements | 29.38% branches | 45.21% functions | 41.07% lines *(coverage report generation pending after test fixes)*

**Test Suite Stats:**
- **57 test suites** (56 test files, 1 skipped)
- **643 total tests** (620 passed, 0 failed, 23 skipped)
- **Test pass rate:** **100%** ✅
- Coverage report: `coverage/index.html` (generated after `npm run test:coverage`)

**Well-Covered Areas (70%+):**
- ✅ **Utils/matching** - 75.18% statements (core matching engine)
- ✅ **Utils/monitoring** - 82.37% statements (health checks, logging, metrics)
- ✅ **Utils/database** - 76.19% statements (database utilities)
- ✅ **Utils/auth** - 71.03% statements (authentication & HMAC)
- ✅ **Utils/config** - 76.31% statements (configuration management)

**E2E Test Coverage:**
- ✅ **Free Tier** - Complete signup → matches → email flow (loading, performance, API)
- ✅ **Premium Tier** - Enhanced signup → premium matching → weekly emails (3 new test suites)
- ✅ **Cross-tier Comparison** - Free vs Premium matching quality, API behavior, limits

**Recent Improvements:**
- ✅ **Premium E2E Tests Added** - Comprehensive coverage of premium user journeys, matching behavior, and email delivery
- ✅ **Tier-specific Testing** - Dedicated test suites for free vs premium feature differences

**Moderately Covered (40-70%):**
- ⚠️ **Utils/email** - 60.11% statements (email sending & templates)
- ⚠️ **Utils/matching/prefilter** - 71.85% statements (SQL pre-filtering)
- ⚠️ **Utils/matching/distribution** - 50.42% statements (job distribution logic)

**Areas Needing Coverage:**
- ❌ **Utils/business-rules** - 0% (business logic rules)
- ❌ **Utils/performance** - 3.96% (performance optimizations)
- ❌ **Utils/cv** - 28.57% (CV parsing)
- ❌ **Utils/matching/consolidated** - 30.79% (consolidated matching logic)
- ❌ **Utils/matching/guaranteed** - 38.72% (guaranteed fallback matching)

**Test Categories:**
- **API Routes** - 43 comprehensive test files covering all endpoints
- **Integration Tests** - Database, email, Stripe, API integration
- **Unit Tests** - Matching engine, utilities, scrapers
- **Security Tests** - API key exposure, HMAC validation
- **E2E Tests** - Playwright tests for critical user flows (Free + Premium tiers)

**Coverage Thresholds:**
- Global minimum: 10% (all metrics)
- Critical modules have higher thresholds (e.g., `consolidatedMatchingV2.ts` requires 25%+)

**View Coverage:**
```bash
npm run test:coverage      # Generate coverage report
open coverage/index.html   # View HTML report (macOS)
```

### Database
```bash
# Create new migration
npx supabase migration new <name>

# Apply migrations (local)
supabase db push

# Or via Supabase Dashboard → SQL Editor
```

### Health & Verification
```bash
curl http://localhost:3000/api/health    # Health check
npm run verify:env                      # Verify environment services
```

**👉 See [HANDOFF.md](HANDOFF.md) for detailed workflows and common tasks**

## 🏗️ Key Concepts

### Matching Pipeline
1. **SQL Pre-filter** - Reduces job pool by 90% using database indexes
2. **AI Matching** - GPT-4o-mini semantic scoring (cached, 60-80% hit rate)
3. **Guaranteed Fallback** - Rule-based matching if AI fails
4. **Custom Scan** - Historical company matching
5. **Diversity Pass** - Ensures variety in results

### Subscription Tiers
- **Free**: 5 instant matches on signup (one-time, website only, 30-day access)
- **Premium (€5/month)**: 10 matches on signup + 15/week via email (Mon/Wed/Fri)

### Background Jobs
- **Scraping**: 2x daily (8am, 6pm UTC) - 8 scrapers run in parallel
- **Embeddings**: Every 72 hours - Refresh vector embeddings for semantic search
- **Email Sends**: Daily at 9am UTC - Scheduled premium emails

**👉 See [ARCHITECTURE.md](ARCHITECTURE.md) for complete system design**

---

## 🚨 Troubleshooting

### Common Issues

**"Missing environment variable" error:**
- Check `.env.local` exists and has all required variables
- Run `npm run verify:env` to see what's missing
- See `lib/env.ts` for all variable definitions

**Database connection fails:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (no trailing slash)
- Check `SUPABASE_SERVICE_ROLE_KEY` is the service_role key (not anon key)
- Ensure Supabase project is active

**Email not sending:**
- Verify `RESEND_API_KEY` starts with `re_`
- Check Resend dashboard for domain verification (SPF/DKIM/DMARC)
- See `Utils/email/sender.ts` for email logic

**TypeScript errors:**
- Run `npm run type-check` to see all errors
- Ensure Node.js 24+ is installed
- Try `rm -rf node_modules package-lock.json && npm install`

**Build fails:**
- Check Node.js version: `node --version` (must be 24+)
- Clear Next.js cache: `rm -rf .next`
- Check `next.config.ts` for any misconfigurations

**👉 See [docs/guides/RUNBOOK.md](docs/guides/RUNBOOK.md) for operational troubleshooting**

---

## 📦 Deployment

### Vercel (Production)
- **Auto-deploy**: Push to `main` branch triggers deployment
- **Preview URLs**: Created automatically for PRs
- **Environment Variables**: Set in Vercel Dashboard → Settings → Environment Variables

### Pre-Deploy Checklist
```bash
npm run lint          # No linting errors
npm run type-check    # No TypeScript errors
npm run build         # Build succeeds
npm run pilot:smoke   # Smoke tests pass
```

**👉 See [docs/guides/PRODUCTION_GUIDE.md](docs/guides/PRODUCTION_GUIDE.md) for complete deployment guide**

## License

MIT

## Support

- Website: https://getjobping.com
- Email: support@getjobping.com

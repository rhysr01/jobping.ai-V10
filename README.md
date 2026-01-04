# JobPing

> AI-powered job matching for early-career roles across Europe. Free instant matches or premium weekly emails.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Production](https://img.shields.io/badge/Status-Live-green)](https://getjobping.com)

## What It Does

AI-matched job recommendations for internships, graduate schemes, and junior roles across European cities. Free tier: 5 instant matches (one-time, website only). Premium tier: 10 matches on signup + 15 matches per week via email (Mon/Wed/Fri).

**Live**: [getjobping.com](https://getjobping.com)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Custom email verification system
- **Payments**: Polar subscriptions
- **Email**: Resend with custom templates
- **AI**: OpenAI for job matching
- **Job Sources**: Adzuna, Reed, JobSpy (LinkedIn, Indeed, Glassdoor)
- **Hosting**: Vercel Edge Network
- **Monitoring**: Structured logging
- **Testing**: Jest (unit/integration), Playwright (E2E)

## Quick Start

### Prerequisites

- Node.js 24+ (see `package.json` engines)
- Supabase account
- Resend API key
- OpenAI API key
- Polar account (for payments)

### Installation

```bash
# Clone repository
npm install

# Environment
# Configure required keys as documented in docs/guides/PRODUCTION_GUIDE.md

# Start
npm run dev
```

Visit http://localhost:3000

## Environment Variables

See `docs/guides/PRODUCTION_GUIDE.md` section 2 for required environment variables (DB, Email, AI, System). All variables are validated at startup via `lib/env.ts`.

## Key Features

### AI-Powered Matching
- GPT-4o-mini for job scoring with caching and cost controls
- Pre-filtering by location/experience/visa
- Duplicate prevention per user
- Vector embeddings for semantic matching

### Smart Email Delivery
- Production-ready templates at `Utils/email/productionReadyTemplates.ts`
- Purple brand alignment, hot-match styling, VML buttons for Outlook
- Feedback endpoints wired into emails

### Security
- RLS enabled
- Rate limiting & input validation
- Admin protected via middleware Basic Auth (see Admin Security below)

### Subscriptions
- **Free**: 5 instant job matches on signup (one-time, viewable on website for 30 days, no email delivery)
- **Premium**: 10 jobs on signup, then 5 jobs/week via email (Mon/Wed/Fri = 15 jobs/week total)

## Architecture

### Matching Engine (`Utils/matching/`)
Multi-stage matching system with intelligent fallbacks and cost optimization:

**Stage 1: SQL Pre-filtering** (Postgres indexes)
- Filters by city, categories, active status, filtered_reason
- Reduces job pool by ~90% using database indexes
- Cost: $0

**Stage 2: AI Matching** (GPT-4o-mini)
- Semantic fit ranking via OpenAI API
- Processes top 20-50 pre-ranked jobs from Stage 1
- LRU caching (60-80% hit rate) reduces costs by 60-80%
- Circuit breaker pattern prevents cascade failures
- Cost: ~$0.001-0.01 per user (with caching)
- Fallback: Rule-based matching if AI fails/timeouts

**Stage 3: Guaranteed Fallback** (Rule-based)
- Location expansion + criteria relaxation
- Triggers if < 10 matches after Stage 2
- Relaxation levels (0-10+) for location proximity
- Visa confidence scoring
- Cost: $0 (in-memory scoring)

**Stage 4: Custom Scan** (Background job)
- Historical company matching + broader search
- Triggers if still < 10 matches after Stage 3
- Finds matches in related fields/locations
- Cost: Medium (background processing)

**Stage 5: Diversity Pass** (Distribution)
- Ensures variety in company types, locations, roles
- Prevents clustering of similar jobs
- Cost: $0 (in-memory algorithm)

**Key Components:**
- `consolidated/engine.ts` - Main orchestrator
- `consolidated/scoring.ts` - Tier-aware match scoring with weights, feedback penalties
- `consolidated/prompts.ts` - GPT-4o-mini prompts with function calling
- `consolidated/cache.ts` - LRU cache implementation
- `consolidated/circuitBreaker.ts` - Circuit breaker pattern
- `guaranteed/coordinator.ts` - Guaranteed matching coordinator
- `prefilter/` - Pre-filtering modules (location, quality, feedback, diversity)

### Background Jobs & Automation (`automation/`)
- **Real Job Runner** (`real-job-runner.cjs`): Runs 2x daily (8am, 6pm UTC)
  - Executes 8 scrapers: JobSpy, JobSpy Internships, Career Path Roles, Adzuna, Reed, CareerJet, Arbeitnow, Jooble
  - Parallel execution for faster cycles
  - Smart stop conditions per scraper
  - Daily health checks and database monitoring
- **Embedding Refresh** (`embedding-refresh.cjs`): Runs every 72 hours
  - Refreshes vector embeddings for semantic search
  - Updates pgvector embeddings in Supabase

### Rate Limiting & Caching
- **Redis** (optional): Rate limiting via `Utils/productionRateLimiter.ts`
  - Atomic rate limiting with Lua scripts
  - Distributed locking for job reservation
  - Configurable windows and limits
- **LRU Cache**: In-memory caching for AI matching results
  - 60-80% cache hit rate
  - Reduces AI costs by 60-80%
  - Automatic eviction of least recently used items

### Job Sources & Scraping (`scrapers/`)
- **8 Active Scrapers**: JobSpy (LinkedIn/Indeed/Glassdoor), JobSpy Internships, Career Path Roles, Adzuna, Reed, CareerJet, Arbeitnow, Jooble
- **Normalization**: 
  - Database-level triggers (automatic cleaning on insert/update)
  - Application-level (`lib/normalize.ts`)
  - City/country/company name standardization
- **Filtering**: 
  - Job boards flagged as companies (prevents "Reed" as company)
  - Non-business roles filtered (e.g., "Dog Walker", "Babysitter")
  - Quality gates prevent low-quality jobs

### Data Quality & Normalization
- **Database Triggers**: Automatic normalization on insert/update
  - City names (München → Munich, Praha → Prague)
  - Country names (Deutschland → Germany)
  - Company names (removes legal suffixes: Ltd, Inc, GmbH)
- **Application-Level**: `lib/normalize.ts` for runtime normalization
- **Prevention System**: Triggers prevent dirty data from multiple sources

### Security Architecture
- **Row-Level Security (RLS)**: Enabled on all public tables
  - Users see only their own data
  - Service role has full access for admin operations
  - Policies defined in `supabase/migrations/`
- **Authentication**: 
  - Custom email verification system (`Utils/emailVerification.ts`)
  - Secure tokens via `Utils/auth/secureTokens.ts`
  - HMAC authentication for system endpoints
- **Rate Limiting**: 
  - Per-user rate limits via Redis
  - API route protection via `lib/api-logger.ts`
  - Admin Basic Auth for `/admin` routes

### Monitoring & Observability
- **Health Endpoints**: 
  - `/api/health` - Database, email, queue, external APIs (<100ms)
  - `/api/metrics` - System metrics (requires `SYSTEM_API_KEY`)
- **Structured Logging**: 
  - All logs via `lib/monitoring.ts`
  - Structured JSON format for parsing
  - Error tracking and performance metrics
- **Vercel Analytics**: 4xx/5xx spikes, latency histograms

## Integrations

### Core Services (Required)

**Supabase** - Database & Backend
- PostgreSQL database with Row-Level Security (RLS)
- Real-time subscriptions
- Vector embeddings (pgvector) for semantic search
- Connection: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Package: `@supabase/supabase-js@2.57.4`

**Resend** - Email Delivery
- Transactional email service
- Production-ready templates with VML support for Outlook
- Domain verification required (SPF/DKIM/DMARC)
- Connection: `RESEND_API_KEY` (starts with `re_`)
- Package: `resend@^6.0.1`

**OpenAI** - AI Matching
- GPT-4o-mini for job scoring and semantic matching
- Function calling for structured responses
- Cost optimization with caching and circuit breakers
- Connection: `OPENAI_API_KEY` (starts with `sk-`)
- Package: `openai@^4.20.1`

**Polar** - Payment Processing (Active)
- **Status**: ✅ Currently active for all subscriptions
- Subscription management (€5/month premium tier)
- Webhook handling for subscription events (`/api/webhooks/polar`)
- Checkout flow integration (`/api/checkout`)
- Connection: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_PRODUCT_ID`
- Package: `@polar-sh/nextjs@0.7.0`

### Optional Services (Recommended)

**Redis** - Rate Limiting & Caching
- Distributed rate limiting with atomic operations
- Job reservation locking
- Connection: `REDIS_URL` (optional, falls back to in-memory)
- Supports: Upstash, Redis Cloud, self-hosted

**Inngest** - Background Jobs & Workflows
- Durable workflows for matching operations
- Auto-configured via Vercel integration
- Enable with: `USE_INNGEST_FOR_MATCHING=true`
- Package: `inngest@3.48.1`

**Sentry** - Error Tracking
- Production error monitoring
- Performance tracking
- Connection: `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN`
- Package: `@sentry/nextjs@10.32.1`

**Axiom** - Logging & Analytics
- Structured logging aggregation
- Auto-configured via Vercel integration
- No environment variables needed
- Package: `next-axiom@1.10.0`

### Job Source APIs

**Adzuna** - Job Aggregator
- European job listings
- Connection: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`
- Scraper: `scrapers/wrappers/adzuna-wrapper.cjs`

**Reed** - UK Job Board
- UK-focused job listings
- Connection: `REED_API_KEY` (optional)
- Scraper: `scrapers/wrappers/reed-wrapper.cjs`, `scrapers/reed-scraper-standalone.cjs`

**JobSpy** - Multi-Source Aggregator
- Aggregates LinkedIn, Indeed, Glassdoor
- Internships-only variant available
- Scraper: `scrapers/wrappers/jobspy-wrapper.cjs`

**CareerJet** - International Job Search
- Global job listings
- Scraper: `scrapers/careerjet.cjs`

**Arbeitnow** - European Job Board
- European job listings
- Scraper: `scrapers/arbeitnow.cjs`

**Jooble** - Job Search Engine
- Global job aggregator
- Scraper: `scrapers/jooble.cjs`

### Hosting & Infrastructure

**Vercel** - Hosting & Edge Network
- Serverless Next.js deployment
- Automatic deployments on push to `main`
- Preview URLs for PRs
- Edge network for global performance
- Auto-integrates: Axiom, Inngest

**Stripe** - Payment Processing (Optional - Not Active)
- **Status**: Code is ready but NOT actively used
- **Purpose**: Stripe Connect for future marketplace features
- **Current Payment System**: Polar (active for subscriptions)
- **Implementation**: Full Stripe Connect API routes exist (`app/api/stripe-connect/`)
  - Create connected accounts
  - Create checkout sessions
  - Create subscriptions
  - Billing portal
  - Webhook handlers
- **To Enable**: Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Package**: `stripe@17.7.0`
- **Note**: All Stripe routes check `isStripeConfigured()` and return 503 if not configured

### Integration Setup

All integrations are configured via environment variables validated at startup (`lib/env.ts`). See `docs/guides/PRODUCTION_GUIDE.md` section 2 for complete setup instructions.

**Quick Verification:**
```bash
npm run verify:env  # Checks all service connections
curl /api/health    # Health check endpoint
```

## Project Structure

```
app/           # Next.js app
components/    # Shared UI
Utils/         # Email + matching + supabase
scripts/       # Automation & utility scripts
supabase/      # Supabase configuration
  migrations/  # Database migrations (canonical)
docs/          # Documentation
  guides/      # Active guides (PRODUCTION_GUIDE.md, RUNBOOK.md)
  status/      # Historical status reports
  archive/     # Legacy files
```

## Email Templates (Production-Ready)

- Source: `Utils/email/productionReadyTemplates.ts`
- Exports: `createWelcomeEmail`, `createJobMatchesEmail`, `createVerificationEmail`, `createReEngagementEmailTemplate`
- Brand: Purple gradients; hot match highlighting; table layout for clients
- Outlook: VML fallback buttons for CTAs
- Feedback: Buttons calling `/api/feedback/email` with sentiment/score

## Send Plan (Operational)

- **Free**: 5 instant matches on signup (website only, no emails)
- **Premium**: 10 jobs on signup via email, then 5 jobs/week via email (Mon/Wed/Fri = 15 jobs/week)
- See logic in `Utils/sendConfiguration.ts` and scheduled sender route (`app/api/send-scheduled-emails/route.ts`)

## Admin Security

- `/admin` requires Basic Auth via env `ADMIN_BASIC_USER` and `ADMIN_BASIC_PASS`
- Upgrade path: move to session-based admin users and audit logging

## Documentation

- **[HANDOFF.md](HANDOFF.md)** – Start here for project handoff and architecture overview
- **[docs/guides/PRODUCTION_GUIDE.md](docs/guides/PRODUCTION_GUIDE.md)** – Environment configuration, deployment, monitoring
- **[docs/guides/RUNBOOK.md](docs/guides/RUNBOOK.md)** – Operational procedures and incident response
- **[docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)** – Contribution guidelines

For historical context, see status reports in `docs/status/` and archived files in `docs/archive/`.

## Troubleshooting

- Health: `/api/health` (database, email, queue, external APIs)
- Email: verify `RESEND_API_KEY` and domain (SPF/DKIM/DMARC) - see `docs/guides/PRODUCTION_GUIDE.md` for email configuration

## Development

```bash
npm run dev
npm run build
npm run start
npm test
npm run type-check
```

## Operational Checks

- `npm run pilot:smoke` — runs the production readiness smoke test and writes `PILOT_SMOKE.md`. Requires Supabase service credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and optional `PILOT_BASE_URL` for staging/prod targets.

## Deployment

- Vercel auto-deploy on push to `main`
- Preview URLs for PRs

## License

MIT

## Support

- Website: https://getjobping.com
- Email: support@getjobping.com

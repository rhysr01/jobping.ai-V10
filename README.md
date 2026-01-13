# JobPing

AI-powered job matching platform built with Next.js, TypeScript, and Supabase.

## Architecture

### Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **AI:** OpenAI GPT-4 for job matching via vector embeddings
- **Email:** Resend API with HTML templates
- **Hosting:** Vercel with cron jobs
- **Analytics:** PostHog, Google Analytics 4, Sentry

### Core Components
- Job scraping and processing system
- AI-powered similarity matching
- Automated email delivery via cron jobs
- User preference management
- Payment processing with Stripe

## API Endpoints

### User Management
- `POST /api/signup` - User registration with preferences
- `POST /api/auth/verify` - Email verification
- `GET /api/user/profile` - Get user profile and preferences

### Job Matching
- `POST /api/matches` - Generate AI-powered job recommendations
- `POST /api/matches/feedback` - User feedback on matches

### Email Delivery
- `POST /api/send-emails` - Send match emails to users
- `GET /api/emails/status` - Check email delivery status

### Payments
- `POST /api/webhooks/stripe` - Stripe webhook handling
- `POST /api/billing/subscribe` - Create subscription
- `POST /api/billing/cancel` - Cancel subscription

### Automation
- `GET /api/cron/daily-scrape` - Daily job data scraping
- `GET /api/cron/email-delivery` - Automated email delivery
- `GET /api/cron/cleanup` - User data cleanup

## Database Schema

### Core Tables
- `users` - User profiles, preferences, subscription status
- `user_preferences` - Detailed career and location preferences
- `job_matches` - AI-generated job recommendations with similarity scores
- `email_deliveries` - Email send logs and delivery tracking
- `user_feedback` - Thumbs up/down responses on matches

### Job Data
- `jobs` - Scraped job listings with embeddings
- `job_sources` - Job board sources and scraping config
- `job_embeddings` - Vector embeddings for similarity matching

### System
- `system_health` - Health check logs
- `rate_limits` - API rate limiting tracking
- `audit_logs` - User actions and system events

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase)
- OpenAI API key
- Resend API key
- Stripe account (for payments)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd jobping

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
OPENAI_API_KEY=your_openai_key

# Email
RESEND_API_KEY=your_resend_key

# Payments
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_GA_ID=your_ga_id
SENTRY_DSN=your_sentry_dsn
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/               # API endpoints
│   ├── dashboard/         # User dashboard
│   └── signup/            # Registration flow
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── matches/          # Job matching components
├── lib/                  # Utility libraries
├── scrapers/            # Job scraping scripts
├── automation/          # Cron job scripts
├── supabase/            # Database migrations and config
└── utils/               # Helper functions
```

## Development

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm run test
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Database Operations
```bash
# Create migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset database
npm run db:reset
```

## Deployment

The application is configured for Vercel deployment with automated CI/CD.

### Cron Jobs
- Daily job scraping at 2 AM CET
- Email delivery at 9 AM CET (Mon/Wed/Fri)
- User cleanup at 3 AM CET
- Health checks every 6 hours

### Monitoring
- Sentry for error tracking
- Vercel Analytics for performance
- PostHog for user behavior
- Supabase monitoring for database health
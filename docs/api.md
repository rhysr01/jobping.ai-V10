## API Reference

### Authentication

All API endpoints require authentication via HMAC signatures or API keys.

```typescript
// HMAC Authentication Example
const signature = crypto
  .createHmac('sha256', process.env.API_SECRET)
  .update(`${userLimit}${jobLimit}${timestamp}`, 'utf8')
  .digest('hex');

const response = await fetch('/api/match-users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userLimit: 100,
    jobLimit: 500,
    signature,
    timestamp: Date.now()
  })
});
```

### Core Endpoints

#### Job Matching (`/api/match-users`)
**Method:** `POST`

Processes batch job matching for all active users.

**Request Body:**
```json
{
  "userLimit": 100,
  "jobLimit": 500,
  "signature": "hmac_signature",
  "timestamp": 1703123456789
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "matches": [
        {
          "jobId": 123,
          "similarity": 0.92,
          "confidence": "high",
          "reasoning": "Strong match in software engineering and Berlin location"
        }
      ],
      "processingTime": 1250
    }
  ],
  "totalUsers": 42,
  "totalMatches": 156
}
```

**Rate Limiting:** 1 request per 30 seconds (global lock)

#### User Registration (`/api/signup`)
**Method:** `POST`

Creates new user account and sends verification email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "preferences": {
    "targetCities": ["Berlin", "Munich"],
    "roles": ["Software Engineer", "Frontend Developer"],
    "workEnvironment": "hybrid",
    "startDate": "2024-06-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "verificationToken": "token",
  "message": "Please check your email to verify your account"
}
```

#### Email Verification (`/api/auth/verify`)
**Method:** `POST`

Verifies user email address.

```json
{
  "token": "verification_token"
}
```

#### User Preferences (`/api/preferences`)
**Method:** `POST`

Updates user job matching preferences.

```json
{
  "userId": "uuid",
  "preferences": {
    "skills": ["React", "TypeScript", "Node.js"],
    "industries": ["Technology", "FinTech"],
    "companySize": "startup",
    "careerKeywords": "junior software engineer"
  }
}
```

#### Email Delivery (`/api/send-emails`)
**Method:** `POST`

Triggers email delivery for matched jobs.

```json
{
  "userIds": ["uuid1", "uuid2"],
  "matchIds": [123, 456],
  "deliveryType": "premium" // or "free"
}
```

#### Stripe Webhooks (`/api/webhooks/stripe`)
**Method:** `POST`

Handles Stripe subscription events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Supported Events:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`

#### Health Check (`/api/health`)
**Method:** `GET`

System health monitoring endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-13T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "email": "healthy",
    "ai": "healthy"
  },
  "version": "1.0.0"
}
```

### Cron Endpoints

#### Daily Scraping (`/api/cron/daily-scrape`)
**Method:** `GET`

Executes daily job data scraping from all sources.

- **Schedule:** Every 2 hours
- **Sources:** Arbeitnow, Careerjet, Jooble, Reed, Adzuna
- **Processing:** Deduplication, AI labeling, embedding generation

#### Email Delivery (`/api/cron/email-delivery`)
**Method:** `GET`

Sends weekly match emails to premium users.

- **Schedule:** Monday, Wednesday, Friday at 9:00 AM CET
- **Template:** Personalized HTML with match recommendations
- **Tracking:** Open rates, click tracking, engagement scoring

#### User Cleanup (`/api/cron/cleanup-free-users`)
**Method:** `GET`

Removes inactive free users after 30-day expiration.

- **Schedule:** Daily at 2:00 AM CET
- **Criteria:** Free tier users with no engagement > 30 days
- **Process:** Data anonymization, account deactivation

#### Health Monitoring (`/api/cron/check-link-health`)
**Method:** `GET`

Validates job URLs and updates active status.

- **Schedule:** Every 6 hours
- **Checks:** HTTP status, content validation
- **Updates:** Job active/inactive status in database

#### Data Integrity Maintenance (`/api/cron/run-maintenance`)
**Method:** `GET`

Enforces database data integrity and performs automated maintenance.

- **Schedule:** Daily at 3:00 AM CET
- **Functions:**
  - **Company name sync**: Updates missing company_name fields
  - **Job board filtering**: Removes job board companies from results
  - **Role filtering**: Filters out CEO/executive, construction, medical, legal, teaching roles
  - **Data integrity enforcement**: Fixes invalid categories and visa statuses
- **Data Integrity Features:**
  - Maps invalid job categories to valid form options using AI-like metadata analysis
  - Ensures all jobs have explicit visa_friendly status (true/false, never null)
  - Prevents data drift and maintains 100% consistency with form requirements

### Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    "field": "validation_error_details"
  },
  "requestId": "uuid"
}
```

**Common Error Types:**
- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_FAILED` - Invalid credentials
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DATABASE_ERROR` - Database connectivity issues
- `EXTERNAL_SERVICE_ERROR` - Third-party API failures


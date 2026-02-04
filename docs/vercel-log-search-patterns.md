# Vercel Log Search Patterns

## Quick Reference: Search Patterns for Vercel Dashboard

Copy and paste these patterns into the Vercel Logs search box to filter logs:

### Signup Operations

| Pattern | Description | Example |
|---------|-------------|---------|
| `[SIGNUP_FREE]` | All free signup operations | Free signup requests, validation, matching |
| `[SIGNUP_PREMIUM]` | All premium signup operations | Premium signup requests, validation, matching |
| `[SIGNUP_START]` | Signup flow started | User begins signup process |
| `[SIGNUP_SUCCESS]` | Signup completed successfully | User created, matches found |
| `[SIGNUP_ERROR]` | Signup errors | Validation failures, API errors |
| `[SIGNUP_VALIDATION]` | Validation operations | Form validation, schema checks |

### Matching Operations

| Pattern | Description | Example |
|---------|-------------|---------|
| `[MATCHING]` | All matching operations | Generic matching logs |
| `[MATCHING_FREE]` | Free tier matching | Free user job matching |
| `[MATCHING_PREMIUM]` | Premium tier matching | Premium user job matching |
| `[MATCHING_START]` | Matching started | Beginning of matching process |
| `[MATCHING_COMPLETE]` | Matching completed | Matching finished successfully |
| `[MATCHING_ERROR]` | Matching errors | Matching failures, AI errors |
| `[MATCHING_AI]` | AI matching operations | AI ranking, semantic matching |
| `[MATCHING_FALLBACK]` | Fallback matching | Using fallback when AI fails |

### Database Operations

| Pattern | Description | Example |
|---------|-------------|---------|
| `[DB]` | All database operations | Generic DB logs |
| `[DB_QUERY]` | Database queries | SELECT, checking existing users |
| `[DB_INSERT]` | Database inserts | Creating users, saving matches |
| `[DB_UPDATE]` | Database updates | Updating user data |
| `[DB_DELETE]` | Database deletes | Removing records |
| `[DB_ERROR]` | Database errors | Query failures, constraint violations |
| `[DB_SUCCESS]` | Successful DB operations | Query completed successfully |

### API Operations

| Pattern | Description | Example |
|---------|-------------|---------|
| `[API]` | All API operations | Generic API logs |
| `[API_REQUEST]` | API requests received | Incoming requests |
| `[API_RESPONSE]` | API responses sent | Successful responses |
| `[API_ERROR]` | API errors | Route handler errors |

### Authentication

| Pattern | Description | Example |
|---------|-------------|---------|
| `[AUTH]` | Authentication operations | Login, signup auth |
| `[AUTH_SUCCESS]` | Successful authentication | User authenticated |
| `[AUTH_ERROR]` | Authentication errors | Auth failures |

### Email Operations

| Pattern | Description | Example |
|---------|-------------|---------|
| `[EMAIL]` | All email operations | Generic email logs |
| `[EMAIL_SENT]` | Emails sent successfully | Welcome emails, match emails |
| `[EMAIL_ERROR]` | Email errors | Send failures |

### Validation

| Pattern | Description | Example |
|---------|-------------|---------|
| `[VALIDATION]` | All validation operations | Generic validation |
| `[VALIDATION_SUCCESS]` | Validation passed | Form data valid |
| `[VALIDATION_ERROR]` | Validation failed | Invalid form data |

### Rate Limiting

| Pattern | Description | Example |
|---------|-------------|---------|
| `[RATE_LIMIT]` | Rate limiting operations | Rate limit checks |
| `[RATE_LIMIT_EXCEEDED]` | Rate limit exceeded | Too many requests |

### Performance

| Pattern | Description | Example |
|---------|-------------|---------|
| `[PERF]` | Performance metrics | Timing, duration |
| `[PERF_SLOW]` | Slow operations | Requests > 5 seconds |

### Critical Operations

| Pattern | Description | Example |
|---------|-------------|---------|
| `[CRITICAL]` | Critical operations | Important system events |
| `[CRITICAL_ERROR]` | Critical errors | System failures, silent exceptions |

## Common Search Combinations

### Debug Free Signup Issues
```
[SIGNUP_FREE] [SIGNUP_ERROR]
```

### Debug Premium Signup Issues
```
[SIGNUP_PREMIUM] [SIGNUP_ERROR]
```

### Debug Matching Problems
```
[MATCHING_ERROR] OR [MATCHING_FREE] OR [MATCHING_PREMIUM]
```

### Debug Database Issues
```
[DB_ERROR] OR [DB_QUERY]
```

### Track Complete Signup Flow
```
[SIGNUP_FREE] [SIGNUP_START] ... [SIGNUP_SUCCESS]
```

### Find Slow Operations
```
[PERF_SLOW]
```

### Find All Errors
```
[SIGNUP_ERROR] OR [MATCHING_ERROR] OR [DB_ERROR] OR [API_ERROR] OR [CRITICAL_ERROR]
```

## Vercel Dashboard Usage

1. Go to: **Vercel Dashboard → Your Project → Logs**
2. Use the search box at the top
3. Enter one of the patterns above
4. Filter by:
   - Function: `app/api/signup/free/route.ts` or `app/api/signup/route.ts`
   - Time range: Last hour, 24 hours, etc.

## Example Log Output

```
[SIGNUP_FREE] [API_REQUEST] 🚀 Request received { requestId: "...", url: "..." }
[SIGNUP_FREE] [VALIDATION] Validation result { success: true }
[SIGNUP_FREE] [DB_QUERY] Checking for existing user { email: "..." }
[SIGNUP_FREE] [DB_INSERT] Creating user { email: "..." }
[SIGNUP_FREE] [MATCHING_START] ✅ Starting matching { email: "..." }
[MATCHING_FREE] [MATCHING_START] Starting lightweight free tier matching { jobsAvailable: 100 }
[MATCHING_FREE] [MATCHING_COMPLETE] Strategy matching completed { matchesFound: 5 }
[SIGNUP_FREE] [SIGNUP_SUCCESS] 🎉 Signup successful { matchCount: 5 }
```

## Tips

1. **Combine patterns**: Use `AND` or `OR` to combine patterns
2. **Use request IDs**: Once you find an error, search for the `requestId` to see the full flow
3. **Filter by time**: Narrow down to specific time ranges
4. **Export logs**: Use Vercel CLI to export logs: `vercel logs [deployment-url]`

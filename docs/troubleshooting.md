# Troubleshooting Guide

## Common Issues & Solutions

### Development Setup Issues

#### "TypeScript errors on startup"
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

#### "Database connection failed"
```bash
# Check Supabase credentials in .env.local
npm run db:health

# Verify environment variables
cat .env.local | grep SUPABASE

# Test database connection
npm run db:test-connection
```

#### "AI matching not working"
```bash
# Verify OpenAI API key
npm run test:ai-check

# Check API key format (should start with sk-)
echo $OPENAI_API_KEY | head -c 10

# Test OpenAI connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Build & Deployment Issues

#### "Build failing with TypeScript errors"
```bash
# Type check first
npm run type-check

# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm install
npm run build
```

#### "Vercel deployment failing"
```bash
# Check build locally first
npm run build

# Verify all environment variables are set in Vercel
# Check build logs in Vercel dashboard

# Common issues:
# - Missing OPENAI_API_KEY
# - Incorrect SUPABASE_URL format
# - Node.js version mismatch
```

### Testing Issues

#### "E2E tests failing with rate limits"
```bash
# Tests automatically handle rate limits with mock data
# If persistent, wait 1 hour or use different IP

# Manual rate limit check
curl -s http://localhost:3000/api/health | jq .status
```

#### "Database tests failing"
```bash
# Reset test database
npm run db:reset

# Check database migrations
npm run db:migrate

# Verify Supabase connection
npm run db:health
```

### Production Issues

#### "Emails not sending"
```bash
# Check Resend API key
echo $RESEND_API_KEY | head -c 10

# Test email sending
npm run test:email

# Check email logs
npm run logs:email
```

#### "Job scraping failing"
```bash
# Check scraping logs
npm run logs:scraping

# Manual scrape test
npm run scrape:test

# Verify API keys for job sources
```

#### "High error rates in monitoring"
```bash
# Check application logs
npm run logs:app

# Database performance
npm run db:performance

# Restart services if needed
npm run restart:all
```

## Performance Issues

### Slow API Responses
```bash
# Check database query performance
npm run db:analyze-queries

# Redis cache status
npm run cache:status

# Server resource usage
npm run monitor:resources
```

### High Memory Usage
```bash
# Check for memory leaks
npm run memory:profile

# Restart application
npm run restart:app

# Scale infrastructure if needed
```

## Emergency Procedures

### Complete System Reset
```bash
# Stop all services
npm run stop:all

# Reset database (WARNING: destroys all data)
npm run db:reset

# Clear all caches
npm run cache:clear

# Rebuild from scratch
npm install
npm run build
npm run db:migrate
npm start
```

### Database Recovery
```bash
# Create backup first
npm run db:backup

# Reset to last good state
npm run db:restore

# Verify data integrity
npm run db:verify
```

### Emergency Contacts

- **Database Issues**: Check Supabase dashboard
- **API Issues**: Check Vercel function logs
- **Email Issues**: Check Resend dashboard
- **AI Issues**: Check OpenAI dashboard

## Monitoring & Alerts

### Key Metrics to Monitor
- API response times (< 2 seconds)
- Database query performance (< 100ms)
- Email delivery rates (> 95%)
- Error rates (< 1%)
- User signup conversion (> 10%)

### Log Locations
- Application logs: `/var/log/jobping/app.log`
- Database logs: Supabase dashboard
- Email logs: Resend dashboard
- Error logs: Sentry dashboard

## Getting Help

1. **Check this troubleshooting guide first**
2. **Search existing GitHub issues**
3. **Check service status pages** (Supabase, Vercel, OpenAI)
4. **Create detailed issue report** with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Log excerpts
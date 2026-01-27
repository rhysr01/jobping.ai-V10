## Performance Considerations

### Frontend Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for unused dependencies
npx knip
```

#### Image Optimization
```tsx
// components/ui/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
        onLoadingComplete={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

#### Database Performance

#### Query Optimization
```sql
-- Optimized job matching query
EXPLAIN ANALYZE
SELECT j.*, jm.similarity_score, jm.confidence_level
FROM jobs j
JOIN job_matches jm ON j.id = jm.job_id
WHERE jm.user_id = $1
  AND j.is_active = true
  AND jm.created_at > NOW() - INTERVAL '30 days'
ORDER BY jm.similarity_score DESC
LIMIT 15;

-- Add composite index
CREATE INDEX CONCURRENTLY idx_job_matches_user_score
ON job_matches(user_id, similarity_score DESC, created_at DESC)
WHERE created_at > NOW() - INTERVAL '90 days';
```

#### Connection Pooling
```typescript
// lib/database-pool.ts (see earlier implementation)
import { DatabasePool } from './database-pool';

const pool = DatabasePool.getInstance();

// Health monitoring
setInterval(() => {
  const status = DatabasePool.getPoolStatus();
  if (!status.isHealthy) {
    console.warn('Database pool unhealthy:', status);
  }
}, 30000);
```

#### Caching Strategy
```typescript
// Redis caching for frequent queries
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedUserMatches(userId: string) {
  const cacheKey = `user_matches:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const matches = await fetchUserMatchesFromDB(userId);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(matches));

  return matches;
}
```

### API Performance

#### Response Compression
```typescript
// middleware/compression.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enable compression for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  return response;
}
```

#### Rate Limiting
```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function checkRateLimit(identifier: string) {
  const { success, reset } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${reset} seconds.`);
  }
}
```

### Monitoring & Observability

#### Performance Metrics
```typescript
// lib/performance-monitor.ts
export function trackApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) {
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'api_performance', {
      endpoint,
      method,
      duration,
      status_code: statusCode,
    });
  }

  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow API request: ${method} ${endpoint} took ${duration}ms`);
  }
}
```

#### Error Tracking
```typescript
// lib/error-handler.ts
import * as Sentry from '@sentry/nextjs';

export function handleApiError(error: Error, context: Record<string, any>) {
  // Log to console
  console.error('API Error:', error, context);

  // Send to Sentry
  Sentry.captureException(error, {
    tags: {
      component: 'api',
      ...context,
    },
  });

  // Return standardized error response
  return {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId: context.requestId,
  };
}
```

### Security Considerations

#### Input Validation
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const userSignupSchema = z.object({
  email: z.string().email().max(254),
  fullName: z.string().min(2).max(100),
  targetCities: z.array(z.string()).min(1).max(5),
  roles: z.array(z.string()).min(1).max(3),
});

export const jobMatchSchema = z.object({
  userLimit: z.number().int().min(1).max(1000),
  jobLimit: z.number().int().min(1).max(10000),
  signature: z.string().optional(),
  timestamp: z.number().optional(),
});
```

#### Authentication & Authorization
```typescript
// middleware/auth.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const isValid = await validateApiKey(token);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}
```

#### Data Sanitization
```typescript
// utils/sanitizers.ts
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

export function sanitizeHtml(html: string): string {
  return DOMPurifyInstance.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

export function sanitizeJobDescription(description: string): string {
  // Remove script tags, excessive whitespace, etc.
  return description
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```


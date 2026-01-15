## Component Architecture

### Frontend Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected user routes
│   ├── api/                      # API endpoints
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx           # Button component
│   │   ├── input.tsx            # Input field
│   │   ├── card.tsx             # Card container
│   │   └── dialog.tsx           # Modal dialogs
│   ├── forms/                   # Form components
│   │   ├── signup-form.tsx      # Registration form
│   │   ├── preferences-form.tsx # User preferences
│   │   └── payment-form.tsx     # Stripe integration
│   ├── matches/                 # Job matching UI
│   │   ├── match-card.tsx       # Individual match display
│   │   ├── match-list.tsx       # Match results list
│   │   └── match-filters.tsx    # Filtering controls
│   └── sections/                # Page sections
│       ├── hero.tsx             # Landing page hero
│       ├── pricing.tsx          # Pricing display
│       └── testimonials.tsx     # Social proof
├── lib/                         # Utilities and services
│   ├── supabase-client.ts       # Database client
│   ├── stripe.ts                # Payment processing
│   ├── validation.ts            # Form validation
│   └── constants.ts             # App constants
├── hooks/                       # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   ├── use-matches.ts           # Match data hook
│   └── use-preferences.ts       # User preferences hook
└── utils/                       # Helper functions
    ├── api-helpers.ts           # API utilities
    ├── formatters.ts            # Data formatters
    └── validators.ts            # Input validation
```

### Component Patterns

#### Server Components (Default)
```tsx
// app/dashboard/page.tsx
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { MatchList } from '@/components/matches/match-list';

export default async function DashboardPage() {
  const supabase = getServerSupabaseClient();

  // Server-side data fetching
  const { data: user } = await supabase.auth.getUser();
  const { data: matches } = await supabase
    .from('job_matches')
    .select('*')
    .eq('user_id', user.user?.id)
    .limit(10);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
      <MatchList matches={matches || []} />
    </div>
  );
}
```

#### Client Components (Interactive)
```tsx
// components/matches/match-list.tsx
'use client';

import { useState } from 'react';
import { MatchCard } from './match-card';

interface MatchListProps {
  initialMatches: JobMatch[];
}

export function MatchList({ initialMatches }: MatchListProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.confidence_level === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['all', 'high', 'medium', 'low'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level as any)}
            className={`px-3 py-1 rounded ${
              filter === level ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {filteredMatches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

#### Custom Hooks
```tsx
// hooks/use-matches.ts
import { useState, useEffect } from 'react';
import { getClientSupabaseClient } from '@/lib/supabase-client';

export function useMatches(userId: string) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const supabase = getClientSupabaseClient();
        const { data, error } = await supabase
          .from('job_matches')
          .select(`
            *,
            jobs (
              title,
              company,
              location,
              job_url
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  return { matches, loading, error };
}
```

### State Management

#### Server State (React Query/TanStack Query)
```tsx
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,  // 10 minutes
    },
  },
});

// Usage in components
import { useQuery } from '@tanstack/react-query';

function useUserMatches(userId: string) {
  return useQuery({
    queryKey: ['matches', userId],
    queryFn: () => fetchUserMatches(userId),
    enabled: !!userId,
  });
}
```

#### Client State (Zustand)
```tsx
// lib/store/auth.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const supabase = getClientSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      set({ user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const supabase = getClientSupabaseClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
```


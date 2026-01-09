#!/bin/bash
echo '🚀 AI Testing Environment Setup Check'
echo '====================================='

# Check required environment variables
echo 'Checking environment variables...'
echo ''

missing_vars=()

if [ -z "$OPENAI_API_KEY" ]; then
    echo '❌ OPENAI_API_KEY not set'
    missing_vars+=('OPENAI_API_KEY')
else
    echo '✅ OPENAI_API_KEY is set'
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo '❌ NEXT_PUBLIC_SUPABASE_URL not set'
    missing_vars+=('NEXT_PUBLIC_SUPABASE_URL')
else
    echo '✅ NEXT_PUBLIC_SUPABASE_URL is set'
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo '❌ SUPABASE_SERVICE_ROLE_KEY not set'
    missing_vars+=('SUPABASE_SERVICE_ROLE_KEY')
else
    echo '✅ SUPABASE_SERVICE_ROLE_KEY is set'
fi

echo ''
echo '====================================='

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo '🎉 All required variables are set!'
    echo 'Running AI tests...'
    echo ''
    npm run test:ai-simple
else
    echo '⚠️  Missing environment variables:'
    printf '   - %s
' "${missing_vars[@]}"
    echo ''
    echo 'Please set them in your .env.local file or export them:'
    echo 'export OPENAI_API_KEY="sk-your-key"'
    echo 'export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"'
    echo 'export SUPABASE_SERVICE_ROLE_KEY="your-service-key"'
    echo ''
    echo 'Then run: npm run test:ai-simple'
fi

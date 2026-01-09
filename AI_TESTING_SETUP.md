# 🚀 AI Testing Environment Setup

## Required Environment Variables

Your AI tests require these environment variables to run with real OpenAI API calls:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## How to Get Your API Keys

### 1. OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. **Never commit this to git!**

### 2. Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Setting Up Environment Variables

### Option 1: .env.local file (Recommended)

Add these lines to your `.env.local` file:

```bash
# AI Testing Environment Variables
OPENAI_API_KEY=sk-your-actual-openai-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

### Option 2: Terminal Export (Temporary)

```bash
export OPENAI_API_KEY="sk-your-key"
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

## Testing Your Setup

### Quick Check
```bash
npm run test:ai-check
```

This will:
- ✅ Verify all required variables are set
- 🧪 Run a simple AI test to confirm everything works
- 📊 Show you the results

### Full Test Suite
```bash
# Once environment is set up, run comprehensive tests
npm run test:ai-comprehensive
```

## What Each Test Validates

| Test | What it checks | Without API Key | With API Key |
|------|----------------|----------------|--------------|
| `test:ai-simple` | Basic AI connectivity | ❌ Fails | ✅ Tests real AI responses |
| `test:ai-quality` | Result relevance & accuracy | ❌ Fails | ✅ Validates match quality |
| `test:ai-validation` | Data structure & integrity | ❌ Fails | ✅ Checks response formats |
| `test:ai-reliability` | System stability | ✅ Mock mode | ✅ Real AI + MCP validation |

## Security Notes

- 🔒 **Never commit API keys to git**
- 🔒 **Use .env.local** (already in .gitignore)
- 🔒 **Rotate keys regularly** for security
- 🔒 **Limit API key permissions** to minimum required

## Troubleshooting

### "API key not found" error
```bash
# Check if variable is set
echo $OPENAI_API_KEY

# If not set, export it
export OPENAI_API_KEY="sk-your-key"
```

### "Invalid API key" error
- Double-check you copied the full key
- Make sure it starts with `sk-`
- Verify it's not expired

### Supabase connection issues
- Check your project URL is correct
- Verify you're using the `service_role` key (not the `anon` key)
- Make sure your Supabase project is active

## Cost Considerations

- **OpenAI API**: ~$0.01-0.05 per test run
- **Supabase**: Free for testing
- **Monitor usage** in your OpenAI dashboard

## Next Steps

1. Set up environment variables
2. Run `npm run test:ai-check`
3. If successful, run `npm run test:ai-quality`
4. Set up automated testing in CI/CD

---

**Ready to test your AI?** Get your API keys and run `npm run test:ai-check`! 🎯
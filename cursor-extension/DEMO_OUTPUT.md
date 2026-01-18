# 🎯 JobPing MCP Tools - Demo Output

## Installation Complete ✅

After installing the extension (`jobping-mcp-tools-0.1.0.vsix`), you should see it in your Extensions panel:

```
📦 Installed Extensions
├── JobPing MCP Tools v0.1.0
│   ├── Get Recent Sentry Errors
│   ├── Analyze Sentry Error Patterns
│   ├── Get Sentry Error Details
│   └── Test MCP Connection
```

## Command Examples

### 1. Test Connection
**Command Palette**: `JobPing: Test MCP Connection`

**Output** (opens in new editor tab):
```markdown
🔧 MCP Connection Test:

Environment Variables:
• SENTRY_AUTH_TOKEN: ✅ Set
• SENTRY_ORG: ✅ Set
• SENTRY_PROJECT: ✅ Set

Configuration Status: ✅ Ready

Sentry API Connection: ✅ Successful
Last API Call: 1/19/2026, 12:45:00 PM
```

### 2. Get Recent Errors
**Command Palette**: `JobPing: Get Recent Sentry Errors`

**Output** (opens in new editor tab):
```markdown
🚨 Recent Sentry errors (last 24 hours):

• **TypeError: Cannot read property 'map' of undefined**
  📊 Count: 23 | Users: 7
  🏷️ Level: error | Status: unresolved
  📅 Last seen: 1/19/2026, 12:34:56 PM
  🔗 https://sentry.io/organizations/jobping/issues/123456/

• **ReferenceError: setFormData is not defined**
  📊 Count: 12 | Users: 4
  🏷️ Level: error | Status: unresolved
  📅 Last seen: 1/19/2026, 11:22:33 AM
  🔗 https://sentry.io/organizations/jobping/issues/789012/

• **NetworkError: Failed to fetch**
  📊 Count: 8 | Users: 3
  🏷️ Level: warning | Status: resolved
  📅 Last seen: 1/19/2026, 10:15:44 AM
  🔗 https://sentry.io/organizations/jobping/issues/345678/
```

### 3. Analyze Error Patterns
**Command Palette**: `JobPing: Analyze Sentry Error Patterns`
**Input**: `7` (days)

**Output** (opens in new editor tab):
```markdown
📊 Sentry Error Analysis (last 7 days):

**Summary:**
• Total issues: 47
• Total events: 1,234
• Affected users: 89

**By Severity:**
• error: 32 (68%)
• warning: 12 (26%)
• info: 3 (6%)

**By Status:**
• unresolved: 28 (60%)
• resolved: 15 (32%)
• ignored: 4 (8%)

**Top 10 Errors:**
1. TypeError: Cannot read property 'map' of undefined
   Count: 23 (error) - 49% of all errors
2. ReferenceError: setFormData is not defined
   Count: 12 (error) - 26% of all errors
3. NetworkError: Failed to fetch
   Count: 8 (warning) - 17% of all errors

**Trending Issues:**
• 🔴 setFormData errors increasing 150% this week
• 🟡 Network errors stable
• 🟢 TypeError issues decreasing 30%

**Recommendations:**
• **Critical**: Fix setFormData undefined errors - they're increasing rapidly
• **Warning**: Review network error handling in API calls
• **Info**: Monitor TypeError resolution progress
```

### 4. Get Specific Error Details
**Command Palette**: `JobPing: Get Sentry Error Details`
**Input**: `123456` (error ID from Sentry URL)

**Output** (opens in new editor tab):
```markdown
🔍 Sentry Error Details: TypeError: Cannot read property 'map' of undefined

**Basic Info:**
• ID: 123456
• Level: error
• Status: unresolved
• First seen: 1/18/2026, 9:15:23 AM
• Last seen: 1/19/2026, 12:34:56 PM

**Stats:**
• Total events: 23
• Affected users: 7
• Events per hour: 2.3

**Tags:**
• browser: Chrome 120.0.0
• os: macOS 15.6.1
• url: /signup/free
• component: SignupFormFree

**Stack Trace:**
```
TypeError: Cannot read property 'map' of undefined
    at SignupFormFree (/app/components/signup/SignupFormFree.tsx:156:12)
    at renderWithHooks (/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:14938:18)
    at mountIndeterminateComponent (/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:17791:13)
    at beginWork (/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18596:16)
    at HTMLUnknownElement.callCallback (/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:18961:14)
```

**Context:**
• User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
• IP Address: 192.168.1.100
• Session ID: abc123def456
• User ID: user_789xyz

**URL:** https://sentry.io/organizations/jobping/issues/123456/
```

## Real-World Usage Scenarios

### 🔧 During Development
```bash
# After pushing a new feature
JobPing: Get Recent Sentry Errors
# → See if any new errors were introduced
```

### 🚀 Before Deployment
```bash
# Check error trends
JobPing: Analyze Sentry Error Patterns
# → Ensure error rates are acceptable
```

### 🐛 When Debugging
```bash
# Investigate a specific user report
JobPing: Get Sentry Error Details
# → Get full context and stack trace
```

### 📊 Daily Monitoring
```bash
# Start-of-day error check
JobPing: Get Recent Sentry Errors
# → Stay aware of overnight issues
```

## Integration Benefits

✅ **No Context Switching** - Access error data without leaving Cursor
✅ **Real-time Monitoring** - Get immediate feedback on code changes
✅ **Detailed Analysis** - Comprehensive error statistics and trends
✅ **Direct Links** - Click through to full Sentry issues
✅ **Team Collaboration** - Share error data with team members

## Next Steps

1. **Install the extension** using the VSIX file
2. **Configure your Sentry credentials** in `.env.local`
3. **Test the connection** with the test command
4. **Start monitoring errors** during development
5. **Integrate into your workflow** for better error tracking

The extension provides direct Sentry integration within Cursor, making error monitoring and debugging much more efficient! 🎉
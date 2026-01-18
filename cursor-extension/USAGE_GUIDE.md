# 🚀 JobPing MCP Tools - Usage Guide

## Installation

### Step 1: Install the Extension
```bash
# Navigate to the extension directory
cd cursor-extension

# The .vsix file should be ready for installation
ls -la *.vsix
```

**In Cursor:**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open Command Palette
2. Type "Extensions: Install from VSIX" and select it
3. Navigate to: `cursor-extension/jobping-mcp-tools-0.1.0.vsix`
4. Click "Install"

### Step 2: Verify Installation
1. Open Extensions panel (`Ctrl+Shift+X`)
2. Search for "JobPing MCP Tools"
3. Confirm it's installed and enabled

### Step 3: Configure Environment
Ensure your `.env.local` file contains:
```env
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=javascript-nextjs
```

## Usage Examples

### 1. Test Connection
```
Command: JobPing: Test MCP Connection
Result: Shows configuration status
```

### 2. Get Recent Errors
```
Command: JobPing: Get Recent Sentry Errors
Result: Lists all errors from the last 24 hours
```

### 3. Analyze Error Patterns
```
Command: JobPing: Analyze Sentry Error Patterns
Input: Number of days (e.g., 7)
Result: Statistical analysis of error trends
```

### 4. Get Specific Error Details
```
Command: JobPing: Get Sentry Error Details
Input: Error ID (e.g., 123456789)
Result: Detailed information about that specific error
```

## Expected Output Examples

### Connection Test
```
🔧 MCP Connection Test:

Environment Variables:
• SENTRY_AUTH_TOKEN: ✅ Set
• SENTRY_ORG: ✅ Set
• SENTRY_PROJECT: ✅ Set

Configuration Status: ✅ Ready
```

### Recent Errors
```
🚨 Recent Sentry errors (last 24 hours):

• **TypeError: Cannot read property 'x' of undefined**
  📊 Count: 15 | Users: 3
  🏷️ Level: error | Status: unresolved
  📅 Last seen: 1/19/2026, 12:34:56 PM
  🔗 https://sentry.io/organizations/jobping/issues/123456/

• **ReferenceError: setFormData is not defined**
  📊 Count: 8 | Users: 2
  🏷️ Level: error | Status: resolved
  📅 Last seen: 1/18/2026, 3:21:45 PM
  🔗 https://sentry.io/organizations/jobping/issues/789012/
```

### Error Analysis
```
📊 Sentry Error Analysis (last 7 days):

**Summary:**
• Total issues: 23

**By Severity:**
• error: 18
• warning: 4
• info: 1

**By Status:**
• resolved: 15
• unresolved: 8

**Top 10 Errors:**
1. TypeError: Cannot read property 'x' of undefined
   Count: 15 (error)
2. ReferenceError: setFormData is not defined
   Count: 8 (error)
```

## Quick Start

1. **Install Extension** (follow steps above)
2. **Test Connection**: `JobPing: Test MCP Connection`
3. **Check for Errors**: `JobPing: Get Recent Sentry Errors`
4. **Analyze Trends**: `JobPing: Analyze Sentry Error Patterns`

## Troubleshooting

### Extension Not Found
- Ensure the .vsix file exists in `cursor-extension/`
- Restart Cursor after installation
- Check Developer Tools for errors

### Commands Not Available
- Verify extension is enabled in Extensions panel
- Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

### API Errors
- Check `.env.local` file exists and has correct values
- Verify Sentry token has "Read" permissions
- Confirm organization and project slugs are correct

### No Errors Found
- This is actually good! It means your app is running smoothly
- Try extending the time range in analysis commands

## Integration with Development Workflow

### During Development
- Run "Get Recent Sentry Errors" after deploying new features
- Use "Analyze Error Patterns" to identify trending issues
- Check specific error details when debugging user reports

### In Production Monitoring
- Set up regular checks for critical errors
- Monitor error rates and user impact
- Track resolution progress for ongoing issues

## Advanced Usage

### Custom Error Queries
The extension uses Sentry's API directly, so you can:
- Filter by error level, status, or time range
- Get detailed stack traces and context
- View user impact and affected browsers/devices

### Integration with Other Tools
- Combine with existing debugging workflows
- Export error data for further analysis
- Use in CI/CD pipelines for automated monitoring

## Support

If you encounter issues:
1. Check the extension logs in Cursor's Developer Tools
2. Verify your Sentry configuration
3. Ensure the extension is properly installed
4. Check that your `.env.local` file is accessible

The extension provides direct integration with Sentry's error monitoring, giving you immediate access to error data without leaving your IDE!
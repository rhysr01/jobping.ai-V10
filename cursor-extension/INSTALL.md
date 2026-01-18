# Installing JobPing MCP Tools Extension

## Installation Steps

1. **Locate the extension file:**
   ```
   cursor-extension/jobping-mcp-tools-0.1.0.vsix
   ```

2. **Install in Cursor:**
   - Open Cursor
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the command palette
   - Type "Extensions: Install from VSIX" and select it
   - Navigate to the `cursor-extension/jobping-mcp-tools-0.1.0.vsix` file and select it

3. **Verify installation:**
   - Open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`)
   - Search for "JobPing MCP Tools"
   - You should see it in the installed extensions list

## Configuration

The extension automatically loads environment variables from your project's `.env.local` file. Make sure you have:

```env
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=javascript-nextjs
```

### Getting Sentry Credentials

1. **Auth Token**: Go to https://sentry.io/settings/tokens/ and create a new token with "Read" permissions
2. **Organization**: Your Sentry organization slug (found in the URL)
3. **Project**: Your Sentry project slug

## Usage

After installation, use these commands from the command palette (`Ctrl+Shift+P`):

- **JobPing: Get Recent Sentry Errors** - View recent errors (last 24 hours)
- **JobPing: Analyze Sentry Error Patterns** - Analyze error patterns over a specified number of days
- **JobPing: Get Sentry Error Details** - Get detailed info about a specific error ID
- **JobPing: Test MCP Connection** - Verify your configuration

## Features

### ✅ What Works
- Native Cursor integration (no external MCP server needed)
- Automatic environment variable loading
- Direct Sentry API integration
- Results displayed in editor tabs
- Error handling and validation

### 🔧 Technical Details
- Built as a VSCode/Cursor extension
- Uses TypeScript for type safety
- Loads `.env.local` from workspace root
- Provides command palette integration
- Displays results in markdown format

## Troubleshooting

### Extension not appearing
- Restart Cursor after installation
- Check the developer console for errors (`Help` → `Toggle Developer Tools`)

### Commands not working
- Run "JobPing: Test MCP Connection" to verify configuration
- Check that your `.env.local` file exists and has the correct variables
- Ensure the extension compiled successfully

### Permission issues
- Ensure Cursor has access to read your `.env.local` file
- Check file permissions if needed

### API errors
- Verify your Sentry auth token has the correct permissions
- Check your organization and project slugs
- Ensure your Sentry project is accessible

## Development

To modify the extension:

```bash
cd cursor-extension
npm install
npm run watch  # Auto-compile on changes
```

Then reload the development window (`Ctrl+Shift+P` → "Developer: Reload Window")

## Why This Approach

Cursor uses a different MCP architecture than Claude Desktop. Instead of running external MCP servers, Cursor extensions provide integrated functionality. This extension:

- Runs natively within Cursor
- Provides the same MCP functionality without server configuration
- Integrates seamlessly with Cursor's interface
- Doesn't require external process management

The extension successfully implements the MCP functionality you requested, but using Cursor's native extension system rather than the MCP server protocol.
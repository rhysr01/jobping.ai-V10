# JobPing MCP Tools - Cursor Extension

This Cursor extension provides MCP (Model Context Protocol) tools for JobPing project management and debugging, specifically integrating with Sentry error monitoring.

## Features

- **Get Recent Sentry Errors**: Fetch and display recent errors from your Sentry project
- **Analyze Error Patterns**: Get statistical analysis of error patterns over time
- **Get Error Details**: Retrieve detailed information about specific Sentry errors
- **Test MCP Connection**: Verify that your Sentry configuration is working

## Installation

1. **Clone and build the extension:**
   ```bash
   cd cursor-extension
   npm install
   npm run compile
   ```

2. **Install in Cursor:**
   - Open Cursor
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Click the "..." menu and select "Install from VSIX"
   - Select the compiled extension (you may need to package it first)

3. **Alternative: Development mode:**
   ```bash
   cd cursor-extension
   npm run watch
   ```
   Then in Cursor: Run "Debug: Start Debugging" with the extension development host.

## Configuration

The extension automatically loads environment variables from your project's `.env.local` file. Make sure you have:

```env
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your_organization_slug
SENTRY_PROJECT=javascript-nextjs
```

### Getting Sentry Credentials

1. **Auth Token**: Go to https://sentry.io/settings/tokens/ and create a new token with "Read" permissions
2. **Organization**: Your Sentry organization slug (found in the URL)
3. **Project**: Your Sentry project slug

## Usage

### Command Palette Commands

- `JobPing: Get Recent Sentry Errors` - Shows recent errors (last 24 hours)
- `JobPing: Analyze Sentry Error Patterns` - Analyzes error patterns over a specified number of days
- `JobPing: Get Sentry Error Details` - Get detailed info about a specific error ID
- `JobPing: Test MCP Connection` - Verify your configuration

### Using the Tools

1. Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search for "JobPing" commands
3. Select the desired command
4. Results will open in a new editor tab

## Troubleshooting

### "Environment variables not found"
- Ensure your `.env.local` file exists in the workspace root
- Check that the variable names match exactly
- Restart Cursor after updating environment variables

### "API errors"
- Verify your Sentry auth token has the correct permissions
- Check your organization and project slugs
- Ensure your Sentry project is accessible

### Extension not loading
- Check the Cursor developer console for errors
- Ensure the extension compiled successfully
- Try reloading the window (Ctrl+Shift+P → "Developer: Reload Window")

## Development

### Project Structure
```
cursor-extension/
├── src/
│   └── extension.ts     # Main extension code
├── package.json         # Extension manifest
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

### Building
```bash
npm run compile    # Build once
npm run watch      # Watch for changes
```

### Testing
```bash
npm test           # Run tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
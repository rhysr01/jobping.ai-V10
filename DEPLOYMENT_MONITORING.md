# 🚀 JobPing Deployment Monitoring

Automated deployment monitoring using Vercel MCP to ensure builds succeed after git pushes.

## ✨ Features

- **Real-time Deployment Monitoring** - Automatically monitors Vercel deployments
- **Failure Detection** - Alerts when deployments fail with detailed error information
- **GitHub Integration** - Creates issues for failed deployments
- **Success Notifications** - Confirms when deployments are ready
- **Git Hook Integration** - Triggers monitoring after commits and merges

## 🛠️ Setup

### Environment Variables

Ensure these are set in your `.env.local`:

```bash
# Vercel API Access
VERCEL_ACCESS_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_optional

# GitHub Integration (for issue creation on failures)
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=yourusername/yourrepo
```

### Get Vercel Access Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token with appropriate permissions
3. Add to your `.env.local` file

### Get GitHub Token (Optional)

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Create a token with `repo` permissions
3. Set `GITHUB_TOKEN` and `GITHUB_REPO` in `.env.local`

## 📋 Usage

### Manual Monitoring

```bash
# Monitor latest deployment (default: 10min timeout)
npm run deploy:monitor

# Monitor with custom timeout (30 minutes)
npm run deploy:watch

# Quick status check without notifications
npm run deploy:check
```

### Command Line Options

```bash
# Custom timeout (in seconds)
npm run deploy:monitor -- --timeout 1800

# Custom poll interval (in seconds)
npm run deploy:monitor -- --interval 60

# Disable success notifications
npm run deploy:monitor -- --no-notify-success

# Disable failure notifications
npm run deploy:monitor -- --no-notify-failure
```

## 🔄 Git Integration

### Automatic Hooks

Git hooks are automatically set up to notify you about deployment monitoring:

- **`post-commit`**: Shows deployment monitoring commands after commits on main/master
- **`post-merge`**: Shows deployment monitoring commands after merges on main/master

### Workflow

1. **Make changes** and commit to main/master branch
2. **Git hooks notify** you about available monitoring commands
3. **Push your changes** to trigger Vercel deployment
4. **Run monitoring**: `npm run deploy:monitor`
5. **Get real-time updates** on deployment status
6. **Receive notifications** when deployment succeeds or fails

## 📊 What It Monitors

- **Build Status** - Tracks deployment from queued → building → ready/error
- **Timing** - Monitors build duration and deployment time
- **Errors** - Captures and reports build failures
- **URLs** - Provides live deployment URLs when ready

## 🚨 Failure Handling

When deployments fail, the monitor will:

1. **Display error status** in terminal
2. **Create GitHub issue** with deployment details (if GitHub token configured)
3. **Show failure summary** with next steps
4. **Exit with error code** for CI/CD integration

### Example Failure Output

```
❌ Deployment failed with status: ERROR
🔗 Check: https://vercel.com/dashboard
🔧 Check build logs for error details
🐛 Created GitHub issue for investigation
```

## ✅ Success Notifications

When deployments succeed, you'll see:

```
✅ Deployment successful!
🔗 Live at: https://your-app.vercel.app
📱 Ready for testing and user traffic
```

## 🔧 Troubleshooting

### Common Issues

**"Vercel MCP not configured"**
- Check `VERCEL_ACCESS_TOKEN` in `.env.local`
- Verify token has correct permissions

**"Could not parse deployment information"**
- Ensure Vercel project exists and is accessible
- Check team ID if using team account

**GitHub issues not created**
- Verify `GITHUB_TOKEN` and `GITHUB_REPO` are set
- Check token has `repo` permissions

### Debug Mode

```bash
# Run with verbose output
DEBUG=* npm run deploy:monitor
```

## 📈 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy and Monitor
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run deploy:monitor
        env:
          VERCEL_ACCESS_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
```

## 🎯 Best Practices

1. **Always monitor deployments** after pushing to main/master
2. **Set up notifications** for team awareness
3. **Review failed deployments** immediately
4. **Use GitHub issues** to track deployment problems
5. **Test locally** before pushing: `npm run build`

## 📝 API Reference

The deployment monitor uses these Vercel MCP tools:

- `vercel_get_deployments` - Fetch recent deployments
- `vercel_check_deployment_status` - Get detailed deployment info
- `github_create_issue` - Create issues for failed deployments

## 🤝 Contributing

To extend deployment monitoring:

1. Add new notification channels (Slack, Discord, etc.)
2. Integrate with additional deployment platforms
3. Add custom success/failure criteria
4. Enhance error reporting and diagnostics

---

**Happy deploying!** 🎉 Your JobPing deployments are now fully monitored and automated.
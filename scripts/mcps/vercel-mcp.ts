export class VercelMCP {
  private accessToken: string;
  private teamId?: string;

  constructor() {
    this.accessToken = process.env.VERCEL_ACCESS_TOKEN || "";
    this.teamId = process.env.VERCEL_TEAM_ID;

    if (!this.accessToken) {
      console.warn("⚠️  Vercel MCP: Missing VERCEL_ACCESS_TOKEN. Vercel tools will not be available.");
    }
  }

  async getDeployments(args: any) {
    const { limit = 10 } = args;

    try {
      if (!this.accessToken) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️  Vercel MCP not configured. Please set VERCEL_ACCESS_TOKEN environment variable.\n\nTo get your token:\n1. Go to https://vercel.com/account/tokens\n2. Create a new token\n3. Set VERCEL_ACCESS_TOKEN in your environment\n4. Optionally set VERCEL_TEAM_ID if using a team`,
            },
          ],
        };
      }

      const teamParam = this.teamId ? `?teamId=${this.teamId}` : "";
      const url = `https://api.vercel.com/v6/deployments${teamParam}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const deployments = data.deployments.slice(0, limit);

      const formattedDeployments = deployments.map((deployment: any) => ({
        id: deployment.id,
        url: deployment.url,
        state: deployment.state,
        createdAt: new Date(deployment.createdAt).toLocaleString(),
        buildingAt: deployment.buildingAt ? new Date(deployment.buildingAt).toLocaleString() : null,
        ready: deployment.ready ? new Date(deployment.ready).toLocaleString() : null,
        target: deployment.target,
        source: deployment.source,
      }));

      return {
        content: [
          {
            type: "text",
            text: `🚀 Recent Vercel Deployments (last ${formattedDeployments.length}):\n\n${formattedDeployments.map((deployment: any) =>
              `• **${deployment.url}**\n  📊 Status: ${deployment.state}\n  🎯 Target: ${deployment.target}\n  📅 Created: ${deployment.createdAt}\n  ${deployment.ready ? `✅ Ready: ${deployment.ready}` : '⏳ Building...'}\n  🔗 https://${deployment.url}\n`
            ).join("\n")}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch Vercel deployments: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async checkDeploymentStatus(args: any) {
    const { deploymentId } = args;

    try {
      if (!this.accessToken) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️  Vercel MCP not configured. Please set VERCEL_ACCESS_TOKEN first.",
            },
          ],
        };
      }

      const teamParam = this.teamId ? `?teamId=${this.teamId}` : "";
      const url = `https://api.vercel.com/v13/deployments/${deploymentId}${teamParam}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const deployment = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `📊 Vercel Deployment Status: ${deployment.url}\n\n**Basic Info:**\n• ID: ${deployment.id}\n• URL: https://${deployment.url}\n• State: ${deployment.state}\n• Target: ${deployment.target}\n• Source: ${deployment.source || 'unknown'}\n\n**Timestamps:**\n• Created: ${new Date(deployment.createdAt).toLocaleString()}\n${deployment.buildingAt ? `• Building: ${new Date(deployment.buildingAt).toLocaleString()}\n` : ''}${deployment.ready ? `• Ready: ${new Date(deployment.ready).toLocaleString()}\n` : ''}\n**Build Info:**\n• Framework: ${deployment.framework || 'unknown'}\n• Regions: ${deployment.regions?.join(', ') || 'unknown'}\n\n**Git Info:**\n• Commit: ${deployment.gitCommitMessage || 'unknown'}\n• Author: ${deployment.gitCommitAuthorName || 'unknown'}\n• SHA: ${deployment.gitCommitSha || 'unknown'}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to check Vercel deployment status: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getLogs(args: any) {
    const { deploymentId, limit = 100 } = args;

    try {
      if (!this.accessToken) {
        return {
          content: [
            {
              type: "text",
              text: "⚠️  Vercel MCP not configured. Please set VERCEL_ACCESS_TOKEN first.",
            },
          ],
        };
      }

      const teamParam = this.teamId ? `&teamId=${this.teamId}` : "";
      const url = `https://api.vercel.com/v8/deployments/${deploymentId}/events?limit=${limit}${teamParam}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.events || data.events.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `📝 No logs found for deployment ${deploymentId}`,
            },
          ],
        };
      }

      const logs = data.events.slice(-limit).map((event: any) => ({
        timestamp: new Date(event.created).toLocaleString(),
        type: event.type,
        text: event.text || JSON.stringify(event.payload || {}),
      }));

      return {
        content: [
          {
            type: "text",
            text: `📝 Vercel Deployment Logs (last ${logs.length} events):\n\n${logs.map((log: any) =>
              `${log.timestamp} [${log.type}] ${log.text}`
            ).join('\n')}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch Vercel logs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}

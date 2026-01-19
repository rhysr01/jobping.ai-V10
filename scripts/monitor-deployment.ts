#!/usr/bin/env tsx

import { resolve } from "node:path";
import { config as dotenvConfig } from "dotenv";
import { GitHubMCP } from "./mcps/github-mcp.ts";
import { VercelMCP } from "./mcps/vercel-mcp.ts";

// Load environment variables from .env.local
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

interface DeploymentMonitorOptions {
	timeout?: number;
	pollInterval?: number;
	notifyOnFailure?: boolean;
	notifyOnSuccess?: boolean;
}

class DeploymentMonitor {
	private vercel: VercelMCP;
	private github: GitHubMCP;
	private options: Required<DeploymentMonitorOptions>;

	constructor(options: DeploymentMonitorOptions = {}) {
		this.vercel = new VercelMCP();
		this.github = new GitHubMCP();
		this.options = {
			timeout: 10 * 60 * 1000, // 10 minutes
			pollInterval: 30 * 1000, // 30 seconds
			notifyOnFailure: true,
			notifyOnSuccess: true,
			...options,
		};
	}

	async monitorLatestDeployment(): Promise<void> {
		console.log("🚀 Starting deployment monitoring...\n");

		try {
			// Get the latest deployment
			console.log("📊 Fetching latest deployment...");
			const deploymentsResult = await this.vercel.getDeployments({ limit: 1 });

			if (deploymentsResult.isError || !deploymentsResult.content) {
				throw new Error("Failed to fetch deployments");
			}

			const deploymentsText = deploymentsResult.content[0].text;
			const deploymentMatch = deploymentsText.match(
				/• \*\*(.*?)\*\*\n\s*📊 Status: (\w+)/,
			);

			if (!deploymentMatch) {
				throw new Error("Could not parse deployment information");
			}

			const [, deploymentUrl, status] = deploymentMatch;
			console.log(`📋 Latest deployment: ${deploymentUrl}`);
			console.log(`📊 Current status: ${status}\n`);

			if (status === "READY") {
				console.log("✅ Deployment is already ready!");
				if (this.options.notifyOnSuccess) {
					await this.notifySuccess(deploymentUrl);
				}
				return;
			}

			if (status === "ERROR" || status === "CANCELED") {
				console.log(`❌ Deployment failed with status: ${status}`);
				if (this.options.notifyOnFailure) {
					await this.notifyFailure(deploymentUrl, status);
				}
				return;
			}

			// Monitor the deployment until it's ready or times out
			await this.monitorDeployment(deploymentUrl);
		} catch (error: any) {
			console.error("❌ Deployment monitoring failed:", error.message);
			process.exit(1);
		}
	}

	private async monitorDeployment(deploymentUrl: string): Promise<void> {
		const startTime = Date.now();
		let lastStatus = "";

		console.log(`⏳ Monitoring deployment: ${deploymentUrl}`);
		console.log(`⏰ Timeout: ${this.options.timeout / 1000}s`);
		console.log(`🔄 Poll interval: ${this.options.pollInterval / 1000}s\n`);

		while (Date.now() - startTime < this.options.timeout) {
			try {
				// Get latest deployment status
				const deploymentsResult = await this.vercel.getDeployments({
					limit: 1,
				});

				if (deploymentsResult.isError || !deploymentsResult.content) {
					console.log("⚠️  Could not fetch deployment status, retrying...");
					await this.sleep(this.options.pollInterval);
					continue;
				}

				const deploymentsText = deploymentsResult.content[0].text;
				const statusMatch = deploymentsText.match(/📊 Status: (\w+)/);

				if (!statusMatch) {
					console.log("⚠️  Could not parse status, retrying...");
					await this.sleep(this.options.pollInterval);
					continue;
				}

				const currentStatus = statusMatch[1];

				if (currentStatus !== lastStatus) {
					const timestamp = new Date().toLocaleTimeString();
					console.log(`${timestamp} 📊 Status: ${currentStatus}`);

					if (currentStatus === "READY") {
						console.log("\n✅ Deployment successful!");
						console.log(`🔗 Live at: https://${deploymentUrl}`);

						if (this.options.notifyOnSuccess) {
							await this.notifySuccess(deploymentUrl);
						}
						return;
					}

					if (currentStatus === "ERROR" || currentStatus === "CANCELED") {
						console.log(`\n❌ Deployment failed with status: ${currentStatus}`);

						if (this.options.notifyOnFailure) {
							await this.notifyFailure(deploymentUrl, currentStatus);
						}

						// Try to get error logs
						await this.getDeploymentLogs(deploymentUrl);
						process.exit(1);
					}

					lastStatus = currentStatus;
				}

				await this.sleep(this.options.pollInterval);
			} catch (error: any) {
				console.log(`⚠️  Error during monitoring: ${error.message}`);
				await this.sleep(this.options.pollInterval);
			}
		}

		console.log(
			`\n⏰ Monitoring timed out after ${this.options.timeout / 1000} seconds`,
		);
		console.log(
			"🔍 You can check the deployment status manually in Vercel dashboard",
		);
		process.exit(1);
	}

	private async getDeploymentLogs(_deploymentUrl: string): Promise<void> {
		try {
			console.log("\n📝 Fetching deployment logs...");

			// We need to get the deployment ID first
			const deploymentsResult = await this.vercel.getDeployments({ limit: 5 });
			if (deploymentsResult.content) {
				const logsText = deploymentsResult.content[0].text;
				// Extract deployment ID from the logs text if available
				console.log("📋 Recent deployment logs:");
				console.log(logsText);
			}
		} catch (error: any) {
			console.log(`⚠️  Could not fetch deployment logs: ${error.message}`);
		}
	}

	private async notifySuccess(deploymentUrl: string): Promise<void> {
		console.log("\n🎉 Deployment Notification:");
		console.log(`✅ Your JobPing deployment is live!`);
		console.log(`🔗 https://${deploymentUrl}`);
		console.log(`📱 Ready for testing and user traffic`);

		// Could integrate with Slack, Discord, or other notification services here
	}

	private async notifyFailure(
		deploymentUrl: string,
		status: string,
	): Promise<void> {
		console.log("\n🚨 Deployment Failure Notification:");
		console.log(`❌ JobPing deployment failed`);
		console.log(`📊 Status: ${status}`);
		console.log(`🔗 Check: https://vercel.com/dashboard`);
		console.log(`🔧 Check build logs for error details`);

		// Could create GitHub issue for failed deployments
		try {
			const issueResult = await this.github.createIssue({
				title: `🚨 Deployment Failed: ${deploymentUrl}`,
				body: `## Deployment Failure Alert

**Deployment URL:** ${deploymentUrl}
**Status:** ${status}
**Time:** ${new Date().toISOString()}

### Action Required:
- Check Vercel dashboard for build logs
- Review recent commits for breaking changes
- Verify environment variables are set correctly

### Next Steps:
1. Fix any build errors
2. Test locally with \`npm run build\`
3. Push fix to trigger new deployment

_Automatically created by deployment monitor_`,
				labels: ["deployment", "bug", "urgent"],
			});

			if (!issueResult.isError) {
				console.log("🐛 Created GitHub issue for investigation");
			}
		} catch (_error) {
			console.log("⚠️  Could not create GitHub issue");
		}
	}

	private async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// CLI interface
async function main() {
	const args = process.argv.slice(2);
	const options: DeploymentMonitorOptions = {};

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case "--timeout":
				options.timeout = parseInt(args[++i], 10) * 1000;
				break;
			case "--interval":
				options.pollInterval = parseInt(args[++i], 10) * 1000;
				break;
			case "--no-notify-success":
				options.notifyOnSuccess = false;
				break;
			case "--no-notify-failure":
				options.notifyOnFailure = false;
				break;
		}
	}

	const monitor = new DeploymentMonitor(options);
	await monitor.monitorLatestDeployment();
}

if (require.main === module) {
	main().catch(console.error);
}

export { DeploymentMonitor };

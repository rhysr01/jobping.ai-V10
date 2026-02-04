export class VercelMCP {
	private accessToken: string;
	private teamId?: string;

	constructor() {
		this.accessToken = process.env.VERCEL_ACCESS_TOKEN || "";
		this.teamId = process.env.VERCEL_TEAM_ID;

		if (!this.accessToken) {
			console.warn(
				"⚠️  Vercel MCP: Missing VERCEL_ACCESS_TOKEN. Vercel tools will not be available.",
			);
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
				throw new Error(
					`Vercel API error: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();
			const deployments = data.deployments.slice(0, limit);

			const formattedDeployments = deployments.map((deployment: any) => ({
				id: deployment.id,
				url: deployment.url,
				state: deployment.state,
				createdAt: new Date(deployment.createdAt).toLocaleString(),
				buildingAt: deployment.buildingAt
					? new Date(deployment.buildingAt).toLocaleString()
					: null,
				ready: deployment.ready
					? new Date(deployment.ready).toLocaleString()
					: null,
				target: deployment.target,
				source: deployment.source,
			}));

			return {
				content: [
					{
						type: "text",
						text: `🚀 Recent Vercel Deployments (last ${formattedDeployments.length}):\n\n${formattedDeployments
							.map(
								(deployment: any) =>
									`• **${deployment.url}**\n  📊 Status: ${deployment.state}\n  🎯 Target: ${deployment.target}\n  📅 Created: ${deployment.createdAt}\n  ${deployment.ready ? `✅ Ready: ${deployment.ready}` : "⏳ Building..."}\n  🔗 https://${deployment.url}\n`,
							)
							.join("\n")}`,
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
				throw new Error(
					`Vercel API error: ${response.status} ${response.statusText}`,
				);
			}

			const deployment = await response.json();

			return {
				content: [
					{
						type: "text",
						text: `📊 Vercel Deployment Status: ${deployment.url}\n\n**Basic Info:**\n• ID: ${deployment.id}\n• URL: https://${deployment.url}\n• State: ${deployment.state}\n• Target: ${deployment.target}\n• Source: ${deployment.source || "unknown"}\n\n**Timestamps:**\n• Created: ${new Date(deployment.createdAt).toLocaleString()}\n${deployment.buildingAt ? `• Building: ${new Date(deployment.buildingAt).toLocaleString()}\n` : ""}${deployment.ready ? `• Ready: ${new Date(deployment.ready).toLocaleString()}\n` : ""}\n**Build Info:**\n• Framework: ${deployment.framework || "unknown"}\n• Regions: ${deployment.regions?.join(", ") || "unknown"}\n\n**Git Info:**\n• Commit: ${deployment.gitCommitMessage || "unknown"}\n• Author: ${deployment.gitCommitAuthorName || "unknown"}\n• SHA: ${deployment.gitCommitSha || "unknown"}`,
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
				throw new Error(
					`Vercel API error: ${response.status} ${response.statusText}`,
				);
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
						text: `📝 Vercel Deployment Logs (last ${logs.length} events):\n\n${logs
							.map((log: any) => `${log.timestamp} [${log.type}] ${log.text}`)
							.join("\n")}`,
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

	async getEnvironmentVariables(args: any) {
		const { projectId } = args;

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

			if (!projectId) {
				return {
					content: [
						{
							type: "text",
							text: "❌ projectId is required. Get it from your Vercel project settings or use vercel_get_projects first.",
						},
					],
					isError: true,
				};
			}

			const teamParam = this.teamId ? `?teamId=${this.teamId}` : "";
			const url = `https://api.vercel.com/v9/projects/${projectId}/env${teamParam}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Vercel API error: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();

			if (!data.envs || data.envs.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `📋 No environment variables found for project ${projectId}`,
						},
					],
				};
			}

			// Group by variable name (since same var can exist for different environments)
			const varsByName: Record<string, any[]> = {};
			data.envs.forEach((env: any) => {
				if (!varsByName[env.key]) {
					varsByName[env.key] = [];
				}
				varsByName[env.key].push(env);
			});

			const requiredVars = [
				"NEXT_PUBLIC_SUPABASE_URL",
				"SUPABASE_SERVICE_ROLE_KEY",
				"RESEND_API_KEY",
				"INTERNAL_API_HMAC_SECRET",
				"SYSTEM_API_KEY",
			];

			const formattedVars = Object.entries(varsByName).map(([key, envs]) => {
				const environments = envs.map((e: any) => {
					const envTypes = [];
					if (e.target?.includes("production")) envTypes.push("Production");
					if (e.target?.includes("preview")) envTypes.push("Preview");
					if (e.target?.includes("development")) envTypes.push("Development");
					return envTypes.join(", ") || "None";
				});

				const isRequired = requiredVars.includes(key);
				const isSet = envs.length > 0;
				const hasAllEnvs = envs.some(
					(e: any) =>
						e.target?.includes("production") &&
						e.target?.includes("preview"),
				);

				return {
					name: key,
					set: isSet,
					required: isRequired,
					environments: environments.join(" | "),
					hasAllEnvironments: hasAllEnvs,
					count: envs.length,
					// Don't expose values for security
				};
			});

			const missingRequired = requiredVars.filter(
				(key) => !varsByName[key] || varsByName[key].length === 0,
			);

			const incompleteRequired = requiredVars.filter((key) => {
				const envs = varsByName[key];
				if (!envs || envs.length === 0) return false;
				// Check if it has both production and preview
				const hasProduction = envs.some((e: any) =>
					e.target?.includes("production"),
				);
				const hasPreview = envs.some((e: any) =>
					e.target?.includes("preview"),
				);
				return !(hasProduction && hasPreview);
			});

			let statusText = "";
			if (missingRequired.length > 0) {
				statusText += `\n❌ Missing required variables:\n${missingRequired.map((v) => `   - ${v}`).join("\n")}\n`;
			}
			if (incompleteRequired.length > 0) {
				statusText += `\n⚠️  Required variables not set for all environments:\n${incompleteRequired.map((v) => `   - ${v}`).join("\n")}\n`;
			}
			if (missingRequired.length === 0 && incompleteRequired.length === 0) {
				statusText += "\n✅ All required variables are properly configured!\n";
			}

			return {
				content: [
					{
						type: "text",
						text: `📋 Environment Variables for Project ${projectId}:\n\n${formattedVars
							.map((v) => {
								const status = v.required
									? v.set
										? v.hasAllEnvironments
											? "✅"
											: "⚠️"
										: "❌"
									: "  ";
								return `${status} ${v.name}${v.required ? " (REQUIRED)" : ""}\n   Environments: ${v.environments}\n   Count: ${v.count}`;
							})
							.join("\n\n")}${statusText}`,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to fetch environment variables: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	async getProjects(args: any) {
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
			const url = `https://api.vercel.com/v9/projects${teamParam}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Vercel API error: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();

			if (!data.projects || data.projects.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "📋 No projects found",
						},
					],
				};
			}

			const formattedProjects = data.projects.map((project: any) => ({
				id: project.id,
				name: project.name,
				framework: project.framework || "unknown",
				updatedAt: new Date(project.updatedAt).toLocaleString(),
			}));

			return {
				content: [
					{
						type: "text",
						text: `📋 Vercel Projects:\n\n${formattedProjects
							.map(
								(p: any) =>
									`• **${p.name}**\n  ID: ${p.id}\n  Framework: ${p.framework}\n  Updated: ${p.updatedAt}`,
							)
							.join("\n\n")}`,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to fetch projects: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}
}

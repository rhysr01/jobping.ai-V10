#!/usr/bin/env tsx
/**
 * Check Vercel deployment logs
 * Usage: npm run check:vercel-logs [deployment-id]
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

import { VercelMCP } from "./mcps/vercel-mcp";

async function main() {
	const vercel = new VercelMCP();

	console.log("🔍 Fetching recent Vercel deployments...\n");

	// Get recent deployments
	const deploymentsResult = await vercel.getDeployments({ limit: 5 });
	if (deploymentsResult.isError) {
		console.error("❌ Failed to get deployments");
		console.error(deploymentsResult.content[0].text);
		process.exit(1);
	}

	console.log(deploymentsResult.content[0].text);
	console.log("\n");

	// Get deployment ID from args or use latest
	const deploymentId = process.argv[2];

	if (!deploymentId) {
		console.log("💡 Usage: npm run check:vercel-logs <deployment-id>");
		console.log("   Get deployment ID from the list above\n");
		console.log("   Or check Vercel Dashboard → Deployments → Click on a deployment → Copy ID\n");
		process.exit(0);
	}

	console.log(`📝 Fetching logs for deployment: ${deploymentId}\n`);

	// Get logs
	const logsResult = await vercel.getLogs({ deploymentId, limit: 200 });
	if (logsResult.isError) {
		console.error("❌ Failed to get logs");
		console.error(logsResult.content[0].text);
		process.exit(1);
	}

	console.log(logsResult.content[0].text);
	
	// Filter for errors
	const logsText = logsResult.content[0].text;
	const errorLines = logsText.split("\n").filter((line: string) => 
		line.toLowerCase().includes("error") || 
		line.toLowerCase().includes("failed") ||
		line.toLowerCase().includes("❌")
	);

	if (errorLines.length > 0) {
		console.log("\n⚠️  Found errors in logs:\n");
		errorLines.forEach((line: string) => console.log(line));
	}
}

main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});

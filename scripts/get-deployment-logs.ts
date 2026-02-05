#!/usr/bin/env tsx

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

import { VercelMCP } from "./mcps/vercel-mcp";

async function main() {
	const vercel = new VercelMCP();

	console.log("🔍 Getting recent deployments with full IDs...\n");

	// Get recent deployments
	const deploymentsResult = await vercel.getDeployments({ limit: 3 });
	if (deploymentsResult.isError) {
		console.error("❌ Failed to get deployments");
		console.error(deploymentsResult.content[0].text);
		process.exit(1);
	}

	// Parse deployments to get actual IDs
	const deploymentsText = deploymentsResult.content[0].text;
	console.log(deploymentsText);
	console.log("\n");

	// For now, let me try to get logs from the latest deployment
	// I'll extract the deployment ID from the API response directly
	console.log("🔍 Getting deployment details with IDs...\n");

	// Make direct API call to get deployment IDs
	const accessToken = process.env.VERCEL_ACCESS_TOKEN;
	if (!accessToken) {
		console.error("❌ VERCEL_ACCESS_TOKEN not found");
		process.exit(1);
	}

	const response = await fetch("https://api.vercel.com/v6/deployments?limit=3", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		console.error(`❌ API error: ${response.status} ${response.statusText}`);
		process.exit(1);
	}

	const data = await response.json();
	console.log("📋 Raw API response structure:");
	console.log(JSON.stringify(data, null, 2).substring(0, 1000) + "...");
	console.log();
	
	const latestDeployment = data.deployments[0];

	console.log(`📋 Latest deployment:`);
	console.log(`   ID: ${latestDeployment?.id || 'MISSING'}`);
	console.log(`   UID: ${latestDeployment?.uid || 'MISSING'}`);
	console.log(`   URL: ${latestDeployment?.url || 'MISSING'}`);
	console.log(`   State: ${latestDeployment?.state || 'MISSING'}`);
	console.log(`   Created: ${latestDeployment?.createdAt ? new Date(latestDeployment.createdAt).toLocaleString() : 'MISSING'}`);
	console.log();

	// Now get logs for this deployment
	const deploymentId = latestDeployment?.uid || latestDeployment?.id;
	console.log(`📝 Getting logs for deployment ${deploymentId}...\n`);

	const logsResult = await vercel.getLogs({ 
		deploymentId: deploymentId, 
		limit: 500 
	});
	
	if (logsResult.isError) {
		console.error("❌ Failed to get logs");
		console.error(logsResult.content[0].text);
		process.exit(1);
	}

	const logsText = logsResult.content[0].text;
	
	// Filter for our debug logs
	const debugLines = logsText.split("\n").filter((line: string) => 
		line.includes("DEBUG_SERVICE_KEY") || 
		line.includes("DEBUG_DATABASE_POOL") ||
		line.includes("SIGNUP_FREE") ||
		line.includes("User insert error") ||
		line.includes("CRITICAL_ERROR")
	);

	if (debugLines.length > 0) {
		console.log("🔍 Found relevant debug/error logs:\n");
		debugLines.forEach((line: string) => console.log(line));
	} else {
		console.log("⚠️  No debug logs found. Full logs:");
		console.log(logsText);
	}
}

main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});
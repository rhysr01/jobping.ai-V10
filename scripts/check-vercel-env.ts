#!/usr/bin/env tsx

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import { VercelMCP } from "./mcps/vercel-mcp.ts";

// Load environment variables
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

async function main() {
	const vercel = new VercelMCP();

	console.log("🔍 Checking Vercel Projects...\n");

	// Get projects
	const projectsResult = await vercel.getProjects({});
	if (projectsResult.isError) {
		console.error("❌ Failed to get projects");
		console.error(projectsResult.content[0].text);
		process.exit(1);
	}

	console.log(projectsResult.content[0].text);
	console.log("\n");

	// Extract project ID from the output (you'll need to provide it)
	const projectId = process.argv[2];

	if (!projectId) {
		console.log("💡 Usage: npm run check:vercel-env <project-id>");
		console.log("   Get project ID from the list above\n");
		process.exit(0);
	}

	console.log(`🔍 Checking environment variables for project: ${projectId}\n`);

	// Get environment variables
	const envResult = await vercel.getEnvironmentVariables({ projectId });
	if (envResult.isError) {
		console.error("❌ Failed to get environment variables");
		console.error(envResult.content[0].text);
		process.exit(1);
	}

	console.log(envResult.content[0].text);
	
	console.log("\n");
	console.log("📝 How to Fix Missing Variables:");
	console.log("   1. Go to: Vercel Dashboard → jobping-ai-v10 → Settings → Environment Variables");
	console.log("   2. Click 'Add Environment Variable' (NOT Team Settings)");
	console.log("   3. Add each missing variable directly to THIS project");
	console.log("   4. Set for ALL environments: Production, Preview, Development");
	console.log("   5. After adding all variables, redeploy the project");
	console.log("\n");
	console.log("💡 Note: Team-level variables must be linked to projects.");
	console.log("   If you see variables in Team Settings but not here, they're not linked to this project.");
}

main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});

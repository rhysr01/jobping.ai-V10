#!/usr/bin/env tsx

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load environment variables
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

async function checkRecentErrors() {
	const authToken = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_TOKEN || "";
	const org = process.env.SENTRY_ORG || "";

	if (!authToken || !org) {
		console.error("❌ Missing Sentry configuration");
		process.exit(1);
	}

	// Check last hour only
	const hours = 1;
	const url = `https://sentry.io/api/0/organizations/${org}/issues/?statsPeriod=${hours}h&per_page=50`;

	console.log(`🔍 Checking Sentry errors from last ${hours} hour(s)...\n`);

	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${authToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => response.statusText);
			console.error(`❌ Sentry API error: ${response.status} ${response.statusText}`);
			console.error(`   Response: ${errorText}`);
			process.exit(1);
		}

		const issues = await response.json();

		if (!Array.isArray(issues)) {
			console.error("❌ Unexpected response format");
			process.exit(1);
		}

		console.log(`📊 Found ${issues.length} errors in the last ${hours} hour(s)\n`);

		if (issues.length === 0) {
			console.log("✅ No recent errors! Our fixes are working! 🎉\n");
			return;
		}

		// Filter out expected INFO level messages
		const realErrors = issues.filter((issue: any) => {
			const title = issue.title?.toLowerCase() || "";
			const level = issue.level?.toLowerCase() || "";
			
			// Filter out INFO level messages that are expected
			if (level === "info") {
				return false; // Don't show INFO messages
			}
			
			// Filter out expected warnings we fixed
			if (level === "warning") {
				if (title.includes("rate limit exceeded")) return false;
				if (title.includes("openai api key not configured")) return false;
				if (title.includes("openai client not initialized")) return false;
			}
			
			return true;
		});

		if (realErrors.length === 0) {
			console.log("✅ No unexpected errors! Only expected warnings/INFO messages.\n");
			console.log("📋 All recent issues are expected behavior or INFO level:\n");
			issues.slice(0, 5).forEach((issue: any, index: number) => {
				console.log(`${index + 1}. [${issue.level}] ${issue.title} (${issue.count}x)`);
			});
			return;
		}

		console.log(`⚠️  Found ${realErrors.length} unexpected errors:\n`);
		realErrors.forEach((issue: any, index: number) => {
			console.log(`${index + 1}. [${issue.level}] ${issue.title}`);
			console.log(`   Count: ${issue.count} | Last seen: ${new Date(issue.lastSeen).toLocaleString()}`);
			console.log(`   🔗 https://sentry.io/organizations/${org}/issues/${issue.id}/\n`);
		});

		// Show summary
		const byLevel: Record<string, number> = {};
		realErrors.forEach((issue: any) => {
			const level = issue.level || "unknown";
			byLevel[level] = (byLevel[level] || 0) + 1;
		});

		console.log("\n📊 Summary:");
		Object.entries(byLevel).forEach(([level, count]) => {
			console.log(`   ${level.toUpperCase()}: ${count} issues`);
		});

	} catch (error: any) {
		console.error("❌ Error:", error.message);
		process.exit(1);
	}
}

checkRecentErrors();

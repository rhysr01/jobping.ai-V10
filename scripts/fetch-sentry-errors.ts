#!/usr/bin/env tsx

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load environment variables
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

async function fetchSentryErrors() {
	const authToken = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_TOKEN || "";
	const org = process.env.SENTRY_ORG || "";
	const project = process.env.SENTRY_PROJECT || "";

	console.log("🔍 Sentry Configuration:");
	console.log(`   SENTRY_AUTH_TOKEN: ${authToken ? "✅ Set" : "❌ Missing"}`);
	console.log(`   SENTRY_ORG: ${org || "❌ Missing"}`);
	console.log(`   SENTRY_PROJECT: ${project || "⚠️  Optional"}`);
	console.log("");

	if (!authToken || !org) {
		console.error("❌ Missing required Sentry configuration");
		console.error("   Set SENTRY_AUTH_TOKEN (or SENTRY_TOKEN) and SENTRY_ORG in .env.local");
		process.exit(1);
	}

	const hours = 24;
	const limit = 100;
	const url = `https://sentry.io/api/0/organizations/${org}/issues/?statsPeriod=${hours}h&per_page=${limit}`;

	console.log(`📡 Fetching errors from Sentry...`);
	console.log(`   URL: ${url}`);
	console.log("");

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
			console.error(`   URL: ${url}`);
			process.exit(1);
		}

		const issues = await response.json();

		if (!Array.isArray(issues)) {
			console.error("❌ Unexpected response format:", JSON.stringify(issues, null, 2));
			process.exit(1);
		}

		console.log(`🚨 Found ${issues.length} errors in the last ${hours} hours\n`);

		if (issues.length === 0) {
			console.log("✅ No errors found!");
			return;
		}

		// Group by level
		const byLevel: Record<string, any[]> = {};
		issues.forEach((issue: any) => {
			const level = issue.level || "unknown";
			if (!byLevel[level]) {
				byLevel[level] = [];
			}
			byLevel[level].push(issue);
		});

		// Display summary
		console.log("📊 Summary by Level:");
		Object.entries(byLevel).forEach(([level, levelIssues]) => {
			const totalCount = levelIssues.reduce((sum, issue) => sum + (issue.count || 0), 0);
			console.log(`   ${level.toUpperCase()}: ${levelIssues.length} issues, ${totalCount} total occurrences`);
		});
		console.log("");

		// Display top errors
		const topErrors = issues
			.sort((a, b) => (b.count || 0) - (a.count || 0))
			.slice(0, 20);

		console.log(`🔥 Top ${topErrors.length} Errors (by count):\n`);
		topErrors.forEach((issue: any, index: number) => {
			console.log(`${index + 1}. ${issue.title}`);
			console.log(`   📊 Count: ${issue.count} | Users: ${issue.userCount}`);
			console.log(`   🏷️  Level: ${issue.level} | Status: ${issue.status}`);
			console.log(`   📅 Last seen: ${new Date(issue.lastSeen).toLocaleString()}`);
			console.log(`   🔗 https://sentry.io/organizations/${org}/issues/${issue.id}/`);
			console.log("");
		});

		// Show all errors in a compact format
		console.log("\n" + "=".repeat(80));
		console.log(`📋 All ${issues.length} Errors:\n`);
		issues.forEach((issue: any, index: number) => {
			console.log(`${index + 1}. [${issue.level}] ${issue.title} (${issue.count}x)`);
		});

	} catch (error: any) {
		console.error("❌ Error fetching Sentry errors:", error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

fetchSentryErrors();

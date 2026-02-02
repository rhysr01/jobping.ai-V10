#!/usr/bin/env tsx
/**
 * Sentry MCP Configuration Test Script
 *
 * Tests Sentry MCP API configuration and verifies credentials.
 * Run this to diagnose why Sentry MCP isn't working.
 *
 * Usage: tsx scripts/test-sentry-mcp.ts
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load environment variables
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

// Color codes for terminal output
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
	console.log(`\n${"=".repeat(60)}`);
	log(title, "bright");
	console.log("=".repeat(60));
}

function logSuccess(message: string) {
	log(`✅ ${message}`, "green");
}

function logWarning(message: string) {
	log(`⚠️  ${message}`, "yellow");
}

function logError(message: string) {
	log(`❌ ${message}`, "red");
}

function logInfo(message: string) {
	log(`ℹ️  ${message}`, "cyan");
}

async function checkEnvironmentVariables() {
	logSection("Environment Variables Check");

	const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
	const sentryOrg = process.env.SENTRY_ORG;
	const sentryProject = process.env.SENTRY_PROJECT;

	let allConfigured = true;

	if (!sentryAuthToken) {
		logError("SENTRY_AUTH_TOKEN is not set");
		allConfigured = false;
	} else {
		logSuccess(
			`SENTRY_AUTH_TOKEN is set (${sentryAuthToken.substring(0, 10)}...)`,
		);
	}

	if (!sentryOrg) {
		logError("SENTRY_ORG is not set");
		allConfigured = false;
	} else {
		logSuccess(`SENTRY_ORG is set: ${sentryOrg}`);
	}

	if (!sentryProject) {
		logWarning("SENTRY_PROJECT is not set (optional for MCP, but recommended)");
	} else {
		logSuccess(`SENTRY_PROJECT is set: ${sentryProject}`);
	}

	return { allConfigured, sentryAuthToken, sentryOrg, sentryProject };
}

async function testSentryAPI(authToken: string, org: string) {
	logSection("Testing Sentry API Connection");

	try {
		// Test 1: Check organization access
		logInfo("Test 1: Checking organization access...");
		const orgUrl = `https://sentry.io/api/0/organizations/${org}/`;

		const orgResponse = await fetch(orgUrl, {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (orgResponse.status === 404) {
			logError(`Organization '${org}' not found (404)`);
			logWarning("Possible causes:");
			logWarning("  • Organization slug is incorrect");
			logWarning("  • Auth token doesn't have access to this organization");
			logWarning("  • Organization doesn't exist");
			return false;
		}

		if (orgResponse.status === 401 || orgResponse.status === 403) {
			logError(`Unauthorized (${orgResponse.status})`);
			logWarning("Possible causes:");
			logWarning("  • Auth token is invalid or expired");
			logWarning("  • Auth token doesn't have required permissions");
			logWarning("  • Token doesn't have access to this organization");
			return false;
		}

		if (!orgResponse.ok) {
			logError(`API error: ${orgResponse.status} ${orgResponse.statusText}`);
			return false;
		}

		const orgData = await orgResponse.json();
		logSuccess(`Organization found: ${orgData.name || org}`);
		logInfo(`  Slug: ${orgData.slug}`);
		logInfo(`  ID: ${orgData.id}`);

		// Test 2: List projects
		logInfo("\nTest 2: Listing projects...");
		const projectsUrl = `https://sentry.io/api/0/organizations/${org}/projects/`;

		const projectsResponse = await fetch(projectsUrl, {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (!projectsResponse.ok) {
			logError(`Failed to list projects: ${projectsResponse.status}`);
			return false;
		}

		const projects = await projectsResponse.json();
		logSuccess(`Found ${projects.length} project(s)`);

		if (projects.length > 0) {
			logInfo("\nAvailable projects:");
			projects.forEach((project: any, index: number) => {
				logInfo(`  ${index + 1}. ${project.name} (slug: ${project.slug})`);
			});
		} else {
			logWarning("No projects found in this organization");
		}

		// Test 3: List issues
		logInfo("\nTest 3: Fetching recent issues...");
		const issuesUrl = `https://sentry.io/api/0/organizations/${org}/issues/?statsPeriod=24h`;

		const issuesResponse = await fetch(issuesUrl, {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (!issuesResponse.ok) {
			logError(`Failed to fetch issues: ${issuesResponse.status}`);
			if (issuesResponse.status === 404) {
				logWarning("This might be normal if there are no issues");
			}
			return false;
		}

		const issues = await issuesResponse.json();
		logSuccess(`Found ${issues.length} issue(s) in the last 24 hours`);

		if (issues.length > 0) {
			logInfo("\nRecent issues:");
			issues.slice(0, 5).forEach((issue: any, index: number) => {
				logInfo(
					`  ${index + 1}. ${issue.title.substring(0, 60)}... (Level: ${issue.level}, Count: ${issue.count})`,
				);
			});
		}

		return true;
	} catch (error) {
		logError(
			`API test failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
		return false;
	}
}

async function provideSetupInstructions() {
	logSection("Setup Instructions");

	logInfo("To configure Sentry MCP:");
	console.log("\n1. Create a Sentry Auth Token:");
	console.log("   • Go to https://sentry.io/settings/tokens/");
	console.log("   • Click 'Create New Token'");
	console.log("   • Give it a name (e.g., 'MCP Integration')");
	console.log("   • Select scopes: 'org:read', 'project:read', 'event:read'");
	console.log("   • Copy the token");

	console.log("\n2. Find your organization slug:");
	console.log("   • Go to https://sentry.io/settings/");
	console.log("   • Your organization slug is in the URL or settings page");
	console.log(
		"   • Example: If URL is https://sentry.io/organizations/my-org/",
	);
	console.log("     then SENTRY_ORG=my-org");

	console.log("\n3. Find your project slug:");
	console.log("   • Go to your Sentry project");
	console.log("   • The project slug is in the URL or project settings");
	console.log(
		"   • Example: If URL is https://sentry.io/organizations/my-org/projects/my-project/",
	);
	console.log("     then SENTRY_PROJECT=my-project");

	console.log("\n4. Add to .env.local:");
	console.log("   SENTRY_AUTH_TOKEN=your-token-here");
	console.log("   SENTRY_ORG=your-org-slug");
	console.log("   SENTRY_PROJECT=your-project-slug");

	console.log("\n5. Restart your MCP server:");
	console.log("   npm run mcp:start");
}

async function main() {
	console.clear();
	log("\n🔍 Sentry MCP Configuration Test", "bright");
	log("==================================\n", "bright");

	const { allConfigured, sentryAuthToken, sentryOrg } =
		await checkEnvironmentVariables();

	if (!allConfigured) {
		logError("\n❌ Sentry MCP is not properly configured");
		await provideSetupInstructions();
		process.exit(1);
	}

	if (!sentryAuthToken || !sentryOrg) {
		logError("\n❌ Missing required environment variables");
		await provideSetupInstructions();
		process.exit(1);
	}

	const apiOk = await testSentryAPI(sentryAuthToken, sentryOrg);

	if (apiOk) {
		logSection("Summary");
		logSuccess("Sentry MCP configuration is working!");
		logInfo("You should be able to use Sentry MCP tools now.");
	} else {
		logSection("Summary");
		logError("Sentry MCP API connection failed");
		logWarning("Check the errors above and verify your credentials");
		await provideSetupInstructions();
		process.exit(1);
	}

	console.log("\n");
}

// Run test
main().catch((error) => {
	logError(`Test failed: ${error.message}`);
	if (error instanceof Error && error.stack) {
		console.error(error.stack);
	}
	process.exit(1);
});

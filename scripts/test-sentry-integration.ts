#!/usr/bin/env tsx
/**
 * Sentry Integration Test Script
 *
 * Tests Sentry configuration and sends test events to verify setup.
 * Run this to diagnose why Sentry isn't showing events in the dashboard.
 *
 * Usage: tsx scripts/test-sentry-integration.ts
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load environment variables from .env.local
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

import * as Sentry from "@sentry/nextjs";

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

async function checkSentryConfiguration() {
	logSection("Sentry Configuration Check");

	const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
	const sentryOrg = process.env.SENTRY_ORG;
	const sentryProject = process.env.SENTRY_PROJECT;
	const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
	const nodeEnv = process.env.NODE_ENV;
	const vercelEnv = process.env.VERCEL_ENV;

	logInfo(`NODE_ENV: ${nodeEnv || "not set"}`);
	logInfo(`VERCEL_ENV: ${vercelEnv || "not set"}`);

	// Check DSN
	if (!sentryDsn) {
		logError("SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN is not set");
		logWarning("Sentry will not capture any events without a DSN");
		return false;
	}

	logSuccess(`Sentry DSN found: ${sentryDsn.substring(0, 30)}...`);

	// Validate DSN format
	try {
		const url = new URL(sentryDsn);
		if (!url.hostname.includes("sentry.io") && !url.hostname.includes("ingest.sentry.io")) {
			logWarning(`Sentry DSN hostname looks unusual: ${url.hostname}`);
		} else {
			logSuccess(`Sentry DSN hostname is valid: ${url.hostname}`);
		}
	} catch (error) {
		logError(`Invalid Sentry DSN format: ${sentryDsn}`);
		return false;
	}

	// Check Sentry project config (for source maps)
	if (!sentryOrg || !sentryProject) {
		logWarning("SENTRY_ORG or SENTRY_PROJECT not set (source maps may not upload)");
	} else {
		logSuccess(`Sentry project: ${sentryOrg}/${sentryProject}`);
	}

	if (!sentryAuthToken) {
		logWarning("SENTRY_AUTH_TOKEN not set (source maps may not upload)");
	} else {
		logSuccess("Sentry auth token configured");
	}

	return true;
}

async function testSentryCapture() {
	logSection("Testing Sentry Event Capture");

	try {
		// Initialize Sentry manually for testing
		const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
		
		if (!dsn) {
			logError("Cannot test Sentry - DSN not configured");
			return false;
		}

		// Determine environment
		const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

		// Initialize Sentry with debug enabled
		Sentry.init({
			dsn,
			environment,
			debug: true, // Enable debug mode for testing
			tracesSampleRate: 1.0,
			beforeSend(event, hint) {
				console.log("\n[Sentry Test] Event being sent:", {
					message: event.message,
					exception: event.exception?.values?.[0]?.value,
					level: event.level,
					environment: event.environment,
					tags: event.tags,
				});
				return event;
			},
		});

		logInfo("Sentry initialized with debug mode enabled");
		logInfo(`Environment: ${environment}`);

		// Test 1: Capture a test exception
		logInfo("\nTest 1: Capturing test exception...");
		const testError = new Error("Sentry Integration Test - This is a test error");
		Sentry.captureException(testError, {
			tags: {
				test: true,
				test_type: "integration_test",
			},
			extra: {
				testTimestamp: new Date().toISOString(),
				testScript: "test-sentry-integration.ts",
			},
		});
		logSuccess("Test exception captured");

		// Test 2: Capture a test message
		logInfo("\nTest 2: Capturing test message...");
		Sentry.captureMessage("Sentry Integration Test - This is a test message", {
			level: "info",
			tags: {
				test: true,
				test_type: "message_test",
			},
			extra: {
				testTimestamp: new Date().toISOString(),
				testScript: "test-sentry-integration.ts",
			},
		});
		logSuccess("Test message captured");

		// Wait for events to be sent
		logInfo("\nWaiting for events to be sent to Sentry...");
		await new Promise((resolve) => setTimeout(resolve, 3000));

		logSuccess("Events should now be visible in Sentry dashboard");
		logInfo("Check your Sentry project for events tagged with 'test: true'");

		return true;
	} catch (error) {
		logError(`Sentry test failed: ${error instanceof Error ? error.message : String(error)}`);
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
		return false;
	}
}

async function checkSentryDashboard() {
	logSection("Sentry Dashboard Checklist");

	logInfo("To verify events are appearing in Sentry:");
	console.log("\n1. Go to your Sentry project dashboard");
	console.log("2. Check the 'Issues' tab");
	console.log("3. Look for events with tag 'test: true'");
	console.log("4. Check the environment filter matches your current environment");
	console.log("5. Verify date filters aren't excluding recent events");
	console.log("\nCommon issues:");
	console.log("  • Environment filter mismatch (check VERCEL_ENV or NODE_ENV)");
	console.log("  • Date range too narrow");
	console.log("  • Inbound data filters excluding test events");
	console.log("  • DSN mismatch between config and Sentry project");
}

async function main() {
	console.clear();
	log("\n🔍 Sentry Integration Test", "bright");
	log("==========================\n", "bright");

	const configOk = await checkSentryConfiguration();

	if (!configOk) {
		logError("\nSentry is not properly configured. Please set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN");
		logInfo("See .env.example for required environment variables");
		process.exit(1);
	}

	const testOk = await testSentryCapture();

	if (testOk) {
		await checkSentryDashboard();
		logSection("Next Steps");
		logInfo("1. Check Sentry dashboard for test events");
		logInfo("2. If events don't appear, check:");
		logInfo("   - Environment filter in Sentry dashboard");
		logInfo("   - Date range filter");
		logInfo("   - Inbound data filters (may exclude test events)");
		logInfo("   - DSN matches your Sentry project");
		logInfo("3. Enable SENTRY_DEBUG=true for more verbose logging");
	} else {
		logError("\nSentry test failed. Check the errors above.");
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

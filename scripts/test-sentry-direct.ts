/**
 * Direct Sentry Test Script
 * Tests if Sentry is actually capturing and sending events
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

console.log("🔍 Sentry Configuration Check:");
console.log("DSN:", dsn ? `${dsn.substring(0, 20)}...` : "NOT SET");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("VERCEL_ENV:", process.env.VERCEL_ENV);

if (!dsn) {
	console.error("❌ Sentry DSN not found!");
	console.log("Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN environment variable");
	process.exit(1);
}

// Initialize Sentry
Sentry.init({
	dsn,
	environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
	tracesSampleRate: 1.0,
	debug: true,
	beforeSend(event) {
		console.log("\n📤 [Sentry] Event being sent:", {
			message: event.message,
			exception: event.exception?.values?.[0]?.value,
			level: event.level,
			environment: event.environment,
			tags: event.tags,
		});
		return event;
	},
});

async function testSentry() {
	console.log("\n🧪 Testing Sentry capture...\n");

	// Test 1: Capture a message
	console.log("Test 1: Capturing message...");
	Sentry.captureMessage("Test message from diagnostic script", {
		level: "info",
		tags: {
			test: "true",
			source: "diagnostic_script",
		},
		extra: {
			timestamp: new Date().toISOString(),
			environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
		},
	});

	// Test 2: Capture an exception
	console.log("Test 2: Capturing exception...");
	const testError = new Error("Test error from diagnostic script");
	Sentry.captureException(testError, {
		tags: {
			test: "true",
			source: "diagnostic_script",
		},
		extra: {
			timestamp: new Date().toISOString(),
		},
	});

	// Test 3: Set context
	console.log("Test 3: Setting context...");
	Sentry.setContext("test_context", {
		test: true,
		timestamp: new Date().toISOString(),
	});

	// Flush and wait
	console.log("\n⏳ Flushing Sentry (waiting 3 seconds)...");
	await Sentry.flush(3000);

	console.log("\n✅ Test complete!");
	console.log("Check your Sentry dashboard for these events:");
	console.log("  - Message: 'Test message from diagnostic script'");
	console.log("  - Exception: 'Test error from diagnostic script'");
}

testSentry().catch((error) => {
	console.error("❌ Test failed:", error);
	process.exit(1);
});

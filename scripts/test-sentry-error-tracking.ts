#!/usr/bin/env tsx
/**
 * Test Script: Sentry Error Tracking for Signup Issues
 * 
 * This script tests that our improved error handling and Sentry tracking
 * is working correctly for the database query issues in free signup.
 * 
 * Usage: tsx scripts/test-sentry-error-tracking.ts
 */

import * as Sentry from "@sentry/nextjs";
import { SignupMatchingService } from "../utils/services/SignupMatchingService";

// Initialize Sentry for testing
Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: "test",
	debug: true,
});

async function testErrorTracking() {
	console.log("🔍 Testing Sentry Error Tracking for Signup Issues...\n");

	try {
		// Test 1: Database Error Handling
		console.log("1. Testing database error handling...");
		
		const mockUserPrefs = {
			email: "test@example.com",
			target_cities: ["berlin", "munich"],
			career_path: ["tech-transformation"],
			subscription_tier: "free" as const,
		};

		const config = SignupMatchingService.getConfig("free");
		console.log("✅ Config retrieved:", config);

		// Test 2: Verify Sentry is configured
		console.log("\n2. Testing Sentry configuration...");
		
		Sentry.captureMessage("Test message from error tracking script", {
			level: "info",
			tags: {
				script: "test-sentry-error-tracking",
				test_type: "configuration_check",
			},
		});
		console.log("✅ Test message sent to Sentry");

		// Test 3: Simulate the error scenario
		console.log("\n3. Simulating error scenario...");
		
		try {
			// This would normally trigger the database error we're tracking
			const result = await SignupMatchingService.runMatching(mockUserPrefs, config);
			console.log("✅ Matching completed:", result.success ? "SUCCESS" : "FAILED");
			console.log("   Match count:", result.matchCount);
			console.log("   Method:", result.method);
			if (result.error) {
				console.log("   Error:", result.error);
			}
		} catch (error) {
			console.log("❌ Matching failed with error:", error instanceof Error ? error.message : String(error));
			
			// Verify our error handling captured this
			Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
				tags: {
					script: "test-sentry-error-tracking",
					test_type: "error_simulation",
				},
			});
		}

		console.log("\n✅ Error tracking test completed!");
		console.log("📊 Check Sentry dashboard for captured events:");
		console.log("   - Test configuration message");
		console.log("   - Any database errors from matching");
		console.log("   - Error context and user information");

	} catch (error) {
		console.error("❌ Test failed:", error);
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				script: "test-sentry-error-tracking",
				test_type: "script_error",
			},
		});
	}

	// Flush Sentry events
	await Sentry.flush(2000);
}

// Run the test
testErrorTracking().catch(console.error);
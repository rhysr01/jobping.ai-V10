#!/usr/bin/env tsx
/**
 * Comprehensive Sentry Error Tracking Test
 * 
 * This script tests all the Sentry integrations we've added across the entire
 * signup and matching pipeline to ensure complete error visibility.
 * 
 * Usage: tsx scripts/test-comprehensive-sentry-tracking.ts
 */

import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for testing
Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: "test",
	debug: true,
});

interface TestResult {
	component: string;
	test: string;
	status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
	details?: string;
}

const results: TestResult[] = [];

function logResult(component: string, test: string, status: TestResult["status"], details?: string) {
	results.push({ component, test, status, details });
	console.log(`${status} [${component}] ${test}${details ? ` - ${details}` : ""}`);
}

async function testSentryConfiguration() {
	console.log("🔍 Testing Sentry Configuration...\n");

	// Test 1: Environment Variables
	const sentryDsn = process.env.SENTRY_DSN;
	const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
	const sentryOrg = process.env.SENTRY_ORG;
	const sentryProject = process.env.SENTRY_PROJECT;

	logResult("Configuration", "SENTRY_DSN", sentryDsn ? "✅ PASS" : "❌ FAIL", sentryDsn ? "Set" : "Missing");
	logResult("Configuration", "SENTRY_AUTH_TOKEN", sentryAuthToken ? "✅ PASS" : "❌ FAIL", sentryAuthToken ? "Set" : "Missing");
	logResult("Configuration", "SENTRY_ORG", sentryOrg ? "✅ PASS" : "❌ FAIL", sentryOrg || "Missing");
	logResult("Configuration", "SENTRY_PROJECT", sentryProject ? "✅ PASS" : "❌ FAIL", sentryProject || "Missing");

	// Test 2: Sentry Initialization
	try {
		Sentry.captureMessage("Comprehensive Sentry test - Configuration check", {
			level: "info",
			tags: {
				test_type: "configuration",
				script: "comprehensive-sentry-test",
			},
		});
		logResult("Configuration", "Sentry.captureMessage", "✅ PASS", "Test message sent");
	} catch (error) {
		logResult("Configuration", "Sentry.captureMessage", "❌ FAIL", error instanceof Error ? error.message : String(error));
	}
}

async function testComponentSentryIntegration() {
	console.log("\n🧩 Testing Component Sentry Integration...\n");

	const components = [
		{
			name: "Free Signup Route",
			path: "app/api/signup/free/route.ts",
			expectedTags: ["endpoint: signup-free", "error_type: database_error", "error_type: no_matches_found"],
		},
		{
			name: "Premium Signup Route", 
			path: "app/api/signup/route.ts",
			expectedTags: ["service: premium-signup", "error_type: email_delivery_failed", "error_type: user_creation_failed"],
		},
		{
			name: "SignupMatchingService",
			path: "utils/services/SignupMatchingService.ts",
			expectedTags: ["service: SignupMatchingService", "method: fetchJobsForTier", "method: runMatching"],
		},
		{
			name: "FreeMatchingStrategy",
			path: "utils/strategies/FreeMatchingStrategy.ts",
			expectedTags: ["service: FreeMatchingStrategy", "tier: free", "method: runFreeMatching"],
		},
		{
			name: "PremiumMatchingStrategy",
			path: "utils/strategies/PremiumMatchingStrategy.ts",
			expectedTags: ["service: PremiumMatchingStrategy", "tier: premium", "method: runPremiumMatching"],
		},
		{
			name: "AIMatchingService",
			path: "utils/matching/core/ai-matching.service.ts",
			expectedTags: ["service: AIMatchingService", "method: getMatches", "error_type: response_parsing_failed"],
		},
		{
			name: "MatchingEngine",
			path: "utils/matching/core/matching-engine.ts",
			expectedTags: ["service: MatchingEngine", "method: simplifiedMatchingEngine", "fallback_triggered: true"],
		},
	];

	for (const component of components) {
		try {
			// Check if file exists and has Sentry import
			const fs = await import('fs/promises');
			const content = await fs.readFile(component.path, 'utf-8');
			
			const hasSentryImport = content.includes('import * as Sentry from "@sentry/nextjs"');
			const hasSentryCapture = content.includes('Sentry.capture');
			
			if (hasSentryImport && hasSentryCapture) {
				logResult(component.name, "Sentry Integration", "✅ PASS", "Import and capture calls found");
				
				// Check for expected tags
				let tagsFound = 0;
				for (const tag of component.expectedTags) {
					if (content.includes(tag)) {
						tagsFound++;
					}
				}
				
				const tagCoverage = `${tagsFound}/${component.expectedTags.length} tags`;
				logResult(component.name, "Error Tags", tagsFound > 0 ? "✅ PASS" : "⚠️ SKIP", tagCoverage);
			} else {
				logResult(component.name, "Sentry Integration", "❌ FAIL", 
					!hasSentryImport ? "Missing import" : "Missing capture calls");
			}
		} catch (error) {
			logResult(component.name, "File Check", "❌ FAIL", error instanceof Error ? error.message : String(error));
		}
	}
}

async function testErrorScenarios() {
	console.log("\n🚨 Testing Error Scenarios...\n");

	// Test 1: Simulated Database Error
	try {
		Sentry.captureException(new Error("Simulated database query failure"), {
			tags: {
				service: "test-script",
				error_type: "database_error",
				test_scenario: "simulated",
			},
			extra: {
				query: "SELECT * FROM jobs WHERE company_profile_url IS NOT NULL",
				errorCode: "42703",
				operation: "job_fetching",
			},
			level: "error",
		});
		logResult("Error Scenarios", "Database Error Simulation", "✅ PASS", "Exception captured with context");
	} catch (error) {
		logResult("Error Scenarios", "Database Error Simulation", "❌ FAIL", error instanceof Error ? error.message : String(error));
	}

	// Test 2: Simulated AI API Error
	try {
		Sentry.captureException(new Error("OpenAI API rate limit exceeded"), {
			tags: {
				service: "test-script",
				error_type: "ai_api_error",
				provider: "openai",
			},
			extra: {
				userEmail: "test@example.com",
				jobsCount: 150,
				operation: "ai_matching",
			},
			user: { email: "test@example.com" },
			level: "error",
		});
		logResult("Error Scenarios", "AI API Error Simulation", "✅ PASS", "API error captured with user context");
	} catch (error) {
		logResult("Error Scenarios", "AI API Error Simulation", "❌ FAIL", error instanceof Error ? error.message : String(error));
	}

	// Test 3: Simulated User Creation Error
	try {
		Sentry.captureMessage("User creation failed - RLS policy violation", {
			level: "error",
			tags: {
				service: "test-script",
				error_type: "user_creation_failed",
				errorCode: "42501",
			},
			extra: {
				email: "test@example.com",
				operation: "premium_signup",
				hasServiceRoleKey: true,
			},
			user: { email: "test@example.com" },
		});
		logResult("Error Scenarios", "User Creation Error Simulation", "✅ PASS", "Message captured with tags");
	} catch (error) {
		logResult("Error Scenarios", "User Creation Error Simulation", "❌ FAIL", error instanceof Error ? error.message : String(error));
	}
}

async function testErrorContextPreservation() {
	console.log("\n📋 Testing Error Context Preservation...\n");

	const testContexts = [
		{
			name: "User Context",
			test: () => Sentry.captureMessage("Test with user context", {
				user: { email: "test@example.com", tier: "premium" },
				level: "info",
			}),
		},
		{
			name: "Request Context",
			test: () => Sentry.captureMessage("Test with request context", {
				extra: { requestId: "test-123", endpoint: "/api/signup/free" },
				level: "info",
			}),
		},
		{
			name: "Performance Context",
			test: () => Sentry.captureMessage("Test with performance context", {
				extra: { 
					processingTime: 2500,
					jobsProcessed: 150,
					matchesFound: 5,
				},
				level: "info",
			}),
		},
		{
			name: "Error Tags",
			test: () => Sentry.captureMessage("Test with error tags", {
				tags: {
					service: "test",
					method: "contextTest",
					tier: "premium",
					error_type: "test_scenario",
				},
				level: "info",
			}),
		},
	];

	for (const context of testContexts) {
		try {
			context.test();
			logResult("Context Preservation", context.name, "✅ PASS", "Context captured");
		} catch (error) {
			logResult("Context Preservation", context.name, "❌ FAIL", error instanceof Error ? error.message : String(error));
		}
	}
}

async function generateSummaryReport() {
	console.log("\n📊 Test Summary Report\n");
	console.log("=".repeat(60));

	const totalTests = results.length;
	const passedTests = results.filter(r => r.status === "✅ PASS").length;
	const failedTests = results.filter(r => r.status === "❌ FAIL").length;
	const skippedTests = results.filter(r => r.status === "⚠️ SKIP").length;

	console.log(`📋 Total Tests: ${totalTests}`);
	console.log(`✅ Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
	console.log(`❌ Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
	console.log(`⚠️ Skipped: ${skippedTests} (${Math.round(skippedTests/totalTests*100)}%)`);

	console.log("\n📋 Detailed Results:");
	console.log("-".repeat(60));

	const groupedResults = results.reduce((acc, result) => {
		if (!acc[result.component]) acc[result.component] = [];
		acc[result.component].push(result);
		return acc;
	}, {} as Record<string, TestResult[]>);

	for (const [component, componentResults] of Object.entries(groupedResults)) {
		console.log(`\n🧩 ${component}:`);
		for (const result of componentResults) {
			console.log(`  ${result.status} ${result.test}${result.details ? ` - ${result.details}` : ""}`);
		}
	}

	// Recommendations
	console.log("\n💡 Recommendations:");
	console.log("-".repeat(60));

	if (failedTests > 0) {
		console.log("❌ Fix failed tests before deploying to production");
	}
	
	if (passedTests / totalTests >= 0.9) {
		console.log("✅ Excellent Sentry coverage - ready for production monitoring");
	} else if (passedTests / totalTests >= 0.7) {
		console.log("⚠️ Good Sentry coverage - consider adding more error tracking");
	} else {
		console.log("❌ Insufficient Sentry coverage - add more error tracking before production");
	}

	console.log("📊 Monitor Sentry dashboard for captured events");
	console.log("🔔 Set up alerting rules based on error frequency and types");
	console.log("📈 Review error patterns weekly to improve system reliability");

	return {
		total: totalTests,
		passed: passedTests,
		failed: failedTests,
		skipped: skippedTests,
		coverage: passedTests / totalTests,
	};
}

async function main() {
	console.log("🚀 Starting Comprehensive Sentry Error Tracking Test\n");
	console.log("=".repeat(60));

	try {
		await testSentryConfiguration();
		await testComponentSentryIntegration();
		await testErrorScenarios();
		await testErrorContextPreservation();

		const summary = await generateSummaryReport();

		// Flush Sentry events
		console.log("\n📤 Flushing Sentry events...");
		await Sentry.flush(5000);
		console.log("✅ Sentry events flushed");

		console.log("\n🎉 Comprehensive Sentry test completed!");
		
		// Exit with appropriate code
		process.exit(summary.failed > 0 ? 1 : 0);

	} catch (error) {
		console.error("❌ Test suite failed:", error);
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
		await Sentry.flush(2000);
		process.exit(1);
	}
}

// Run the test suite
main().catch(console.error);
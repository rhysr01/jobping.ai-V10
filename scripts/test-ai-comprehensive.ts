#!/usr/bin/env tsx

/**
 * Comprehensive AI Testing Suite
 *
 * Runs all AI-related tests in sequence for complete validation.
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function runComprehensiveAITests() {
	console.log("🚀 COMPREHENSIVE AI TESTING SUITE\n");
	console.log("=".repeat(60));

	const tests = [
		{
			name: "Production Engine Tests",
			command: "npm run test:production-engine",
			description: "Real production code testing (ConsolidatedMatchingEngine)",
		},
	];

	const results = [];
	let allPassed = true;

	for (const test of tests) {
		console.log(`\n🧪 Running: ${test.name}`);
		console.log(`   ${test.description}`);
		console.log("-".repeat(50));

		const startTime = Date.now();

		try {
			const { spawn } = require("node:child_process");
			const [cmd, ...args] = test.command.split(" ");

			await new Promise((resolve, reject) => {
				const child = spawn(cmd, args, {
					stdio: "inherit",
					shell: true,
				});

				child.on("close", (code: number) => {
					if (code === 0) {
						resolve(code);
					} else {
						reject(new Error(`Test failed with code ${code}`));
					}
				});

				child.on("error", reject);
			});

			const duration = Date.now() - startTime;
			results.push({
				name: test.name,
				passed: true,
				duration: Math.round(duration / 1000), // seconds
				error: null,
			});

			console.log(`✅ PASSED (${Math.round(duration / 1000)}s)`);
		} catch (error) {
			const duration = Date.now() - startTime;
			allPassed = false;

			results.push({
				name: test.name,
				passed: false,
				duration: Math.round(duration / 1000),
				error: error instanceof Error ? error.message : "Unknown error",
			});

			console.log(`❌ FAILED (${Math.round(duration / 1000)}s)`);
			console.log(
				`   Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	// Summary
	console.log(`\n${"=".repeat(60)}`);
	console.log("📊 COMPREHENSIVE AI TESTING SUMMARY");
	console.log("=".repeat(60));

	const passedTests = results.filter((r) => r.passed).length;
	const totalTests = results.length;
	const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

	console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
	console.log(
		`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`,
	);
	console.log(`⏱️  Total Time: ${totalTime}s`);

	console.log("\n📋 Detailed Results:");
	results.forEach((result) => {
		const status = result.passed ? "✅" : "❌";
		const time =
			result.duration < 60
				? `${result.duration}s`
				: `${Math.round(result.duration / 60)}m ${result.duration % 60}s`;
		console.log(`   ${status} ${result.name}: ${time}`);

		if (!result.passed && result.error) {
			console.log(`      Error: ${result.error}`);
		}
	});

	console.log(`\n${"=".repeat(60)}`);

	if (allPassed) {
		console.log("🎉 ALL AI TESTS PASSED!");
		console.log("🚀 AI system is production-ready");
	} else {
		console.log("⚠️  SOME AI TESTS FAILED");
		console.log("🔧 Review failures above and fix issues");
	}

	console.log("=".repeat(60));

	process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
	runComprehensiveAITests().catch((error) => {
		console.error("💥 Comprehensive testing failed:", error);
		process.exit(1);
	});
}

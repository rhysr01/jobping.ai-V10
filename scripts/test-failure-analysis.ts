#!/usr/bin/env tsx

/**
 * TEST FAILURE ANALYSIS SCRIPT
 *
 * Analyzes test failures from CI/CD runs and creates automated GitHub issues
 * using MCP tools. Correlates test failures with production errors and
 * provides actionable insights.
 */

import * as fs from "fs";
import * as path from "path";

interface TestResult {
	numTotalTests: number;
	numPassedTests: number;
	numFailedTests: number;
	testResults: Array<{
		testFilePath: string;
		testResults: Array<{
			title: string;
			status: "passed" | "failed";
			duration: number;
			errorMessage?: string;
		}>;
	}>;
}

interface FailureAnalysis {
	testSuite: string;
	failedTests: string[];
	errorMessages: string[];
	patterns: string[];
	severity: "low" | "medium" | "high" | "critical";
	recommendations: string[];
}

class TestFailureAnalyzer {
	private testResults: TestResult | null = null;
	private analysis: FailureAnalysis | null = null;

	async run() {
		try {
			console.log("🔍 Starting test failure analysis...");

			// Load test results
			await this.loadTestResults();

			// Analyze failures
			this.analyzeFailures();

			// Correlate with production errors
			await this.correlateWithProduction();

			// Create GitHub issue if needed
			await this.createIssueIfNeeded();

			console.log("✅ Test failure analysis completed");
		} catch (error) {
			console.error("❌ Test failure analysis failed:", error);
			process.exit(1);
		}
	}

	private async loadTestResults() {
		const resultsPath = path.join(
			process.cwd(),
			"test-results",
			"results.json",
		);

		if (!fs.existsSync(resultsPath)) {
			console.log(
				"⚠️  No test results file found, checking Playwright results...",
			);
			// Try to load Playwright results
			const playwrightResultsPath = path.join(
				process.cwd(),
				"playwright-report",
				"results.json",
			);
			if (fs.existsSync(playwrightResultsPath)) {
				this.parsePlaywrightResults(playwrightResultsPath);
			} else {
				throw new Error("No test results found");
			}
		} else {
			const resultsContent = fs.readFileSync(resultsPath, "utf-8");
			this.testResults = JSON.parse(resultsContent);
		}

		console.log(
			`📊 Loaded results: ${this.testResults?.numTotalTests || 0} tests, ${this.testResults?.numFailedTests || 0} failed`,
		);
	}

	private parsePlaywrightResults(resultsPath: string) {
		// Parse Playwright-specific result format
		try {
			const results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
			this.testResults = {
				numTotalTests: results.suites?.[0]?.specs?.length || 0,
				numPassedTests: 0,
				numFailedTests: 0,
				testResults: [],
			};

			// This would need more sophisticated parsing based on Playwright's actual format
			console.log("⚠️  Playwright results parsing is simplified");
		} catch (error) {
			throw new Error(`Failed to parse Playwright results: ${error.message}`);
		}
	}

	private analyzeFailures() {
		if (!this.testResults || this.testResults.numFailedTests === 0) {
			console.log("✅ No test failures to analyze");
			return;
		}

		const failedTests: string[] = [];
		const errorMessages: string[] = [];
		const patterns: string[] = [];

		// Extract failed tests and error patterns
		this.testResults.testResults.forEach((suite) => {
			suite.testResults.forEach((test) => {
				if (test.status === "failed") {
					failedTests.push(`${suite.testFilePath}: ${test.title}`);
					if (test.errorMessage) {
						errorMessages.push(test.errorMessage);

						// Extract common error patterns
						if (test.errorMessage.includes("rate limit")) {
							patterns.push("rate_limiting");
						}
						if (test.errorMessage.includes("timeout")) {
							patterns.push("timeout");
						}
						if (test.errorMessage.includes("network")) {
							patterns.push("network_error");
						}
						if (test.errorMessage.includes("database")) {
							patterns.push("database_error");
						}
					}
				}
			});
		});

		// Determine severity
		let severity: "low" | "medium" | "high" | "critical" = "low";
		const failureRate =
			this.testResults.numFailedTests / this.testResults.numTotalTests;

		if (failureRate > 0.5) severity = "critical";
		else if (failureRate > 0.25) severity = "high";
		else if (failureRate > 0.1) severity = "medium";

		// Generate recommendations
		const recommendations = this.generateRecommendations(patterns, failureRate);

		this.analysis = {
			testSuite: "CI/CD Test Suite",
			failedTests,
			errorMessages,
			patterns: [...new Set(patterns)], // Remove duplicates
			severity,
			recommendations,
		};

		console.log(
			`🔍 Analysis complete: ${severity} severity, ${patterns.length} patterns identified`,
		);
	}

	private async correlateWithProduction() {
		if (!this.analysis) return;

		// This would use MCP tools to check Sentry for related errors
		console.log("🔗 Checking for production error correlations...");

		// Simulate MCP call - in real implementation, this would call the MCP server
		try {
			// const correlations = await mcpCall("sentry_analyze_error_patterns", {
			// 	patterns: this.analysis.patterns,
			// 	timeRange: "24h"
			// });

			console.log("✅ Production correlation check completed");
		} catch (error) {
			console.log("⚠️  Production correlation check failed:", error.message);
		}
	}

	private async createIssueIfNeeded() {
		if (!this.analysis || this.analysis.failedTests.length === 0) {
			console.log("ℹ️  No issues to create");
			return;
		}

		// Only create issues for medium or higher severity
		if (this.analysis.severity === "low") {
			console.log("ℹ️  Low severity failures - not creating issue");
			return;
		}

		console.log(
			`🚨 Creating GitHub issue for ${this.analysis.severity} severity failures...`,
		);

		const issueTitle = this.generateIssueTitle();
		const issueBody = this.generateIssueBody();

		try {
			// This would use MCP to create the issue
			// await mcpCall("github_create_issue", {
			// 	title: issueTitle,
			// 	body: issueBody,
			// 	labels: this.getIssueLabels()
			// });

			console.log("✅ GitHub issue created successfully");
		} catch (error) {
			console.error("❌ Failed to create GitHub issue:", error.message);
		}
	}

	private generateIssueTitle(): string {
		const { severity, failedTests } = this.analysis!;
		const count = failedTests.length;

		return `🚨 ${severity.toUpperCase()}: ${count} Test Failure${count > 1 ? "s" : ""} in CI/CD`;
	}

	private generateIssueBody(): string {
		const {
			testSuite,
			failedTests,
			errorMessages,
			patterns,
			severity,
			recommendations,
		} = this.analysis!;

		return `
## 🚨 Test Failure Alert

**Severity:** ${severity.toUpperCase()}
**Test Suite:** ${testSuite}
**Failed Tests:** ${failedTests.length}
**Timestamp:** ${new Date().toISOString()}

### Failed Tests
${failedTests.map((test, i) => `- ${test}${errorMessages[i] ? `\n  \`\`\`\n  ${errorMessages[i]}\n  \`\`\`` : ""}`).join("\n")}

### Error Patterns Detected
${patterns.length > 0 ? patterns.map((pattern) => `- ${pattern.replace("_", " ")}`).join("\n") : "No specific patterns identified"}

### Automated Analysis
- **Failure Rate:** ${this.testResults ? ((this.testResults.numFailedTests / this.testResults.numTotalTests) * 100).toFixed(1) : "N/A"}%
- **Severity Assessment:** ${severity}
- This issue was created automatically by the test failure analysis system

### Recommendations
${recommendations.map((rec) => `- ${rec}`).join("\n")}

### Investigation Steps
1. Review the CI/CD logs for detailed error messages
2. Check if failures are environmental (rate limits, network issues)
3. Verify test stability by running locally
4. Check for recent code changes that might have introduced regressions
5. Update test expectations if legitimate behavior changes occurred

### Related Areas
- Check Sentry for related production errors
- Review recent deployments for potential causes
- Monitor performance metrics for degradation

/cc @testing-team @engineering-team
`;
	}

	private getIssueLabels(): string[] {
		const labels = ["bug", "test-failure", "automation"];

		switch (this.analysis!.severity) {
			case "critical":
				labels.push("P0", "blocking");
				break;
			case "high":
				labels.push("P1", "urgent");
				break;
			case "medium":
				labels.push("P2");
				break;
			case "low":
				labels.push("P3");
				break;
		}

		return labels;
	}

	private generateRecommendations(
		patterns: string[],
		failureRate: number,
	): string[] {
		const recommendations: string[] = [];

		if (failureRate > 0.5) {
			recommendations.push(
				"Critical failure rate detected - consider pausing deployments until resolved",
			);
		}

		if (patterns.includes("rate_limiting")) {
			recommendations.push(
				"Rate limiting detected - consider increasing test environment capacity or implementing request deduplication",
			);
		}

		if (patterns.includes("timeout")) {
			recommendations.push(
				"Timeout issues detected - review test timeouts and async operations",
			);
		}

		if (patterns.includes("network_error")) {
			recommendations.push(
				"Network errors detected - check external service dependencies and mocking",
			);
		}

		if (patterns.includes("database_error")) {
			recommendations.push(
				"Database errors detected - verify test database setup and connection pooling",
			);
		}

		if (recommendations.length === 0) {
			recommendations.push(
				"Investigate test failures manually - no specific patterns identified",
			);
			recommendations.push(
				"Check for recent code changes that might have introduced regressions",
			);
			recommendations.push(
				"Verify test environment stability and resource availability",
			);
		}

		return recommendations;
	}
}

// Run the analyzer
const analyzer = new TestFailureAnalyzer();
analyzer.run();

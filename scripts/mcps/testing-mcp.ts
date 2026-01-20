#!/usr/bin/env tsx

/**
 * TESTING MCP SERVER
 *
 * Specialized MCP server for automated testing workflows, issue creation,
 * and test failure analysis. Integrates with GitHub, Sentry, and Supabase
 * to provide comprehensive testing automation.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Import MCP tools
import { githubCreateIssue, githubGetRecentIssues, githubSearchIssues } from "./github-mcp.js";
import { sentryGetRecentErrors, sentryAnalyzeErrorPatterns } from "./sentry-mcp.js";
import { supabaseQueryUsers, supabaseGetTableStats } from "./supabase-mcp.js";

class TestingMCPServer {
	private server: Server;

	constructor() {
		this.server = new Server(
			{
				name: "jobping-testing-mcp",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.setupToolHandlers();
	}

	private setupToolHandlers() {
		// List available testing tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return {
				tools: [
					{
						name: "test_failure_analyzer",
						description: "Analyze test failures and correlate with production errors",
						inputSchema: {
							type: "object",
							properties: {
								testResults: {
									type: "string",
									description: "JSON string of test results",
								},
								timeRange: {
									type: "string",
									description: "Time range to check for related errors (e.g., '1h', '24h')",
									default: "24h",
								},
							},
							required: ["testResults"],
						},
					},
					{
						name: "create_test_failure_issue",
						description: "Create a GitHub issue for test failures with automated analysis",
						inputSchema: {
							type: "object",
							properties: {
								testSuite: {
									type: "string",
									description: "Name of the failing test suite",
								},
								failedTests: {
									type: "array",
									items: { type: "string" },
									description: "List of failed test names",
								},
								errorMessages: {
									type: "array",
									items: { type: "string" },
									description: "Error messages from failed tests",
								},
								environment: {
									type: "string",
									description: "Environment where tests failed (staging, production)",
									default: "staging",
								},
							},
							required: ["testSuite", "failedTests"],
						},
					},
					{
						name: "validate_test_environment",
						description: "Validate that the test environment is properly configured",
						inputSchema: {
							type: "object",
							properties: {
								checkDatabase: {
									type: "boolean",
									description: "Check database connectivity",
									default: true,
								},
								checkExternalAPIs: {
									type: "boolean",
									description: "Check external API connectivity",
									default: true,
								},
								checkEnvironmentVariables: {
									type: "boolean",
									description: "Check required environment variables",
									default: true,
								},
							},
						},
					},
					{
						name: "performance_regression_alert",
						description: "Check for performance regressions and create alerts",
						inputSchema: {
							type: "object",
							properties: {
								baselineMetrics: {
									type: "object",
									description: "Baseline performance metrics",
								},
								currentMetrics: {
									type: "object",
									description: "Current performance metrics",
								},
								threshold: {
									type: "number",
									description: "Performance degradation threshold (percentage)",
									default: 10,
								},
							},
							required: ["baselineMetrics", "currentMetrics"],
						},
					},
					{
						name: "accessibility_violation_tracker",
						description: "Track accessibility violations and create improvement tasks",
						inputSchema: {
							type: "object",
							properties: {
								violations: {
									type: "array",
									items: {
										type: "object",
										properties: {
											rule: { type: "string" },
											element: { type: "string" },
											severity: { type: "string" },
											description: { type: "string" },
										},
									},
								},
								page: {
									type: "string",
									description: "Page where violations were found",
								},
							},
							required: ["violations", "page"],
						},
					},
					{
						name: "test_coverage_analyzer",
						description: "Analyze test coverage and identify gaps",
						inputSchema: {
							type: "object",
							properties: {
								coverageReport: {
									type: "object",
									description: "Coverage report data",
								},
								minimumThreshold: {
									type: "number",
									description: "Minimum coverage threshold",
									default: 80,
								},
							},
							required: ["coverageReport"],
						},
					},
				],
			};
		});

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			try {
				switch (name) {
					case "test_failure_analyzer":
						return await this.handleTestFailureAnalysis(args);

					case "create_test_failure_issue":
						return await this.handleCreateTestFailureIssue(args);

					case "validate_test_environment":
						return await this.handleValidateTestEnvironment(args);

					case "performance_regression_alert":
						return await this.handlePerformanceRegressionAlert(args);

					case "accessibility_violation_tracker":
						return await this.handleAccessibilityViolationTracker(args);

					case "test_coverage_analyzer":
						return await this.handleTestCoverageAnalyzer(args);

					default:
						throw new McpError(
							ErrorCode.MethodNotFound,
							`Unknown tool: ${name}`
						);
				}
			} catch (error) {
				throw new McpError(
					ErrorCode.InternalError,
					`Tool execution failed: ${error.message}`
				);
			}
		});
	}

	private async handleTestFailureAnalysis(args: any) {
		const { testResults, timeRange = "24h" } = args;

		try {
			const results = JSON.parse(testResults);

			// Get recent Sentry errors
			const sentryErrors = await sentryGetRecentErrors({
				limit: 10,
				timeRange,
			});

			// Analyze correlation between test failures and production errors
			const correlations = this.analyzeFailureCorrelations(results, sentryErrors);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							analysis: {
								totalTests: results.numTotalTests || 0,
								failedTests: results.numFailedTests || 0,
								passedTests: results.numPassedTests || 0,
								failureRate: results.numTotalTests ? (results.numFailedTests / results.numTotalTests) * 100 : 0,
							},
							correlations,
							recommendations: this.generateRecommendations(correlations, results),
						}, null, 2),
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to analyze test failures: ${error.message}`);
		}
	}

	private async handleCreateTestFailureIssue(args: any) {
		const { testSuite, failedTests, errorMessages, environment = "staging" } = args;

		// Create a comprehensive GitHub issue
		const issueTitle = `🚨 Test Failures: ${testSuite} (${failedTests.length} failures)`;
		const issueBody = this.generateTestFailureIssueBody(testSuite, failedTests, errorMessages, environment);

		const labels = ["bug", "test-failure", "automation", environment];

		try {
			const issue = await githubCreateIssue({
				title: issueTitle,
				body: issueBody,
				labels,
			});

			return {
				content: [
					{
						type: "text",
						text: `Created GitHub issue: ${issue.html_url}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to create GitHub issue: ${error.message}`);
		}
	}

	private async handleValidateTestEnvironment(args: any) {
		const { checkDatabase = true, checkExternalAPIs = true, checkEnvironmentVariables = true } = args;

		const validationResults = {
			database: { status: "unknown", details: "" },
			externalAPIs: { status: "unknown", details: "" },
			environmentVariables: { status: "unknown", details: "" },
		};

		if (checkDatabase) {
			try {
				const stats = await supabaseGetTableStats();
				validationResults.database = {
					status: "healthy",
					details: `Connected to database with ${Object.keys(stats).length} tables`,
				};
			} catch (error) {
				validationResults.database = {
					status: "failed",
					details: `Database connection failed: ${error.message}`,
				};
			}
		}

		if (checkEnvironmentVariables) {
			const requiredVars = [
				"NEXT_PUBLIC_SUPABASE_URL",
				"SUPABASE_SERVICE_ROLE_KEY",
				"OPENAI_API_KEY",
			];

			const missingVars = requiredVars.filter(varName => !process.env[varName]);

			if (missingVars.length === 0) {
				validationResults.environmentVariables = {
					status: "healthy",
					details: "All required environment variables are set",
				};
			} else {
				validationResults.environmentVariables = {
					status: "failed",
					details: `Missing environment variables: ${missingVars.join(", ")}`,
				};
			}
		}

		if (checkExternalAPIs) {
			// This would need to be implemented based on your external API dependencies
			validationResults.externalAPIs = {
				status: "pending",
				details: "External API validation not yet implemented",
			};
		}

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(validationResults, null, 2),
				},
			],
		};
	}

	private async handlePerformanceRegressionAlert(args: any) {
		const { baselineMetrics, currentMetrics, threshold = 10 } = args;

		const regressions = this.analyzePerformanceRegressions(baselineMetrics, currentMetrics, threshold);

		if (regressions.length > 0) {
			// Create GitHub issue for performance regression
			const issueTitle = `📊 Performance Regression Alert: ${regressions.length} metrics degraded`;
			const issueBody = this.generatePerformanceRegressionIssueBody(regressions, baselineMetrics, currentMetrics);

			try {
				const issue = await githubCreateIssue({
					title: issueTitle,
					body: issueBody,
					labels: ["performance", "regression", "automation"],
				});

				return {
					content: [
						{
							type: "text",
							text: `Performance regression detected. Created issue: ${issue.html_url}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Performance regression detected but failed to create issue: ${error.message}`,
						},
					],
				};
			}
		}

		return {
			content: [
				{
					type: "text",
					text: "No significant performance regressions detected.",
				},
			],
		};
	}

	private async handleAccessibilityViolationTracker(args: any) {
		const { violations, page } = args;

		if (violations.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No accessibility violations found.",
					},
				],
			};
		}

		// Create GitHub issue for accessibility violations
		const issueTitle = `♿ Accessibility Violations: ${violations.length} issues on ${page}`;
		const issueBody = this.generateAccessibilityIssueBody(violations, page);

		try {
			const issue = await githubCreateIssue({
				title: issueTitle,
				body: issueBody,
				labels: ["accessibility", "ux", "automation"],
			});

			return {
				content: [
					{
						type: "text",
						text: `Created accessibility issue: ${issue.html_url}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to create accessibility issue: ${error.message}`);
		}
	}

	private async handleTestCoverageAnalyzer(args: any) {
		const { coverageReport, minimumThreshold = 80 } = args;

		const coverageGaps = this.analyzeCoverageGaps(coverageReport, minimumThreshold);

		if (coverageGaps.length > 0) {
			const issueTitle = `📊 Test Coverage Gaps: ${coverageGaps.length} areas below ${minimumThreshold}%`;
			const issueBody = this.generateCoverageGapIssueBody(coverageGaps, coverageReport);

			try {
				const issue = await githubCreateIssue({
					title: issueTitle,
					body: issueBody,
					labels: ["testing", "coverage", "improvement"],
				});

				return {
					content: [
						{
							type: "text",
							text: `Coverage gaps identified. Created issue: ${issue.html_url}`,
					},
				],
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Coverage gaps identified but failed to create issue: ${error.message}`,
					},
				},
			};
		}

		return {
			content: [
				{
					type: "text",
					text: `Coverage meets minimum threshold of ${minimumThreshold}%.`,
				},
			],
		};
	}

	// Helper methods
	private analyzeFailureCorrelations(testResults: any, sentryErrors: any[]) {
		// Analyze correlations between test failures and production errors
		const correlations = [];

		// This would implement sophisticated correlation analysis
		// For now, return a basic structure
		return correlations;
	}

	private generateRecommendations(correlations: any[], testResults: any) {
		const recommendations = [];

		if (testResults.numFailedTests > testResults.numPassedTests) {
			recommendations.push("High failure rate detected. Consider reviewing test stability and environment setup.");
		}

		if (correlations.length > 0) {
			recommendations.push("Test failures correlate with production errors. Investigate shared root causes.");
		}

		return recommendations;
	}

	private generateTestFailureIssueBody(testSuite: string, failedTests: string[], errorMessages: string[], environment: string) {
		return `
## 🚨 Test Failure Alert

**Test Suite:** ${testSuite}
**Environment:** ${environment}
**Failed Tests:** ${failedTests.length}
**Timestamp:** ${new Date().toISOString()}

### Failed Tests
${failedTests.map((test, i) => `- ${test}${errorMessages[i] ? `: ${errorMessages[i]}` : ''}`).join('\n')}

### Automated Analysis
- This issue was created automatically by the testing MCP server
- Test failures may indicate regressions or environmental issues
- Please investigate and fix the failing tests

### Next Steps
1. Review the test failures in CI/CD logs
2. Check if failures are environmental or code-related
3. Fix any legitimate bugs discovered by tests
4. Update tests if they're flaky or outdated
5. Re-run tests to verify fixes

/cc @testing-team
`;
	}

	private analyzePerformanceRegressions(baseline: any, current: any, threshold: number) {
		const regressions = [];

		// Analyze each metric for regression
		Object.keys(baseline).forEach(metric => {
			if (current[metric] && baseline[metric]) {
				const change = ((current[metric] - baseline[metric]) / baseline[metric]) * 100;
				if (change > threshold) {
					regressions.push({
						metric,
						baseline: baseline[metric],
						current: current[metric],
						change: change.toFixed(2),
					});
				}
			}
		});

		return regressions;
	}

	private generatePerformanceRegressionIssueBody(regressions: any[], baseline: any, current: any) {
		return `
## 📊 Performance Regression Alert

Performance metrics have degraded beyond the ${regressions[0]?.threshold || 10}% threshold.

### Regressions Detected
${regressions.map(r => `- **${r.metric}:** ${r.baseline} → ${r.current} (${r.change}% increase)`).join('\n')}

### Baseline vs Current
- **Baseline:** ${JSON.stringify(baseline, null, 2)}
- **Current:** ${JSON.stringify(current, null, 2)}

### Automated Analysis
- This issue was created automatically by the performance monitoring system
- Regression may impact user experience
- Investigate recent code changes that could affect performance

### Investigation Steps
1. Review recent deployments and code changes
2. Check database query performance
3. Analyze API response times
4. Monitor resource usage (CPU, memory)
5. Consider optimization opportunities

/cc @performance-team
`;
	}

	private generateAccessibilityIssueBody(violations: any[], page: string) {
		return `
## ♿ Accessibility Violations Found

**Page:** ${page}
**Violations:** ${violations.length}

### Violations Details
${violations.map((v, i) => `
#### ${i + 1}. ${v.rule}
- **Element:** ${v.element}
- **Severity:** ${v.severity}
- **Description:** ${v.description}
`).join('\n')}

### Automated Analysis
- This issue was created automatically by accessibility testing
- These violations may prevent users with disabilities from using the site
- WCAG compliance requires fixing these issues

### Priority Levels
- **Critical:** Must fix immediately (keyboard navigation, screen reader support)
- **High:** Should fix soon (color contrast, form labels)
- **Medium:** Consider fixing (minor usability improvements)

### Next Steps
1. Review each violation and determine priority
2. Implement accessibility fixes
3. Test with screen readers and keyboard navigation
4. Re-run accessibility tests to verify fixes

/cc @accessibility-team @ux-team
`;
	}

	private analyzeCoverageGaps(coverageReport: any, threshold: number) {
		const gaps = [];

		// Analyze coverage by file and function
		Object.entries(coverageReport).forEach(([file, coverage]: [string, any]) => {
			if (coverage.lines?.pct < threshold) {
				gaps.push({
					file,
					type: 'lines',
					coverage: coverage.lines.pct,
					threshold,
				});
			}

			if (coverage.functions?.pct < threshold) {
				gaps.push({
					file,
					type: 'functions',
					coverage: coverage.functions.pct,
					threshold,
				});
			}
		});

		return gaps;
	}

	private generateCoverageGapIssueBody(gaps: any[], coverageReport: any) {
		return `
## 📊 Test Coverage Gaps Identified

Coverage analysis shows areas below the minimum threshold.

### Coverage Gaps
${gaps.map(gap => `- **${gap.file}** (${gap.type}): ${gap.coverage}% (threshold: ${gap.threshold}%)`).join('\n')}

### Overall Coverage
- **Lines:** ${coverageReport.total?.lines?.pct || 'N/A'}%
- **Functions:** ${coverageReport.total?.functions?.pct || 'N/A'}%
- **Branches:** ${coverageReport.total?.branches?.pct || 'N/A'}%

### Automated Analysis
- This issue was created automatically by coverage analysis
- Low coverage areas are at higher risk of bugs
- Consider adding tests for uncovered code

### Recommendations
1. Identify critical paths with low coverage
2. Add unit tests for complex business logic
3. Add integration tests for API endpoints
4. Add E2E tests for user journeys
5. Consider refactoring complex functions for better testability

/cc @testing-team @engineering-team
`;
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error("Testing MCP server started");
	}
}

// Start the server
const server = new TestingMCPServer();
server.run().catch(console.error);
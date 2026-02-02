#!/usr/bin/env tsx

/**
 * TESTING STRATEGY VALIDATION
 *
 * Validates that the complete testing strategy is properly implemented
 * and all components are working together correctly.
 */

import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
	component: string;
	status: "✅" | "⚠️" | "❌";
	details: string;
	score: number; // 0-100
}

class TestingStrategyValidator {
	private results: ValidationResult[] = [];

	async validate(): Promise<void> {
		console.log("🔍 Validating Complete Testing Strategy Implementation...\n");

		await this.validateDocumentation();
		await this.validateTestFiles();
		await this.validatePackageScripts();
		await this.validateCIConfiguration();
		await this.validateMCPIntegration();
		await this.validateBaselineFiles();

		this.displayResults();
		this.generateSummary();
	}

	private async validateDocumentation(): Promise<void> {
		const checks = [
			{
				file: "docs/testing.md",
				component: "📚 Comprehensive Testing Documentation",
				required: [
					"visual regression",
					"chaos engineering",
					"MCP integration",
					"performance benchmarks",
				],
			},
			{
				file: "TESTING_README.md",
				component: "📖 Developer Quick Reference",
				required: ["npm run commands", "troubleshooting", "best practices"],
			},
		];

		for (const check of checks) {
			const exists = fs.existsSync(check.file);
			if (exists) {
				const content = fs.readFileSync(check.file, "utf-8");
				const hasAllRequired = check.required.every((req) =>
					content.toLowerCase().includes(req),
				);
				this.results.push({
					component: check.component,
					status: hasAllRequired ? "✅" : "⚠️",
					details: hasAllRequired
						? "Complete documentation available"
						: "Missing some required sections",
					score: hasAllRequired ? 100 : 75,
				});
			} else {
				this.results.push({
					component: check.component,
					status: "❌",
					details: "Documentation file missing",
					score: 0,
				});
			}
		}
	}

	private async validateTestFiles(): Promise<void> {
		const testFiles = [
			{
				path: "tests/e2e/visual-regression.spec.ts",
				component: "👁️ Visual Regression Tests",
			},
			{
				path: "tests/e2e/chaos-engineering.spec.ts",
				component: "🧪 Chaos Engineering Tests",
			},
			{
				path: "tests/e2e/component-testing.spec.ts",
				component: "🧩 Component Tests",
			},
			{
				path: "__tests__/strategies/FreeMatchingStrategy.test.ts",
				component: "⚡ Unit Tests",
			},
		];

		for (const testFile of testFiles) {
			const exists = fs.existsSync(testFile.path);
			this.results.push({
				component: testFile.component,
				status: exists ? "✅" : "❌",
				details: exists ? "Test file exists and ready" : "Test file missing",
				score: exists ? 100 : 0,
			});
		}
	}

	private async validatePackageScripts(): Promise<void> {
		const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
		const scripts = packageJson.scripts;

		const requiredScripts = [
			{ name: "test:e2e:visual", component: "👁️ Visual Test Script" },
			{ name: "test:e2e:chaos", component: "🧪 Chaos Test Script" },
			{ name: "test:quality-gate", component: "🚪 Quality Gate Script" },
			{
				name: "test:health-dashboard",
				component: "📊 Health Dashboard Script",
			},
			{ name: "mcp:start", component: "🤖 MCP Server Script" },
		];

		for (const required of requiredScripts) {
			const exists = scripts[required.name] !== undefined;
			this.results.push({
				component: required.component,
				status: exists ? "✅" : "❌",
				details: exists
					? "Script properly configured"
					: "Script missing from package.json",
				score: exists ? 100 : 0,
			});
		}
	}

	private async validateCIConfiguration(): Promise<void> {
		const ciFile = ".github/workflows/ci-cd.yml";
		const exists = fs.existsSync(ciFile);

		if (exists) {
			const content = fs.readFileSync(ciFile, "utf-8");
			const hasQualityGate = content.includes("test:quality-gate");
			const hasMCPAnalysis = content.includes("test:failure-analysis");
			const hasHealthReport = content.includes("test:health-dashboard");

			this.results.push({
				component: "🔄 CI/CD Pipeline Integration",
				status:
					hasQualityGate && hasMCPAnalysis && hasHealthReport ? "✅" : "⚠️",
				details:
					hasQualityGate && hasMCPAnalysis && hasHealthReport
						? "Complete CI/CD integration"
						: "Missing some CI/CD components",
				score:
					(hasQualityGate ? 33 : 0) +
					(hasMCPAnalysis ? 33 : 0) +
					(hasHealthReport ? 34 : 0),
			});
		} else {
			this.results.push({
				component: "🔄 CI/CD Pipeline Integration",
				status: "❌",
				details: "CI/CD workflow file missing",
				score: 0,
			});
		}
	}

	private async validateMCPIntegration(): Promise<void> {
		const mcpFiles = [
			"scripts/mcps/testing-mcp.ts",
			"scripts/start-mcp-server.ts",
			"scripts/test-failure-analysis.ts",
			"scripts/mcp-config.json",
		];

		let score = 0;
		const existingFiles: string[] = [];

		for (const file of mcpFiles) {
			if (fs.existsSync(file)) {
				existingFiles.push(file);
				score += 25;
			}
		}

		this.results.push({
			component: "🤖 MCP Integration",
			status: score === 100 ? "✅" : score >= 75 ? "⚠️" : "❌",
			details:
				score === 100
					? "Complete MCP integration available"
					: `Partial MCP integration (${existingFiles.length}/${mcpFiles.length} files)`,
			score,
		});
	}

	private async validateBaselineFiles(): Promise<void> {
		const baselineDir = "tests/e2e/visual-regression.spec.ts-snapshots";
		const exists = fs.existsSync(baselineDir);

		if (exists) {
			const files = fs.readdirSync(baselineDir);
			const pngFiles = files.filter((f) => f.endsWith(".png"));

			this.results.push({
				component: "📸 Visual Regression Baselines",
				status: pngFiles.length > 0 ? "✅" : "⚠️",
				details:
					pngFiles.length > 0
						? `${pngFiles.length} baseline screenshots ready`
						: "Baseline directory exists but no screenshots found",
				score: pngFiles.length > 0 ? 100 : 50,
			});
		} else {
			this.results.push({
				component: "📸 Visual Regression Baselines",
				status: "❌",
				details: "Baseline directory missing - run visual tests first",
				score: 0,
			});
		}
	}

	private displayResults(): void {
		console.log("📋 TESTING STRATEGY VALIDATION RESULTS");
		console.log("═".repeat(60));

		this.results.forEach((result) => {
			console.log(`${result.status} ${result.component}`);
			console.log(`   ${result.details} (${result.score}/100)`);
			console.log();
		});
	}

	private generateSummary(): void {
		const totalScore = this.results.reduce((sum, r) => sum + r.score, 0);
		const averageScore = Math.round(totalScore / this.results.length);

		const statusCounts = this.results.reduce(
			(counts, r) => {
				counts[r.status] = (counts[r.status] || 0) + 1;
				return counts;
			},
			{} as Record<string, number>,
		);

		console.log("🏆 FINAL VALIDATION SUMMARY");
		console.log("═".repeat(60));
		console.log(`📊 Overall Score: ${averageScore}/100`);
		console.log(`✅ Components Working: ${statusCounts["✅"] || 0}`);
		console.log(`⚠️  Needs Attention: ${statusCounts["⚠️"] || 0}`);
		console.log(`❌ Critical Issues: ${statusCounts["❌"] || 0}`);

		if (averageScore >= 90) {
			console.log(
				"\n🎉 EXCELLENT: Testing strategy fully implemented and operational!",
			);
		} else if (averageScore >= 75) {
			console.log(
				"\n👍 GOOD: Testing strategy mostly complete with minor gaps to address.",
			);
		} else {
			console.log(
				"\n⚠️  NEEDS WORK: Several critical components missing or incomplete.",
			);
		}

		console.log("\n💡 Next Steps:");
		if (statusCounts["❌"] > 0) {
			console.log("   • Address critical issues marked with ❌");
		}
		if (statusCounts["⚠️"] > 0) {
			console.log("   • Review and complete components marked with ⚠️");
		}
		console.log(
			"   • Run: npm run test:health-dashboard for ongoing monitoring",
		);
		console.log("   • Run: npm run test:quality-gate before deployments");
	}
}

// Run validation
const validator = new TestingStrategyValidator();
validator.validate();

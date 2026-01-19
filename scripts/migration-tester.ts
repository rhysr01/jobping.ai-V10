#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

interface MigrationTest {
	name: string;
	description: string;
	beforeMigration?: () => Promise<any>;
	afterMigration: () => Promise<any>;
	expectedResult: any;
	tolerance?: number; // For numeric comparisons
}

interface TestResult {
	testName: string;
	status: "passed" | "failed" | "error";
	actualResult?: any;
	expectedResult?: any;
	error?: string;
	duration: number;
}

class MigrationTester {
	private pgClient: Client;
	private results: TestResult[] = [];

	constructor() {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error("❌ Missing Supabase environment variables");
		}

		this.supabase = createClient(supabaseUrl, supabaseKey);

		const projectRef = supabaseUrl
			.replace("https://", "")
			.replace(".supabase.co", "");
		const dbUrl = `postgresql://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

		this.pgClient = new Client({
			connectionString: dbUrl,
			ssl: { rejectUnauthorized: false },
		});
	}

	async initialize() {
		await this.pgClient.connect();
	}

	private getTests(): MigrationTest[] {
		return [
			{
				name: "Job Board Filtering Effectiveness",
				description: "Verify that job board companies are properly filtered",
				afterMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM jobs
            WHERE company IN ('Reed', 'Indeed', 'Google', 'StepStone')
            AND is_active = true
          `);
					return parseInt(result.rows[0].count, 10);
				},
				expectedResult: 0,
			},

			{
				name: "CEO Role Filtering",
				description: "Ensure CEO and executive roles are filtered out",
				afterMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM jobs
            WHERE LOWER(title) LIKE '%ceo%'
            AND is_active = true
          `);
					return parseInt(result.rows[0].count, 10);
				},
				expectedResult: 0,
				tolerance: 2, // Allow small number for edge cases
			},

			{
				name: "Data Quality: Company Names",
				description: "Check that company_name field is populated",
				beforeMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM jobs
            WHERE company_name IS NULL AND company IS NOT NULL
            AND is_active = true
          `);
					return parseInt(result.rows[0].count, 10);
				},
				afterMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM jobs
            WHERE company_name IS NULL AND company IS NOT NULL
            AND is_active = true
          `);
					return parseInt(result.rows[0].count, 10);
				},
				expectedResult: 0,
			},

			{
				name: "RLS Security Enabled",
				description: "Verify Row Level Security is enabled on critical tables",
				afterMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename IN ('free_signups_analytics', 'analytics_events')
            AND rowsecurity = true
          `);
					return parseInt(result.rows[0].count, 10);
				},
				expectedResult: 2, // Both tables should have RLS enabled
			},

			{
				name: "Active Jobs Count",
				description: "Ensure reasonable number of active jobs remain",
				afterMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM jobs WHERE is_active = true
          `);
					return parseInt(result.rows[0].count, 10);
				},
				expectedResult: 900,
				tolerance: 200, // Allow for variation in job counts
			},

			{
				name: "No Duplicate Categories",
				description: "Check for jobs with invalid category arrays",
				afterMigration: async () => {
					const result = await this.pgClient.query(`
            SELECT COUNT(*) as count FROM jobs
            WHERE categories IS NOT NULL
            AND array_length(categories, 1) > 10  -- Unreasonably long array
          `);
					return parseInt(result.rows[0].count, 10);
				},
				expectedResult: 0,
			},
		];
	}

	private async runTest(test: MigrationTest): Promise<TestResult> {
		const startTime = performance.now();

		try {
			console.log(`🧪 Running test: ${test.name}`);

			let _beforeResult: any;
			if (test.beforeMigration) {
				_beforeResult = await test.beforeMigration();
			}

			const afterResult = await test.afterMigration();
			const duration = performance.now() - startTime;

			// Compare results
			let status: "passed" | "failed" = "passed";

			if (typeof test.expectedResult === "number" && test.tolerance) {
				// Numeric comparison with tolerance
				const diff = Math.abs(afterResult - test.expectedResult);
				if (diff > test.tolerance) {
					status = "failed";
				}
			} else if (afterResult !== test.expectedResult) {
				status = "failed";
			}

			console.log(
				`   ${status === "passed" ? "✅" : "❌"} ${test.name}: ${afterResult}`,
			);

			return {
				testName: test.name,
				status,
				actualResult: afterResult,
				expectedResult: test.expectedResult,
				duration,
			};
		} catch (error: any) {
			const duration = performance.now() - startTime;
			console.error(`   💥 Error in ${test.name}: ${error.message}`);

			return {
				testName: test.name,
				status: "error",
				error: error.message,
				duration,
			};
		}
	}

	async runTests(): Promise<void> {
		console.log("🧪 Migration Testing Suite");
		console.log("=========================");
		console.log(`Started at: ${new Date().toISOString()}`);
		console.log("");

		const tests = this.getTests();

		for (const test of tests) {
			const result = await this.runTest(test);
			this.results.push(result);
		}

		this.generateReport();
	}

	private generateReport() {
		console.log("\\n📊 Test Results Summary");
		console.log("=======================");

		const passed = this.results.filter((r) => r.status === "passed").length;
		const failed = this.results.filter((r) => r.status === "failed").length;
		const errors = this.results.filter((r) => r.status === "error").length;
		const total = this.results.length;

		console.log(`Total tests: ${total}`);
		console.log(`✅ Passed: ${passed}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`💥 Errors: ${errors}`);

		const successRate = ((passed / total) * 100).toFixed(1);
		console.log(`Success rate: ${successRate}%`);

		if (failed > 0) {
			console.log("\\n❌ Failed Tests:");
			this.results
				.filter((r) => r.status === "failed")
				.forEach((result) => {
					console.log(`   • ${result.testName}`);
					console.log(
						`     Expected: ${result.expectedResult}, Got: ${result.actualResult}`,
					);
				});
		}

		if (errors > 0) {
			console.log("\\n💥 Test Errors:");
			this.results
				.filter((r) => r.status === "error")
				.forEach((result) => {
					console.log(`   • ${result.testName}: ${result.error}`);
				});
		}

		console.log("\\n🎯 Recommendations:");
		if (failed === 0 && errors === 0) {
			console.log("   ✅ All tests passed! Migration quality is excellent.");
		} else if (failed > 0) {
			console.log("   ⚠️  Some tests failed. Review migration logic.");
		} else {
			console.log("   🚨 Test errors occurred. Check database connectivity.");
		}

		console.log("\\n💡 Test Coverage:");
		console.log("   • Job filtering effectiveness");
		console.log("   • Data quality improvements");
		console.log("   • Security configuration");
		console.log("   • Database integrity");
	}

	async close() {
		await this.pgClient.end();
	}
}

async function main() {
	const tester = new MigrationTester();

	try {
		await tester.initialize();
		await tester.runTests();
	} catch (error: any) {
		console.error("💥 Fatal error:", error.message);
		process.exit(1);
	} finally {
		await tester.close();
	}
}

if (require.main === module) {
	main();
}

export { MigrationTester };

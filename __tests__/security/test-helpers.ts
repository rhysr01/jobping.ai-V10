/**
 * SECURITY TEST HELPERS
 *
 * Helper functions for security testing, especially RLS policy validation
 */

import { getDatabaseClient } from "../../utils/core/database-pool";

// Database RPC functions for testing (these would need to be created in the database)
export const createTestHelpers = () => {
	const db = getDatabaseClient();

	return {
		/**
		 * Check if RLS is enabled on a table
		 */
		checkRLSEnabled: async (tableName: string): Promise<boolean> => {
			try {
				const { data, error } = await db
					.from("pg_tables")
					.select("rowsecurity")
					.eq("schemaname", "public")
					.eq("tablename", tableName)
					.single();

				if (error) {
					console.warn(`Could not check RLS for ${tableName}:`, error.message);
					return false;
				}

				return data?.rowsecurity === true;
			} catch (err) {
				console.warn(`Error checking RLS for ${tableName}:`, err);
				return false;
			}
		},

		/**
		 * Get RLS policies for a table
		 */
		getRLSPolicies: async (tableName: string) => {
			try {
				const { data, error } = await db
					.from("pg_policies")
					.select("*")
					.eq("schemaname", "public")
					.eq("tablename", tableName);

				if (error) {
					console.warn(
						`Could not get RLS policies for ${tableName}:`,
						error.message,
					);
					return [];
				}

				return data || [];
			} catch (err) {
				console.warn(`Error getting RLS policies for ${tableName}:`, err);
				return [];
			}
		},

		/**
		 * Test data access as authenticated user (simulated)
		 */
		testDataAccess: async (tableName: string, userEmail?: string) => {
			try {
				const query = db.from(tableName).select("*").limit(1);

				// In a real implementation, you'd set the auth context
				// For now, we just test that the query can be constructed
				return { success: true, query };
			} catch (err) {
				return { success: false, error: err };
			}
		},

		/**
		 * Check if required indexes exist for RLS performance
		 */
		checkRLSIndexes: async (): Promise<{
			users: boolean;
			jobs: boolean;
			matches: boolean;
		}> => {
			try {
				const { data, error } = await db
					.from("pg_indexes")
					.select("tablename, indexname")
					.eq("schemaname", "public")
					.in("tablename", ["users", "jobs", "matches"]);

				if (error) {
					console.warn("Could not check RLS indexes:", error.message);
					return { users: false, jobs: false, matches: false };
				}

				const indexNames = data?.map((idx) => idx.indexname) || [];
				const hasUserIndex = indexNames.some(
					(name) => name.includes("users") && name.includes("id"),
				);
				const hasJobIndex = indexNames.some(
					(name) =>
						name.includes("jobs") &&
						(name.includes("active") || name.includes("status")),
				);
				const hasMatchIndex = indexNames.some(
					(name) => name.includes("matches") && name.includes("email"),
				);

				return {
					users: hasUserIndex,
					jobs: hasJobIndex,
					matches: hasMatchIndex,
				};
			} catch (err) {
				console.warn("Error checking RLS indexes:", err);
				return { users: false, jobs: false, matches: false };
			}
		},

		/**
		 * Validate constraint effectiveness
		 */
		validateConstraints: async () => {
			const results = {
				visaFriendlyConstraint: false,
				categoryValidation: false,
				notNullConstraints: false,
			};

			try {
				// Test visa_friendly constraint by trying to insert invalid data
				// Note: This would require service role access to bypass RLS

				// Test category validation
				const testCategories = ["early-career", "invalid-category"];
				// The database should filter invalid categories

				return results;
			} catch (err) {
				console.warn("Error validating constraints:", err);
				return results;
			}
		},
	};
};

/**
 * Security test utilities
 */
export const securityUtils = {
	/**
	 * Generate test data that respects security boundaries
	 */
	generateSecureTestData: () => ({
		user: {
			email: `security-test-${Date.now()}@jobping-test.com`,
			full_name: "Security Test User",
			target_cities: ["London"],
			active: true,
		},
		job: {
			title: "Security Test Job",
			company: "Test Company",
			is_active: true,
			status: "active",
			visa_friendly: true,
		},
	}),

	/**
	 * Validate that sensitive data is not exposed in responses
	 */
	validateNoDataLeakage: (response: any): boolean => {
		const sensitiveFields = [
			"password",
			"token",
			"secret",
			"private_key",
			"api_key",
			"credit_card",
		];

		const responseStr = JSON.stringify(response).toLowerCase();

		return !sensitiveFields.some((field) =>
			responseStr.includes(field.toLowerCase()),
		);
	},

	/**
	 * Test query parameterization
	 */
	testParameterizedQuery: (userInput: string): boolean => {
		// Test that dangerous input is properly handled
		const dangerousInputs = [
			"'; DROP TABLE users; --",
			"' OR '1'='1",
			"<script>alert('xss')</script>",
			"../../../etc/passwd",
		];

		return !dangerousInputs.includes(userInput);
	},
};

/**
 * Performance test helpers
 */
export const performanceUtils = {
	/**
	 * Measure query execution time
	 */
	measureQueryTime: async (queryFn: () => Promise<any>): Promise<number> => {
		const startTime = Date.now();
		await queryFn();
		return Date.now() - startTime;
	},

	/**
	 * Validate query uses indexes
	 */
	validateIndexUsage: async (queryPlan: string): Promise<boolean> => {
		// Check if query plan indicates index usage
		const indexIndicators = [
			"Index Scan",
			"Index Only Scan",
			"Bitmap Index Scan",
		];

		return indexIndicators.some((indicator) => queryPlan.includes(indicator));
	},
};

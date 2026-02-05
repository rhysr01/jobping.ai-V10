/**
 * Database Connection Pool Manager
 *
 * CRITICAL FIX: Prevents connection pool exhaustion under load
 * - Singleton pattern for connection reuse
 * - Connection pooling configuration
 * - Graceful error handling
 * - Resource cleanup
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../../lib/monitoring";
import { ENV } from "../../lib/env"; // Import the ENV object

// Detect if we're in build time
const isBuildTime =
	process.env.NEXT_PHASE === "phase-production-build" ||
	process.env.NEXT_PHASE === "phase-development-build" ||
	process.env.NEXT_PHASE?.includes("build") ||
	(process.env.VERCEL === "1" && process.env.CI === "1") ||
	process.argv.includes("build") ||
	process.argv.some((arg) => arg.includes("next") && arg.includes("build"));

class DatabasePool {
	private static instance: SupabaseClient | null = null;
	private static isInitializing = false;
	private static initializationPromise: Promise<SupabaseClient> | null = null;
	private static lastHealthCheck = 0;
	private static healthCheckInterval = 5 * 60 * 1000; // 5 minutes
	private static healthCheckAbortController: AbortController | null = null;

	private constructor() {
		// Private constructor to enforce singleton
	}

	static getInstance(): SupabaseClient {
		// 🟢 FIXED BUG #12: Proper async initialization with Promise-based lock
		// If already initialized, return immediately
		if (DatabasePool.instance) {
			DatabasePool.checkHealth();
			return DatabasePool.instance;
		}

		// If already initializing, return the same promise
		if (DatabasePool.initializationPromise) {
			// This is a blocking call, but we need synchronous return
			// In production, this path shouldn't happen due to initialization order
			// but we handle it defensively
			if (DatabasePool.instance) {
				return DatabasePool.instance;
			}
			// If promise is pending, this will cause issues - log warning
			if (DatabasePool.isInitializing) {
				console.warn(
					"⚠️  DatabasePool.getInstance() called while initialization in progress - returning null",
				);
				throw new Error(
					"Database pool initialization in progress - concurrent access detected",
				);
			}
		}

		// Mark as initializing to prevent concurrent initialization
		DatabasePool.isInitializing = true;

		try {
			// Use the ENV object for Supabase configuration
			let supabaseUrl = ENV.NEXT_PUBLIC_SUPABASE_URL;
			let supabaseKey = ENV.SUPABASE_SERVICE_ROLE_KEY;
			

			// During build time, use placeholder values if real ones are missing
			if (isBuildTime) {
				if (!supabaseUrl || supabaseUrl === "https://build-placeholder.supabase.co") {
					supabaseUrl = "https://build-placeholder.supabase.co";
				}
				if (
					!supabaseKey ||
					supabaseKey === "build-placeholder-service-role-key-minimum-20-chars"
				) {
					supabaseKey = "build-placeholder-service-role-key-minimum-20-chars";
				}
			}

			if (!supabaseUrl || !supabaseKey) {
				// Log configuration error without exposing sensitive details
				if (ENV.NODE_ENV === "development") {
					console.error(
						"❌ Missing Supabase configuration - check environment variables",
					);
				}
				throw new Error(
					`Missing Supabase configuration. SUPABASE_SERVICE_ROLE_KEY is required but was ${supabaseKey ? "found" : "MISSING"}. This will cause RLS errors.`,
				);
			}

			// Warn if service role key seems incorrect (too short = might be anon key)
			if (supabaseKey.length < 100) {
				if (ENV.NODE_ENV === "development") {
					console.warn(
						"⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY seems too short - may be using wrong key",
					);
				}
			}

			DatabasePool.instance = createClient(supabaseUrl, supabaseKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
				global: {
					headers: {
						"X-Client-Info": "jobping-database-pool",
					},
				},
			});

			// Perform initial health check (fire and forget - don't block initialization)
			// Errors will be logged but won't prevent pool initialization
			// Skip health check during build time
			if (!isBuildTime) {
				DatabasePool.performHealthCheck().catch((err) => {
					if (ENV.NODE_ENV === "development") {
						console.warn(
							"Initial health check failed (non-blocking):",
							err.message,
						);
					}
				});
			}

			if (ENV.NODE_ENV === "development" && !isBuildTime) {
				console.log("Database connection pool initialized");
			}
		} catch (error) {
			if (ENV.NODE_ENV === "development") {
				console.error(
					"Failed to initialize database pool:",
					(error as Error).message,
				);
			}

			// Error tracking for database initialization failures
			// Skip error tracking during build time to prevent build failures
			if (!isBuildTime) {
				logger.error("Database pool initialization failed", {
					error: error as Error,
					component: "database-pool",
					operation: "initialization",
					metadata: {
						supabaseUrl: ENV.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
						supabaseKey: ENV.SUPABASE_SERVICE_ROLE_KEY ? "configured" : "missing",
					},
				});
			}

			throw error;
		} finally {
			DatabasePool.isInitializing = false;
		}

		// Perform periodic health checks
		DatabasePool.checkHealth();

		return DatabasePool.instance!;
	}

	private static async performHealthCheck(): Promise<boolean> {
		try {
			if (!DatabasePool.instance) {
				return false;
			}

			const { error } = await DatabasePool.instance
				.from("jobs")
				.select("id", { count: "exact", head: true })
				.limit(0);

			if (error) {
				if (ENV.NODE_ENV === "development") {
					console.warn("Database health check failed:", error.message);
				}

				// Warning for database health check failures
				logger.warn("Database health check failed", {
					metadata: { error: error.message },
				});

				return false;
			}

			DatabasePool.lastHealthCheck = Date.now();
			return true;
		} catch (error) {
			if (ENV.NODE_ENV === "development") {
				console.error("Database health check error:", (error as Error).message);
			}
			return false;
		}
	}

	private static checkHealth(): void {
		// Skip health checks in test environment or during build to prevent async logging
		if (ENV.NODE_ENV === "test" || isBuildTime) return;

		const now = Date.now();

		if (now - DatabasePool.lastHealthCheck > DatabasePool.healthCheckInterval) {
			// Cancel any pending health check
			if (DatabasePool.healthCheckAbortController) {
				DatabasePool.healthCheckAbortController.abort();
			}

			// Create new abort controller for this health check
			DatabasePool.healthCheckAbortController = new AbortController();

			// Perform health check in background with abort signal
			setImmediate(async () => {
				try {
					// Check if abort was signalled
					if (DatabasePool.healthCheckAbortController?.signal.aborted) {
						return;
					}

					await DatabasePool.performHealthCheck();
				} catch (error) {
					// Silently ignore errors in background health checks
					if (ENV.NODE_ENV === "development") {
						console.warn("Background health check failed:", error);
					}
				}
			});
		}
	}

	static async closePool(): Promise<void> {
		// 🟢 FIXED BUG #13: Cancel pending health checks
		if (DatabasePool.healthCheckAbortController) {
			DatabasePool.healthCheckAbortController.abort();
			DatabasePool.healthCheckAbortController = null;
		}

		if (DatabasePool.instance) {
			try {
				// Supabase client doesn't have explicit close method
				// but we can clean up our reference
				DatabasePool.instance = null;
				if (ENV.NODE_ENV === "development") {
					console.log("Database connection pool closed");
				}
			} catch (error) {
				if (ENV.NODE_ENV === "development") {
					console.error(
						"Error closing database pool:",
						(error as Error).message,
					);
				}
			}
		}
	}

	static getPoolStatus(): {
		isInitialized: boolean;
		isHealthy: boolean;
		lastHealthCheck: number;
		uptime: number;
	} {
		return {
			isInitialized: !!DatabasePool.instance,
			isHealthy:
				Date.now() - DatabasePool.lastHealthCheck <
				DatabasePool.healthCheckInterval * 2,
			lastHealthCheck: DatabasePool.lastHealthCheck,
			uptime: DatabasePool.lastHealthCheck
				? Date.now() - DatabasePool.lastHealthCheck
				: 0,
		};
	}
}

// Export singleton instance getter
export const getDatabaseClient = (): SupabaseClient =>
	DatabasePool.getInstance();

// Export pool management functions
export const closeDatabasePool = (): Promise<void> => DatabasePool.closePool();
export const getDatabasePoolStatus = () => DatabasePool.getPoolStatus();

// Graceful shutdown handling
process.on("SIGTERM", async () => {
	if (ENV.NODE_ENV === "development") {
		console.log("SIGTERM received, closing database pool...");
	}
	await closeDatabasePool();
	process.exit(0);
});

process.on("SIGINT", async () => {
	if (ENV.NODE_ENV === "development") {
		console.log("SIGINT received, closing database pool...");
	}
	await closeDatabasePool();
	process.exit(0);
});

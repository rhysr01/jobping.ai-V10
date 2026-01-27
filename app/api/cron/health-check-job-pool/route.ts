/**
 * Monitoring Endpoint: Job Pool Health Check
 * Purpose: Track job availability & identify bottlenecks
 * Schedule: Every 6 hours
 * 
 * KISS Principles:
 * - Simple metrics: Just count jobs by city
 * - Clear thresholds: Alert if city has too few jobs
 * - Database-backed: Queries are simple and indexed
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiLogger } from "../../../../lib/api-logger";
import { getDatabaseClient } from "../../../../utils/core/database-pool";

interface CityMetrics {
	city: string;
	total_jobs: number;
	recent_7d: number;
	recent_30d: number;
	average_match_score: number;
}

interface HealthCheck {
	timestamp: string;
	total_active_jobs: number;
	cities: CityMetrics[];
	warnings: string[];
	critical_alerts: string[];
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const expectedAuth = `Bearer ${process.env.SYSTEM_API_KEY}`;

		if (authHeader !== expectedAuth && process.env.NODE_ENV === "production") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const supabase = getDatabaseClient();
		const healthCheck: HealthCheck = {
			timestamp: new Date().toISOString(),
			total_active_jobs: 0,
			cities: [],
			warnings: [],
			critical_alerts: [],
		};

		// Get total active jobs
		const { data: totalData, error: totalError } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true)
			.eq("status", "active")
			.is("filtered_reason", null);

		if (!totalError && totalData !== null) {
			healthCheck.total_active_jobs = totalData.length || 0;
		}

		// Get metrics per city (main signup locations)
		const cities = [
			"London",
			"Berlin",
			"Paris",
			"Amsterdam",
			"Barcelona",
			"Dublin",
		];
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		for (const city of cities) {
			// Total jobs for this city
			const { count: totalCount } = await supabase
				.from("jobs")
				.select("id", { count: "exact", head: true })
				.eq("is_active", true)
				.eq("status", "active")
				.is("filtered_reason", null)
				.eq("city", city);

			// Recent (7 days)
			const { count: recentSevenCount } = await supabase
				.from("jobs")
				.select("id", { count: "exact", head: true })
				.eq("is_active", true)
				.eq("status", "active")
				.is("filtered_reason", null)
				.eq("city", city)
				.gte("posted_at", sevenDaysAgo.toISOString());

			// Recent (30 days)
			const { count: recentThirtyCount } = await supabase
				.from("jobs")
				.select("id", { count: "exact", head: true })
				.eq("is_active", true)
				.eq("status", "active")
				.is("filtered_reason", null)
				.eq("city", city)
				.gte("posted_at", thirtyDaysAgo.toISOString());

			const metrics: CityMetrics = {
				city,
				total_jobs: totalCount || 0,
				recent_7d: recentSevenCount || 0,
				recent_30d: recentThirtyCount || 0,
				average_match_score: 0, // Placeholder
			};

			healthCheck.cities.push(metrics);

			// Check thresholds (KISS: simple >= / <= rules)
			// Critical: City has <100 total jobs (can't find matches)
			if (metrics.total_jobs < 100) {
				healthCheck.critical_alerts.push(
					`CRITICAL: ${city} has only ${metrics.total_jobs} jobs - signup will fail`,
				);
			}

			// Warning: City has <500 jobs for free tier
			if (metrics.total_jobs < 500) {
				healthCheck.warnings.push(
					`WARNING: ${city} has only ${metrics.total_jobs} jobs - free users may struggle`,
				);
			}

			// Warning: Few new jobs in last 7 days
			if (metrics.recent_7d < 20) {
				healthCheck.warnings.push(
					`WARNING: ${city} has only ${metrics.recent_7d} jobs in last 7 days - freshness declining`,
				);
			}
		}

		// Log health status
		apiLogger.info("Job pool health check completed", {
			totalJobs: healthCheck.total_active_jobs,
			citiesMonitored: healthCheck.cities.length,
			warningCount: healthCheck.warnings.length,
			criticalCount: healthCheck.critical_alerts.length,
		});

		// Alert if any critical issues
		if (healthCheck.critical_alerts.length > 0) {
			apiLogger.error(
				"CRITICAL: Job pool health issues detected",
				new Error("Job pool health critical"),
				{
					alerts: healthCheck.critical_alerts,
				},
			);
		}

		return NextResponse.json(healthCheck);
	} catch (error) {
		apiLogger.error("Health check failed", error as Error);

		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

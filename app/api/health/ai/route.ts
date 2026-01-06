/**
 * AI Health Check Endpoint
 * Provides detailed AI system health and performance metrics
 */

import { NextResponse } from "next/server";
import { aiMonitor } from "@/Utils/monitoring/ai-monitor";

export async function GET() {
	try {
		const healthStatus = aiMonitor.getHealthStatus();
		const historicalMetrics = aiMonitor.getHistoricalMetrics(24); // Last 24 hours

		// Calculate additional metrics
		const totalRequests = historicalMetrics.reduce((sum, m) => sum + m.requestCount, 0);
		const totalErrors = historicalMetrics.reduce((sum, m) => sum + m.errorCount, 0);
		const totalRateLimits = historicalMetrics.reduce((sum, m) => sum + m.rateLimitHits, 0);

		const response = {
			status: healthStatus.status,
			message: healthStatus.message,
			timestamp: new Date().toISOString(),
			metrics: {
				current: healthStatus.metrics ? {
					requestCount: healthStatus.metrics.requestCount,
					errorCount: healthStatus.metrics.errorCount,
					rateLimitHits: healthStatus.metrics.rateLimitHits,
					averageLatency: Math.round(healthStatus.metrics.averageLatency),
					averageTokens: Math.round(healthStatus.metrics.averageTokens),
					averageCost: Math.round(healthStatus.metrics.averageCost * 10000) / 10000,
					qualityScore: Math.round(healthStatus.metrics.qualityScore * 100) / 100,
					alertsTriggered: healthStatus.metrics.alertsTriggered,
				} : null,
				historical: {
					totalRequests,
					totalErrors,
					totalRateLimits,
					errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 1000) / 10 : 0,
					rateLimitRate: totalRequests > 0 ? Math.round((totalRateLimits / totalRequests) * 1000) / 10 : 0,
					timeWindows: historicalMetrics.length,
				}
			}
		};

		// Return appropriate HTTP status based on health
		const statusCode = healthStatus.status === "critical" ? 503 :
		                  healthStatus.status === "warning" ? 200 : 200;

		return NextResponse.json(response, { status: statusCode });

	} catch (error) {
		console.error("AI health check failed:", error);
		return NextResponse.json(
			{
				status: "error",
				message: "Health check failed",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}

/**
 * System Monitoring - SOLID Principle Implementation
 * Single Responsibility: Monitor system-level health metrics
 */

export interface SystemHealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	message: string;
	checkTime: string;
	metrics: {
		memoryUsage: number;
		uptime: number;
		responseTime: number;
	};
}

/**
 * Simple system health check
 * Single responsibility: Monitor system resources and performance
 */
export async function checkSystemHealth(): Promise<SystemHealthStatus> {
	const startTime = Date.now();

	try {
		const memUsage = process.memoryUsage();
		const uptime = process.uptime();

		// Check memory usage (heap used > 500MB is concerning)
		const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
		const isHighMemory = heapUsedMB > 500;

		// Check uptime (less than 1 hour might indicate restarts)
		const isLowUptime = uptime < 3600; // 1 hour

		const duration = Date.now() - startTime;

		let status: "healthy" | "degraded" | "unhealthy" = "healthy";
		let message = `System healthy (${Math.round(heapUsedMB)}MB memory, ${Math.round(uptime / 3600)}h uptime)`;

		if (isHighMemory) {
			status = "degraded";
			message = `High memory usage: ${Math.round(heapUsedMB)}MB`;
		}

		if (isLowUptime) {
			status = "degraded";
			message = `Recent restart detected (${Math.round(uptime / 60)}m uptime)`;
		}

		return {
			status,
			message,
			checkTime: new Date().toISOString(),
			metrics: {
				memoryUsage: Math.round(heapUsedMB),
				uptime: Math.round(uptime),
				responseTime: duration,
			},
		};
	} catch (error) {
		return {
			status: "unhealthy",
			message: `System health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			checkTime: new Date().toISOString(),
			metrics: {
				memoryUsage: 0,
				uptime: 0,
				responseTime: Date.now() - startTime,
			},
		};
	}
}
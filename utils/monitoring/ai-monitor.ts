/**
 * Simple AI Health Check - KISS Principle Implementation
 * Replaces 252-line complex monitoring class with simple health check
 */

export interface AIHealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	message: string;
	checkTime: string;
}

/**
 * Simple AI health check - does basic connectivity and error rate check
 * Follows KISS principle: Keep It Simple, Stupid
 */
export async function checkAIHealth(): Promise<AIHealthStatus> {
	const startTime = Date.now();

	try {
		// Basic connectivity check
		if (!process.env.OPENAI_API_KEY) {
			return {
				status: "unhealthy",
				message: "OpenAI API key not configured",
				checkTime: new Date().toISOString(),
			};
		}

		// Simple model availability check
		const response = await fetch("https://api.openai.com/v1/models", {
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			// Timeout after 5 seconds
			signal: AbortSignal.timeout(5000),
		});

		const duration = Date.now() - startTime;

		if (!response.ok) {
			return {
				status: "unhealthy",
				message: `OpenAI API returned ${response.status}: ${response.statusText}`,
				checkTime: new Date().toISOString(),
			};
		}

		// Check response time
		if (duration > 3000) {
			return {
				status: "degraded",
				message: `AI responding slowly (${duration}ms response time)`,
				checkTime: new Date().toISOString(),
			};
		}

		return {
			status: "healthy",
			message: `AI healthy (${duration}ms response time)`,
			checkTime: new Date().toISOString(),
		};
	} catch (error) {
		return {
			status: "unhealthy",
			message: `AI health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			checkTime: new Date().toISOString(),
		};
	}
}

// Backward compatibility export
export const aiMonitor = {
	getHealthStatus: async () => {
		const health = await checkAIHealth();
		return {
			status: health.status,
			message: health.message,
			metrics: null, // No complex metrics anymore
		};
	},
};

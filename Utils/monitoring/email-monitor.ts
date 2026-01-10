/**
 * Email Monitoring - SOLID Principle Implementation
 * Single Responsibility: Monitor email system health
 */

export interface EmailHealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	message: string;
	checkTime: string;
}

/**
 * Simple email system health check
 * Single responsibility: Check email service availability
 */
export async function checkEmailHealth(): Promise<EmailHealthStatus> {
	const startTime = Date.now();

	try {
		// Check if Resend API key is configured
		if (!process.env.RESEND_API_KEY) {
			return {
				status: "unhealthy",
				message: "Email API key not configured",
				checkTime: new Date().toISOString(),
			};
		}

		// Simple API key validation (don't actually send email)
		if (process.env.RESEND_API_KEY.length < 20) {
			return {
				status: "unhealthy",
				message: "Email API key appears invalid",
				checkTime: new Date().toISOString(),
			};
		}

		const duration = Date.now() - startTime;

		return {
			status: "healthy",
			message: `Email service configured (${duration}ms check)`,
			checkTime: new Date().toISOString(),
		};
	} catch (error) {
		return {
			status: "unhealthy",
			message: `Email health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			checkTime: new Date().toISOString(),
		};
	}
}

/**
 * Get email service metrics
 * Single responsibility: Provide email system metrics
 */
export async function getEmailMetrics(): Promise<{
	sentToday: number;
	failedToday: number;
	pendingJobs: number;
}> {
	// This would connect to database to get real metrics
	// For now, return placeholder data
	return {
		sentToday: 0,
		failedToday: 0,
		pendingJobs: 0,
	};
}
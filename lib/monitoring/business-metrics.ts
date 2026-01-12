import { logger } from "./logger";
import { performanceMonitor } from "./performance-monitor";

// Business metrics tracking - using object instead of class for better tree-shaking
export const BusinessMetrics = {
	recordJobCleanup(deleted: number, total: number, duration: number): void {
		logger.metric("jobs.cleanup.deleted", deleted, "count", {
			operation: "job-cleanup",
			component: "database",
			duration,
			metadata: { total, deletionPercentage: (deleted / total) * 100 },
		});
	},

	recordUserMatching(
		users: number,
		jobsMatched: number,
		duration: number,
	): void {
		logger.metric("users.matched", users, "count", {
			operation: "user-matching",
			component: "ai-service",
			duration,
			metadata: { jobsMatched, avgJobsPerUser: jobsMatched / users },
		});
	},

	recordEmailSent(emails: number, success: number, duration: number): void {
		logger.metric("emails.sent", emails, "count", {
			operation: "email-sending",
			component: "email-service",
			duration,
			metadata: { success, successRate: (success / emails) * 100 },
		});
	},

	recordScraperRun(
		scraper: string,
		jobsFound: number,
		duration: number,
		errors: number = 0,
	): void {
		logger.metric("scraper.jobs.found", jobsFound, "count", {
			operation: "scraper-execution",
			component: scraper,
			duration,
			metadata: { errors, successRate: errors === 0 ? 100 : 0 },
		});
	},

	recordAPICall(
		endpoint: string,
		method: string,
		statusCode: number,
		duration: number,
	): void {
		logger.metric("api.calls", 1, "count", {
			operation: "api-call",
			component: "api",
			duration,
			metadata: { endpoint, method, statusCode, success: statusCode < 400 },
		});

		performanceMonitor.recordMetric("api.latency", duration);
		const endpointKey = endpoint.replace(/\s+/g, "").replace(/[:]/g, "_");
		performanceMonitor.recordMetric(`api.latency:${endpointKey}`, duration);
	},
};
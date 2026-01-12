// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// Configuration
export const MONITORING_CONFIG = {
	logging: {
		level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
		structured: false, // Temporarily disable structured logging for Vercel debugging
		console: !isTest,
	},
	environment: process.env.NODE_ENV || "development",
	release:
		process.env.VERCEL_GIT_COMMIT_SHA ||
		process.env.npm_package_version ||
		"1.0.0",
};

export function initializeMonitoring(): void {
	// Monitoring initialized - logs go to Axiom via Vercel integration
	if (isTest) return;

	console.info("Monitoring initialized", {
		metadata: {
			environment: MONITORING_CONFIG.environment,
			release: MONITORING_CONFIG.release,
			service: "jobping",
		},
	});
}
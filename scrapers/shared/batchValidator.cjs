/**
 * Batch Validation System for JobPing Scrapers
 * 
 * Philosophy: Keep current lenient auto-fix approach (prevent job loss)
 * Enhancement: Add batch-level quality monitoring (detect degradation)
 * 
 * This monitors batch quality without rejecting jobs, allowing scrapers
 * to continue accepting partial data while alerting on concerning patterns.
 * 
 * Date: January 28, 2026
 */

const QUALITY_THRESHOLDS = {
	withDescription: 0.70,        // Alert if <70% have any description
	withDescriptionLong: 0.50,    // Alert if <50% have descriptions ≥50 chars
	withLocation: 0.95,           // Alert if <95% have city+country
	withCareerPath: 0.80,         // Alert if <80% have career path
	avgDescriptionLength: 100,    // Alert if average < 100 chars
};

/**
 * Validate batch of jobs for quality metrics
 * DOES NOT REJECT jobs - only gathers metrics
 * 
 * @param {Array} jobs - Processed jobs from processor.cjs
 * @returns {Object} - Batch validation result with stats
 */
function validateBatch(jobs) {
	if (!jobs || jobs.length === 0) {
		return {
			valid: jobs,
			invalid: [],
			stats: {
				total: 0,
				withDescription: 0,
				withDescriptionLong: 0,
				withLocation: 0,
				withCareerPath: 0,
				averageDescriptionLength: 0,
				percentWithDescription: 0,
				percentWithDescriptionLong: 0,
				percentWithLocation: 0,
				percentWithCareerPath: 0,
			},
		};
	}

	const stats = {
		total: jobs.length,
		withDescription: 0,
		withDescriptionLong: 0,
		withLocation: 0,
		withCareerPath: 0,
		averageDescriptionLength: 0,
	};

	let totalDescriptionLength = 0;

	// Analyze each job
	jobs.forEach((job) => {
		// Check description
		if (job.description && job.description.trim().length > 0) {
			stats.withDescription++;
			const descLen = job.description.length;
			totalDescriptionLength += descLen;

			if (descLen >= 50) {
				stats.withDescriptionLong++;
			}
		} else {
			// Track but don't penalize (auto-fix allows empty descriptions)
			totalDescriptionLength += 0;
		}

		// Check location
		if (job.city && job.country) {
			stats.withLocation++;
		}

		// Check career path categories
		if (job.categories && Array.isArray(job.categories) && job.categories.length > 0) {
			const hasCareerPath = job.categories.some(
				(cat) =>
					cat === "strategy-business-design" ||
					cat === "data-analytics" ||
					cat === "sales-client-success" ||
					cat === "marketing-growth" ||
					cat === "product-innovation" ||
					cat === "finance-investment" ||
					cat === "operations-supply-chain" ||
					cat === "tech-transformation" ||
					cat === "sustainability-esg",
			);
			if (hasCareerPath) {
				stats.withCareerPath++;
			}
		}
	});

	// Calculate percentages and averages
	stats.percentWithDescription = jobs.length > 0 ? (stats.withDescription / jobs.length) * 100 : 0;
	stats.percentWithDescriptionLong = jobs.length > 0 ? (stats.withDescriptionLong / jobs.length) * 100 : 0;
	stats.percentWithLocation = jobs.length > 0 ? (stats.withLocation / jobs.length) * 100 : 0;
	stats.percentWithCareerPath = jobs.length > 0 ? (stats.withCareerPath / jobs.length) * 100 : 0;
	stats.averageDescriptionLength =
		jobs.length > 0 ? Math.round(totalDescriptionLength / jobs.length) : 0;

	return {
		valid: jobs,        // ALL jobs valid (current philosophy)
		invalid: [],        // NO jobs rejected
		stats,
	};
}

/**
 * Check batch statistics against quality thresholds
 * Returns alerts for degradation, but allows batch to pass
 * 
 * @param {Object} stats - Stats from validateBatch()
 * @returns {Array} - Array of alert objects
 */
function checkThresholds(stats) {
	const alerts = [];

	if (!stats || !stats.total) {
		return alerts;
	}

	// Check description coverage
	const descPercent = stats.percentWithDescription || 0;
	if (descPercent < QUALITY_THRESHOLDS.withDescription * 100) {
		alerts.push({
			type: "LOW_DESCRIPTION_COVERAGE",
			severity: "WARNING",
			message: `Only ${descPercent.toFixed(1)}% jobs have descriptions (threshold: ${(QUALITY_THRESHOLDS.withDescription * 100).toFixed(0)}%)`,
			jobsAffected: stats.total - stats.withDescription,
		});
	}

	// Check description length
	const longDescPercent = stats.percentWithDescriptionLong || 0;
	if (longDescPercent < QUALITY_THRESHOLDS.withDescriptionLong * 100) {
		alerts.push({
			type: "SHORT_DESCRIPTIONS",
			severity: "MEDIUM",
			message: `Only ${longDescPercent.toFixed(1)}% jobs have descriptions ≥50 chars (threshold: ${(QUALITY_THRESHOLDS.withDescriptionLong * 100).toFixed(0)}%)`,
			jobsAffected: stats.withDescription - stats.withDescriptionLong,
		});
	}

	// Check location coverage
	const locPercent = stats.percentWithLocation || 0;
	if (locPercent < QUALITY_THRESHOLDS.withLocation * 100) {
		alerts.push({
			type: "INCOMPLETE_LOCATION",
			severity: "HIGH",
			message: `Only ${locPercent.toFixed(1)}% jobs have complete location (threshold: ${(QUALITY_THRESHOLDS.withLocation * 100).toFixed(0)}%)`,
			jobsAffected: stats.total - stats.withLocation,
		});
	}

	// Check career path coverage
	const careerPercent = stats.percentWithCareerPath || 0;
	if (careerPercent < QUALITY_THRESHOLDS.withCareerPath * 100) {
		alerts.push({
			type: "UNCATEGORIZED_JOBS",
			severity: "MEDIUM",
			message: `Only ${careerPercent.toFixed(1)}% jobs have career paths (threshold: ${(QUALITY_THRESHOLDS.withCareerPath * 100).toFixed(0)}%)`,
			jobsAffected: stats.total - stats.withCareerPath,
		});
	}

	// Check average description length
	const avgDescLen = stats.averageDescriptionLength || 0;
	if (avgDescLen < QUALITY_THRESHOLDS.avgDescriptionLength) {
		alerts.push({
			type: "LOW_AVG_DESCRIPTION_LENGTH",
			severity: "LOW",
			message: `Average description length ${avgDescLen} chars (threshold: ${QUALITY_THRESHOLDS.avgDescriptionLength} chars)`,
			jobsAffected: 0,
		});
	}

	return alerts;
}

/**
 * Format batch report for logging
 * 
 * @param {Object} validationResult - Result from validateBatch()
 * @param {string} scraperName - Name of scraper for context
 * @returns {string} - Formatted report
 */
function formatBatchReport(validationResult, scraperName = "Unknown") {
	const { stats } = validationResult;

	if (!stats || stats.total === 0) {
		return `[${scraperName}] 📊 Batch validation: No jobs processed`;
	}

	const report = [
		`[${scraperName}] 📊 Batch Quality Report:`,
		`   Total jobs: ${stats.total}`,
		`   With descriptions: ${stats.withDescription} (${stats.percentWithDescription.toFixed(1)}%)`,
		`   With long descriptions (≥50 chars): ${stats.withDescriptionLong} (${stats.percentWithDescriptionLong.toFixed(1)}%)`,
		`   With complete location: ${stats.withLocation} (${stats.percentWithLocation.toFixed(1)}%)`,
		`   With career paths: ${stats.withCareerPath} (${stats.percentWithCareerPath.toFixed(1)}%)`,
		`   Avg description length: ${stats.averageDescriptionLength} chars`,
	].join("\n");

	return report;
}

/**
 * Log batch quality alerts
 * 
 * @param {Array} alerts - Alerts from checkThresholds()
 * @param {string} scraperName - Name of scraper
 */
function logAlerts(alerts, scraperName = "Unknown") {
	if (!alerts || alerts.length === 0) {
		console.log(`[${scraperName}] ✅ Batch quality within thresholds`);
		return;
	}

	console.warn(`[${scraperName}] ⚠️  Batch quality alerts:`);
	alerts.forEach((alert) => {
		const severityEmoji = {
			CRITICAL: "🔴",
			HIGH: "🟠",
			MEDIUM: "🟡",
			WARNING: "🟡",
			LOW: "🔵",
		}[alert.severity] || "⚠️";

		console.warn(
			`   ${severityEmoji} [${alert.severity}] ${alert.type}: ${alert.message}`,
		);
		if (alert.jobsAffected > 0) {
			console.warn(`      Jobs affected: ${alert.jobsAffected}`);
		}
	});
}

module.exports = {
	validateBatch,
	checkThresholds,
	formatBatchReport,
	logAlerts,
	QUALITY_THRESHOLDS,
};


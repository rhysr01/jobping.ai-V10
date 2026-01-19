/**
 * Quota Manager - Pure Business Logic
 *
 * Determines when to stop scraping based on job count targets.
 * This is "Brain" logic - it makes decisions but doesn't execute anything.
 */

/**
 * Get global cycle target from environment
 * Returns 0 if no limit (run all scrapers)
 */
function getCycleJobTarget() {
	const target = process.env.SCRAPER_CYCLE_JOB_TARGET || "0";
	return parseInt(target, 10);
}

/**
 * Get per-scraper targets based on historical performance
 * These are the business rules about how many jobs each scraper should collect
 */
function getScraperTargets() {
	return {
		"jobspy-indeed": parseInt(process.env.JOBSPY_TARGET || "500", 10),
		"jobspy-internships": parseInt(
			process.env.JOBSPY_INTERNSHIPS_TARGET || "2000",
			10,
		),
		"jobspy-career-roles": parseInt(
			process.env.JOBSPY_CAREER_TARGET || "3000",
			10,
		),
		adzuna: parseInt(process.env.ADZUNA_TARGET || "500", 10),
		reed: parseInt(process.env.REED_TARGET || "200", 10),
		careerjet: parseInt(process.env.CAREERJET_TARGET || "450", 10),
		arbeitnow: parseInt(process.env.ARBEITNOW_TARGET || "400", 10),
	};
}

/**
 * Evaluate if scraping should stop based on quotas
 *
 * @param {Object} stats - Current cycle statistics with {total: number, perSource: Object}
 * @returns {boolean} true if global cycle should stop, false otherwise
 *
 * Note: Per-scraper quotas don't stop the cycle, they just indicate
 * that specific scraper has reached its target
 */
function shouldStopCycle(stats) {
	// Check global target first
	const globalTarget = getCycleJobTarget();
	if (globalTarget > 0 && stats.total >= globalTarget) {
		return true;
	}

	return false;
}

/**
 * Check if a specific scraper has reached its target
 *
 * @param {Object} stats - Current cycle statistics with {total: number, perSource: Object}
 * @param {string} scraperName - Name of scraper to check
 * @returns {boolean} true if scraper has reached its quota
 */
function hasScraperReachedTarget(stats, scraperName) {
	const targets = getScraperTargets();
	const target = targets[scraperName];
	const current = stats.perSource[scraperName] || 0;

	if (target && target > 0 && current >= target) {
		return true;
	}
	return false;
}

module.exports = {
	getCycleJobTarget,
	getScraperTargets,
	shouldStopCycle,
	hasScraperReachedTarget,
};

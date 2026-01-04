/**
 * Target Resolver - Pure Business Logic
 * 
 * Resolves user preferences into scraping targets.
 * This is "Brain" logic - it decides WHAT to scrape, not HOW.
 */

/**
 * Parse JSON environment variable
 * Helper for environment variable overrides
 */
function parseJsonEnv(value) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) {
			return parsed
				.map((item) => (typeof item === "string" ? item.trim() : ""))
				.filter(Boolean);
		}
		return [];
	} catch {
		return [];
	}
}

/**
 * Resolve user preferences into scraping targets
 * 
 * @param {Array} users - Array of user preferences from database
 * @returns {Object} Aggregated scraping targets with {cities, careerPaths, industries, roles}
 * 
 * Business Rules:
 * - Combines all active user preferences
 * - Respects environment variable overrides
 * - Returns empty arrays if no preferences (scrapers use defaults)
 */
function resolveTargets(users) {
	// Start with environment overrides (highest priority)
	const citySet = new Set(parseJsonEnv(process.env.TARGET_CITIES_OVERRIDE));
	const careerSet = new Set(
		parseJsonEnv(process.env.TARGET_CAREER_PATHS_OVERRIDE),
	);
	const industrySet = new Set(
		parseJsonEnv(process.env.TARGET_INDUSTRIES_OVERRIDE),
	);
	const roleSet = new Set(parseJsonEnv(process.env.TARGET_ROLES_OVERRIDE));

	// Aggregate from user preferences
	(users || []).forEach((user) => {
		if (Array.isArray(user?.target_cities)) {
			user.target_cities.forEach((city) => {
				if (typeof city === "string" && city.trim()) {
					citySet.add(city.trim());
				}
			});
		}

		if (user?.career_path && typeof user.career_path === "string") {
			careerSet.add(user.career_path.trim());
		}

		if (Array.isArray(user?.industries)) {
			user.industries.forEach((industry) => {
				if (typeof industry === "string" && industry.trim()) {
					industrySet.add(industry.trim());
				}
			});
		}

		if (Array.isArray(user?.roles_selected)) {
			user.roles_selected.forEach((role) => {
				if (typeof role === "string" && role.trim()) {
					roleSet.add(role.trim());
				}
			});
		}
	});

	return {
		cities: Array.from(citySet),
		careerPaths: Array.from(careerSet),
		industries: Array.from(industrySet),
		roles: Array.from(roleSet),
	};
}

module.exports = {
	resolveTargets,
	parseJsonEnv, // Export for backwards compatibility if needed
};


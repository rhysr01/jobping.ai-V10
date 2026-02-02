/**
 * Salary Extraction Utility
 *
 * Extracts salary information from job titles and descriptions
 * Supports multiple currency formats and patterns
 *
 * Features:
 * - Salary range extraction (min-max)
 * - Currency detection (EUR, GBP, USD, CHF, etc.)
 * - Frequency parsing (hourly, monthly, annual)
 * - Multiple format support (15,000 | 15k | €15,000 etc)
 */

// Common salary patterns by region
const SALARY_PATTERNS = {
	// EUR patterns (most common in European market)
	EUR: [
		/€\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:€?\s*)?(\d+[\s,.]?\d*)[kK]?/i,
		/EUR\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:EUR\s*)?(\d+[\s,.]?\d*)[kK]?/i,
		/(\d+[\s,.]?\d*)[kK]?\s*(?:to|€|EUR)[\s-–]*(\d+[\s,.]?\d*)[kK]?\s*(?:€|EUR)?/i,
	],
	// GBP patterns (UK market)
	GBP: [
		/£\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:£?\s*)?(\d+[\s,.]?\d*)[kK]?/i,
		/GBP\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:GBP\s*)?(\d+[\s,.]?\d*)[kK]?/i,
	],
	// USD patterns
	USD: [
		/\$\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:\$?\s*)?(\d+[\s,.]?\d*)[kK]?/i,
		/USD\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:USD\s*)?(\d+[\s,.]?\d*)[kK]?/i,
	],
	// CHF patterns (Switzerland)
	CHF: [/CHF\s*(\d+[\s,.]?\d*)[kK]?[\s-–]*(?:CHF\s*)?(\d+[\s,.]?\d*)[kK]?/i],
};

// Frequency keywords
const FREQUENCY = {
	annual: ["per year", "per annum", "yearly", "/year", "p.a.", "annual"],
	monthly: ["per month", "monthly", "/month"],
	hourly: ["per hour", "hourly", "/hour"],
};

/**
 * Extract salary range from job title and description
 *
 * @param {string} title - Job title
 * @param {string} description - Job description
 * @returns {Object} {min: number, max: number, currency: string, frequency: string}
 */
function extractSalary(title = "", description = "") {
	if (!title && !description) return null;

	const text = `${title} ${description}`.toLowerCase();

	// Try each currency pattern
	for (const [currency, patterns] of Object.entries(SALARY_PATTERNS)) {
		for (const pattern of patterns) {
			const match = text.match(pattern);
			if (match && match[1] && match[2]) {
				let min = parseFloat(match[1].replace(/[\s,]/g, ""));
				let max = parseFloat(match[2].replace(/[\s,]/g, ""));

				// Handle 'k' multiplier (thousands)
				if (match[1].includes("k")) min *= 1000;
				if (match[2].includes("k")) max *= 1000;

				// Ensure min < max
				if (min > max) [min, max] = [max, min];

				// Determine frequency
				let frequency = "annual"; // default
				for (const [freq, keywords] of Object.entries(FREQUENCY)) {
					if (keywords.some((kw) => text.includes(kw))) {
						frequency = freq;
						break;
					}
				}

				return {
					min,
					max,
					currency,
					frequency,
				};
			}
		}
	}

	return null;
}

/**
 * Detect currency from text
 *
 * @param {string} text - Text to analyze
 * @returns {string} Currency code (EUR, GBP, USD, CHF)
 */
function detectCurrency(text) {
	const lowerText = text.toLowerCase();

	if (lowerText.includes("£") || lowerText.includes("gbp")) return "GBP";
	if (lowerText.includes("$") || lowerText.includes("usd")) return "USD";
	if (lowerText.includes("chf")) return "CHF";

	// Default to EUR for European market
	return "EUR";
}

/**
 * Normalize salary to annual if different frequency
 *
 * @param {number} salary - Salary amount
 * @param {string} frequency - 'annual', 'monthly', or 'hourly'
 * @returns {number} Annualized salary
 */
function normalizeToAnnual(salary, frequency) {
	if (frequency === "monthly") {
		return salary * 12;
	} else if (frequency === "hourly") {
		// Assume 40 hours/week, 52 weeks/year
		return salary * 40 * 52;
	}
	return salary;
}

/**
 * Parse salary string with various formats
 * Examples: "15k", "15,000", "15k-20k", "€15,000-€20,000"
 *
 * @param {string} salaryStr - Salary string
 * @returns {Array} [min, max] or null
 */
function parseSalaryAmount(salaryStr) {
	if (!salaryStr) return null;

	const clean = salaryStr.replace(/[^0-9kK,.\s-–]/g, "").trim();

	const parts = clean.split(/[-–]/);
	if (parts.length < 2) return null;

	let min = parseFloat(parts[0].replace(/[^0-9.]/g, ""));
	let max = parseFloat(parts[1].replace(/[^0-9.]/g, ""));

	// Apply 'k' multiplier if present
	if (parts[0].includes("k")) min *= 1000;
	if (parts[1].includes("k")) max *= 1000;

	if (isNaN(min) || isNaN(max)) return null;

	return [min, max];
}

/**
 * Extract all salary-related data
 *
 * @param {string} title - Job title
 * @param {string} description - Job description
 * @returns {Object} Complete salary data
 */
function extractCompleteSalaryData(title = "", description = "") {
	const salaryData = extractSalary(title, description);

	if (!salaryData) {
		return {
			salary_min: null,
			salary_max: null,
			salary_currency: "EUR", // default
			salary_frequency: null,
		};
	}

	// Convert frequency to annual if needed
	const annualMin = normalizeToAnnual(salaryData.min, salaryData.frequency);
	const annualMax = normalizeToAnnual(salaryData.max, salaryData.frequency);

	return {
		salary_min: Math.round(annualMin),
		salary_max: Math.round(annualMax),
		salary_currency: salaryData.currency,
		salary_frequency: salaryData.frequency,
	};
}

module.exports = {
	extractSalary,
	extractCompleteSalaryData,
	detectCurrency,
	normalizeToAnnual,
	parseSalaryAmount,
	SALARY_PATTERNS,
	FREQUENCY,
};

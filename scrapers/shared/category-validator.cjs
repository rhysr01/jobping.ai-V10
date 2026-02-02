/**
 * Category Validator
 * Ensures job categories match exactly with signup form CAREER_PATHS
 *
 * Valid categories (from components/signup/constants.ts):
 * - strategy-business-design
 * - data-analytics
 * - sales-client-success
 * - marketing-growth
 * - finance-investment
 * - operations-supply-chain
 * - product-innovation
 * - tech-transformation
 * - sustainability-esg
 * - unsure (fallback for general/unknown roles)
 * - early-career (flag, not a career path)
 *
 * INVALID categories (must be removed):
 * - people-hr ❌ NOT a signup form option
 * - creative-design ❌ NOT a signup form option
 * - general ❌ TOO VAGUE
 * - general-management ❌ NOT a signup form option
 * - legal-compliance ❌ NOT a signup form option
 * - all-categories ❌ INCORRECT
 */

// Valid career paths from signup form
const VALID_CATEGORIES = new Set([
	"strategy-business-design",
	"data-analytics",
	"sales-client-success",
	"marketing-growth",
	"finance-investment",
	"operations-supply-chain",
	"product-innovation",
	"tech-transformation",
	"sustainability-esg",
	"unsure",
	"early-career", // Flag, not a path
]);

// Invalid categories that must be removed
const INVALID_CATEGORIES = new Set([
	"people-hr",
	"creative-design",
	"general",
	"general-management",
	"legal-compliance",
	"all-categories",
	"legal",
	"compliance",
	"creative",
	"design",
	"hr",
	"people",
]);

/**
 * Validate and clean job categories
 * @param {string[]} categories - Array of categories from job
 * @returns {string[]} - Cleaned categories with only valid ones
 */
function validateCategories(categories) {
	if (!Array.isArray(categories) || categories.length === 0) {
		return [];
	}

	// Remove invalid categories
	const cleaned = categories.filter((cat) => {
		const lowerCat = String(cat).toLowerCase().trim();

		// Remove if in invalid set
		if (INVALID_CATEGORIES.has(lowerCat)) {
			console.warn(`[CategoryValidator] Removing invalid category: ${cat}`);
			return false;
		}

		// Keep if in valid set
		if (VALID_CATEGORIES.has(lowerCat)) {
			return true;
		}

		// Remove unknown categories
		console.warn(`[CategoryValidator] Unknown category removed: ${cat}`);
		return false;
	});

	// Map to lowercase for consistency
	return cleaned.map((cat) => String(cat).toLowerCase().trim());
}

/**
 * Map job title/description to appropriate career path
 * Fallback categorization when AI fails
 */
function mapTitleToCategory(title, description = "") {
	const text = `${title} ${description}`.toLowerCase();

	// Strategy & Business Design
	if (/\b(business|consultant|strategy|analyst|consulting)\b/.test(text)) {
		return "strategy-business-design";
	}

	// Data & Analytics
	if (/\b(data|analytics|business intelligence|bi|analyst)\b/.test(text)) {
		return "data-analytics";
	}

	// Sales & Client Success
	if (
		/\b(sales|sdr|bdr|business development|customer success|account)\b/.test(
			text,
		)
	) {
		return "sales-client-success";
	}

	// Marketing & Growth
	if (/\b(marketing|growth|content|social media|brand)\b/.test(text)) {
		return "marketing-growth";
	}

	// Finance & Investment
	if (
		/\b(finance|financial|investment|banking|audit|accountant|treasury)\b/.test(
			text,
		)
	) {
		return "finance-investment";
	}

	// Operations & Supply Chain
	if (
		/\b(operations|supply chain|logistics|procurement|inventory)\b/.test(text)
	) {
		return "operations-supply-chain";
	}

	// Product & Innovation
	if (/\b(product|pm|apm|ux|ui|design|innovation)\b/.test(text)) {
		return "product-innovation";
	}

	// Tech & Transformation
	if (
		/\b(software|engineer|developer|tech|it|cloud|devops|database)\b/.test(text)
	) {
		return "tech-transformation";
	}

	// Sustainability & ESG
	if (/\b(sustainability|esg|environmental|green|climate)\b/.test(text)) {
		return "sustainability-esg";
	}

	// Default to unsure for unknown roles
	return "unsure";
}

/**
 * Ensure categories don't contain HR-related terms
 * HR is not a valid career path - map HR roles to appropriate paths
 */
function fixHRCategories(categories) {
	return categories.map((cat) => {
		// HR shouldn't be in any category
		if (cat.includes("hr") || cat.includes("people") || cat.includes("human")) {
			// HR roles are often about recruitment, so use unsure as fallback
			return "unsure";
		}
		return cat;
	});
}

/**
 * Validate a complete job object
 */
function validateJobCategories(job) {
	let { categories = [], title = "", description = "" } = job;

	// Step 1: Remove invalid categories
	categories = validateCategories(categories);

	// Step 2: Fix any HR-related categories
	categories = fixHRCategories(categories);

	// Step 3: If no valid categories, map from title
	if (categories.length === 0) {
		const mappedCategory = mapTitleToCategory(title, description);
		categories = [mappedCategory];
	}

	// Step 4: Ensure all are valid
	categories = categories.filter((cat) => VALID_CATEGORIES.has(cat));

	// Step 5: If still empty, use unsure as fallback
	if (categories.length === 0) {
		categories = ["unsure"];
	}

	return {
		...job,
		categories,
	};
}

module.exports = {
	VALID_CATEGORIES,
	INVALID_CATEGORIES,
	validateCategories,
	mapTitleToCategory,
	fixHRCategories,
	validateJobCategories,
};

/**
 * Category Mapper - Single Source of Truth
 * CRITICAL: This must match CAREER_PATHS from components/signup/constants.ts
 *
 * Valid Career Paths (ONLY):
 * - strategy-business-design
 * - data-analytics
 * - sales-client-success
 * - marketing-growth
 * - finance-investment
 * - operations-supply-chain
 * - product-innovation
 * - tech-transformation
 * - sustainability-esg
 * - unsure (fallback for general/unknown)
 *
 * SEPARATE FLAGS (NOT categories):
 * - is_early_career: boolean (entry-level role?)
 * - is_internship: boolean (internship placement?)
 * - is_graduate: boolean (graduate program?)
 *
 */

// CRITICAL: These mappings MUST match CAREER_PATHS from components/signup/constants.ts
// Career path keywords → Valid Database category
const CATEGORY_MAP = {
	strategy: "strategy-business-design",
	finance: "finance-investment",
	sales: "sales-client-success",
	marketing: "marketing-growth",
	product: "product-innovation",
	operations: "operations-supply-chain",
	data: "data-analytics",
	tech: "tech-transformation",
	sustainability: "sustainability-esg",
	engineering: "tech-transformation",
	software: "tech-transformation",
	cloud: "tech-transformation",
	// Fallback: any unrecognized category maps to unsure
};

// INVALID category names that should NEVER exist in production
const INVALID_CATEGORIES = new Set([
	"people-hr", // ❌ NOT IN SIGNUP FORM
	"creative-design", // ❌ NOT IN SIGNUP FORM
	"legal-compliance", // ❌ NOT IN SIGNUP FORM
	"general-management", // ❌ NOT IN SIGNUP FORM
	"general", // ❌ TOO VAGUE
	"legal", // ❌ NOT IN SIGNUP FORM
	"creative", // ❌ NOT IN SIGNUP FORM
	"all-categories", // ❌ INCORRECT
	"early-career", // ❌ USE is_early_career FLAG INSTEAD
	"internship", // ❌ USE is_internship FLAG INSTEAD
	"graduate", // ❌ USE is_graduate FLAG INSTEAD
]);

// Valid categories from signup form
// NOTE: early-career, internship, graduate are NOT categories!
// They are separate boolean flags (is_early_career, is_internship, is_graduate)
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
]);

/**
 * Map a career path keyword to database category
 * @param {string} path - Career path keyword
 * @returns {string} - Database category name (always valid)
 */
function mapCategory(path) {
	if (!path) return "unsure";

	const mapped = CATEGORY_MAP[path.toLowerCase()] || null;

	// If mapped to a valid category, return it
	if (mapped && VALID_CATEGORIES.has(mapped)) {
		return mapped;
	}

	// If unmapped and it's valid, use it
	if (VALID_CATEGORIES.has(path.toLowerCase())) {
		return path.toLowerCase();
	}

	// Fallback to unsure for unknown paths
	return "unsure";
}

/**
 * Validate and fix categories array
 * - Removes all invalid categories (including early-career, internship, graduate)
 * - Ensures all categories are from VALID_CATEGORIES
 * - Never allows people-hr, creative-design, legal-compliance, general-management
 * @param {string[]} categories - Array of category names
 * @returns {string[]} - Cleaned categories array (guaranteed valid)
 */
function validateAndFixCategories(categories) {
	if (!Array.isArray(categories)) {
		return ["unsure"];
	}

	const cleaned = [];
	const seen = new Set();

	for (const cat of categories) {
		if (!cat) continue;

		const lowerCat = String(cat).toLowerCase().trim();

		// REJECT all invalid categories
		if (INVALID_CATEGORIES.has(lowerCat)) {
			console.warn(`[CategoryValidator] Removing INVALID category: "${cat}"`);
			continue;
		}

		// Accept if it's in valid set
		if (VALID_CATEGORIES.has(lowerCat)) {
			if (!seen.has(lowerCat)) {
				cleaned.push(lowerCat);
				seen.add(lowerCat);
			}
			continue;
		}

		// Try to map unknown category
		const mapped = mapCategory(cat);
		if (mapped && VALID_CATEGORIES.has(mapped) && !seen.has(mapped)) {
			cleaned.push(mapped);
			seen.add(mapped);
			continue;
		}

		// If still unknown, log warning
		console.warn(`[CategoryValidator] Unknown category skipped: "${cat}"`);
	}

	// Ensure at least one valid category exists
	if (cleaned.length === 0) {
		cleaned.push("unsure");
	}

	return cleaned;
}

/**
 * Build categories from career path keywords
 * Ensures ALL returned categories are valid
 * @param {string} path - Career path keyword
 * @param {string[]} existingCategories - Existing categories array
 * @returns {string[]} - Updated categories array (guaranteed valid)
 */
function addCategoryFromPath(path, existingCategories = []) {
	if (!path) {
		return validateAndFixCategories(existingCategories);
	}

	const mappedCategory = mapCategory(path);
	const categories = Array.isArray(existingCategories)
		? [...existingCategories]
		: ["early-career"];

	if (!categories.includes(mappedCategory)) {
		categories.push(mappedCategory);
	}

	return validateAndFixCategories(categories);
}

/**
 * Test/Debug: Check if a category is valid
 * @param {string} category - Category to check
 * @returns {boolean} - True if valid, false if invalid
 */
function isValidCategory(category) {
	return VALID_CATEGORIES.has(String(category).toLowerCase().trim());
}

module.exports = {
	CATEGORY_MAP,
	VALID_CATEGORIES,
	INVALID_CATEGORIES,
	mapCategory,
	validateAndFixCategories,
	addCategoryFromPath,
	isValidCategory,
};

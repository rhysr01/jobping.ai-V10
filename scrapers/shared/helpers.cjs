const GRADUATE_REGEX =
	/(graduate|new.?grad|recent.?graduate|campus.?hire|graduate.?scheme|graduate.?program|rotational.?program|university.?hire|college.?hire|entry.?level|junior|trainee|intern|internship|placement|analyst|assistant|fellowship|apprenticeship|apprentice|stagiaire|alternant|alternance|d[ée]butant|formation|dipl[oô]m[eé]|apprenti|poste.?d.?entr[ée]e|niveau.?d[ée]butant|praktikum|praktikant|traineeprogramm|berufseinstieg|absolvent|absolventenprogramm|ausbildung|auszubildende|werkstudent|einsteiger|becario|pr[aá]cticas|programa.?de.?graduados|reci[eé]n.?titulado|aprendiz|nivel.?inicial|puesto.?de.?entrada|j[uú]nior|formaci[oó]n.?dual|tirocinio|stagista|apprendista|apprendistato|neolaureato|formazione|inserimento.?lavorativo|stage|stagiair|starterfunctie|traineeship|afgestudeerde|leerwerkplek|instapfunctie|fresher|nyuddannet|nyutdannet|nyexaminerad|neo.?laureato|nuovo.?laureato|reci[eé]n.?graduado|nuevo.?graduado|joven.?profesional|nieuwe.?medewerker)/i;
const SENIOR_REGEX =
	/(senior|principal|director|head.?of|vp|vice\s+president|chief|executive\s+director|5\+.?years|7\+.?years|10\+.?years|experienced\s+professional|architect\b|staff\b|distinguished|managing\s+director|senioritätsniveau|chief\s+officer|cfo|cto|cio|coo)/i;
const EXPERIENCE_REGEX =
	/(proven.?track.?record|extensive.?experience|minimum.?3.?years|minimum.?5.?years|minimum.?7.?years|prior.?experience|relevant.?experience|3\+.?years|5\+.?years|7\+.?years|10\+.?years)/i;

const CAREER_PATH_KEYWORDS = {
	strategy: [
		"strategy",
		"consult",
		"business analyst",
		"transformation",
		"growth",
	],
	finance: [
		"finance",
		"financial",
		"banking",
		"investment",
		"audit",
		"account",
		"treasury",
	],
	sales: [
		"sales",
		"business development",
		"account executive",
		"sdr",
		"bdr",
		"customer success",
	],
	marketing: [
		"marketing",
		"brand",
		"growth",
		"digital",
		"content",
		"communications",
	],
	product: [
		"product manager",
		"product management",
		"product analyst",
		"product owner",
	],
	operations: [
		"operations",
		"supply chain",
		"logistics",
		"process",
		"project coordinator",
	],
	"general-management": [
		"management trainee",
		"leadership programme",
		"general management",
	],
	data: ["data", "analytics", "bi analyst", "insight", "business intelligence"],
	"people-hr": ["hr", "people", "talent", "recruit", "human resources"],
	legal: ["legal", "compliance", "paralegal", "law", "regulation"],
	sustainability: ["sustainability", "esg", "environment", "impact", "climate"],
	creative: ["design", "creative", "ux", "ui", "graphic", "copywriter"],
};

function normalizeString(value) {
	return String(value || "")
		.toLowerCase()
		.trim()
		.replace(/\s+/g, " ");
}

function classifyEarlyCareer(job) {
	const title = normalizeString(job?.title || "");
	const description = normalizeString(job?.description || "");
	const fullText = `${title} ${description}`;
	if (!fullText.trim()) return false;

	// STRONG EARLY CAREER INDICATORS: If title or description contains clear early career terms,
	// accept regardless of other content (company descriptions often mention execs)
	const strongEarlyCareerTerms =
		/(?:^|\s)(internship|intern|graduate\s+(?:programme|program|scheme|trainee)|placement|work\s+experience\s+placement|industrial\s+placement|sandwich\s+(?:course|placement)|year\s+(?:in|out)\s+industry|undergraduate\s+placement|trainee\s+programme|spring\s+intern|summer\s+intern|fall\s+intern|winter\s+intern)(?:\s|$)/i;

	if (
		strongEarlyCareerTerms.test(title) ||
		strongEarlyCareerTerms.test(description)
	) {
		return true;
	}

	// For other roles, use the standard logic: no senior/experience terms AND has graduate terms
	if (SENIOR_REGEX.test(fullText) || EXPERIENCE_REGEX.test(fullText)) {
		return false;
	}

	return GRADUATE_REGEX.test(fullText);
}

function makeJobHash(job) {
	const normalizedTitle = normalizeString(job?.title);
	const normalizedCompany = normalizeString(job?.company);
	const normalizedLocation = normalizeString(job?.location);
	const hashString = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;

	let hash = 0;
	for (let i = 0; i < hashString.length; i += 1) {
		const code = hashString.charCodeAt(i);
		hash = (hash << 5) - hash + code;
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

/**
 * Fetch full job description from job URL when API description is truncated
 * @param {string} jobUrl - The job posting URL
 * @param {string} apiDescription - The truncated description from API
 * @returns {Promise<string>} - Full description or original if fetching fails
 */
async function fetchFullJobDescription(jobUrl, apiDescription = "") {
	if (!jobUrl || typeof jobUrl !== "string") {
		return apiDescription;
	}

	// Skip if description is already long enough (at least 200 characters)
	if (apiDescription && apiDescription.length > 200) {
		return apiDescription;
	}

	// Skip if URL contains common job board domains that block scraping
	const blockedDomains = [
		"indeed.com",
		"linkedin.com",
		"glassdoor.com",
		"monster.com",
		"ziprecruiter.com",
		"careerjet.com",
		"reed.co.uk",
		"adzuna.co.uk",
		"totaljobs.com",
		"jooble.org",
		"arbeitnow.com",
	];

	try {
		const url = new URL(jobUrl);
		if (blockedDomains.some((domain) => url.hostname.includes(domain))) {
			return apiDescription;
		}
	} catch {
		return apiDescription;
	}

	try {
		const response = await fetch(jobUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; JobPing/1.0; +https://jobping.ai)",
				Accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate",
				Connection: "keep-alive",
				"Upgrade-Insecure-Requests": "1",
			},
			timeout: 10000, // 10 second timeout
		});

		if (!response.ok) {
			return apiDescription;
		}

		const html = await response.text();

		// Extract job description from common HTML patterns
		const description = extractDescriptionFromHtml(html);

		// Return full description if it's significantly longer than API description
		if (
			description &&
			description.length > apiDescription.length * 1.5 &&
			description.length > 100
		) {
			return description;
		}

		return apiDescription;
	} catch (_error) {
		// Silently fail and return original description
		return apiDescription;
	}
}

/**
 * Extract job description from HTML content
 * @param {string} html - HTML content of job page
 * @returns {string} - Extracted description or empty string
 */
function extractDescriptionFromHtml(html) {
	try {
		// Common selectors for job descriptions across different sites
		const selectors = [
			'[data-testid="job-description"]',
			'[data-qa="job-description"]',
			".job-description",
			".job-detail-description",
			".description",
			"#job-description",
			".vacancy-description",
			".job__description",
			'[class*="description"]',
			'[class*="job-description"]',
			'[class*="job_detail"]',
		];

		// Try to find description using selectors
		for (const selector of selectors) {
			const matches = html.match(
				new RegExp(
					`${selector}[^>]*>([^<]*(?:<(?!/?${selector})[^>]*>[^<]*)*)`,
					"gi",
				),
			);
			if (matches && matches.length > 0) {
				// Clean up HTML tags and extract text
				const description = matches[0]
					.replace(/<[^>]*>/g, " ")
					.replace(/\s+/g, " ")
					.trim();
				if (description.length > 50) {
					return description;
				}
			}
		}

		// Fallback: Look for common text patterns
		const textPatterns = [
			/Job Description:?\s*([^]{50,500})/i,
			/Description:?\s*([^]{50,500})/i,
			/Role Overview:?\s*([^]{50,500})/i,
			/About the role:?\s*([^]{50,500})/i,
		];

		for (const pattern of textPatterns) {
			const match = html.match(pattern);
			if (match?.[1]) {
				const description = match[1]
					.replace(/<[^>]*>/g, " ")
					.replace(/\s+/g, " ")
					.trim();
				if (description.length > 50) {
					return description;
				}
			}
		}

		return "";
	} catch {
		return "";
	}
}

module.exports = {
	classifyEarlyCareer,
	makeJobHash,
	normalizeString,
	CAREER_PATH_KEYWORDS,
	fetchFullJobDescription,
};

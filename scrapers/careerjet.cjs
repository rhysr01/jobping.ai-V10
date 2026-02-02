// Load environment variables conditionally
// In production/GitHub Actions, env vars are already set
if (process.env.NODE_ENV !== "production" && !process.env.GITHUB_ACTIONS) {
	require("dotenv").config({ path: ".env.local" });
}
const { createClient } = require("@supabase/supabase-js");
const {
	classifyEarlyCareer,
	makeJobHash,
	normalizeString,
	CAREER_PATH_KEYWORDS,
} = require("./shared/helpers.cjs");
const {
	getAllRoles,
	getEarlyCareerRoles,
	getTopRolesByCareerPath,
	getRoleVariations,
	cleanRoleForSearch,
} = require("./shared/roles.cjs");
const { recordScraperRun } = require("./shared/telemetry.cjs");

// Check for required API credentials
if (!process.env.CAREERJET_API_KEY) {
	console.error("❌ CAREERJET CREDENTIALS MISSING:");
	console.error(
		"   - CAREERJET_API_KEY:",
		process.env.CAREERJET_API_KEY ? "✅ Set" : "❌ Missing",
	);
	console.error(
		"   📝 Add this to your environment variables or GitHub Actions secrets",
	);
	console.error(
		"   🔗 Get credentials: https://www.careerjet.com/partners/api/",
	);
	process.exit(1);
}
const { processIncomingJob } = require("./shared/processor.cjs");
const { validateAndFixCategories } = require("./shared/categoryMapper.cjs");
const { getInferredCategories } = require("./shared/careerPathInference.cjs");

const CAREERJET_API_KEY = process.env.CAREERJET_API_KEY;
// V4 API endpoint (HTTPS with basic authentication)
// V3 endpoint: http://public.api.careerjet.net/search (old, uses affid parameter)
// V4 endpoint: https://search.api.careerjet.net/v4/query (new, uses basic auth)
const BASE_URL = "https://search.api.careerjet.net/v4/query";

// Cities we target (21 cities matching signup form)
const CITIES = [
	// United Kingdom (4)
	{ name: "London", country: "gb", locale: "en_GB" },
	{ name: "Manchester", country: "gb", locale: "en_GB" },
	{ name: "Birmingham", country: "gb", locale: "en_GB" },
	{ name: "Belfast", country: "gb", locale: "en_GB" },

	// Ireland (1)
	{ name: "Dublin", country: "ie", locale: "en_IE" },

	// France (1)
	{ name: "Paris", country: "fr", locale: "fr_FR" },

	// Germany (3)
	{ name: "Berlin", country: "de", locale: "de_DE" },
	{ name: "Munich", country: "de", locale: "de_DE" },
	{ name: "Hamburg", country: "de", locale: "de_DE" },

	// Netherlands (1)
	{ name: "Amsterdam", country: "nl", locale: "nl_NL" },

	// Spain (2)
	{ name: "Madrid", country: "es", locale: "es_ES" },
	{ name: "Barcelona", country: "es", locale: "es_ES" },

	// Italy (2)
	{ name: "Milan", country: "it", locale: "it_IT" },
	{ name: "Rome", country: "it", locale: "it_IT" },

	// Switzerland (1)
	{ name: "Zurich", country: "ch", locale: "de_CH" },

	// Austria (1)
	{ name: "Vienna", country: "at", locale: "de_AT" },

	// Belgium (1)
	{ name: "Brussels", country: "be", locale: "fr_BE" },

	// Sweden (1)
	{ name: "Stockholm", country: "se", locale: "sv_SE" },

	// Denmark (1)
	{ name: "Copenhagen", country: "dk", locale: "da_DK" },

	// Czech Republic (1)
	{ name: "Prague", country: "cz", locale: "cs_CZ" },

	// Poland (1)
	{ name: "Warsaw", country: "pl", locale: "pl_PL" },
];

// Local language early-career terms by country (expanded for better coverage)
const LOCAL_EARLY_CAREER_TERMS = {
	fr: [
		// EXPANDED: Maximum French early career terms
		"jeune diplômé",
		"stagiaire",
		"alternance",
		"junior",
		"débutant",
		"programme graduate",
		"coordinateur",
		"assistant",
		"représentant",
		"spécialiste",
		"ingénieur",
		"stagiaire marketing",
		"stagiaire finance",
		"stagiaire tech",
		"stagiaire hr",
		"stagiaire esg",
		"diplômé",
		"alternant",
		"apprenti",
		"premier emploi",
		"jeune professionnel",
		"coordinateur junior",
		"assistant junior",
		"spécialiste junior",
		"ingénieur junior",
		"stagiaire commercial",
		"stagiaire opérationnel",
		"stagiaire logistique",
		"stagiaire rh",
		"stagiaire comptabilité",
		"cdd",
		"cdi débutant",
	],
	de: [
		// EXPANDED: Maximum German early career terms
		"absolvent",
		"trainee",
		"praktikant",
		"junior",
		"berufseinsteiger",
		"nachwuchskraft",
		"praktikum",
		"werkstudent",
		"koordinator",
		"assistent",
		"vertreter",
		"spezialist",
		"ingenieur",
		"praktikum marketing",
		"praktikum finance",
		"praktikum tech",
		"praktikum hr",
		"praktikum nachhaltigkeit",
		"ausbildung",
		"duales studium",
		"azubi",
		"berufseinstieg",
		"karrierestart",
		"einsteiger",
		"praktikumsplatz",
		"koordinator junior",
		"assistent junior",
		"spezialist junior",
		"ingenieur junior",
		"volontariat",
		"freiwilligendienst",
		"fsj",
		" BFD",
	],
	es: [
		"programa de graduados",
		"becario",
		"prácticas",
		"junior",
		"recién graduado",
		"nivel inicial",
		"coordinador",
		"asistente",
		"representante",
		"especialista",
		"ingeniero",
		"prácticas marketing",
		"prácticas finance",
		"prácticas tech",
		"prácticas hr",
		"prácticas sostenibilidad",
	],
	it: [
		"neolaureato",
		"stage",
		"tirocinio",
		"junior",
		"primo lavoro",
		"laureato",
		"coordinatore",
		"assistente",
		"rappresentante",
		"specialista",
		"ingegnere",
		"stage marketing",
		"stage finance",
		"stage tech",
		"stage hr",
		"stage sostenibilità",
	],
	nl: [
		"afgestudeerde",
		"traineeship",
		"starter",
		"junior",
		"beginnend",
		"werkstudent",
		"coördinator",
		"assistent",
		"vertegenwoordiger",
		"specialist",
		"ingenieur",
		"stage marketing",
		"stage finance",
		"stage tech",
		"stage hr",
		"stage duurzaamheid",
	],
	be: [
		"stagiaire",
		"junior",
		"débutant",
		"afgestudeerde",
		"starter",
		"coordinateur",
		"assistant",
		"représentant",
		"spécialiste",
		"ingénieur",
		"stagiaire marketing",
	],
	pt: [
		"recém-formado",
		"estagiário",
		"júnior",
		"trainee",
		"programa de graduados",
		"coordenador",
		"assistente",
		"representante",
		"especialista",
		"engenheiro",
		"estágio marketing",
		"estágio finance",
		"estágio tech",
		"estágio rh",
	],
	ie: ["early careers", "junior", "graduate", "internship"], // English only
	gb: [], // English only
	ch: [
		// German/French Switzerland
		"absolvent",
		"trainee",
		"junior",
		"berufseinsteiger",
		"apprenti",
		"stagiaire",
		"diplômé",
	],
	at: [
		// Austrian German
		"absolvent",
		"trainee",
		"praktikant",
		"junior",
		"berufseinsteiger",
		"nachwuchskraft",
		"praktikum",
	],
	se: [
		// Swedish
		"examen",
		"trainee",
		"junior",
		"praktik",
		"nyexaminerad",
		"yngre",
	],
	dk: [
		// Danish
		"elev",
		"trainee",
		"junior",
		"praktik",
		"nyuddannet",
		"starter",
	],
	cz: [
		// Czech
		"absolvent",
		"junior",
		"stážista",
		"praktikant",
		"začínající",
		"trainee",
	],
	pl: [
		// Polish
		"absolwent",
		"junior",
		"stażysta",
		"praktykant",
		"trainee",
		"początkujący",
	],
};

/**
 * Query rotation system - 3 sets that rotate every 8 hours
 * EXPANDED to cover all role types: coordinator, assistant, representative, engineer, specialist, manager, designer, HR, legal, sustainability
 */
const QUERY_SETS = {
	SET_A: [
		// Focus: Pure INTERNSHIPS (placements, rotations, summer/spring roles)
		"internship",
		"intern",
		"summer intern",
		"spring intern",
		"finance intern",
		"consulting intern",
		"marketing intern",
		"data intern",
		"investment banking intern",
		"ux intern",
		"design intern",
		"tech intern",
		"technology intern",
		"software engineer intern",
		"data engineer intern",
		"business analyst intern",
		"sales intern",
		"operations intern",
		"hr intern",
		"product intern",
		"business intelligence intern",
		"strategy intern",
		"research intern",
		"engineering intern",
		"analyst intern",
		"audit intern",
		"compliance intern",
		"supply chain intern",
		"manufacturing intern",
		"sustainability intern",
		"esg intern",
	],
	SET_B: [
		// Focus: GRADUATE PROGRAMS & SCHEMES (structured trainee pathways)
		"graduate programme",
		"graduate program",
		"graduate scheme",
		"graduate trainee",
		"management trainee",
		"trainee program",
		"campus hire",
		"campus recruitment",
		"rotational graduate program",
		"rotational program",
		"early careers program",
		"graduate software engineer",
		"graduate consultant",
		"graduate analyst",
		"graduate finance",
		"graduate marketing",
		"graduate technology",
		"graduate engineer",
		"graduate designer",
		"graduate product manager",
		"new grad program",
		"recent graduate",
		"graduate associate",
		"graduate specialist",
		"associate investment banker",
		"graduate accountant",
		"graduate auditor",
		"graduate compliance",
		"graduate risk manager",
		"graduate supply chain",
		"graduate operations",
	],
	SET_C: [
		// Focus: ENTRY-LEVEL ANALYST & ASSOCIATE ROLES (career start positions)
		"business analyst graduate",
		"financial analyst graduate",
		"data analyst graduate",
		"operations analyst graduate",
		"strategy analyst graduate",
		"risk analyst graduate",
		"compliance analyst graduate",
		"audit analyst graduate",
		"investment analyst graduate",
		"research analyst graduate",
		"associate consultant",
		"junior consultant graduate",
		"associate product manager",
		"junior product manager graduate",
		"apm",
		"associate finance",
		"associate account manager",
		"junior account executive",
		"business development graduate",
		"business development associate",
		"customer success associate",
		"junior business analyst",
		"graduate product manager",
		"junior engineer graduate",
		"junior technology analyst",
		"junior ux designer",
		"junior graphic designer",
		"junior data scientist",
		"junior developer",
		"talent acquisition associate",
		"people operations associate",
		"marketing coordinator graduate",
		"operations coordinator graduate",
	],
};

/**
 * Determine which query set to use based on time of day
 * Rotates every 8 hours: SET_A (0-7h), SET_B (8-15h), SET_C (16-23h)
 */
function getCurrentQuerySet() {
	const manualSet = process.env.CAREERJET_QUERY_SET;
	if (manualSet && QUERY_SETS[manualSet]) {
		return manualSet;
	}

	const hour = new Date().getHours();
	if (hour >= 0 && hour < 8) return "SET_A";
	if (hour >= 8 && hour < 16) return "SET_B";
	return "SET_C";
}

/**
 * Generate search queries from specific roles (not generic terms)
 * Uses actual roles from signup form for targeted searches
 * NOW WITH QUERY ROTATION for variety across runs
 */
function generateSearchQueries() {
	const currentSet = getCurrentQuerySet();
	const baseQueries = QUERY_SETS[currentSet];
	console.log(
		`🔄 CareerJet using query set: ${currentSet} (${baseQueries.length} base terms)`,
	);

	const queries = new Set();

	// Add base rotation queries (early-career focused)
	baseQueries.forEach((term) => {
		queries.add(term.toLowerCase());
	});

	// Priority 1: Early-career roles (intern, graduate, junior, trainee)
	// Rotate which roles we prioritize based on query set
	const earlyCareerRoles = getEarlyCareerRoles();
	const roleSlice =
		currentSet === "SET_A"
			? earlyCareerRoles.slice(0, 8)
			: currentSet === "SET_B"
				? earlyCareerRoles.slice(8, 16)
				: earlyCareerRoles.slice(16, 24);

	roleSlice.forEach((role) => {
		const cleaned = cleanRoleForSearch(role);
		cleaned.forEach((cleanRole) => {
			if (cleanRole.length > 5) {
				queries.add(cleanRole.toLowerCase());
			}
		});
	});

	// Priority 2: All roles from signup form (rotated subset)
	const allRoles = getAllRoles();
	const allRolesSlice =
		currentSet === "SET_A"
			? allRoles.slice(0, 10)
			: currentSet === "SET_B"
				? allRoles.slice(10, 20)
				: allRoles.slice(20, 30);

	allRolesSlice.forEach((role) => {
		const cleaned = cleanRoleForSearch(role);
		cleaned.forEach((cleanRole) => {
			if (cleanRole.length > 5) {
				queries.add(cleanRole.toLowerCase());
			}
		});
	});

	// Priority 3: Specific early-career program terms (rotated)
	const specificProgramTerms =
		currentSet === "SET_A"
			? [
					"graduate programme",
					"graduate scheme",
					"graduate program",
					"graduate trainee",
					"management trainee",
					"rotational graduate program",
				]
			: currentSet === "SET_B"
				? [
						"graduate analyst",
						"graduate associate",
						"early careers program",
						"corporate graduate programme",
						"future leaders programme",
					]
				: [
						"campus hire",
						"new grad",
						"recent graduate",
						"entry level program",
						"graduate scheme",
						"trainee program",
					];

	specificProgramTerms.forEach((term) => queries.add(term.toLowerCase()));

	// Add career path keywords for broader matching (rotated subset)
	const paths = Object.keys(CAREER_PATH_KEYWORDS);
	const pathSlice =
		currentSet === "SET_A"
			? paths.slice(0, 4)
			: currentSet === "SET_B"
				? paths.slice(4, 8)
				: paths.slice(8, 12);

	pathSlice.forEach((path) => {
		CAREER_PATH_KEYWORDS[path].forEach((keyword) => {
			if (keyword.length > 3) {
				queries.add(keyword.toLowerCase());
			}
		});
	});

	return Array.from(queries);
}

/**
 * Get local language early-career terms for a city
 */
function getLocalTermsForCity(city) {
	const countryCode = city.country.toLowerCase();
	return LOCAL_EARLY_CAREER_TERMS[countryCode] || [];
}

/**
 * Parse relative dates from CareerJet (e.g., "2 days ago")
 */
function parseRelativeDate(relativeDate) {
	const now = new Date();
	const normalized = normalizeString(relativeDate);

	if (normalized.includes("hour")) {
		const hours = parseInt(normalized, 10) || 1;
		now.setHours(now.getHours() - hours);
	} else if (normalized.includes("day")) {
		const days = parseInt(normalized, 10) || 1;
		now.setDate(now.getDate() - days);
	} else if (normalized.includes("week")) {
		const weeks = parseInt(normalized, 10) || 1;
		now.setDate(now.getDate() - weeks * 7);
	} else if (normalized.includes("month")) {
		const months = parseInt(normalized, 10) || 1;
		now.setMonth(now.getMonth() - months);
	}

	return now.toISOString();
}

/**
 * ENHANCED: Infer categories from job text using CAREER_PATH_KEYWORDS
 * Maps to your category naming convention
 */
function inferCategories(title, description) {
	const text = normalizeString(`${title} ${description}`);
	let categories = ["early-career"];

	// Use shared category mapper to ensure consistency
	const {
		addCategoryFromPath,
		validateAndFixCategories,
	} = require("./shared/categoryMapper.cjs");

	Object.entries(CAREER_PATH_KEYWORDS).forEach(([path, keywords]) => {
		const keywordLower = keywords.map((k) => k.toLowerCase());
		if (keywordLower.some((kw) => text.includes(kw))) {
			categories = addCategoryFromPath(path, categories);
		}
	});

	// CRITICAL: Validate and fix categories before returning
	categories = validateAndFixCategories(categories);

	// If no specific category found, add 'general'
	if (categories.length === 1) {
		categories.push("general");
	}

	return categories;
}

/**
 * Get a random IP address from a pool of European IPs
 * CareerJet requires a valid-looking IP for abuse detection
 */
function getRandomEuropeanIP() {
	// Use consistent IP from environment or generate deterministic one
	// This should be whitelisted on CareerJet partner dashboard
	const consistentIp = process.env.CAREERJET_USER_IP;

	if (consistentIp) {
		return consistentIp; // Use env var if provided
	}

	// Fallback: Generate consistent IP based on hostname/machine to minimize variation
	// This ensures same IP across multiple runs on the same machine
	const hostname = require("os").hostname();
	const hash = require("crypto")
		.createHash("md5")
		.update(hostname)
		.digest("hex");

	// Use hash to generate reproducible IP
	const part1 = parseInt(hash.substring(0, 2), 16) % 256;
	const part2 = parseInt(hash.substring(2, 4), 16) % 256;
	const part3 = parseInt(hash.substring(4, 6), 16) % 256;
	const part4 = parseInt(hash.substring(6, 8), 16) % 256;

	return `${part1}.${part2}.${part3}.${part4}`;
}

/**
 * Scrape CareerJet for a single city + keyword combo
 * FIXED: Batches database saves to prevent timeouts
 * FIXED: Added pagination to fetch all available pages (was only fetching page 1)
 * FIXED: Using V4 API with basic authentication instead of V3 with affid parameter
 */
async function scrapeCareerJetQuery(city, keyword, supabase) {
	const BATCH_SIZE = 50; // Batch size for database saves
	const jobBatch = []; // Accumulate jobs for batch saving

	// OPTIMIZED: Limit pages to prevent timeouts while getting good coverage
	// Stop when API indicates no more pages or returns empty results, but cap at reasonable limit
	const MAX_PAGES = parseInt(process.env.CAREERJET_MAX_PAGES || "5", 10); // Reduced from 1000 to 5
	let page = 1;
	let hasMorePages = true;
	let savedCount = 0;
	let totalResponseTime = 0;

	try {
		// Create basic auth header for V4 API
		// API key is username, empty string is password
		const auth = Buffer.from(`${CAREERJET_API_KEY}:`).toString("base64");

		while (hasMorePages && page <= MAX_PAGES) {
			try {
				// Get a random IP address (not hardcoded) for this request
				const userIp = getRandomEuropeanIP();

				const params = new URLSearchParams({
					locale_code: city.locale,
					location: city.name,
					keywords: keyword,
					user_ip: userIp, // Dynamic IP address
					user_agent: "Mozilla/5.0 JobPing/1.0", // User agent
					pagesize: "50", // Max on free tier
					page: String(page),
					sort: "date", // Most recent first
					contracttype: "p", // Permanent
				});

				const url = `${BASE_URL}?${params.toString()}`;
				const startTime = Date.now();

				// Add 30-second timeout to prevent hanging requests
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 30000);

				let response;
				try {
					response = await fetch(url, {
						headers: {
							"User-Agent": "Mozilla/5.0 JobPing/1.0",
							Accept: "application/json",
							// V4 API requires basic authentication
							Authorization: `Basic ${auth}`,
							// V4 API requires referer header
							Referer: "https://www.careerjet.com",
						},
						signal: controller.signal,
					});
					clearTimeout(timeoutId);
				} catch (error) {
					clearTimeout(timeoutId);
					if (error.name === "AbortError") {
						throw new Error(
							`Request timed out after 30s for ${keyword} in ${city.name}`,
						);
					}
					throw error;
				}
				const responseTime = Date.now() - startTime;
				totalResponseTime += responseTime;

				if (!response.ok) {
					// Handle specific error codes
					if (response.status === 403) {
						console.error(
							`[CareerJet] 🚫 ACCESS FORBIDDEN (403) - API key invalid or account blocked`,
						);
						console.error(
							`[CareerJet] Please check CAREERJET_API_KEY or contact CareerJet support`,
						);
						// Fail fast on 403 - don't retry
						throw new Error("CareerJet API access forbidden - invalid API key");
					}

					if (response.status === 429) {
						console.warn(
							`[CareerJet] Rate limit hit for ${keyword} in ${city.name} (page ${page}) - will slow down`,
						);
						return {
							saved: savedCount,
							shouldSlowDown: true,
							responseTime: totalResponseTime,
						};
					}

					console.error(
						`[CareerJet] API error ${response.status} for ${keyword} in ${city.name} (page ${page})`,
					);
					break; // Stop pagination on other errors
				}

				const data = await response.json();
				const jobs = data.jobs || [];
				const totalPages = data.pages || data.total_pages || null;
				const totalResults = data.hits || data.total || null;

				if (jobs.length === 0) {
					hasMorePages = false;
					break;
				}

				// Check if we've reached the last page
				if (totalPages && page >= totalPages) {
					hasMorePages = false;
				}

				console.log(
					`[CareerJet] Found ${jobs.length} jobs for "${keyword}" in ${city.name} (page ${page}${totalResults ? `/${totalPages || "?"}, total available: ${totalResults}` : ""}${totalPages ? `, ${totalPages} pages total` : ""}) (${responseTime}ms)`,
				);

				// Process each job
				for (const job of jobs) {
					try {
						// Create normalized job object for early-career check
						const normalizedJob = {
							title: job.title || "",
							company: job.company || "",
							location: job.location || city.name,
							description: job.description || "",
						};

						// Check if it's early career using shared helper
						const isEarlyCareer = classifyEarlyCareer(normalizedJob);
						if (!isEarlyCareer) {
							continue; // Skip non-early-career jobs
						}

						// ENHANCED: Extract salary from description (keep this as it's CareerJet-specific)
						function extractSalary(desc) {
							if (!desc) return null;
							const patterns = [
								/(?:€|EUR|euro)\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)\s*-?\s*(?:€|EUR|euro)?\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)/i,
								/(?:£|GBP|pound)\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)\s*-?\s*(?:£|GBP|pound)?\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)/i,
								/(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)\s*-?\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)\s*(?:€|EUR|£|GBP|euro|pound)/i,
								/salary[:\s]+(?:€|£|EUR|GBP)?\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)\s*-?\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)/i,
								/(?:€|EUR|euro)\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)/i,
								/(?:£|GBP|pound)\s*(\d{1,3}(?:[.,]\d{3})*(?:k|K)?)/i,
							];
							for (const pattern of patterns) {
								const match = desc.match(pattern);
								if (match) return match[0].trim().replace(/\s+/g, " ");
							}
							return null;
						}
						const salary = extractSalary(job.description || "");

						// ENHANCED: Enrich description if too short
						let enrichedDescription = job.description || "";
						if (enrichedDescription.length < 50 && job.site) {
							enrichedDescription =
								`${job.title || ""} at ${job.company || ""}. ${enrichedDescription}`.trim();
						}

						// Process through standardization pipe
						const processed = await processIncomingJob(
							{
								title: job.title,
								company: job.company,
								location: job.location || city.name,
								description: enrichedDescription,
								url: job.url,
								posted_at: parseRelativeDate(job.date || "today"),
								date: job.date,
							},
							{
								source: "careerjet",
								defaultCity: city.name,
								defaultCountry: city.country,
								categories: getInferredCategories(
									job.title,
									enrichedDescription,
								), // Infer career path from title/description
							},
						);

						// CRITICAL: Skip if processor rejected (e.g., job board company)
						if (!processed) {
							continue;
						}

						// Generate job_hash
						const job_hash = makeJobHash({
							title: processed.title,
							company: processed.company,
							location: processed.location,
						});

						// ENHANCED: Infer categories using CAREER_PATH_KEYWORDS (keep this as it's CareerJet-specific)
						const categories = inferCategories(job.title, enrichedDescription);

						// Prepare database record with all standardized fields
						const jobRecord = {
							...processed,
							job_hash,
							categories, // Override with CareerJet-specific categories
							// Add salary if extracted (CareerJet-specific)
							...(salary ? { salary_range: salary } : {}),
						};

						// CRITICAL: Validate before adding to batch
						const { validateJob } = require("./shared/jobValidator.cjs");
						const validation = validateJob(jobRecord);
						if (!validation.valid) {
							console.warn(
								`[CareerJet] Skipping invalid job: ${validation.errors.join(", ")}`,
							);
							continue;
						}

						// Add to batch instead of saving immediately
						jobBatch.push(validation.job);

						// Save batch when it reaches BATCH_SIZE
						if (jobBatch.length >= BATCH_SIZE) {
							const { error, data } = await supabase
								.from("jobs")
								.upsert(jobBatch, {
									onConflict: "job_hash",
									ignoreDuplicates: true, // Skip duplicates instead of expensive updates
								});

							if (error) {
								console.error(`[CareerJet] Error saving batch:`, error.message);
							} else {
								const saved = Array.isArray(data)
									? data.length
									: jobBatch.length;
								savedCount += saved;
								console.log(
									`[CareerJet] Saved batch of ${jobBatch.length} jobs`,
								);
							}
							jobBatch.length = 0; // Clear batch
						}
					} catch (jobError) {
						console.error(
							"[CareerJet] Error processing job:",
							jobError.message,
						);
					}
				}

				// If we got fewer jobs than expected (less than page size), likely no more pages
				if (jobs.length < 50) {
					hasMorePages = false;
				}

				page++;

				// Rate limiting between pages
				if (hasMorePages && page <= MAX_PAGES) {
					await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay between pages
				}
			} catch (error) {
				console.error(
					`[CareerJet] Error scraping ${keyword} in ${city.name} (page ${page}):`,
					error.message,
				);
				break; // Stop pagination on error
			}
		}

		// Save any remaining jobs in the batch
		if (jobBatch.length > 0) {
			const { error, data } = await supabase.from("jobs").upsert(jobBatch, {
				onConflict: "job_hash",
				ignoreDuplicates: true, // Skip duplicates instead of expensive updates
			});

			if (error) {
				console.error(`[CareerJet] Error saving final batch:`, error.message);
			} else {
				const saved = Array.isArray(data) ? data.length : jobBatch.length;
				savedCount += saved;
				console.log(`[CareerJet] Saved final batch of ${jobBatch.length} jobs`);
			}
		}

		// Return both count and whether to slow down (based on response time)
		return {
			saved: savedCount,
			shouldSlowDown: totalResponseTime > 2000,
			responseTime: totalResponseTime,
		};
	} catch (error) {
		console.error(
			`[CareerJet] Error scraping ${keyword} in ${city.name}:`,
			error.message,
		);
		return 0;
	}
}

/**
 * Main scraper function
 */
async function scrapeCareerJet() {
	if (!CAREERJET_API_KEY) {
		console.error("[CareerJet] ❌ CAREERJET_API_KEY not set");
		return;
	}

	const supabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
	const supabaseKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.error(
			"[CareerJet] ❌ Supabase credentials not set. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
		);
		return;
	}

	const startTime = Date.now();
	console.log("[CareerJet] 🚀 Starting scrape...");

	// Create Supabase client (matching existing scraper pattern)
	const supabase = createClient(supabaseUrl, supabaseKey);

	const baseQueries = generateSearchQueries();

	// OPTIMIZED: Reduce queries to prevent timeouts while maintaining coverage
	// Strategy: 12 cities × 8 queries × 2 pages = ~192 requests per run (much safer)
	// Reduced from 25 to 8 queries per city to prevent timeouts
	// Still good coverage with adaptive rate limiting
	const limitedBaseQueries = baseQueries.slice(0, 8); // REDUCED from 15 to 8

	let totalSaved = 0;
	let errors = 0;

	// Scrape each city + keyword combo
	for (const city of CITIES) {
		// Get local language terms for this city (if not English)
		const localTerms = getLocalTermsForCity(city);

		// Combine base queries with local terms for this city
		const cityQueries = [...limitedBaseQueries];
		if (localTerms.length > 0) {
			// EXPANDED: Add top 5 local terms for this city (increased from 3)
			cityQueries.push(...localTerms.slice(0, 5)); // EXPANDED from 3 to 5
			console.log(
				`[CareerJet] ${city.name}: Using ${cityQueries.length} queries (${localTerms.slice(0, 3).length} local language terms)`,
			);
		}

		// Adaptive rate limiting: start with base delay, adjust based on API response
		let currentDelay = 800; // Start faster (800ms) - will adapt if needed
		let consecutiveSlowResponses = 0;

		for (const keyword of cityQueries) {
			try {
				const result = await scrapeCareerJetQuery(city, keyword, supabase);
				// Handle both old format (number) and new format (object)
				const saved =
					typeof result === "object" ? result.saved || 0 : result || 0;
				const shouldSlowDown =
					typeof result === "object" ? result.shouldSlowDown || false : false;

				totalSaved += saved;

				// Adaptive delay: slow down if API is slow or rate limited
				if (shouldSlowDown) {
					consecutiveSlowResponses++;
					currentDelay = Math.min(currentDelay * 1.5, 3000); // Max 3 seconds
					console.log(
						`[CareerJet] Slowing down to ${currentDelay}ms (slow response detected)`,
					);
				} else if (consecutiveSlowResponses > 0) {
					// Gradually speed up if responses are fast again
					consecutiveSlowResponses = Math.max(0, consecutiveSlowResponses - 1);
					currentDelay = Math.max(800, currentDelay * 0.9); // Back to base delay
				}

				// Rate limiting: adaptive delay between requests
				await new Promise((resolve) => setTimeout(resolve, currentDelay));
			} catch (error) {
				console.error(
					`[CareerJet] Error with ${keyword} in ${city.name}:`,
					error.message,
				);
				errors++;

				// Fail fast on critical errors to prevent timeouts
				if (
					error.message.includes("timed out") ||
					error.message.includes("API access forbidden") ||
					error.message.includes("ECONNREFUSED") ||
					error.message.includes("ENOTFOUND")
				) {
					console.error(
						`[CareerJet] Critical error detected, stopping ${city.name} processing`,
					);
					break; // Stop processing this city
				}

				// Slow down on errors too
				currentDelay = Math.min(currentDelay * 1.2, 3000);
			}
		}
	}

	const duration = Date.now() - startTime;

	// Record telemetry
	recordScraperRun("careerjet", totalSaved, duration, errors);

	console.log(
		`[CareerJet] ✅ Complete: ${totalSaved} jobs saved in ${(duration / 1000).toFixed(1)}s`,
	);
}

// Run if called directly
if (require.main === module) {
	scrapeCareerJet()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("[CareerJet] Fatal error:", error);
			process.exit(1);
		});
}

module.exports = { scrapeCareerJet };

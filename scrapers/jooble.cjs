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
	cleanRoleForSearch,
} = require("./shared/roles.cjs");
const {
	recordScraperRun,
	recordApiRequest,
} = require("./shared/telemetry.cjs");

// Check for required API credentials
if (!process.env.JOOBLE_API_KEY) {
	console.error("❌ JOOBLE CREDENTIALS MISSING:");
	console.error(
		"   - JOOBLE_API_KEY:",
		process.env.JOOBLE_API_KEY ? "✅ Set" : "❌ Missing",
	);
	console.error(
		"   📝 Add this to your environment variables or GitHub Actions secrets",
	);
	console.error("   🔗 Get credentials: https://jooble.org/api");
	process.exit(1);
}
const { processIncomingJob } = require("./shared/processor.cjs");
const { validateAndFixCategories } = require("./shared/categoryMapper.cjs");
const { getInferredCategories } = require("./shared/careerPathInference.cjs");

// Jooble API endpoint - using their public API
// Note: Jooble may require API key registration for production use
const BASE_URL = "https://jooble.org/api/";

// EU Cities - ONLY from signup form + Vienna (as requested)
// Expanded to 15 major cities from signup form for maximum early-career job discovery
// Conservative scaling: 8 → 15 cities across 11 European countries
const CITIES = [
	// United Kingdom (3)
	{ name: "London", country: "gb", locale: "en" },
	{ name: "Manchester", country: "gb", locale: "en" },
	{ name: "Birmingham", country: "gb", locale: "en" },
	// Germany (3)
	{ name: "Berlin", country: "de", locale: "de" },
	{ name: "Munich", country: "de", locale: "de" },
	{ name: "Hamburg", country: "de", locale: "de" },
	// France (1)
	{ name: "Paris", country: "fr", locale: "fr" },
	// Netherlands (1)
	{ name: "Amsterdam", country: "nl", locale: "nl" },
	// Spain (2)
	{ name: "Madrid", country: "es", locale: "es" },
	{ name: "Barcelona", country: "es", locale: "es" },
	// Italy (1)
	{ name: "Milan", country: "it", locale: "it" },
	// Austria (1)
	{ name: "Vienna", country: "at", locale: "de" },
	// Switzerland (1)
	{ name: "Zurich", country: "ch", locale: "de" },
	// Ireland (1)
	{ name: "Dublin", country: "ie", locale: "en" },
];

/**
 * Query rotation system - 3 sets that rotate every 8 hours
 * EXPANDED: 20+ terms per set for comprehensive rotating coverage
 * Focused on early-career roles matching signup form
 * Strategy: 12 queries per run × 3 rotation sets = 36 different terms across 24 hours
 */
const QUERY_SETS = {
	SET_A: [
		// Focus: Pure INTERNSHIPS (placements, rotations, summer/spring roles)
		"internship",
		"intern",
		"summer intern",
		"year in industry",
		"industrial placement",
		"degree apprenticeship",
		"apprentice",
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
	],
	SET_B: [
		// Focus: GRADUATE PROGRAMS & SCHEMES (structured trainee pathways)
		"graduate programme",
		"graduate program",
		"graduate scheme",
		"graduate trainee",
		"management trainee",
		"trainee program",
		"trainee scheme",
		"campus hire",
		"rotational graduate program",
		"early careers program",
		"graduate software engineer",
		"graduate consultant",
		"graduate analyst",
		"graduate finance",
		"graduate marketing",
		"graduate technology",
		"graduate engineer",
		"graduate designer",
		"new grad",
		"recent graduate",
		"graduate development program",
		"graduate associate",
		"graduate specialist",
	],
	SET_C: [
		// Focus: ENTRY-LEVEL ANALYST & ASSOCIATE ROLES (career start positions)
		"business analyst",
		"financial analyst",
		"data analyst",
		"operations analyst",
		"strategy analyst",
		"junior analyst",
		"graduate analyst",
		"associate consultant",
		"junior consultant",
		"marketing assistant",
		"product assistant",
		"finance assistant",
		"sales development representative",
		"sdr",
		"bdr",
		"customer success associate",
		"associate product manager",
		"apm",
		"audit associate",
		"investment associate",
		"junior account manager",
		"junior engineer",
		"junior designer",
	],
};

/**
 * Determine which query set to use based on time of day
 * Rotates every 8 hours: SET_A (0-7h), SET_B (8-15h), SET_C (16-23h)
 */
function getCurrentQuerySet() {
	const manualSet = process.env.JOOBLE_QUERY_SET;
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
 * ALL QUERIES ARE EARLY-CAREER FOCUSED
 */
function generateSearchQueries() {
	const currentSet = getCurrentQuerySet();
	const baseQueries = QUERY_SETS[currentSet];
	console.log(
		`🔄 Jooble using query set: ${currentSet} (${baseQueries.length} base terms)`,
	);

	const queries = new Set();

	// Add base rotation queries (early-career focused)
	baseQueries.forEach((term) => {
		queries.add(term.toLowerCase());
	});

	// Priority 1: Early-career roles (intern, graduate, junior, trainee)
	const earlyCareerRoles = getEarlyCareerRoles();
	const roleSlice =
		currentSet === "SET_A"
			? earlyCareerRoles.slice(0, 10)
			: currentSet === "SET_B"
				? earlyCareerRoles.slice(10, 20)
				: earlyCareerRoles.slice(20, 30);

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
			? allRoles.slice(0, 15)
			: currentSet === "SET_B"
				? allRoles.slice(15, 30)
				: allRoles.slice(30, 45);

	allRolesSlice.forEach((role) => {
		const cleaned = cleanRoleForSearch(role);
		cleaned.forEach((cleanRole) => {
			if (cleanRole.length > 5) {
				queries.add(cleanRole.toLowerCase());
			}
		});
	});

	return Array.from(queries).slice(0, 8); // Limit to 8 queries per run (prevents timeout)
}

/**
 * Extract city from location string
 * FIXED: Use location normalizer for proper city extraction
 */
function extractCity(location) {
	if (!location) return "";
	const { normalizeCity } = require("./shared/locationNormalizer.cjs");
	const parts = location
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
	if (parts.length === 0) return "";
	const city = normalizeCity(parts[0]);
	return city || "Unknown";
}

/**
 * Infer country name from location
 * FIXED: Use location normalizer for proper country extraction
 */
function inferCountry(location) {
	if (!location) return "";
	const { normalizeCountry } = require("./shared/locationNormalizer.cjs");
	const parts = location
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);

	// Try to get country from last part first (usually most reliable)
	if (parts.length > 1) {
		const country = normalizeCountry(parts[parts.length - 1]);
		if (country) return country;
	}

	// Fall back to normalizing full location string
	const country = normalizeCountry(location);
	return country || "United Kingdom"; // Default to UK if unknown
}

/**
 * Normalize date from Jooble API
 */
function normalizeDate(dateValue) {
	if (!dateValue) return new Date().toISOString();

	// If it's a number (Unix timestamp), convert to milliseconds
	if (typeof dateValue === "number" || /^\d+$/.test(String(dateValue))) {
		const timestamp =
			typeof dateValue === "number" ? dateValue : parseInt(dateValue, 10);
		const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
		return new Date(ms).toISOString();
	}

	// Try to parse as ISO string
	try {
		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) {
			return new Date().toISOString();
		}
		return date.toISOString();
	} catch {
		return new Date().toISOString();
	}
}

/**
 * Scrape Jooble for a single keyword + location combo
 * FIXED: Added pagination, better logging, and response structure debugging
 */
async function scrapeJoobleQuery(keyword, location, supabase, apiKey) {
	if (!apiKey) {
		console.error(
			`[Jooble] ❌ API key missing for ${keyword} in ${location.name}`,
		);
		return 0;
	}

	const BATCH_SIZE = 50; // Batch size for database saves
	let totalSaved = 0;
	let totalFound = 0;
	let totalFilteredEarlyCareer = 0;
	let totalFilteredProcessor = 0;
	let totalFilteredValidation = 0;
	const jobBatch = []; // Accumulate jobs for batch saving

	// UNLIMITED: Fetch as many pages as available (no artificial limit)
	// Only stop when API indicates no more pages or returns empty results
	const MAX_PAGES = parseInt(process.env.JOOBLE_MAX_PAGES || "3", 10); // FIXED: Conservative 3 pages per query (was 1000!)
	let page = 1;
	let hasMorePages = true;

	while (hasMorePages && page <= MAX_PAGES) {
		try {
			// Jooble API requires POST requests to /api/{api_key} endpoint
			const url = `${BASE_URL}${apiKey}`;

			// Increased timeout to 60 seconds to handle rate limiting and large responses
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000);

			let response;
			try {
				response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"User-Agent": "JobPing/1.0 (job aggregator)",
						Accept: "application/json",
					},
					body: JSON.stringify({
						keywords: keyword,
						location: location.name,
						country: location.country || "gb", // Required country parameter
						page: page,
						radius: 25,
					}),
					signal: controller.signal,
				});
				clearTimeout(timeoutId);
			} catch (error) {
				clearTimeout(timeoutId);
				if (error.name === "AbortError") {
					throw new Error(
						`Request timed out after 30s for ${keyword} in ${location.name}`,
					);
				}
				throw error;
			}

			// Track API request
			recordApiRequest("jooble", url, response.ok);

			if (!response.ok) {
				const errorText = await response.text().catch(() => "");
				console.error(
					`[Jooble] API error ${response.status} for ${keyword} in ${location.name} (page ${page}): ${errorText.substring(0, 200)}`,
				);
				break;
			}

			const data = await response.json();

			// DEBUG: Log response structure on first page to understand API format
			if (page === 1) {
				console.log(
					`[Jooble] Response structure for ${keyword} in ${location.name}:`,
					JSON.stringify(
						{
							keys: Object.keys(data),
							hasJobs: !!data.jobs,
							hasResults: !!data.results,
							hasData: !!data.data,
							hasItems: !!data.items,
							totalJobs:
								data.jobs?.length ||
								data.results?.length ||
								data.data?.length ||
								data.items?.length ||
								0,
						},
						null,
						2,
					),
				);
			}

			// Try multiple response structures
			const jobs = data.jobs || data.results || data.data || data.items || [];
			totalFound += jobs.length;

			// Check for pagination metadata
			const totalPages =
				data.totalPages ||
				data.last_page ||
				data.pages ||
				data.total_pages ||
				null;
			const totalResults =
				data.total || data.totalResults || data.count || null;

			if (jobs.length === 0) {
				hasMorePages = false;
				break;
			}

			// If we have pagination metadata, use it
			if (totalPages && page >= totalPages) {
				hasMorePages = false;
			}

			console.log(
				`[Jooble] Found ${jobs.length} jobs for "${keyword}" in ${location.name} (page ${page}${totalResults ? `, total available: ${totalResults}` : ""})`,
			);

			// Process each job
			for (const job of jobs) {
				try {
					// Extract city and country
					const city = extractCity(job.location || job.city || "");
					const country = inferCountry(job.location || job.country || "");

					// Create normalized job object for early-career check
					const normalizedJob = {
						title: job.title || job.jobTitle || "",
						company: job.company || job.companyName || job.employer || "",
						location: city,
						description: job.description || job.snippet || "",
					};

					// Check if it's early career
					const isEarlyCareer = classifyEarlyCareer(normalizedJob);
					if (!isEarlyCareer) {
						totalFilteredEarlyCareer++;
						continue; // Skip non-early-career jobs
					}

					// Process through standardization pipe
					const processed = await processIncomingJob(
						{
							title: job.title || job.jobTitle || "",
							company: job.company || job.companyName || job.employer || "",
							location: job.location || `${city}, ${country}`,
							description: job.description || job.snippet || "",
							url: job.url || job.link || job.jobUrl || "",
							posted_at: normalizeDate(
								job.date || job.postedDate || job.created,
							),
							created_at: job.created || job.postedDate,
						},
						{
							source: "jooble",
							defaultCity: city,
							defaultCountry: country,
							categories: getInferredCategories(
								job.title || "",
								job.description || "",
							), // Infer career path
						},
					);

					// CRITICAL: Skip if processor rejected (e.g., job board company)
					if (!processed) {
						totalFilteredProcessor++;
						continue;
					}

					// Generate job_hash
					const job_hash = makeJobHash({
						title: processed.title,
						company: processed.company,
						location: processed.location,
					});

					// Prepare database record
					const jobRecord = {
						...processed,
						job_hash,
					};

					// CRITICAL: Validate before adding to batch
					const { validateJob } = require("./shared/jobValidator.cjs");
					const validation = validateJob(jobRecord);
					if (!validation.valid) {
						totalFilteredValidation++;
						console.warn(
							`[Jooble] Skipping invalid job: ${validation.errors.join(", ")}`,
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
							console.error(`[Jooble] Error saving batch:`, error.message);
						} else {
							const saved = Array.isArray(data) ? data.length : jobBatch.length;
							totalSaved += saved;
							console.log(`[Jooble] Saved batch of ${jobBatch.length} jobs`);
						}
						jobBatch.length = 0; // Clear batch
					}
				} catch (jobError) {
					console.error("[Jooble] Error processing job:", jobError.message);
				}
			}

			// If we got fewer than 5 jobs, likely no more pages (conservative threshold)
			if (jobs.length < 5) {
				hasMorePages = false;
			}

			page++;

			// CRITICAL: Rate limiting between pages - 2 second delay to prevent API throttling
			// Jooble may throttle aggressive requests - be polite with delays
			if (hasMorePages && page <= MAX_PAGES) {
				await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s delay between pages (was 1s)
			}
		} catch (error) {
			console.error(
				`[Jooble] Error scraping ${keyword} in ${location.name} (page ${page}):`,
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
			console.error(`[Jooble] Error saving final batch:`, error.message);
		} else {
			const saved = Array.isArray(data) ? data.length : jobBatch.length;
			totalSaved += saved;
			console.log(`[Jooble] Saved final batch of ${jobBatch.length} jobs`);
		}
	}

	// Log filtering stats for debugging
	if (totalFound > 0) {
		console.log(
			`[Jooble] ${keyword} in ${location.name} stats: ${totalFound} found, ${totalSaved} saved, ` +
				`${totalFilteredEarlyCareer} filtered (early-career), ${totalFilteredProcessor} filtered (processor), ` +
				`${totalFilteredValidation} filtered (validation)`,
		);
	}

	return totalSaved;
}

/**
 * Main scraper function
 */
async function scrapeJooble() {
	const supabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
	const supabaseKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.error(
			"[Jooble] ❌ Supabase credentials not set. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
		);
		return;
	}

	const apiKey = process.env.JOOBLE_API_KEY || "";
	if (!apiKey) {
		console.error(
			"[Jooble] ❌ JOOBLE_API_KEY not set. Please set the JOOBLE_API_KEY environment variable.",
		);
		return;
	}

	const startTime = Date.now();
	console.log("[Jooble] 🚀 Starting scrape...");

	// Create Supabase client
	const supabase = createClient(supabaseUrl, supabaseKey);

	const queries = generateSearchQueries();

	// CONSERVATIVE SCALING: Reduced to 8 queries to fit within 240s cron timeout
	// Jooble API: 15 cities × 8 queries × 3 pages = ~360 safe requests per run
	// Timeline: 360 × (1.5s delay + ~1-2s fetch) = ~900 seconds ideal, ~300-400s realistic with batching
	// Rate limit: 1.5s delays between requests (prevents throttling)
	// Rotation: 3 query sets (SET_A, SET_B, SET_C) rotate every 8 hours for variety
	const limitedQueries = queries.slice(0, 8); // 8 queries per run (balanced for timeout)

	let totalSaved = 0;
	let errors = 0;

	// Scrape each city + keyword combo
	for (const city of CITIES) {
		for (const keyword of limitedQueries) {
			try {
				const saved = await scrapeJoobleQuery(keyword, city, supabase, apiKey);
				totalSaved += saved;

				// CRITICAL: Rate limiting 2 seconds between queries to prevent 429 rate limit errors
				// 15 cities × 8 queries × 3 pages × 2s = ~960 seconds ideal, but batching reduces actual time
				// Plus query time: reasonable within timeout with proper backoff
				// If scraper times out before completion, it will gracefully exit
				// Increased from 1500ms to 2000ms to prevent 429 errors (was getting 3+ errors per run)
				await new Promise((resolve) => setTimeout(resolve, 2000));
			} catch (error) {
				console.error(
					`[Jooble] Error with ${keyword} in ${city.name}:`,
					error.message,
				);
				errors++;

				// Fail fast on critical errors to prevent timeouts
				if (
					error.message.includes("timed out") ||
					error.message.includes("API key missing") ||
					error.message.includes("ECONNREFUSED") ||
					error.message.includes("ENOTFOUND") ||
					error.message.includes("AbortError")
				) {
					console.error(
						`[Jooble] Critical error detected (${error.message}), stopping ${city.name} processing`,
					);
					break; // Stop processing this city
				}
			}
		}
	}

	const duration = Date.now() - startTime;

	// Record telemetry
	recordScraperRun("jooble", totalSaved, duration, errors);

	console.log(
		`[Jooble] ✅ Complete: ${totalSaved} jobs saved in ${(duration / 1000).toFixed(1)}s`,
	);
}

// Run if called directly
if (require.main === module) {
	scrapeJooble()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("[Jooble] Fatal error:", error);
			process.exit(1);
		});
}

module.exports = { scrapeJooble };

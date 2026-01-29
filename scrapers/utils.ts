/**
 * Scraper Helper Functions (TypeScript ESM)
 * Shared utilities for TS scrapers run via tsx
 */

export interface IngestJob {
	title: string;
	company: string;
	location: string;
	description: string;
	url: string;
	source: string;
	posted_at?: string;
}

/**
 * Normalize a string for classification (lowercase, trim)
 */
function normalizeString(str: string | undefined): string {
	return (str || "").toLowerCase().trim();
}

/**
 * Classify job into one of three early-career categories
 * Returns object with three mutually-exclusive flags
 * PRODUCTION-READY: Fixed false positives (analyst, assistant), weak senior detection, and boilerplate pollution
 */
export function classifyEarlyCareer(job: IngestJob): {
	is_internship: boolean;
	is_graduate: boolean;
	is_early_career: boolean;
} {
	const title = normalizeString(job?.title);
	const description = normalizeString(job?.description);

	if (!title.trim()) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// ===== CHECK FOR INTERNSHIPS FIRST =====
	// Internship/placement patterns (highest priority)
	const internshipPatterns =
		/\b(intern|internship|placement|spring\s+intern|summer\s+intern|work\s+experience|industrial\s+placement|sandwich\s+placement)\b/i;
	if (internshipPatterns.test(title) || internshipPatterns.test(description.slice(0, 500))) {
		// But NOT if PhD required
		const phdRequired = /(phd|doctorate)\s+(required|preferred|needed|candidate)/i;
		if (!phdRequired.test(title) && !phdRequired.test(description.slice(0, 500))) {
			return { is_internship: true, is_graduate: false, is_early_career: false };
		}
	}

	// ===== CHECK FOR GRADUATE SCHEMES =====
	// Graduate/trainee program patterns
	const graduatePatterns =
		/\b(graduate\s+(?:scheme|program|programme|trainee|development|role)|management\s+trainee|trainee\s+programme|trainee\s+program|rotational\s+program|apprentice|apprenticeship|new\s+grad|recent\s+graduate)\b/i;
	if (graduatePatterns.test(title) || graduatePatterns.test(description.slice(0, 500))) {
		// But NOT if PhD required
		const phdRequired = /(phd|doctorate)\s+(required|preferred|needed|candidate)/i;
		if (!phdRequired.test(title) && !phdRequired.test(description.slice(0, 500))) {
			return { is_internship: false, is_graduate: true, is_early_career: false };
		}
	}

	// ===== HARD REJECTIONS =====
	// Senior/Leadership titles - IMMEDIATE REJECT
	const seniorTitles =
		/\b(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\b/i;
	if (seniorTitles.test(title)) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// PhD/Doctorate is HARD REJECT
	const phdRequired = /(phd|doctorate)\s+(required|preferred|needed|candidate)/i;
	if (phdRequired.test(title) || phdRequired.test(description.slice(0, 500))) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// Professional qualifications (non-PhD) required - REJECT
	const otherQualificationRequired =
		/(cpa|cfa|chartered|qualified|licen[cs]ed|mba\s+(?:required|preferred)|master['']?s\s+(?:required|preferred))/i;
	if (
		otherQualificationRequired.test(title) ||
		otherQualificationRequired.test(description.slice(0, 500))
	) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// Experience requirements - REJECT
	const experienceRequired =
		/\b(minimum|min\.?|at\s+least|plus|\+)\s*(2|3|4|5|6|7|8|9|10)\+?\s*(years?|yrs?|ans|años|jahre|anni|年|年以上)\b/i;
	const firstPartDescription = description.slice(0, 500);
	if (experienceRequired.test(title) || experienceRequired.test(firstPartDescription)) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// Proven track record / extensive experience - REJECT
	const seniorPhrases =
		/\b(proven\s+track\s+record|extensive\s+experience|significant\s+experience|seasoned\s+professional|expert\s+in)\b/i;
	if (seniorPhrases.test(firstPartDescription)) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// Explicitly says NOT for beginners/graduates
	const notForJuniors =
		/\b(not\s+(?:suitable\s+)?for|not\s+an?|no\s+entry.?level|will\s+not\s+(?:consider|accept)|cannot\s+(?:hire|accept))\s+(?:\w+\s+)?(beginners|graduates?|entry|junior|inexperienced|candidates?)/i;
	if (notForJuniors.test(description.slice(0, 500))) {
		return { is_internship: false, is_graduate: false, is_early_career: false };
	}

	// ===== CHECK FOR JUNIOR/ENTRY-LEVEL =====
	const earlyCareerKeywords =
		/\b(junior|entry\s+level|entry-level|new\s+grad|recent\s+graduate|campus\s+hire|rotational\s+program|fellowship|d[ée]butant|absolvent|reci[eé]n\s+titulado|joven\s+profesional|nivel\s+inicial|puesto\s+de\s+entrada)\b/i;
	if (earlyCareerKeywords.test(title)) {
		return { is_internship: false, is_graduate: false, is_early_career: true };
	}

	// ===== CONTEXTUAL ANALYST/ASSISTANT ROLES =====
	const ambiguousTitles = /\b(analyst|assistant|associate|coordinator)\b/i;
	if (ambiguousTitles.test(title)) {
		const earlyContext = description.slice(0, 300);
		const hasEarlyCareerContext =
			/(graduate|entry\s+level|no\s+experience|0-2\s+years|training\s+provided|learn\s+on\s+the\s+job|perfect\s+for\s+graduates)/i;

		if (hasEarlyCareerContext.test(earlyContext)) {
			return { is_internship: false, is_graduate: false, is_early_career: true };
		}

		if (experienceRequired.test(earlyContext)) {
			return { is_internship: false, is_graduate: false, is_early_career: false };
		}

		// Default for ambiguous: accept as early career
		return { is_internship: false, is_graduate: false, is_early_career: true };
	}

	// ===== DESCRIPTION CHECK (LAST RESORT) =====
	const descStart = description.slice(0, 300);
	if (internshipPatterns.test(descStart)) {
		return { is_internship: true, is_graduate: false, is_early_career: false };
	}

	if (graduatePatterns.test(descStart)) {
		return { is_internship: false, is_graduate: true, is_early_career: false };
	}

	if (earlyCareerKeywords.test(descStart)) {
		return { is_internship: false, is_graduate: false, is_early_career: true };
	}

	// Default: not early career
	return { is_internship: false, is_graduate: false, is_early_career: false };
}

/**
 * Infer the role/career path from job title and description
 */
export function inferRole(job: IngestJob): string {
	const { title, description } = job;
	const text = `${title} ${description}`.toLowerCase();

	// Role mappings
	const rolePatterns = [
		{
			pattern: /software\s+(?:engineer|developer|programmer)/i,
			role: "software-engineering",
		},
		{ pattern: /data\s+(?:scientist|analyst|engineer)/i, role: "data-science" },
		{ pattern: /product\s+(?:manager|owner)/i, role: "product-management" },
		{ pattern: /marketing/i, role: "marketing" },
		{ pattern: /sales/i, role: "sales" },
		{ pattern: /design(?:er)?/i, role: "design" },
		{ pattern: /finance/i, role: "finance" },
		{ pattern: /hr|human\s+resources/i, role: "hr" },
		{ pattern: /operations/i, role: "operations" },
		{ pattern: /consultant/i, role: "consulting" },
		{ pattern: /research/i, role: "research" },
		{
			pattern: /business\s+(?:analyst|intelligence)/i,
			role: "business-analytics",
		},
		{ pattern: /devops/i, role: "devops" },
		{ pattern: /frontend/i, role: "frontend-development" },
		{ pattern: /backend/i, role: "backend-development" },
		{ pattern: /full\s+stack/i, role: "full-stack-development" },
		{ pattern: /mobile\s+(?:developer|engineer)/i, role: "mobile-development" },
		{ pattern: /qa|quality\s+assurance|test/i, role: "quality-assurance" },
		{ pattern: /security/i, role: "cybersecurity" },
		{ pattern: /ai|machine\s+learning|ml/i, role: "ai-ml" },
	];

	// Find the first matching role pattern
	for (const { pattern, role } of rolePatterns) {
		if (pattern.test(text)) {
			return role;
		}
	}

	// Default to general if no specific role is found
	return "general";
}

/**
 * Parse and standardize location information
 */
export function parseLocation(location: string): {
	city: string;
	country: string;
	isRemote: boolean;
	isEU: boolean;
} {
	const loc = location.toLowerCase().trim();

	// Check for remote indicators
	const isRemote = /remote|work\s+from\s+home|wfh|anywhere/i.test(loc);

	// EU countries + UK, Switzerland, Norway
	const euCountries = [
		"austria",
		"belgium",
		"bulgaria",
		"croatia",
		"cyprus",
		"czech republic",
		"denmark",
		"estonia",
		"finland",
		"france",
		"germany",
		"greece",
		"hungary",
		"ireland",
		"italy",
		"latvia",
		"lithuania",
		"luxembourg",
		"malta",
		"netherlands",
		"poland",
		"portugal",
		"romania",
		"slovakia",
		"slovenia",
		"spain",
		"sweden",
		"united kingdom",
		"uk",
		"gb",
		"great britain",
		"england",
		"scotland",
		"wales",
		"northern ireland",
		"switzerland",
		"ch",
		"norway",
		"no",
	];

	// Known EU/UK/CH city names to infer EU when country is absent
	const euCities = new Set([
		"london",
		"manchester",
		"birmingham",
		"edinburgh",
		"glasgow",
		"leeds",
		"liverpool",
		"dublin",
		"cork",
		"galway",
		"berlin",
		"munich",
		"hamburg",
		"cologne",
		"frankfurt",
		"stuttgart",
		"düsseldorf",
		"duesseldorf",
		"paris",
		"marseille",
		"lyon",
		"toulouse",
		"nice",
		"nantes",
		"strasbourg",
		"madrid",
		"barcelona",
		"valencia",
		"seville",
		"bilbao",
		"mlaga",
		"malaga",
		"rome",
		"milan",
		"naples",
		"turin",
		"florence",
		"bologna",
		"amsterdam",
		"rotterdam",
		"the hague",
		"den haag",
		"utrecht",
		"eindhoven",
		"brussels",
		"antwerp",
		"ghent",
		"bruges",
		"vienna",
		"salzburg",
		"graz",
		"innsbruck",
		"zurich",
		"geneva",
		"basel",
		"bern",
		"lausanne",
		"stockholm",
		"gothenburg",
		"goteborg",
		"malmö",
		"malmo",
		"uppsala",
		"copenhagen",
		"aarhus",
		"odense",
		"aalborg",
		"oslo",
		"bergen",
		"trondheim",
		"stavanger",
		"helsinki",
		"espoo",
		"tampere",
		"vantaa",
		"warsaw",
		"krakow",
		"gdansk",
		"wroclaw",
		"poznan",
		"wrocław",
		"pozna",
		"prague",
		"brno",
		"ostrava",
		"plzen",
		"plzeň",
		"budapest",
		"debrecen",
		"szeged",
		"miskolc",
		"lisbon",
		"porto",
		"braga",
		"coimbra",
		"athens",
		"thessaloniki",
		"patras",
		"heraklion",
	]);

	// Check if location contains EU country
	let isEU = euCountries.some((country) => loc.includes(country));

	// Extract city and country using comma separation first
	const parts = loc
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
	const city = parts.length > 0 ? parts[0] : loc;
	let country = parts.length > 1 ? parts[parts.length - 1] : "";
	// If there's only one part and it's a known city, leave country empty to allow EU city inference
	if (parts.length === 1 && euCities.has(city)) {
		country = "";
	}

	// If country was not detected but city is a known EU city, mark as EU
	if (!isEU && country.length === 0) {
		const cityOnly = city.replace(/\s+/g, " ").trim();
		if (euCities.has(cityOnly)) {
			isEU = true;
		}
	}

	return {
		city: city || location,
		country: country,
		isRemote,
		isEU, // Never treat remote as EU; remote must be excluded by policy
	};
}

/**
 * Generate a consistent job hash for deduplication
 */
export function makeJobHash(job: IngestJob): string {
	const { title, company, location } = job;

	// Normalize the data
	const normalizedTitle = title.toLowerCase().trim().replace(/\s+/g, " ");
	const normalizedCompany = company.toLowerCase().trim().replace(/\s+/g, " ");
	const normalizedLocation = location.toLowerCase().trim().replace(/\s+/g, " ");

	// Create hash string
	const hashString = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;

	// Simple hash function (in production, you might want to use crypto)
	let hash = 0;
	for (let i = 0; i < hashString.length; i++) {
		const char = hashString.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(36);
}

/**
 * Validate if a job meets basic requirements
 */
export function validateJob(job: IngestJob): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!job.title || job.title.trim().length === 0) {
		errors.push("Title is required");
	}

	if (!job.company || job.company.trim().length === 0) {
		errors.push("Company is required");
	}

	if (!job.location || job.location.trim().length === 0) {
		errors.push("Location is required");
	}

	if (!job.description || job.description.trim().length === 0) {
		errors.push("Description is required");
	}

	if (!job.url || job.url.trim().length === 0) {
		errors.push("URL is required");
	}

	if (!job.source || job.source.trim().length === 0) {
		errors.push("Source is required");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Convert IngestJob to the format expected by the database
 */
export function convertToDatabaseFormat(job: IngestJob) {
	const { city, country, isRemote, isEU } = parseLocation(job.location);
	const classification = classifyEarlyCareer(job);
	const jobHash = makeJobHash(job);

	// Determine if any early-career flag is set
	const isEarlyCareerJob = classification.is_internship || classification.is_graduate || classification.is_early_career;

	//  Log classification for debugging
	console.log(
		` Classification: "${job.title}" - internship: ${classification.is_internship}, graduate: ${classification.is_graduate}, early_career: ${classification.is_early_career}`,
	);

	// CRITICAL: Always set company_name from company
	const companyName = job.company.trim();

	return {
		job_hash: jobHash,
		title: job.title.trim(),
		company: companyName,
		company_name: companyName, // CRITICAL: Always set company_name
		location: job.location.trim(),
		description: job.description.trim(),
		job_url: job.url.trim(),
		source: job.source.trim(),
		posted_at: job.posted_at || new Date().toISOString(),
		categories: [isEarlyCareerJob ? "early-career" : "experienced"],
		work_environment: isRemote ? "remote" : "on-site",
		experience_required: isEarlyCareerJob ? "entry-level" : "experienced",
		is_internship: classification.is_internship,
		is_graduate: classification.is_graduate,
		is_early_career: classification.is_early_career,
		company_profile_url: "",
		language_requirements: [],
		scrape_timestamp: new Date().toISOString(),
		original_posted_date: job.posted_at || new Date().toISOString(),
		last_seen_at: new Date().toISOString(),
		is_active: true,
		created_at: new Date().toISOString(),
		// Additional metadata
		metadata: {
			city,
			country,
			isRemote,
			isEU,
			isEarlyCareer: isEarlyCareerJob,
			parsedAt: new Date().toISOString(),
		},
	};
}

/**
 * Check if a job should be saved based on the north-star rule
 * "If it's early-career and in Europe, save it"
 */
export function shouldSaveJob(job: IngestJob): boolean {
	const { isEU } = parseLocation(job.location);
	const classification = classifyEarlyCareer(job);

	// North-star rule: save if early-career (any flag) and in Europe
	const isEarlyCareer = classification.is_internship || classification.is_graduate || classification.is_early_career;
	return isEarlyCareer && isEU;
}

/**
 * Helper function for tests: Check if a job is any type of early-career
 */
export function isEarlyCareerJob(job: IngestJob): boolean {
	const classification = classifyEarlyCareer(job);
	return classification.is_internship || classification.is_graduate || classification.is_early_career;
}

/**
 * Log job processing for debugging
 */
export function logJobProcessing(
	job: IngestJob,
	action: string,
	details?: any,
) {
	const { isEU } = parseLocation(job.location);
	const classification = classifyEarlyCareer(job);

	console.log(`[${action}] ${job.company} - ${job.title}`);
	console.log(`  Location: ${job.location} (EU: ${isEU})`);
	console.log(`  Classification: internship: ${classification.is_internship}, graduate: ${classification.is_graduate}, early_career: ${classification.is_early_career}`);
	console.log(`  Should Save: ${shouldSaveJob(job)}`);

	if (details) {
		console.log(`  Details:`, details);
	}
}

// Job boards/aggregators to filter out (NOT recruitment agencies)
const JOB_BOARDS = [
	"reed",
	"indeed",
	"linkedin",
	"adzuna",
	"totaljobs",
	"monster",
	"ziprecruiter",
	"jobspy",
	"google",
	"glassdoor",
	"careerjet",
	"jooble",
	"arbeitnow",
	"efinancial",
	"stepstone",
	"reed.co.uk",
	"indeed.com",
	"linkedin.com",
	"adzuna.co.uk",
	"totaljobs.com",
	"glassdoor.com",
	"careerjet.com",
	"monster.com",
	"ziprecruiter.com",
	"stepstone.com",
];

const COUNTRY_NAMES = [
	"espana",
	"deutschland",
	"osterreich",
	"nederland",
	"belgique",
	"united kingdom",
	"uk",
	"usa",
	"us",
	"france",
	"germany",
	"spain",
	"austria",
	"netherlands",
	"belgium",
	"ireland",
	"schweiz",
	"switzerland",
	"italia",
	"italy",
	"poland",
	"polska",
	"denmark",
	"danmark",
	"sweden",
	"sverige",
	"czech republic",
	"czechia",
];

/**
 * Validate a job before saving to database
 */
function validateJob(job) {
	const errors = [];
	const warnings = [];

	// EXTREMELY LENIENT: Provide fallbacks for ALL sources to ensure jobs are only rejected due to duplicates
	// Only reject if job_hash is missing (which would prevent duplicate detection)

	// ALWAYS provide fallbacks - never reject due to missing data
	if (!job.title || job.title.trim().length === 0) {
		job.title = "Job Opportunity"; // Fallback title
		warnings.push("Auto-fixed: Used fallback title for missing title");
	}

	if (!job.company || job.company.trim().length === 0) {
		job.company = "Company Not Specified"; // Fallback company
		warnings.push("Auto-fixed: Used fallback company for missing company");
	}

	// CRITICAL: job_hash is required for duplicate detection - this is the ONLY rejection reason allowed
	if (!job.job_hash || job.job_hash.trim().length === 0) {
		errors.push("Missing job_hash"); // Hash is always required for deduplication
	}

	// Always provide URL fallback
	if (!job.job_url || job.job_url.trim().length === 0) {
		if (job.url) {
			job.job_url = job.url; // Use url field as fallback
			warnings.push("Auto-fixed: Used url field as job_url");
		} else {
			job.job_url = "#"; // Placeholder URL
			warnings.push("Auto-fixed: Used placeholder URL for missing job_url");
		}
	}

	// Always provide company_name fallback
	if (!job.company_name || job.company_name.trim().length === 0) {
		job.company_name = job.company || "Company Not Specified";
		warnings.push("Auto-fixed: Used fallback company_name");
	}

	// WARNING: Job board detection (don't reject - let duplicate detection handle it)
	const companyLower = (job.company || "").toLowerCase();
	const companyNameLower = (job.company_name || "").toLowerCase();
	const isJobBoard = JOB_BOARDS.some(
		(board) => companyLower.includes(board) || companyNameLower.includes(board),
	);

	if (isJobBoard) {
		warnings.push(
			`Job board detected: ${job.company} - allowing for cross-source deduplication`,
		);
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		job: errors.length === 0 ? job : null, // Return fixed job if valid
	};
}

/**
 * Validate and fix a batch of jobs
 * Returns { valid: [], invalid: [], stats: {} }
 */
function validateJobs(jobs) {
	const valid = [];
	const invalid = [];
	const stats = {
		total: jobs.length,
		valid: 0,
		invalid: 0,
		autoFixed: 0,
		errors: {},
		warnings: {},
	};

	for (const job of jobs) {
		const result = validateJob(job);

		if (result.valid) {
			valid.push(result.job);
			stats.valid++;
			if (result.warnings.length > 0) {
				stats.autoFixed++;
			}
		} else {
			invalid.push({ job, errors: result.errors, warnings: result.warnings });
			stats.invalid++;

			// Track error types
			result.errors.forEach((error) => {
				const errorType = error.split(":")[0];
				stats.errors[errorType] = (stats.errors[errorType] || 0) + 1;
			});
		}

		// Track warning types
		result.warnings.forEach((warning) => {
			const warningType = warning.split(":")[0];
			stats.warnings[warningType] = (stats.warnings[warningType] || 0) + 1;
		});
	}

	return { valid, invalid, stats };
}

module.exports = {
	validateJob,
	validateJobs,
	JOB_BOARDS,
	COUNTRY_NAMES,
};

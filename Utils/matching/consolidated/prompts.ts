/**
 * Prompts Domain - GPT-4o-mini system/user instructions and AI API calls
 * Extracted from consolidatedMatchingV2.ts for better organization
 */

import type OpenAI from "openai";
import type { ParsedMatch } from "@/lib/types";
import type { Job } from "@/scrapers/types";
import { enrichJobData } from "../job-enrichment.service";
import type { JobMatch, UserPreferences } from "../types";
import { JOBS_TO_ANALYZE_FREE, JOBS_TO_ANALYZE_PREMIUM } from "./config";

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize text for safe inclusion in AI prompts
 * Prevents prompt injection and ensures clean output
 */
function sanitizeForPrompt(text: string | undefined | null): string {
	if (!text || typeof text !== "string") return "";

	// Remove or escape potentially dangerous characters
	return (
		text
			// Remove null bytes and other control characters
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Control characters are intentionally filtered for security
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
			// Escape backticks and curly braces that could break prompt structure
			.replace(/[`{}]/g, (match) => `\\${match}`)
			// Normalize whitespace
			.replace(/\s+/g, " ")
			// Remove extremely long words (potential attacks)
			.replace(/\b\w{100,}\b/g, "[LONG_WORD_REMOVED]")
			// Limit total length to prevent token bloat
			.substring(0, 1000)
			.trim()
	);
}

/**
 * Sanitize user preferences for prompt inclusion
 */
function sanitizeUserPreferences(userPrefs: UserPreferences): {
	email: string;
	target_cities: string;
	career_path: string;
	roles_selected: string;
	work_environment: string;
	visa_status: string;
	entry_level_preference: string;
	languages_spoken: string;
	skills: string;
	industries: string;
	company_size_preference: string;
	career_keywords: string;
} {
	return {
		email: sanitizeForPrompt(userPrefs.email),
		target_cities: Array.isArray(userPrefs.target_cities)
			? userPrefs.target_cities.map(sanitizeForPrompt).join(", ")
			: sanitizeForPrompt(userPrefs.target_cities),
		career_path: Array.isArray(userPrefs.career_path)
			? userPrefs.career_path.map(sanitizeForPrompt).join(", ")
			: sanitizeForPrompt(userPrefs.career_path),
		roles_selected: Array.isArray(userPrefs.roles_selected)
			? userPrefs.roles_selected.map(sanitizeForPrompt).join(", ")
			: sanitizeForPrompt(userPrefs.roles_selected),
		work_environment: sanitizeForPrompt(userPrefs.work_environment),
		visa_status: sanitizeForPrompt(userPrefs.visa_status),
		entry_level_preference: sanitizeForPrompt(userPrefs.entry_level_preference),
		languages_spoken: Array.isArray(userPrefs.languages_spoken)
			? userPrefs.languages_spoken.map(sanitizeForPrompt).join(", ")
			: sanitizeForPrompt(userPrefs.languages_spoken),
		skills: Array.isArray(userPrefs.skills)
			? userPrefs.skills.map(sanitizeForPrompt).join(", ")
			: sanitizeForPrompt(userPrefs.skills),
		industries: Array.isArray(userPrefs.industries)
			? userPrefs.industries.map(sanitizeForPrompt).join(", ")
			: sanitizeForPrompt(userPrefs.industries),
		company_size_preference: sanitizeForPrompt(
			userPrefs.company_size_preference,
		),
		career_keywords: sanitizeForPrompt(userPrefs.career_keywords),
	};
}

// ============================================
// PROMPT BUILDING
// ============================================

/**
 * Free tier prompt - Simple, fast matching for quick results
 * Focuses on core requirements and immediate job fit
 */
export function buildFreeTierPrompt(
	jobs: Job[],
	userPrefs: UserPreferences,
): string {
	const jobsArray = Array.isArray(jobs) ? jobs : [];

	// Sanitize all user inputs to prevent prompt injection
	const safePrefs = sanitizeUserPreferences(userPrefs);

	const jobsToAnalyze = JOBS_TO_ANALYZE_FREE;

	// Handle array fields properly - these can be arrays or single values
	const userCities = safePrefs.target_cities || "Europe";
	const userCareer = Array.isArray(safePrefs.career_path)
		? safePrefs.career_path.join(", ")
		: safePrefs.career_path || "Graduate";
	const userLevel = safePrefs.entry_level_preference || "entry-level";

	const languages = Array.isArray(safePrefs.languages_spoken)
		? safePrefs.languages_spoken.join(", ")
		: safePrefs.languages_spoken || "";
	const roles = Array.isArray(safePrefs.roles_selected)
		? safePrefs.roles_selected.join(", ")
		: safePrefs.roles_selected || "";
	const careerPaths = Array.isArray(safePrefs.career_path)
		? safePrefs.career_path.join(", ")
		: safePrefs.career_path || "";
	const workEnv = safePrefs.work_environment || "";
	const industries = Array.isArray(safePrefs.industries)
		? safePrefs.industries.join(", ")
		: safePrefs.industries || "";
	const skills = Array.isArray(safePrefs.skills)
		? safePrefs.skills.join(", ")
		: safePrefs.skills || "";
	const careerKeywords = safePrefs.career_keywords || "";
	const companySize = safePrefs.company_size_preference || "";

	// Include legacy fields that are valuable for matching
	const professionalExpertise = userPrefs.professional_expertise || "";
	const companyTypes = Array.isArray(userPrefs.company_types)
		? userPrefs.company_types.join(", ")
		: userPrefs.company_types || "";

	// Check if user needs visa sponsorship
	const visaStatus = userPrefs.visa_status?.toLowerCase() || "";
	const needsVisaSponsorship =
		(visaStatus.includes("non-eu") && !visaStatus.includes("non-eu citizen")) ||
		(visaStatus.includes("non-uk") && !visaStatus.includes("non-uk citizen")) ||
		visaStatus.includes("require sponsorship") ||
		visaStatus.includes("need_sponsorship") ||
		visaStatus.includes("visa-required") ||
		(visaStatus.includes("sponsorship") &&
			!visaStatus.includes("eu") &&
			!visaStatus.includes("uk citizen")) ||
		(!visaStatus.includes("eu-citizen") &&
			!visaStatus.includes("eu citizen") &&
			!visaStatus.includes("uk citizen") &&
			!visaStatus.includes("eea citizen") &&
			!visaStatus.includes("swiss citizen") &&
			!visaStatus.includes("citizen") &&
			!visaStatus.includes("permanent") &&
			visaStatus.length > 0);

	const topJobs = jobsArray.slice(0, jobsToAnalyze);

	const jobListParts: string[] = [];
	for (let i = 0; i < topJobs.length; i++) {
		const job = topJobs[i];

		// Enrich job with additional metadata for better AI analysis
		const enrichedJob = enrichJobData(job);

		// Include job description for AI analysis (truncated for token efficiency)
		const description = job.description
			? job.description.substring(0, 200).replace(/\s+/g, " ").trim() +
				(job.description.length > 200 ? "..." : "")
			: "No description available";

		// Include enriched metadata for AI analysis with clear explanations
		const enrichedData = [
			enrichedJob.experienceLevel
				? `Experience Level: ${enrichedJob.experienceLevel} (entry/junior/mid/senior)`
				: null,
			enrichedJob.companySize
				? `Company Size: ${enrichedJob.companySize} (startup/scaleup/enterprise)`
				: null,
			enrichedJob.growthPotential
				? `Growth Potential: ${enrichedJob.growthPotential}/10 (career advancement opportunities)`
				: null,
			enrichedJob.culturalFit
				? `Culture Score: ${enrichedJob.culturalFit}/10 (work environment alignment)`
				: null,
			enrichedJob.visaFriendly !== undefined
				? `Visa Sponsorship: ${enrichedJob.visaFriendly ? "Likely Available" : "Unknown"}`
				: null,
			job.work_environment
				? `Work Environment: ${job.work_environment} (remote/hybrid/on-site)`
				: null,
			job.is_internship
				? `Internship: Yes`
				: job.is_graduate
					? `Graduate Program: Yes`
					: job.is_early_career
						? `Early Career Focus: Yes`
						: null,
		]
			.filter(Boolean)
			.join(" | ");

		jobListParts.push(
			`${i + 1}. [${job.job_hash}] ${job.title} @ ${job.company} | ${job.location}\n` +
				`   Description: ${description}` +
				(enrichedData ? `\n   Enriched Data: ${enrichedData}` : ""),
		);
	}
	const jobList = jobListParts.join("\n\n");

	return `### USER PROFILE
- Experience Level: ${userLevel} (entry/mid/senior preference)
- Professional Background: ${userCareer} (primary career interests)
${professionalExpertise ? `- Self-Reported Expertise: ${professionalExpertise}` : ""}
${companyTypes ? `- Preferred Company Cultures: ${companyTypes}` : ""}
- Target Locations: ${userCities} (cities where user wants to work)
${languages ? `- Languages Spoken: ${languages}` : ""}
${roles ? `- Target Job Titles/Roles: ${roles}` : ""}
${careerPaths ? `- Career Paths: ${careerPaths}` : ""}
${workEnv ? `- Preferred Work Environment: ${workEnv} (remote/hybrid/on-site)` : ""}
${industries ? `- Preferred Industries: ${industries}` : ""}
${skills ? `- Technical Skills: ${skills}` : ""}
${companySize ? `- Company Size Preference: ${companySize}` : ""}
${careerKeywords ? `- Career Keywords: ${careerKeywords}` : ""}
${needsVisaSponsorship ? `- Visa Status: Requires sponsorship (non-EU citizen)` : ""}

### AVAILABLE JOBS
${jobList}

---

## IMPORTANT CONTEXT
All jobs listed above have ALREADY PASSED basic requirement filters:
- ✅ Location verified (in user's target cities)
- ✅ Visa requirements met (if needed)
- ✅ Language requirements compatible
- ✅ Basic eligibility confirmed

---

## JOBPING FREE TIER MATCHING

You are JobPing's graduate career specialist. Focus on identifying the top 5 most relevant career opportunities that create immediate value for recent graduates and entry-level professionals.

### CORE ASSESSMENT CRITERIA:
1. **EXPERIENCE ALIGNMENT**: Match job's Experience Level (entry/junior/mid/senior) against user's entry_level_preference
2. **COMPANY SIZE FIT**: Compare job's Company Size (startup/scaleup/enterprise) against user's company_size_preference
3. **GROWTH POTENTIAL**: Evaluate job's Growth Potential score (1-10) for career advancement opportunities
4. **CULTURAL ALIGNMENT**: Assess job's Culture Score (1-10) against user's preferred company cultures and work environment
5. **VISA COMPATIBILITY**: Check job's Visa Sponsorship status against user's visa requirements
6. **DESCRIPTION ANALYSIS**: Analyze full job descriptions for specific requirements, skills, and career opportunities
7. **EARLY CAREER FOCUS**: Prioritize jobs marked as internships, graduate programs, or early-career focused

### EVIDENCE SCALE:
**DIRECT**: Explicit mentions ("mentorship program", "training")
**INDIRECT**: Strong indicators ("senior team", "learning environment")
**INFERRED**: Reasonable assumptions ("small team" → "likely mentorship")

### ACCURACY REQUIREMENTS:
- Cite specific job text for all claims
- Use "likely/typically" for inferences only
- Never fabricate unmentioned benefits
- Confidence ≥ 0.6 minimum

### SCORING:
- 4+ indicators: 90-100
- 3 indicators: 80-89
- 2 indicators: 70-79
- 1 indicator: 60-69
- None: 50-59

### ENGAGEMENT:
Connect evidence to user's career goals. Use aspirational language grounded in facts.

### CONFIDENCE CALIBRATION:
- **0.9-1.0**: Multiple explicit indicators + strong evidence
- **0.7-0.89**: Good explicit evidence + reasonable context
- **0.5-0.69**: Limited explicit evidence, heavy inference
- **<0.5**: Insufficient evidence (don't recommend)

---

## ASSESSMENT REQUIREMENTS:

**REASONING STRUCTURE:**
Evidence → Career Impact → User Goals

**LENGTH REQUIREMENTS:**
- 85+ scores: 25+ words (clear insight)
- 75-84 scores: 20+ words (balanced assessment)
- 65-74 scores: 15+ words (honest evaluation)
- <65 scores: 12+ words (brief evaluation)

---

## OUTPUT FORMAT
Return a JSON array of your top 5 career matches with evidence-based reasoning.

Format:
\`\`\`json
[
  {
    "job_index": 1,
    "job_hash": "actual-hash-from-list",
    "match_score": 85,
    "confidence_score": 0.9,
    "match_reason": "Evidence-based career insight connecting job features to their professional aspirations."
  }
]
\`\`\`

Requirements:
- **job_index**: Position in the job list (1-${jobsToAnalyze})
- **job_hash**: Exact hash from the job list above
- **match_score**: 50-100 based on evidence hierarchy
- **confidence_score**: 0.0-1.0 (certainty of assessment)
- **match_reason**: Evidence → Insight → Aspiration structure
- **Return 5 matches** ordered by evidence strength
- **Only include matches** where confidence_score ≥ 0.6
- **Valid JSON only** - no markdown or extra text`;
}

/**
 * Premium tier prompt - Comprehensive, deep analysis for serious job seekers
 * Provides enhanced insights with additional career data and detailed matching
 */
export function buildPremiumTierPrompt(
	jobs: Job[],
	userPrefs: UserPreferences,
): string {
	const jobsArray = Array.isArray(jobs) ? jobs : [];

	// Sanitize all user inputs to prevent prompt injection
	const safePrefs = sanitizeUserPreferences(userPrefs);

	const jobsToAnalyze = JOBS_TO_ANALYZE_PREMIUM;

	// Handle array fields properly - these can be arrays or single values
	const userCities = safePrefs.target_cities || "Europe";
	const userCareer = Array.isArray(safePrefs.career_path)
		? safePrefs.career_path.join(", ")
		: safePrefs.career_path || "Graduate";
	const userLevel = safePrefs.entry_level_preference || "entry-level";

	const languages = Array.isArray(safePrefs.languages_spoken)
		? safePrefs.languages_spoken.join(", ")
		: safePrefs.languages_spoken || "";
	const roles = Array.isArray(safePrefs.roles_selected)
		? safePrefs.roles_selected.join(", ")
		: safePrefs.roles_selected || "";
	const careerPaths = Array.isArray(safePrefs.career_path)
		? safePrefs.career_path.join(", ")
		: safePrefs.career_path || "";
	const workEnv = safePrefs.work_environment || "";
	const industries = Array.isArray(safePrefs.industries)
		? safePrefs.industries.join(", ")
		: safePrefs.industries || "";
	const skills = Array.isArray(safePrefs.skills)
		? safePrefs.skills.join(", ")
		: safePrefs.skills || "";
	const careerKeywords = safePrefs.career_keywords || "";
	const companySize = safePrefs.company_size_preference || "";

	// Include legacy fields that are valuable for matching
	const professionalExpertise = userPrefs.professional_expertise || "";
	const companyTypes = Array.isArray(userPrefs.company_types)
		? userPrefs.company_types.join(", ")
		: userPrefs.company_types || "";

	// Check if user needs visa sponsorship
	const visaStatus = userPrefs.visa_status?.toLowerCase() || "";
	const needsVisaSponsorship =
		(visaStatus.includes("non-eu") && !visaStatus.includes("non-eu citizen")) ||
		(visaStatus.includes("non-uk") && !visaStatus.includes("non-uk citizen")) ||
		visaStatus.includes("require sponsorship") ||
		visaStatus.includes("need_sponsorship") ||
		visaStatus.includes("visa-required") ||
		(visaStatus.includes("sponsorship") &&
			!visaStatus.includes("eu") &&
			!visaStatus.includes("uk citizen")) ||
		(!visaStatus.includes("eu-citizen") &&
			!visaStatus.includes("eu citizen") &&
			!visaStatus.includes("uk citizen") &&
			!visaStatus.includes("eea citizen") &&
			!visaStatus.includes("swiss citizen") &&
			!visaStatus.includes("citizen") &&
			!visaStatus.includes("permanent") &&
			visaStatus.length > 0);

	const topJobs = jobsArray.slice(0, jobsToAnalyze);

	const jobListParts: string[] = [];
	for (let i = 0; i < topJobs.length; i++) {
		const job = topJobs[i];

		// Enrich job with additional metadata for better AI analysis
		const enrichedJob = enrichJobData(job);

		// Include job description for AI analysis (premium gets more context)
		const description = job.description
			? job.description.substring(0, 400).replace(/\s+/g, " ").trim() +
				(job.description.length > 400 ? "..." : "")
			: "No description available";

		// Include enriched metadata for AI analysis with clear explanations
		const enrichedData = [
			enrichedJob.experienceLevel
				? `Experience Level: ${enrichedJob.experienceLevel} (entry/junior/mid/senior)`
				: null,
			enrichedJob.companySize
				? `Company Size: ${enrichedJob.companySize} (startup/scaleup/enterprise)`
				: null,
			enrichedJob.growthPotential
				? `Growth Potential: ${enrichedJob.growthPotential}/10 (career advancement opportunities)`
				: null,
			enrichedJob.culturalFit
				? `Culture Score: ${enrichedJob.culturalFit}/10 (work environment alignment)`
				: null,
			enrichedJob.visaFriendly !== undefined
				? `Visa Sponsorship: ${enrichedJob.visaFriendly ? "Likely Available" : "Unknown"}`
				: null,
			job.work_environment
				? `Work Environment: ${job.work_environment} (remote/hybrid/on-site)`
				: null,
			job.is_internship
				? `Internship: Yes`
				: job.is_graduate
					? `Graduate Program: Yes`
					: job.is_early_career
						? `Early Career Focus: Yes`
						: null,
		]
			.filter(Boolean)
			.join(" | ");

		jobListParts.push(
			`${i + 1}. [${job.job_hash}] ${job.title} @ ${job.company} | ${job.location}\n` +
				`   Description: ${description}` +
				(enrichedData ? `\n   Enriched Data: ${enrichedData}` : ""),
		);
	}
	const jobList = jobListParts.join("\n\n");

	return `### USER PROFILE
- Experience Level: ${userLevel} (entry/mid/senior preference)
- Professional Background: ${userCareer} (primary career interests)
${professionalExpertise ? `- Self-Reported Expertise: ${professionalExpertise}` : ""}
${companyTypes ? `- Preferred Company Cultures: ${companyTypes}` : ""}
- Target Locations: ${userCities} (cities where user wants to work)
${languages ? `- Languages Spoken: ${languages}` : ""}
${roles ? `- Target Job Titles/Roles: ${roles}` : ""}
${careerPaths ? `- Career Paths: ${careerPaths}` : ""}
${workEnv ? `- Preferred Work Environment: ${workEnv} (remote/hybrid/on-site)` : ""}
${industries ? `- Preferred Industries: ${industries}` : ""}
${skills ? `- Technical Skills: ${skills}` : ""}
${companySize ? `- Company Size Preference: ${companySize}` : ""}
${careerKeywords ? `- Career Keywords: ${careerKeywords}` : ""}
${needsVisaSponsorship ? `- Visa Status: Requires sponsorship (non-EU citizen)` : ""}

### AVAILABLE JOBS
${jobList}

---

## IMPORTANT CONTEXT
All jobs listed above have ALREADY PASSED basic requirement filters:
- ✅ Location verified (in user's target cities)
- ✅ Visa requirements met (if needed)
- ✅ Language requirements compatible
- ✅ Basic eligibility confirmed

---

## JOBPING PREMIUM CAREER INSIGHT FRAMEWORK

You are JobPing's graduate career specialist who creates meaningful career connections by demonstrating genuine understanding of professional journeys. Your assessments combine evidence-based evaluation with career insight that resonates emotionally.

### CORE ASSESSMENT CRITERIA:
1. **EXPERIENCE ALIGNMENT**: Match job's Experience Level (entry/junior/mid/senior) against user's entry_level_preference
2. **COMPANY SIZE FIT**: Compare job's Company Size (startup/scaleup/enterprise) against user's company_size_preference
3. **GROWTH POTENTIAL**: Evaluate job's Growth Potential score (1-10) for career advancement opportunities
4. **CULTURAL ALIGNMENT**: Assess job's Culture Score (1-10) against user's preferred company cultures and work environment preferences
5. **VISA COMPATIBILITY**: Check job's Visa Sponsorship likelihood against user's visa requirements
6. **DESCRIPTION ANALYSIS**: Analyze full job descriptions for specific requirements, skills, and career opportunities
7. **MENTORSHIP EVIDENCE**: Direct mentions of guidance, coaching, senior support, or structured development programs
8. **LEARNING OPPORTUNITIES**: Training programs, skill development, educational support, or professional development initiatives
9. **SKILLS ALIGNMENT**: Match job requirements against user's technical skills and self-reported expertise
10. **INDUSTRY FIT**: Consider user's preferred industries and career keywords for sector alignment

### EVIDENCE SCALE:
**DIRECT**: Explicit mentions ("mentorship program", "training")
**INDIRECT**: Strong indicators ("senior team", "learning environment")
**INFERRED**: Reasonable assumptions ("small team" → "likely mentorship")

### ACCURACY REQUIREMENTS:
- Cite specific job text for all claims
- Use "likely/typically" for inferences only
- Never fabricate unmentioned benefits
- Confidence ≥ 0.6 minimum

### SCORING:
- 4+ indicators: 90-100
- 3 indicators: 80-89
- 2 indicators: 70-79
- 1 indicator: 60-69
- None: 50-59

### ENGAGEMENT:
Connect evidence to user's career goals. Use aspirational language grounded in facts.

### CONFIDENCE CALIBRATION:
- **0.9-1.0**: Multiple explicit indicators + strong evidence
- **0.7-0.89**: Good explicit evidence + reasonable context
- **0.5-0.69**: Limited explicit evidence, heavy inference
- **<0.5**: Insufficient evidence (don't recommend)

---

## PREMIUM ANALYSIS REQUIREMENTS:
- Leverage user's self-reported expertise and preferred company cultures for precise matching
- Use industry preferences to identify sector-aligned opportunities
- Apply skill requirements against user's technical background
- Prioritize higher growth score jobs for ambitious users
- Consider company size alignment for preferred work environments
- Higher confidence weight on profile-to-job metadata alignment

---

## ASSESSMENT REQUIREMENTS:

**REASONING STRUCTURE:**
Evidence → Career Impact → User Goals

**LENGTH REQUIREMENTS:**
- 85+ scores: 35+ words (comprehensive insight)
- 75-84 scores: 25+ words (clear reasoning)
- 65-74 scores: 20+ words (balanced assessment)
- <65 scores: 15+ words (honest evaluation)

---

## OUTPUT FORMAT
Return a JSON array of your top 5-7 career matches with evidence-based reasoning.

Format:
\`\`\`json
[
  {
    "job_index": 1,
    "job_hash": "actual-hash-from-list",
    "match_score": 85,
    "confidence_score": 0.9,
    "match_reason": "Evidence-based career insight connecting job features to their professional aspirations. Start with what the job explicitly offers, explain the career significance, and show how it advances their goals."
  }
]
\`\`\`

Requirements:
- **job_index**: Position in the job list (1-${jobsToAnalyze})
- **job_hash**: Exact hash from the job list above
- **match_score**: 50-100 based on evidence hierarchy
- **confidence_score**: 0.0-1.0 (certainty of assessment)
- **match_reason**: Evidence → Insight → Aspiration structure
- **Return 5-7 matches** ordered by evidence strength
- **Only include matches** where confidence_score ≥ 0.6
- **Valid JSON only** - no markdown or extra text`;
}

// ============================================
// AI API CALLS
// ============================================

/**
 * Calculate AI cost in USD based on tokens and model
 */
export function calculateAICost(tokens: number, model: string): number {
	if (model === "gpt-4o-mini") {
		const inputTokens = Math.floor(tokens * 0.8);
		const outputTokens = tokens - inputTokens;
		const inputCost = (inputTokens / 1_000_000) * 0.15;
		const outputCost = (outputTokens / 1_000_000) * 0.6;
		return inputCost + outputCost;
	}
	return 0;
}

/**
 * System message for AI matching
 */
export function getSystemMessage(): string {
	return `You are JobPing's graduate career specialist. You excel at matching recent graduates and entry-level professionals with transformative first roles. Your expertise focuses on CAREER LAUNCHPAD opportunities that accelerate professional growth and shape long-term career trajectories. You understand that graduates need mentorship, learning potential, and cultural fit more than technical perfection. Every match should create that magical "wow" moment where users realize JobPing truly understands their professional journey and aspirations.`;
}

/**
 * Call OpenAI API with function calling and rate limit handling
 * Returns raw ParsedMatch[] that needs to be validated
 */
export async function callOpenAIAPI(
	client: OpenAI,
	jobs: Job[],
	userPrefs: UserPreferences,
	model: "gpt-4o-mini" | "gpt-4" | "gpt-3.5-turbo" = "gpt-4o-mini",
	parseFunction: (matches: ParsedMatch[], jobs: Job[]) => JobMatch[],
): Promise<{
	matches: JobMatch[];
	tokens: number;
	cost: number;
}> {
	const jobsArray = Array.isArray(jobs) ? jobs : [];

	// Choose appropriate prompt based on subscription tier
	const isPremiumTier = userPrefs.subscription_tier === "premium";
	const prompt = isPremiumTier
		? buildPremiumTierPrompt(jobsArray, userPrefs)
		: buildFreeTierPrompt(jobsArray, userPrefs);

	// A/B Test temperature settings for consistency vs creativity
	const temperature =
		process.env.AI_TEMPERATURE_AB_TEST === "creative"
			? 0.3 // More creative for nuanced matching
			: 0.0; // Fully deterministic for reproducibility

	// Dynamic token allocation based on tier
	const maxTokens = userPrefs.subscription_tier === "premium" ? 2000 : 1500;

	const maxRetries = 3;
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const completion = await client.chat.completions.create({
				model: model,
				messages: [
					{
						role: "system",
						content: getSystemMessage(),
					},
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: temperature,
				max_tokens: maxTokens,
				functions: [
					{
						name: "return_job_matches",
						description: isPremiumTier
							? "Return the top 5-7 most relevant job matches for the user"
							: "Return the top 5 most relevant job matches for the user",
						parameters: {
							type: "object",
							properties: {
								matches: {
									type: "array",
									minItems: 1,
									maxItems: isPremiumTier ? 7 : 5,
									items: {
										type: "object",
										properties: {
											job_index: {
												type: "number",
												minimum: 1,
												description: "Index of the job from the list provided",
											},
											job_hash: {
												type: "string",
												description: "Exact job_hash from the job list",
											},
											match_score: {
												type: "number",
												minimum: 50,
												maximum: 100,
												description:
													"How well this job matches the user (50-100)",
											},
											confidence_score: {
												type: "number",
												minimum: 0.0, // Allow AI to be honest about low confidence
												maximum: 1.0,
												description:
													"How certain you are in this assessment (0.0 = very uncertain, 1.0 = completely certain)",
											},
											match_reason: {
												type: "string",
												maxLength: 400,
												description:
													"Evidence-based reason (2-3 sentences max) that explicitly links user profile to job requirements. Reference specific skills, experience, or requirements. NO emotional hype or outcome predictions.",
											},
										},
										required: [
											"job_index",
											"job_hash",
											"match_score",
											"confidence_score",
											"match_reason",
										],
									},
								},
							},
							required: ["matches"],
						},
					},
				],
				function_call: { name: "return_job_matches" },
			});

			const tokens = completion.usage?.total_tokens || 0;
			const cost = calculateAICost(tokens, model);

			const functionCall = completion.choices[0]?.message?.function_call;
			if (!functionCall || functionCall.name !== "return_job_matches") {
				throw new Error("Invalid function call response");
			}

			try {
				const functionArgs = JSON.parse(functionCall.arguments);
				const matches = parseFunction(functionArgs.matches, jobsArray);
				return { matches, tokens, cost };
			} catch (error) {
				throw new Error(`Failed to parse function call: ${error}`);
			}
		} catch (error: any) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Handle rate limit errors (429)
			if (error?.status === 429) {
				const retryAfter = extractRetryAfterFromError(error);
				const backoffDelay = calculateBackoffDelay(attempt, retryAfter);

				console.warn(
					`OpenAI rate limit hit (attempt ${attempt}/${maxRetries}), retrying in ${backoffDelay}ms:`,
					{
						retryAfter,
						model,
						jobsCount: jobsArray.length,
						userEmail: userPrefs.email,
						error: error.message,
					},
				);

				if (attempt < maxRetries) {
					await new Promise((resolve) => setTimeout(resolve, backoffDelay));
					continue;
				}
			}

			// Handle server errors (5xx)
			if (error?.status >= 500) {
				console.warn(
					`OpenAI server error (attempt ${attempt}/${maxRetries}):`,
					error.message,
				);
				if (attempt < maxRetries) {
					const backoffDelay = calculateBackoffDelay(attempt, 2000);
					await new Promise((resolve) => setTimeout(resolve, backoffDelay));
					continue;
				}
			}

			// For client errors (4xx except 429) or final attempt, throw
			console.error(`OpenAI API call failed after ${attempt} attempts:`, {
				status: error?.status,
				message: error?.message,
				model,
				jobsCount: jobsArray.length,
			});
			throw lastError;
		}
	}

	throw lastError || new Error("OpenAI API call failed after all retries");
}

/**
 * Extract retry-after header from OpenAI error
 */
function extractRetryAfterFromError(error: any): number {
	// Check various header locations
	const retryAfter =
		error?.headers?.["retry-after"] ||
		error?.response?.headers?.["retry-after"] ||
		error?.headers?.["x-ratelimit-reset-requests"];

	if (retryAfter) {
		const seconds = parseInt(retryAfter, 10);
		return Number.isNaN(seconds) ? 1000 : seconds * 1000; // Convert to milliseconds
	}

	return 1000; // Default 1 second
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
	const exponentialDelay = baseDelay * 2 ** (attempt - 1);
	const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
	const totalDelay = exponentialDelay + jitter;

	// Cap at 60 seconds for API calls (vs 30s for embeddings)
	return Math.min(totalDelay, 60000);
}

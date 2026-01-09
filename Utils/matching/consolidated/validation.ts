/**
 * Validation Domain - AI output validation logic
 * Extracted from consolidatedMatchingV2.ts for better organization
 */

import { apiLogger } from "@/lib/api-logger";
import type { ParsedMatch } from "@/lib/types";
import type { Job } from "@/scrapers/types";
import type { JobMatch, UserPreferences } from "../types";

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate individual match from AI response
 */
export function isValidMatch(match: ParsedMatch, maxJobIndex: number): boolean {
	return (
		match &&
		typeof match.job_index === "number" &&
		typeof match.job_hash === "string" &&
		typeof match.match_score === "number" &&
		match.job_index >= 1 &&
		match.job_index <= maxJobIndex &&
		match.match_score >= 0 &&
		match.match_score <= 100 &&
		match.job_hash.length > 0
	);
}

/**
 * Parse function call response - much more reliable than text parsing
 * CRITICAL: Uses imperative loops instead of filter/map to avoid TDZ errors during bundling
 */
export function parseFunctionCallResponse(
	matches: ParsedMatch[],
	jobs: Job[],
): JobMatch[] {
	const jobsArray = Array.isArray(jobs) ? jobs : [];
	const maxJobIndex = jobsArray.length;

	try {
		if (!Array.isArray(matches) || maxJobIndex === 0) {
			if (maxJobIndex === 0) {
				console.warn(
					"parseFunctionCallResponse: jobs array is empty or invalid",
				);
			}
			return [];
		}

		const validMatches: JobMatch[] = [];

		for (let i = 0; i < matches.length && validMatches.length < 5; i++) {
			const match = matches[i];

			if (!isValidMatch(match, maxJobIndex)) {
				continue;
			}

			if (!match || typeof match.job_index !== "number" || !match.job_hash) {
				continue;
			}

			validMatches.push({
				job_index: match.job_index,
				job_hash: match.job_hash,
				match_score: Math.min(100, Math.max(50, match.match_score || 50)),
				match_reason: match.match_reason || "AI match",
				confidence_score: (match as any).confidence_score || (match as any).confidence || 0.8,
			});
		}

		return validMatches;
	} catch (error) {
		console.error("Failed to parse function call response:", error);
		return [];
	}
}

/**
 * Post-filter AI matches to ensure they meet location and career path requirements
 * This is a safety net to catch any AI mistakes
 * CRITICAL: Uses imperative loops instead of filter/some to avoid TDZ errors during bundling
 */
export function validateAIMatches(
	aiMatches: JobMatch[],
	jobs: Job[],
	userPrefs: UserPreferences,
): JobMatch[] {
	const jobsArray = Array.isArray(jobs) ? jobs : [];

	const targetCities = Array.isArray(userPrefs.target_cities)
		? userPrefs.target_cities
		: userPrefs.target_cities
			? [userPrefs.target_cities]
			: [];

	const userHasRolePreference =
		userPrefs.roles_selected && userPrefs.roles_selected.length > 0;
	const userHasCareerPreference =
		userPrefs.career_path &&
		(Array.isArray(userPrefs.career_path)
			? userPrefs.career_path.length > 0
			: !!userPrefs.career_path);

	const validatedMatches: JobMatch[] = [];

	for (let i = 0; i < aiMatches.length; i++) {
		const match = aiMatches[i];

		let job: Job | undefined;
		for (let j = 0; j < jobsArray.length; j++) {
			if (jobsArray[j].job_hash === match.job_hash) {
				job = jobsArray[j];
				break;
			}
		}

		if (!job) {
			console.warn(`Job not found for hash: ${match.job_hash}`);
			continue;
		}

		// Validate location match
		if (targetCities.length > 0) {
			const jobCity = (job as any).city
				? String((job as any).city).toLowerCase()
				: "";
			const jobLocation = (job.location || "").toLowerCase();

			let locationMatches = false;
			for (let k = 0; k < targetCities.length; k++) {
				const city = targetCities[k];
				const cityLower = city.toLowerCase();

				if (jobCity && jobCity === cityLower) {
					locationMatches = true;
					break;
				}

				if (!jobCity) {
					const escapedCity = cityLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
					const patterns = [
						new RegExp(`\\b${escapedCity}\\b`, "i"),
						new RegExp(`^${escapedCity}[,\\s]`, "i"),
						new RegExp(`[,\\s]${escapedCity}[,\\s]`, "i"),
						new RegExp(`[,\\s]${escapedCity}$`, "i"),
					];

					for (let p = 0; p < patterns.length; p++) {
						if (patterns[p].test(jobLocation)) {
							locationMatches = true;
							break;
						}
					}
				}

				if (locationMatches) break;

				if (jobLocation.includes("remote") || jobLocation.includes("hybrid")) {
					locationMatches = true;
					break;
				}
			}

			if (!locationMatches) {
				console.warn(
					`Location mismatch: job location "${job.location}" doesn't match user cities: ${targetCities.join(", ")}`,
				);
				continue;
			}
		}

		// Validate role match if user specified roles
		if (userHasRolePreference) {
			const jobTitle = (job.title || "").toLowerCase();
			const jobDesc = (job.description || "").toLowerCase();
			const roles = userPrefs.roles_selected || [];

			let hasRoleMatch = false;
			for (let r = 0; r < roles.length; r++) {
				const role = roles[r];
				if (
					role &&
					(jobTitle.includes(role.toLowerCase()) ||
						jobDesc.includes(role.toLowerCase()))
				) {
					hasRoleMatch = true;
					break;
				}
			}

			if (!hasRoleMatch) {
				console.warn(
					`Role mismatch: job "${job.title}" doesn't match user roles: ${roles.join(", ")}`,
				);
				continue;
			}
		}

		// Validate career path match if user specified career path
		if (userHasCareerPreference) {
			const jobTitle = (job.title || "").toLowerCase();
			const jobDesc = (job.description || "").toLowerCase();
			const careerPaths = Array.isArray(userPrefs.career_path)
				? userPrefs.career_path
				: [userPrefs.career_path];

			let hasCareerMatch = false;
			for (let c = 0; c < careerPaths.length; c++) {
				const path = careerPaths[c];
				if (!path) continue;
				const pathLower = path.toLowerCase();

				if (jobTitle.includes(pathLower) || jobDesc.includes(pathLower)) {
					hasCareerMatch = true;
					break;
				}

				if (job.categories && Array.isArray(job.categories)) {
					for (let cat = 0; cat < job.categories.length; cat++) {
						const catLower = String(job.categories[cat]).toLowerCase();
						if (catLower.includes(pathLower) || pathLower.includes(catLower)) {
							hasCareerMatch = true;
							break;
						}
					}
				}
				if (hasCareerMatch) break;
			}

			if (!hasCareerMatch) {
				console.warn(
					`Career path mismatch: job "${job.title}" doesn't match user career paths: ${careerPaths.join(", ")}`,
				);
				continue;
			}
		}

		// EVIDENCE VERIFICATION: Check match reason length
		const matchReason = match.match_reason || "";
		const wordCount = matchReason
			.trim()
			.split(/\s+/)
			.filter((w) => w.length > 0).length;
		const EVIDENCE_THRESHOLD = 20;

		if (wordCount < EVIDENCE_THRESHOLD) {
			apiLogger.debug("Short match reason detected (potential weak evidence)", {
				email: userPrefs.email || "unknown",
				jobHash: match.job_hash,
				jobTitle: job.title,
				reasonLength: wordCount,
				reason: matchReason.substring(0, 100),
				threshold: EVIDENCE_THRESHOLD,
				note: "AI may have struggled to find strong evidence linking user skills to job requirements",
			});
		}

		validatedMatches.push(match);
	}

	return validatedMatches;
}

/**
 * Graduate-focused AI validation with reasonable growth inferences
 * Allows reasonable inferences about mentorship and learning potential for entry-level roles
 */
function validateNoHallucinations(
	match: JobMatch,
	job: Job,
	userPrefs: UserPreferences,
): { isValid: boolean; issues: string[] } {
	const issues: string[] = [];
	const reason = match.match_reason.toLowerCase();
	const jobText = `${job.title || ""} ${job.description || ""}`.toLowerCase();

	// CRITICAL HALLUCINATIONS (skills that definitely don't exist)
	if (userPrefs.skills) {
		for (const skill of userPrefs.skills) {
			// Only penalize if skill is completely unrelated to the job domain
			const skillLower = skill.toLowerCase();
			const jobRequiresSkill = jobText.includes(skillLower);
			const jobDomainRelated = isSkillDomainRelated(skillLower, jobText);

			if (
				reason.includes(skillLower) &&
				!jobRequiresSkill &&
				!jobDomainRelated
			) {
				issues.push(`hallucinated_unrelated_skill_${skill}`);
			}
		}
	}

	// ALLOWED GROWTH INFERENCES (reasonable for graduate roles):
	// - Mentorship in team environments
	// - Learning in dynamic companies
	// - Leadership development in growing companies
	// - Skill development in tech-forward environments

	// Check for obvious contradictions only
	if (reason.includes("remote work") && jobText.includes("office required")) {
		issues.push("contradictory_work_environment");
	}

	return { isValid: issues.length === 0, issues };
}

/**
 * Check if a skill is reasonably related to the job domain
 * Allows AI to make reasonable growth inferences for graduates
 */
function isSkillDomainRelated(skill: string, jobText: string): boolean {
	const skillDomains: Record<string, string[]> = {
		react: [
			"frontend",
			"javascript",
			"web",
			"ui",
			"user interface",
			"component",
		],
		python: ["data", "backend", "ml", "ai", "automation", "scripting"],
		javascript: ["web", "frontend", "backend", "fullstack", "node"],
		leadership: ["team", "manage", "lead", "coordinate", "mentor", "guide"], // Allow in team contexts
		communication: ["team", "collaborate", "present", "stakeholder"], // Allow in team contexts
		mentorship: ["team", "junior", "train", "develop", "grow", "support"], // Allow in development contexts
	};

	for (const [skillKey, relatedTerms] of Object.entries(skillDomains)) {
		if (skill.includes(skillKey)) {
			return relatedTerms.some((term) => jobText.includes(term));
		}
	}

	return false;
}

/**
 * Validate reasoning quality and evidence strength
 */
function validateReasoningQuality(
	match: JobMatch,
	_job: Job,
	_userPrefs: UserPreferences,
): { quality: number; issues: string[] } {
	const issues: string[] = [];
	let quality = 1.0; // Start at perfect quality

	const reason = match.match_reason || "";
	const words = reason.split(/\s+/).filter((w) => w.length > 0);

	// Length check (more lenient for graduate-focused explanations)
	const expectedWords =
		match.match_score >= 85
			? 40
			: match.match_score >= 75
				? 30
				: match.match_score >= 65
					? 20
					: 15;
	if (words.length < expectedWords) {
		issues.push("insufficient_evidence_length");
		quality *= 0.8; // Less penalty for graduate context
	}

	// Growth-focused specificity check
	let growthIndicators = 0;

	// Look for graduate-relevant growth indicators
	const growthTerms = [
		"learn",
		"grow",
		"develop",
		"mentor",
		"train",
		"support",
		"team",
		"collaborate",
		"opportunity",
	];
	growthIndicators += growthTerms.filter((term) =>
		reason.toLowerCase().includes(term),
	).length;

	// Career development indicators
	const careerTerms = [
		"career",
		"professional",
		"future",
		"path",
		"journey",
		"aspirations",
	];
	growthIndicators += careerTerms.filter((term) =>
		reason.toLowerCase().includes(term),
	).length;

	// Learning environment indicators
	const learningTerms = [
		"dynamic",
		"innovative",
		"growing",
		"scale",
		"startup",
		"tech-forward",
	];
	growthIndicators += learningTerms.filter((term) =>
		reason.toLowerCase().includes(term),
	).length;

	if (growthIndicators < 2) {
		issues.push("lack_of_growth_indicators");
		quality *= 0.85; // Even less penalty - focus on growth potential
	}

	// Generic language allowance (more lenient for graduate context)
	const genericPhrases = [
		"good fit",
		"great match",
		"perfect",
		"excellent",
		"ideal",
	];
	const hasGeneric = genericPhrases.some((phrase) =>
		reason.toLowerCase().includes(phrase),
	);
	if (hasGeneric && match.match_score >= 90) {
		// Only penalize at very high scores
		issues.push("generic_language_high_score");
		quality *= 0.9;
	}

	return { quality, issues };
}

/**
 * Validate AI output quality after scoring
 * This catches weak evidence, low confidence, hallucinations, and anomalies
 */
export function validateAIOutput(
	matches: JobMatch[],
	jobs: Job[],
	userPrefs: UserPreferences,
): JobMatch[] {
	return matches
		.map((match) => {
			const job = jobs.find((j) => j.job_hash === match.job_hash);
			if (!job) {
				return {
					...match,
					confidence_score: 0,
					validation_issues: ["job_not_found"],
				};
			}

			const issues: string[] = [];
			let adjustedScore = match.match_score;
			let adjustedConfidence = match.confidence_score || 0.7;

			// 1. HALLUCINATION DETECTION (CRITICAL)
			const hallucinationCheck = validateNoHallucinations(
				match,
				job,
				userPrefs,
			);
			if (!hallucinationCheck.isValid) {
				issues.push(...hallucinationCheck.issues);
				adjustedConfidence = Math.max(0.3, adjustedConfidence - 0.4);
				adjustedScore = Math.max(50, adjustedScore - 20); // Heavy penalty for hallucinations

				console.error(
					`[VALIDATION] CRITICAL: Hallucinations detected in ${job.title}: ${hallucinationCheck.issues.join(", ")}`,
				);
			}

			// 2. REASONING QUALITY ASSESSMENT
			const qualityCheck = validateReasoningQuality(match, job, userPrefs);
			if (qualityCheck.quality < 1.0) {
				issues.push(...qualityCheck.issues);
				adjustedConfidence *= qualityCheck.quality;
				adjustedScore = Math.round(adjustedScore * qualityCheck.quality);

				console.warn(
					`[VALIDATION] Quality issues in ${job.title}: ${qualityCheck.issues.join(", ")} (quality: ${(qualityCheck.quality * 100).toFixed(0)}%)`,
				);
			}

			// 3. Score-Confidence Consistency Check
			if (adjustedScore >= 85 && adjustedConfidence < 0.7) {
				issues.push("score_confidence_mismatch");
				adjustedScore = Math.max(75, adjustedScore - 10); // Reduce score if AI isn't confident

				console.warn(
					`[VALIDATION] Low confidence for high score: ${job.title} (${adjustedConfidence})`,
				);
			}

			// 4. Double-check hard requirements (paranoid validation)
			const userCities = (
				Array.isArray(userPrefs.target_cities)
					? userPrefs.target_cities
					: userPrefs.target_cities
						? [userPrefs.target_cities]
						: []
			).map((c) => c.toLowerCase());

			const jobCity = (job.city || "").toLowerCase();
			const locationValid = userCities.some((city) => jobCity.includes(city));

			if (!locationValid) {
				issues.push("CRITICAL_location_filter_failure");
				adjustedScore = 0;
				adjustedConfidence = 0;

				console.error(
					`[VALIDATION] CRITICAL: Location filter failed for ${job.title} in ${job.city}`,
				);
			}

			return {
				...match,
				match_score: Math.max(0, Math.min(100, adjustedScore)),
				confidence_score: Math.max(0, Math.min(1, adjustedConfidence)),
				validation_issues: issues.length > 0 ? issues : undefined,
			};
		})
		.filter((m) => m.match_score >= 50 && (m.confidence_score || 0.7) >= 0.4) // Allow AI to express uncertainty
		.sort((a, b) => {
			// Sort by score * confidence (weighted quality)
			const qualityA = a.match_score * (a.confidence_score || 0.7);
			const qualityB = b.match_score * (b.confidence_score || 0.7);
			return qualityB - qualityA;
		})
		.slice(0, 5); // Return top 5
}

/**
 * FREE MATCH BUILDER - Consolidated
 *
 * Handles all free tier matching logic: prompts, config, and scoring.
 * Focused on speed and immediate applicability for free users.
 */

import type { Job, UserPreferences } from "../../types";

export class FreeMatchBuilder {
	/**
	 * Build prompt for free tier matching
	 */
	static buildPrompt(user: UserPreferences, jobs: Job[]): string {
		const profile = FreeMatchBuilder.buildUserProfile(user);
		const jobList = FreeMatchBuilder.formatJobList(jobs);

		return `${FreeMatchBuilder.systemPrompt}

${profile}

${FreeMatchBuilder.taskInstruction(user)}

${FreeMatchBuilder.outputSchema}

JOBS:
${jobList}`;
	}

	/**
	 * Get match count for free tier
	 */
	static getMatchCount(): number {
		return 5;
	}

	/**
	 * Get AI config for free tier
	 */
	static getConfig() {
		return {
			useAI: true, // Re-enable AI
			maxJobsForAI: 10,
			maxMatches: 5, // FREE TIER: Exactly 5 matches
			fallbackThreshold: 5, // Match maxMatches to ensure fallback provides enough matches
			includePrefilterScore: false,
		};
	}

	/**
	 * System prompt - career counselor for entry-level professionals (free tier)
	 */
	private static get systemPrompt(): string {
		return `You are JobPing's AI career counselor specializing in entry-level job matching.
Your free service helps professionals find their first roles with high success rates.

USER PERSPECTIVE: "I'm looking for my first role in this career path. What positions should I actually apply for and get interviews?"
YOUR ROLE: Find 5 REALISTIC entry-level positions this user has strong qualifications for and would genuinely consider.

CRITICAL: Focus on JOBS THEY CAN ACTUALLY GET based on their career focus and qualifications. Prioritize roles where they meet 70%+ of requirements.`;
	}

	/**
	 * Build user profile string for free tier (1-step form simplicity)
	 * FREE TIER COLLECTS ONLY: Email, Full Name, Cities, Career Path
	 */
	private static buildUserProfile(user: UserPreferences): string {
		const cities = Array.isArray(user.target_cities)
			? user.target_cities.join(", ")
			: user.target_cities || "Flexible";

		const career = Array.isArray(user.career_path)
			? user.career_path.join(", ")
			: user.career_path || "Open";

		return `USER REQUEST: "${career} roles in ${cities}"

USER PROFILE (Simple 1-Step Form):
- Career focus: ${career} (exactly 1 of 9 MBA career paths)
- Target location: ${cities}
- Experience level: Entry-level/Graduate

IMPORTANT JOB FILTERS:
- Only jobs posted within LAST 30 DAYS
- Prefer fresh opportunities (within 7 days if available)
- Ignore jobs older than 30 days

NOTE: This user used JobPing's simple form with no preference details - focus on one clear career direction and find realistic opportunities they would genuinely apply for.`;
	}

	/**
	 * Task instruction for free tier - career counselor approach
	 */
	private static taskInstruction(_user: UserPreferences): string {
		return `CRITICAL: You MUST respond with VALID JSON only. No text, no explanations, no markdown formatting.

Select EXACTLY 5 entry-level positions from the provided job list that match the user's profile.

JOB SELECTION CRITERIA (must meet ALL):
1. LOCATION: Job city matches user's target cities
2. CAREER: Job categories align with user's career path
3. LEVEL: Entry-level, graduate, or internship roles only
4. FRESHNESS: Jobs posted within LAST 30 DAYS ONLY (prefer jobs within 7 days)
5. REALISM: User meets 70%+ of stated requirements

SCORING WEIGHTS:
- Career alignment: 40% (primary factor)
- Location match: 30% (critical for applications)
- Job freshness: 15% (recent opportunities strongly preferred)
- Experience fit: 10% (entry-level focus)
- Company reputation: 5% (bonus factor)

OUTPUT REQUIREMENT: Return ONLY valid JSON. No introductions, no explanations, no markdown. Just the JSON object with EXACTLY 5 matches.`;
	}

	/**
	 * Output schema for free tier - structured JSON for reliable parsing
	 */
	private static get outputSchema(): string {
		return `REQUIRED JSON OUTPUT FORMAT (return ONLY this structure):
{
  "matches": [
    {
      "jobIndex": 0,
      "matchScore": 85,
      "confidenceScore": 90,
      "matchReason": "Software Engineer at TechCorp London - matches tech career path, London location, entry-level with Node.js/React skills mentioned, excellent fit for graduate developer"
    },
    {
      "jobIndex": 3,
      "matchScore": 82,
      "confidenceScore": 85,
      "matchReason": "Data Analyst at DataCo London - aligns with tech career, London location, SQL/Python skills match graduate profile, realistic entry position"
    }
  ]
}

MANDATORY REQUIREMENTS:
- EXACTLY 5 matches from the JOBS list
- jobIndex must be a valid index from the provided jobs array (0-4 for 5 jobs)
- matchScore: 70-100 (entry-level appropriate scores)
- confidenceScore: 70-100
- matchReason: Specific explanation (50+ characters)
- VALID JSON ONLY - no other text or formatting`;
	}

	/**
	 * Format job list for prompt - clear structure for AI matching
	 */
	private static formatJobList(jobs: Job[]): string {
		return jobs
			.map(
				(job, i) =>
					`${i}: ${job.title} | ${job.company} | ${job.city} | Categories: ${job.categories?.join(", ") || "N/A"} | Level: ${job.experience_required || "Not specified"}`,
			)
			.join("\n");
	}
}

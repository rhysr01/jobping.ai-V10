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
			fallbackThreshold: 1, // Low threshold to ensure AI is attempted
			includePrefilterScore: false,
		};
	}

	/**
	 * System prompt - career counselor for business students (free tier)
	 */
	private static get systemPrompt(): string {
		return `You are JobPing's AI career counselor specializing in entry-level job matching.
Your free service helps graduates find their first professional roles with high success rates.

STUDENT PERSPECTIVE: "I'm a recent graduate looking for my first job. What roles should I actually apply for and get interviews?"
YOUR ROLE: Find 5 REALISTIC entry-level positions this student has strong qualifications for and would genuinely consider.

CRITICAL: Focus on JOBS THEY CAN ACTUALLY GET based on their career focus and qualifications. Prioritize roles where they meet 70%+ of requirements.`;
	}

	/**
	 * Build user profile string for free tier (1-step form simplicity)
	 */
	private static buildUserProfile(user: UserPreferences): string {
		const cities = Array.isArray(user.target_cities)
			? user.target_cities.join(", ")
			: user.target_cities || "Flexible";

		const career = Array.isArray(user.career_path)
			? user.career_path.join(", ")
			: user.career_path || "Open";

		return `STUDENT REQUEST: "${career} roles in ${cities}"

STUDENT PROFILE:
- Career focus: ${career} (single career path)
- Target location: ${cities}
- Experience level: Entry-level/Graduate
- Visa status: ${user.visa_status || "EU citizen"}

NOTE: This student used JobPing's simple form - focus on one clear career direction and find realistic opportunities they would genuinely apply for.`;
	}

	/**
	 * Task instruction for free tier - career counselor approach
	 */
	private static taskInstruction(_user: UserPreferences): string {
		return `As this student's career counselor, select EXACTLY 5 entry-level positions from the provided job list that match their profile. Use this scoring system:

JOB SELECTION CRITERIA (must meet ALL):
1. LOCATION: Job city matches student's target cities
2. CAREER: Job categories align with student's career path
3. LEVEL: Entry-level, graduate, or internship roles only
4. REALISM: Student meets 70%+ of stated requirements

SCORING WEIGHTS:
- Career alignment: 40% (primary factor)
- Location match: 30% (critical for applications)
- Experience fit: 20% (entry-level focus)
- Company reputation: 10% (bonus factor)

Output EXACTLY 5 matches ranked by overall fit score. Focus on jobs where the student has genuine qualifications and would realistically apply and interview for.`;
	}

	/**
	 * Output schema for free tier - structured JSON for reliable parsing
	 */
	private static get outputSchema(): string {
		return `{
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

REQUIREMENTS:
- EXACTLY 5 matches from the JOBS list
- jobIndex must be a valid index from the provided jobs array
- matchScore: 0-100 (higher = better fit)
- confidenceScore: 0-100 (higher = more certain about fit)
- matchReason: Specific explanation why this job fits their career + location + experience`;
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

/**
 * PREMIUM MATCH BUILDER - Consolidated
 *
 * Handles all premium tier matching logic: prompts, config, and career-focused scoring.
 * Focused on quality and long-term career guidance for paying users.
 */

import type { Job, UserPreferences } from "../../types";

export class PremiumMatchBuilder {
	/**
	 * Build prompt for premium tier matching
	 */
	static buildPrompt(user: UserPreferences, jobs: Job[]): string {
		const profile = PremiumMatchBuilder.buildUserProfile(user);
		const jobList = PremiumMatchBuilder.formatJobList(jobs);

		return `${PremiumMatchBuilder.systemPrompt}

${profile}

${PremiumMatchBuilder.taskInstruction(user)}

${PremiumMatchBuilder.outputSchema}

OPPORTUNITIES:
${jobList}`;
	}

	/**
	 * Get match count for premium tier
	 */
	static getMatchCount(): number {
		return 15;
	}

	/**
	 * Get AI config for premium tier
	 */
	static getConfig() {
		return {
			useAI: true,
			maxJobsForAI: 30,
			maxMatches: 15, // PREMIUM TIER: Exactly 15 matches
			fallbackThreshold: 3, // Lower threshold to ensure AI gets attempted even with limited jobs
			includePrefilterScore: true,
		};
	}

	/**
	 * System prompt - premium career counselor (Step 2 preferences)
	 */
	private static get systemPrompt(): string {
		return `You are JobPing's premium career strategist for €5/month subscribers.
You provide strategic job recommendations based on user preferences collected in our Step 2 career form.

USER PERSPECTIVE: "I've told JobPing my career goals and preferences. Now I need 15 strategic opportunities that match what I'm actually looking for."
YOUR ROLE: Act as their personal career counselor, providing strategic recommendations that align with their stated preferences and career path.

Focus on ACCURACY: Show you understand their preferences by recommending positions that match their languages, work environment, visa needs, and entry level requirements.`;
	}

	/**
	 * Build comprehensive user profile for premium tier
	 * PREMIUM TIER COLLECTS (Step 2): target_cities, career_path, languages_spoken, work_environment, visa_status, entry_level_preference
	 */
	private static buildUserProfile(user: UserPreferences): string {
		const cities = Array.isArray(user.target_cities)
			? user.target_cities.join(", ")
			: user.target_cities || "Flexible";
		const careerPaths = Array.isArray(user.career_path)
			? user.career_path.join(" or ")
			: user.career_path || "Open";
		const languages = Array.isArray(user.languages_spoken)
			? user.languages_spoken.join(", ")
			: "English";
		const workEnv = Array.isArray(user.work_environment)
			? user.work_environment.join(", ")
			: user.work_environment || "Flexible";
		const entryLevel = Array.isArray(user.entry_level_preference)
			? user.entry_level_preference.join(", ")
			: "Entry-level";
		const visa = user.visa_status || "EU citizen";

		return `USER REQUEST: "${careerPaths} roles in ${cities}"

COMPREHENSIVE USER PROFILE (Step 2 Career Preferences):
- Career paths: ${careerPaths} (1-2 selected MBA paths - multi-career exploration)
- Target locations: ${cities}
- Languages spoken: ${languages}
- Work environment preference: ${workEnv}
- Role type preference: ${entryLevel}
- Visa sponsorship needed: ${visa}

IMPORTANT JOB FILTERS:
- ONLY jobs posted within LAST 7 DAYS
- Premium users deserve the freshest opportunities
- Fresher jobs = better career timing

MATCHING PRIORITIES:
- Language requirements MUST align with ${languages}
- Work environment: ${workEnv}
- Entry level requirement: ${entryLevel}
- Visa sponsorship: ${visa}

MULTI-PATH STRATEGY: This premium user can explore 1-2 career paths. Show you understand their multi-direction career interests by recommending positions that intelligently span their chosen career directions.

NOTE: This premium user has completed Step 2 career preferences. Provide strategic career recommendations based on their actual collected preferences.`;
	}

	/**
	 * Task instruction for premium tier - career counselor with Step 2 preferences
	 */
	private static taskInstruction(_user: UserPreferences): string {
		return `CRITICAL: You MUST respond with VALID JSON only. No text, no explanations, no markdown formatting.

As this user's premium career counselor, analyze the job list and return EXACTLY 15 high-quality matches in the specified JSON format.

MATCHING CRITERIA:
- Career alignment: Must match user's 1-2 selected career paths
- Geographic fit: Perfect city match required
- Language fit: Jobs must match user's language requirements
- Work environment: Must align with user's work environment preference
- Visa sponsorship: Must match user's visa status needs
- Experience level: Must match user's entry level preference
- Job freshness: ONLY jobs posted within LAST 7 DAYS (premium benefit)
- Company quality: Prioritize established companies

SCORING WEIGHTS (Premium Tier):
- Career path alignment: 35% (multi-path support)
- Geographic match: 25% (exact city required)
- Job freshness: 20% (7-day guarantee premium benefit)
- Language compatibility: 10% (international opportunities)
- Work environment fit: 5% (remote/hybrid preference)
- Entry-level appropriateness: 5% (role type match)

Match scores must be 85-100 (premium quality threshold)
Confidence scores must be 90-100 (high certainty required)

OUTPUT REQUIREMENT: Return ONLY valid JSON. No introductions, no explanations, no markdown. Just the JSON object.`;
	}

	/**
	 * Output schema for premium tier - career counselor reasoning
	 */
	private static get outputSchema(): string {
		return `{
  "matches": [
    {
      "jobIndex": 0,
      "matchScore": 95,
      "confidenceScore": 98,
      "matchReason": "Exceptional strategic career move: Senior Product Manager at industry-leading SaaS unicorn matches your [career path] expertise perfectly, offers direct path to C-level leadership, company culture of innovation and work-life balance aligns with your preferences, [selected city] location provides ideal positioning",
      "scoreBreakdown": {
        "skills": 98,
        "experience": 95,
        "location": 96,
        "company": 92,
        "career_progression": 97,
        "overall": 95
      }
    },
    {
      "jobIndex": 1,
      "matchScore": 92,
      "confidenceScore": 95,
      "matchReason": "Premium career advancement opportunity: Tech Lead role at established fintech leader leverages your technical background, provides leadership track, company known for exceptional engineering culture, [selected city] offers vibrant professional ecosystem"
    }
  ]
}

REQUIREMENTS FOR PREMIUM OUTPUT:
- EXACTLY 15 matches from the provided jobs list
- Match scores: 85-100 (premium quality threshold)
- Confidence scores: 90-100 (high certainty required)
- Detailed reasoning showing strategic career thinking
- Focus on career advancement and company prestige
- Geographic and cultural fit considerations`;
	}

	/**
	 * Format job list for prompt - include more details for premium analysis
	 */
	private static formatJobList(jobs: Job[]): string {
		return jobs
			.map(
				(job, i) =>
					`${i}: ${job.title} | ${job.company} | ${job.city} | Industry: ${job.categories?.[0] || "Tech"}`,
			)
			.join("\n");
	}
}

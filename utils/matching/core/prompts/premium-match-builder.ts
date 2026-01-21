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
	 * System prompt - premium career counselor (4-step form depth)
	 */
	private static get systemPrompt(): string {
		return `You are JobPing's premium career strategist for €5/month subscribers.
You provide detailed career guidance based on comprehensive student profiles from our 4-step assessment.

STUDENT PERSPECTIVE: "I've completed JobPing's detailed career assessment. Now I need strategic advice on my next 15 career moves."
YOUR ROLE: Act as their personal career counselor, providing strategic recommendations that align with their long-term professional trajectory.

Focus on TRUST: Show you understand their detailed profile and career goals by recommending positions they would confidently pursue.`;
	}

	/**
	 * Build comprehensive user profile for premium tier
	 */
	private static buildUserProfile(user: UserPreferences): string {
		const skills = Array.isArray(user.skills)
			? user.skills.join(", ")
			: user.skills || "Open";
		const industries = Array.isArray(user.industries)
			? user.industries.join(", ")
			: user.industries || "Flexible";
		const cities = Array.isArray(user.target_cities)
			? user.target_cities.join(", ")
			: user.target_cities || "Flexible";
		const roles = Array.isArray(user.roles_selected)
			? user.roles_selected.join(", ")
			: user.roles_selected || "Open";
		const careerPaths = Array.isArray(user.career_path)
			? user.career_path.join(" or ")
			: user.career_path || "Open";

		return `STUDENT REQUEST: "${careerPaths} roles in ${cities}"

COMPREHENSIVE STUDENT PROFILE (4-Step Career Assessment Completed):
- Career paths: ${careerPaths} (can explore up to 2 career directions)
- Detailed career assessment: ${user.career_keywords || "Career growth focused"}
- Technical & soft skills: ${skills}
- Preferred industries: ${industries}
- Target roles: ${roles}
- Geographic preferences: ${cities}
- Experience level: ${user.entry_level_preference || "Progressive"}
- Company size preference: ${user.company_size_preference || "Open"}
- Work environment: ${user.work_environment || "Flexible"}
- Visa considerations: ${user.visa_status || "EU citizen"}
- Professional expertise: ${user.professional_expertise || "Business foundation"}

NOTE: This premium student can explore up to 2 career paths. Show you understand their multi-path career exploration by recommending positions across their chosen career directions.`;
	}

	/**
	 * Task instruction for premium tier - career counselor with 4-step depth
	 */
	private static taskInstruction(_user: UserPreferences): string {
		return `CRITICAL: You MUST respond with VALID JSON only. No text, no explanations, no markdown formatting.

As this student's premium career counselor, analyze the job list and return EXACTLY 15 high-quality matches in the specified JSON format.

MATCHING CRITERIA:
- Match scores: 85-100 (premium quality only)
- Career alignment: 90%+ match with user's career paths
- Skills fit: 90%+ match with user's technical skills
- Geographic fit: Perfect city match required
- Company quality: Prioritize established companies

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
      "matchReason": "Exceptional strategic career move: Senior Product Manager at industry-leading SaaS unicorn matches your digital transformation expertise perfectly, offers direct path to C-level leadership, company culture of innovation and work-life balance aligns with your preferences, Munich location provides ideal European hub positioning",
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
      "matchReason": "Premium career advancement opportunity: Tech Lead role at established fintech leader leverages your full-stack development background, provides technical leadership track, company known for exceptional engineering culture and Munich's vibrant tech ecosystem"
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

/**
 * AI Matching Service - OpenAI-powered Semantic Job Matching
 * Extracted and simplified from the massive consolidated engine
 */

import OpenAI from "openai";
import * as Sentry from "@sentry/nextjs";
import type { Job } from "@/scrapers/types";
import { apiLogger } from "../../../lib/api-logger";
import { aiMatchingCache } from "../../../lib/cache";
import { ENV } from "../../../lib/env";
import {
	generateScoreExplanation,
	ScoreComponents,
	UnifiedScore,
} from "../scoring-standard";
import type { UserPreferences } from "../types";
import { FreeMatchBuilder } from "./prompts/free-match-builder";
import { PremiumMatchBuilder } from "./prompts/premium-match-builder";

export interface AIMatchResult {
	job: Job;
	unifiedScore: UnifiedScore;
	matchReason: string;
}

export interface AIMatchingOptions {
	maxRetries?: number;
	timeoutMs?: number;
	useCache?: boolean;
	model?: string;
}

export class AIMatchingService {
	private openai: OpenAI | null = null;
	private cache = aiMatchingCache;

	constructor(openaiApiKey?: string) {
		// Use the same pattern as embedding service - always create client
		const apiKey = openaiApiKey || ENV.OPENAI_API_KEY || "";
		this.openai = new OpenAI({ apiKey });
		
		console.log("🔑 AI Matching Service OpenAI client initialized:", {
			hasProvidedKey: !!openaiApiKey,
			hasENVKey: !!ENV.OPENAI_API_KEY,
			finalKeyLength: apiKey.length,
			finalKeyPrefix: apiKey.substring(0, 8) || 'empty',
		});
	}

	/**
	 * Main AI matching method
	 */
	async findMatches(
		user: UserPreferences,
		jobs: Job[],
		options: AIMatchingOptions = {},
	): Promise<AIMatchResult[]> {
		const {
			maxRetries = 3,
			timeoutMs = 30000,
			useCache = true,
			model = "gpt-4o-mini",
		} = options;

		apiLogger.info("AI matching starting", {
			metadata: {
				userEmail: user.email,
				jobsCount: jobs.length,
				model,
				useCache,
			},
		});

		// Check if we have a valid API key (client always exists now)
		// OpenAI keys start with 'sk-' (covers both old 'sk-' and new 'sk-proj-' formats)
		const hasValidKey = ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.startsWith('sk-');
		
		console.log("🔍 AI Matching Service key validation:", {
			hasENVKey: !!ENV.OPENAI_API_KEY,
			keyLength: ENV.OPENAI_API_KEY?.length || 0,
			keyPrefix: ENV.OPENAI_API_KEY?.substring(0, 10) || 'none',
			startsWithSk: ENV.OPENAI_API_KEY?.startsWith('sk-') || false,
			hasValidKey,
		});
		
		if (!hasValidKey) {
			const errorMessage = "OpenAI API key not configured or invalid - AI matching unavailable";
			
			apiLogger.error("AI_MATCHING_UNAVAILABLE", new Error(errorMessage), {
				hasApiKey: !!ENV.OPENAI_API_KEY,
				apiKeyLength: ENV.OPENAI_API_KEY?.length || 0,
				keyPrefix: ENV.OPENAI_API_KEY?.substring(0, 8) || 'none',
			});
			
			Sentry.captureMessage(errorMessage, {
				level: "warning",
				tags: {
					service: "ai-matching",
					error_type: "invalid_api_key",
				},
				extra: {
					hasApiKey: !!ENV.OPENAI_API_KEY,
					apiKeyLength: ENV.OPENAI_API_KEY?.length || 0,
					userEmail: user.email,
					jobCount: jobs.length,
				},
			});
			
			throw new Error(errorMessage);
		}

		const results: AIMatchResult[] = [];
		const startTime = Date.now();

		// Process jobs in batches to avoid rate limits
		const batchSize = 5;
		for (let i = 0; i < jobs.length; i += batchSize) {
			const batch = jobs.slice(i, i + batchSize);
			const batchResults = await this.processBatch(user, batch, {
				maxRetries,
				timeoutMs,
				useCache,
				model,
			});
			results.push(...batchResults);

			// Rate limiting
			if (i + batchSize < jobs.length) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		apiLogger.info("AI matching completed", {
			metadata: {
				userEmail: user.email,
				jobsProcessed: jobs.length,
				matchesFound: results.length,
				processingTime: Date.now() - startTime,
			},
		});

		return results.sort(
			(a, b) => b.unifiedScore.overall - a.unifiedScore.overall,
		);
	}

	/**
	 * Process a batch of jobs
	 */
	private async processBatch(
		user: UserPreferences,
		jobs: Job[],
		options: AIMatchingOptions,
	): Promise<AIMatchResult[]> {
		const cacheKey = this.generateCacheKey(user, jobs);

		// Check cache first
		if (options.useCache) {
			const cached = this.cache.get(cacheKey);
			if (cached) {
				apiLogger.info("AI cache hit", {
					metadata: {
						userEmail: user.email,
						jobsCount: jobs.length,
						cacheKey: cacheKey.substring(0, 50) + "...",
					},
				});
				return cached;
			}
			apiLogger.info("AI cache miss", {
				metadata: {
					userEmail: user.email,
					jobsCount: jobs.length,
					cacheKey: cacheKey.substring(0, 50) + "...",
				},
			});
		}

		const results = await this.callOpenAI(user, jobs, options);

		// Cache results
		if (options.useCache) {
			this.cache.set(cacheKey, results);
			apiLogger.info("AI cache set", {
				metadata: {
					userEmail: user.email,
					jobsCount: jobs.length,
					resultsCount: results.length,
					cacheKey: cacheKey.substring(0, 50) + "...",
				},
			});
		}

		return results;
	}

	/**
	 * Call OpenAI API for matching
	 */
	private async callOpenAI(
		user: UserPreferences,
		jobs: Job[],
		options: AIMatchingOptions,
	): Promise<AIMatchResult[]> {
		const prompt = this.buildPrompt(user, jobs);

		try {
			const response = await this.openai?.chat.completions.create({
				model: options.model || "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content:
							"You are an expert career counselor helping match job seekers with perfect job opportunities. Analyze job matches based on skills, experience, location preferences, and career goals.",
					},
					{
						role: "user",
						content: prompt,
					},
				],
				max_tokens: 2000,
				temperature: 0.3,
			});

			if (!response) {
				throw new Error("No response from OpenAI");
			}

			const content = response.choices[0]?.message?.content;
			if (!content) {
				throw new Error("No response from OpenAI");
			}

			// Debug log the raw response
			apiLogger.info("OpenAI raw response", {
				metadata: {
					userEmail: user.email,
					responseLength: content.length,
					responsePreview: content.substring(0, 200),
				},
			});

			return this.parseResponse(content, jobs);
		} catch (error) {
			apiLogger.error("OpenAI API call failed", error as Error, {
				userEmail: user.email,
				jobsCount: jobs.length,
			});

			// Capture in Sentry
			Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
				tags: {
					service: "AIMatchingService",
					method: "getMatches",
					provider: "openai",
				},
				extra: {
					userEmail: user.email,
					jobsCount: jobs.length,
					subscription_tier: user.subscription_tier,
					operation: "ai_api_call",
				},
				user: { email: user.email },
				level: "error",
			});

			// Return empty results on failure
			return [];
		}
	}

	/**
	 * Build the prompt for OpenAI
	 */
	private buildPrompt(user: UserPreferences, jobs: Job[]): string {
		const isPremium =
			user.subscription_tier === "premium" ||
			user.subscription_tier === "premium_pending";

		return isPremium
			? PremiumMatchBuilder.buildPrompt(user, jobs)
			: FreeMatchBuilder.buildPrompt(user, jobs);
	}

	/**
	 * Parse OpenAI response - ROBUST parsing to handle various AI response formats
	 */
	private parseResponse(content: string, jobs: Job[]): AIMatchResult[] {
		try {
			// Strip markdown code block formatting if present
			let cleanContent = content.trim();

			// Remove any text before JSON starts
			const jsonStartIndex = cleanContent.indexOf("{");
			if (jsonStartIndex > 0) {
				cleanContent = cleanContent.substring(jsonStartIndex);
			}

			// Remove any text after JSON ends
			const jsonEndIndex = cleanContent.lastIndexOf("}");
			if (jsonEndIndex > 0 && jsonEndIndex < cleanContent.length - 1) {
				cleanContent = cleanContent.substring(0, jsonEndIndex + 1);
			}

			// Strip markdown code block formatting if present
			if (cleanContent.startsWith("```json")) {
				cleanContent = cleanContent
					.replace(/^```json\s*/, "")
					.replace(/\s*```$/, "");
			}
			if (cleanContent.startsWith("```")) {
				cleanContent = cleanContent
					.replace(/^```\s*/, "")
					.replace(/\s*```$/, "");
			}

			// Clean up any remaining markdown or extra text
			cleanContent = cleanContent.trim();

			// Fix common AI typos (like "matche" instead of "matches")
			cleanContent = cleanContent.replace(/"matche":/g, '"matches":');

			const parsed = JSON.parse(cleanContent);
			const matches = parsed.matches || [];

			// Validate that we have an array
			if (!Array.isArray(matches)) {
				apiLogger.warn("AI response does not contain matches array", {
					responsePreview: cleanContent.substring(0, 200),
				});
				return [];
			}

			return matches
				.map((match: any) => {
					const jobIndex = match.jobIndex || match.job_index;
					const job = jobs[jobIndex];

					if (!job || jobIndex === undefined || jobIndex === null) {
						apiLogger.warn("Invalid jobIndex in AI response", {
							jobIndex,
							availableJobs: jobs.length,
						});
						return null;
					}

					// Extract scores from response (handle different possible field names)
					const overallScore = Math.max(
						0,
						Math.min(
							100,
							match.matchScore || match.match_score || match.score || 0,
						),
					);

					// Skip matches with very low scores
					if (overallScore < 30) {
						apiLogger.info("Skipping low-score match from AI", {
							jobIndex,
							score: overallScore,
						});
						return null;
					}

					// Distribute overall score across components
					const components: ScoreComponents = {
						relevance: Math.max(0, Math.min(100, overallScore * 0.4)), // Skills/career alignment
						quality: Math.max(0, Math.min(100, overallScore * 0.3)), // Company quality
						opportunity: Math.max(0, Math.min(100, overallScore * 0.2)), // Career opportunity
						timing: Math.max(0, Math.min(100, overallScore * 0.1)), // Location/freshness
					};

					// Create unified score object
					const unifiedScore: UnifiedScore = {
						overall: overallScore,
						components,
						confidence: Math.max(
							0,
							Math.min(
								100,
								match.confidenceScore || match.confidence_score || 85,
							),
						),
						method: "ai",
					};

					// Add explanation for transparency
					unifiedScore.explanation = generateScoreExplanation(
						unifiedScore,
						job.title || "Unknown Position",
					);

					return {
						job,
						unifiedScore,
						matchReason:
							match.matchReason ||
							match.match_reason ||
							match.reason ||
							"AI analyzed match",
					};
				})
				.filter(Boolean) as AIMatchResult[];
		} catch (error) {
			apiLogger.error("Failed to parse OpenAI response", error as Error, {
				responsePreview: content.substring(0, 500),
				errorMessage: (error as Error).message,
			});

			// Capture in Sentry
			Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
				tags: {
					service: "AIMatchingService",
					method: "parseResponse",
					error_type: "response_parsing_failed",
				},
				extra: {
					responsePreview: content.substring(0, 500),
					responseLength: content.length,
					jobsCount: jobs.length,
					operation: "response_parsing",
				},
				level: "error",
			});

			return [];
		}
	}

	/**
	 * Generate cache key
	 */
	private generateCacheKey(user: UserPreferences, jobs: Job[]): string {
		const userKey = `${user.email}-${user.entry_level_preference}-${JSON.stringify(user.career_keywords)}`;
		const jobsKey = jobs
			.map((j) => `${j.title}-${j.company}`)
			.sort()
			.join("|");
		return `${userKey}|${jobsKey}`;
	}
}

// Safe module-level initialization - prevent module loading errors
let aiMatchingService: AIMatchingService;

try {
	// Debug OpenAI API key issue
	console.log("🔍 AI Matching Service Debug:", {
		hasENV_OPENAI_API_KEY: !!ENV.OPENAI_API_KEY,
		keyLength: ENV.OPENAI_API_KEY?.length || 0,
		keyPrefix: ENV.OPENAI_API_KEY?.substring(0, 8) || 'undefined',
		NODE_ENV: process.env.NODE_ENV,
	});

	// Export singleton with proper environment initialization
	aiMatchingService = new AIMatchingService(ENV.OPENAI_API_KEY || undefined);
	console.log("✅ AI Matching Service initialized successfully");
} catch (initError) {
	console.error("❌ AI Matching Service initialization failed:", initError);
	
	// Create a fallback service that always fails gracefully
	aiMatchingService = new AIMatchingService(); // No API key - will fail gracefully
	console.log("🔄 Created fallback AI Matching Service");
}

export { aiMatchingService };

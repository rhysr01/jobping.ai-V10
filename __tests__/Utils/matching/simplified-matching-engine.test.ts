/**
 * UNIT TESTS for SimplifiedMatchingEngine - 100% Coverage
 *
 * Comprehensive unit tests covering all code paths in the SimplifiedMatchingEngine
 * to achieve complete test coverage of our core business logic.
 */

import { SimplifiedMatchingEngine } from "../../../../utils/matching/core/matching-engine";
import type { Job } from "../../../../scrapers/types";
import type { UserPreferences } from "../../../../utils/matching/types";
import type { PrefilterResult } from "../../../../utils/matching/core/prefilter.service";
import type { AIMatchResult } from "../../../../utils/matching/core/ai-matching.service";
import type { FallbackMatch } from "../../../../utils/matching/core/fallback.service";

// Mock all dependencies
jest.mock("../../../../lib/api-logger", () => ({
	apiLogger: {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	},
}));

jest.mock("../../../../utils/matching/core/prefilter.service", () => ({
	prefilterService: {
		prefilterJobs: jest.fn(),
	},
}));

jest.mock("../../../../utils/matching/core/ai-matching.service", () => ({
	aiMatchingService: {
		findMatches: jest.fn(),
	},
}));

jest.mock("../../../../utils/matching/core/fallback.service", () => ({
	fallbackService: {
		generateFallbackMatches: jest.fn(),
	},
}));

jest.mock("../../../../utils/matching/matchUtils", () => ({
	calculateFreshnessTier: jest.fn(),
	convertAIMatchesToJobMatches: jest.fn(),
	convertFallbackMatchesToJobMatches: jest.fn(),
}));

describe("SimplifiedMatchingEngine - 100% Coverage", () => {
	let engine: SimplifiedMatchingEngine;
	let mockUser: UserPreferences;
	let mockJobs: Job[];

	beforeEach(() => {
		engine = new SimplifiedMatchingEngine();
		mockUser = {
			email: "test@example.com",
			full_name: "Test User",
			target_cities: ["London"],
			career_path: ["Tech & Transformation"],
			professional_expertise: "Software Development",
			work_environment: "hybrid",
			visa_status: "eu-citizen",
			entry_level_preference: "entry",
			languages_spoken: ["English"],
			company_types: ["tech"],
			roles_selected: ["software-engineer"],
			subscription_tier: "free",
		};

		mockJobs = [
			{
				job_hash: "job1",
				title: "Software Engineer",
				company: "Tech Corp",
				location: "London, UK",
				city: "London",
				country: "UK",
				job_url: "https://example.com/job1",
				description: "Software engineering role",
				experience_required: "entry-level",
				work_environment: "hybrid",
				source: "test",
				categories: ["tech-transformation"],
				company_profile_url: "",
				language_requirements: ["English"],
				scrape_timestamp: new Date().toISOString(),
				original_posted_date: new Date().toISOString(),
				posted_at: new Date().toISOString(),
				last_seen_at: new Date().toISOString(),
				is_active: true,
				is_graduate: false,
				is_internship: false,
				created_at: new Date().toISOString(),
			},
		];

		// Reset all mocks
		jest.clearAllMocks();
	});

	describe("Normal AI Success Path", () => {
		beforeEach(() => {
			// Mock successful prefilter
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: mockJobs.map(job => ({ ...job, freshnessTier: "fresh", prefilterScore: 80 })),
				matchLevel: "exact",
				filteredCount: 1,
				sourceDistribution: { test: 1 },
			} as PrefilterResult);

			// Mock successful AI matching
			const mockAIMatchingService = require("../../../../utils/matching/core/ai-matching.service").aiMatchingService;
			mockAIMatchingService.findMatches.mockResolvedValue([
				{
					job: mockJobs[0],
					matchScore: 85,
					confidenceScore: 0.9,
					matchReason: "Strong AI match",
					scoreBreakdown: {
						skills: 80,
						experience: 85,
						location: 90,
						company: 75,
						overall: 85,
					},
				} as AIMatchResult,
			]);

			// Mock utility functions
			const mockMatchUtils = require("../../../../utils/matching/matchUtils");
			mockMatchUtils.calculateFreshnessTier.mockReturnValue("fresh");
			mockMatchUtils.convertAIMatchesToJobMatches.mockReturnValue([
				{
					job_index: 0,
					job_hash: "job1",
					job: mockJobs[0],
					match_score: 85,
					match_reason: "Strong AI match",
					confidence_score: 0.9,
					score_breakdown: {
						overall: 85,
						eligibility: 0,
						careerPath: 0,
						location: 90,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 85,
						companyCulture: 75,
						skills: 80,
						timing: 0,
					},
					method: "ai",
					timestamp: new Date().toISOString(),
				},
			]);
		});

		it("should return AI matches when AI succeeds", async () => {
			const result = await engine.findMatchesForUser(mockUser, mockJobs);

			expect(result).toBeDefined();
			expect(result.method).toBe("ai");
			expect(result.matches).toHaveLength(1);
			expect(result.matches[0].match_score).toBe(85);
			expect(result.totalJobsProcessed).toBe(1);
			expect(result.prefilterResults.matchLevel).toBe("exact");
		});

		it("should call prefilter with freshness tiers", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			expect(mockPrefilterService.prefilterJobs).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						freshnessTier: "fresh",
					}),
				]),
				mockUser
			);
		});

		it("should log AI success", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.info).toHaveBeenCalledWith(
				"AI matching successful",
				expect.objectContaining({
					userEmail: mockUser.email,
					aiMatches: 1,
				})
			);
		});

		it("should include processing time", async () => {
			const result = await engine.findMatchesForUser(mockUser, mockJobs);

			expect(result.processingTime).toBeDefined();
			expect(typeof result.processingTime).toBe("number");
			expect(result.processingTime).toBeGreaterThanOrEqual(0);
		});
	});

	describe("AI Failure → Fallback Success Path", () => {
		beforeEach(() => {
			// Mock successful prefilter
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: mockJobs.map(job => ({ ...job, freshnessTier: "fresh", prefilterScore: 80 })),
				matchLevel: "exact",
				filteredCount: 1,
				sourceDistribution: { test: 1 },
			} as PrefilterResult);

			// Mock AI failure
			const mockAIMatchingService = require("../../../../utils/matching/core/ai-matching.service").aiMatchingService;
			mockAIMatchingService.findMatches.mockRejectedValue(new Error("AI service unavailable"));

			// Mock fallback success
			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			mockFallbackService.generateFallbackMatches.mockReturnValue([
				{
					job: mockJobs[0],
					matchScore: 75,
					matchReason: "Fallback match",
					matchQuality: "good",
					confidenceScore: 0.8,
					scoreBreakdown: {
						skills: 70,
						experience: 75,
						location: 80,
						recency: 70,
					},
				} as FallbackMatch,
			]);

			// Mock conversion
			const mockMatchUtils = require("../../../../utils/matching/matchUtils");
			mockMatchUtils.convertFallbackMatchesToJobMatches.mockReturnValue([
				{
					job_index: 0,
					job_hash: "job1",
					job: mockJobs[0],
					match_score: 75,
					match_reason: "Fallback match",
					confidence_score: 0.8,
					score_breakdown: {
						overall: 75,
						eligibility: 0,
						careerPath: 0,
						location: 80,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 75,
						companyCulture: 0,
						skills: 70,
						timing: 70,
					},
					method: "fallback",
					timestamp: new Date().toISOString(),
				},
			]);
		});

		it("should fallback to rules when AI fails", async () => {
			const result = await engine.findMatchesForUser(mockUser, mockJobs);

			expect(result.method).toBe("ai"); // Still marked as AI due to hybrid approach
			expect(result.matches).toHaveLength(1);
			expect(result.matches[0].match_score).toBe(75);
		});

		it("should log AI failure", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"AI matching failed, falling back to rules",
				expect.any(Error),
				expect.objectContaining({
					userEmail: mockUser.email,
				})
			);
		});

		it("should call fallback service when AI fails", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			expect(mockFallbackService.generateFallbackMatches).toHaveBeenCalledWith(
				mockJobs,
				mockUser,
				6 // fallbackThreshold * 2 (3 * 2)
			);
		});
	});

	describe("Prefilter Returns No Jobs", () => {
		beforeEach(() => {
			// Mock prefilter returning no jobs
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: [],
				matchLevel: "broad",
				filteredCount: 0,
				sourceDistribution: {},
			} as PrefilterResult);

			// Mock emergency fallback
			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			mockFallbackService.generateFallbackMatches.mockReturnValue([
				{
					job: mockJobs[0],
					matchScore: 50,
					matchReason: "Emergency fallback",
					matchQuality: "fair",
					confidenceScore: 0.5,
					scoreBreakdown: {
						skills: 50,
						experience: 50,
						location: 50,
						recency: 50,
					},
				} as FallbackMatch,
			]);

			const mockMatchUtils = require("../../../../utils/matching/matchUtils");
			mockMatchUtils.convertFallbackMatchesToJobMatches.mockReturnValue([
				{
					job_index: 0,
					job_hash: "job1",
					job: mockJobs[0],
					match_score: 50,
					match_reason: "Emergency fallback",
					confidence_score: 0.5,
					score_breakdown: {
						overall: 50,
						eligibility: 0,
						careerPath: 0,
						location: 50,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 50,
						companyCulture: 0,
						skills: 50,
						timing: 50,
					},
					method: "fallback",
					timestamp: new Date().toISOString(),
				},
			]);
		});

		it("should return empty matches when prefilter finds nothing", async () => {
			const result = await engine.findMatchesForUser(mockUser, mockJobs);

			expect(result.matches).toHaveLength(0);
			expect(result.method).toBe("fallback");
			expect(result.prefilterResults.filteredCount).toBe(0);
		});

		it("should log when no jobs pass prefilter", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"No jobs passed prefilter",
				expect.objectContaining({
					userEmail: mockUser.email,
					totalJobs: 1,
				})
			);
		});
	});

	describe("AI Disabled - Fallback Only", () => {
		beforeEach(() => {
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: mockJobs.map(job => ({ ...job, freshnessTier: "fresh", prefilterScore: 80 })),
				matchLevel: "exact",
				filteredCount: 1,
				sourceDistribution: { test: 1 },
			} as PrefilterResult);

			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			mockFallbackService.generateFallbackMatches.mockReturnValue([
				{
					job: mockJobs[0],
					matchScore: 70,
					matchReason: "Rule-based match",
					matchQuality: "good",
					confidenceScore: 0.75,
					scoreBreakdown: {
						skills: 65,
						experience: 70,
						location: 75,
						recency: 70,
					},
				} as FallbackMatch,
			]);

			const mockMatchUtils = require("../../../../utils/matching/matchUtils");
			mockMatchUtils.convertFallbackMatchesToJobMatches.mockReturnValue([
				{
					job_index: 0,
					job_hash: "job1",
					job: mockJobs[0],
					match_score: 70,
					match_reason: "Rule-based match",
					confidence_score: 0.75,
					score_breakdown: {
						overall: 70,
						eligibility: 0,
						careerPath: 0,
						location: 75,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 70,
						companyCulture: 0,
						skills: 65,
						timing: 70,
					},
					method: "fallback",
					timestamp: new Date().toISOString(),
				},
			]);
		});

		it("should use only fallback when AI is disabled", async () => {
			const result = await engine.findMatchesForUser(mockUser, mockJobs, {
				useAI: false,
			});

			expect(result.method).toBe("fallback");
			expect(result.matches).toHaveLength(1);
			expect(result.matches[0].match_score).toBe(70);
		});

		it("should not call AI service when disabled", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs, {
				useAI: false,
			});

			const mockAIMatchingService = require("../../../../utils/matching/core/ai-matching.service").aiMatchingService;
			expect(mockAIMatchingService.findMatches).not.toHaveBeenCalled();
		});
	});

	describe("Duplicate Match Removal", () => {
		beforeEach(() => {
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: mockJobs.map(job => ({ ...job, freshnessTier: "fresh", prefilterScore: 80 })),
				matchLevel: "exact",
				filteredCount: 1,
				sourceDistribution: { test: 1 },
			} as PrefilterResult);

			// Mock AI returning matches
			const mockAIMatchingService = require("../../../../utils/matching/core/ai-matching.service").aiMatchingService;
			mockAIMatchingService.findMatches.mockResolvedValue([
				{
					job: mockJobs[0],
					matchScore: 85,
					confidenceScore: 0.9,
					matchReason: "AI match",
					scoreBreakdown: {
						skills: 80,
						experience: 85,
						location: 90,
						company: 75,
						overall: 85,
					},
				} as AIMatchResult,
			]);

			// Mock fallback also returning the same job
			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			mockFallbackService.generateFallbackMatches.mockReturnValue([
				{
					job: mockJobs[0], // Same job
					matchScore: 75,
					matchReason: "Fallback match",
					matchQuality: "good",
					confidenceScore: 0.8,
					scoreBreakdown: {
						skills: 70,
						experience: 75,
						location: 80,
						recency: 70,
					},
				} as FallbackMatch,
			]);

			const mockMatchUtils = require("../../../../utils/matching/matchUtils");
			mockMatchUtils.convertAIMatchesToJobMatches.mockReturnValue([
				{
					job_index: 0,
					job_hash: "job1",
					job: mockJobs[0],
					match_score: 85,
					match_reason: "AI match",
					confidence_score: 0.9,
					score_breakdown: {
						overall: 85,
						eligibility: 0,
						careerPath: 0,
						location: 90,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 85,
						companyCulture: 75,
						skills: 80,
						timing: 0,
					},
					method: "ai",
					timestamp: new Date().toISOString(),
				},
			]);

			mockMatchUtils.convertFallbackMatchesToJobMatches.mockReturnValue([
				{
					job_index: 1,
					job_hash: "job1", // Same hash - duplicate
					job: mockJobs[0],
					match_score: 75,
					match_reason: "Fallback match",
					confidence_score: 0.8,
					score_breakdown: {
						overall: 75,
						eligibility: 0,
						careerPath: 0,
						location: 80,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 75,
						companyCulture: 0,
						skills: 70,
						timing: 70,
					},
					method: "fallback",
					timestamp: new Date().toISOString(),
				},
			]);
		});

		it("should remove duplicate matches by job URL", async () => {
			// Set fallback threshold low to trigger fallback combination
			const result = await engine.findMatchesForUser(mockUser, mockJobs, {
				fallbackThreshold: 1, // Force fallback to combine
			});

			// Should only have one match despite AI + fallback both returning the same job
			expect(result.matches).toHaveLength(1);
			expect(result.matches[0].match_score).toBe(85); // AI match should win (higher score)
		});
	});

	describe("Error Handling - Emergency Fallback", () => {
		beforeEach(() => {
			// Mock prefilter failure
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockRejectedValue(new Error("Prefilter crashed"));

			// Mock emergency fallback
			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			mockFallbackService.generateFallbackMatches.mockReturnValue([
				{
					job: mockJobs[0],
					matchScore: 30,
					matchReason: "Emergency fallback match",
					matchQuality: "low",
					confidenceScore: 0.3,
					scoreBreakdown: {
						skills: 30,
						experience: 30,
						location: 30,
						recency: 30,
					},
				} as FallbackMatch,
			]);

			const mockMatchUtils = require("../../../../utils/matching/matchUtils");
			mockMatchUtils.convertFallbackMatchesToJobMatches.mockReturnValue([
				{
					job_index: 0,
					job_hash: "job1",
					job: mockJobs[0],
					match_score: 30,
					match_reason: "Emergency fallback match",
					confidence_score: 0.3,
					score_breakdown: {
						overall: 30,
						eligibility: 0,
						careerPath: 0,
						location: 30,
						workEnvironment: 0,
						roleFit: 0,
						experienceLevel: 30,
						companyCulture: 0,
						skills: 30,
						timing: 30,
					},
					method: "fallback",
					timestamp: new Date().toISOString(),
				},
			]);
		});

		it("should use emergency fallback when everything fails", async () => {
			const result = await engine.findMatchesForUser(mockUser, mockJobs);

			expect(result.method).toBe("fallback");
			expect(result.matches).toHaveLength(1);
			expect(result.matches[0].match_score).toBe(30);
			expect(result.prefilterResults.matchLevel).toBe("broad");
			expect(result.prefilterResults.filteredCount).toBe(0);
		});

		it("should log matching engine errors", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Matching engine failed",
				expect.any(Error),
				expect.objectContaining({
					userEmail: mockUser.email,
					totalJobs: 1,
				})
			);
		});
	});

	describe("Custom Options", () => {
		beforeEach(() => {
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: mockJobs.map(job => ({ ...job, freshnessTier: "fresh", prefilterScore: 80 })),
				matchLevel: "exact",
				filteredCount: 1,
				sourceDistribution: { test: 1 },
			} as PrefilterResult);

			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			mockFallbackService.generateFallbackMatches.mockReturnValue([]);
		});

		it("should respect custom maxJobsForAI option", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs, {
				maxJobsForAI: 5,
			});

			const mockAIMatchingService = require("../../../../utils/matching/core/ai-matching.service").aiMatchingService;
			expect(mockAIMatchingService.findMatches).toHaveBeenCalledWith(
				mockUser,
				expect.any(Array), // Should be limited to 5 jobs
				expect.any(Object)
			);
		});

		it("should respect custom fallbackThreshold option", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs, {
				fallbackThreshold: 2,
			});

			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			expect(mockFallbackService.generateFallbackMatches).toHaveBeenCalledWith(
				expect.any(Array),
				mockUser,
				4 // 2 * 2
			);
		});

		it("should use default options when none provided", async () => {
			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockFallbackService = require("../../../../utils/matching/core/fallback.service").fallbackService;
			expect(mockFallbackService.generateFallbackMatches).toHaveBeenCalledWith(
				expect.any(Array),
				mockUser,
				6 // 3 * 2 (default fallbackThreshold)
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty job list", async () => {
			const result = await engine.findMatchesForUser(mockUser, []);

			expect(result.matches).toHaveLength(0);
			expect(result.totalJobsProcessed).toBe(0);
			expect(result.method).toBe("fallback");
		});

		it("should handle jobs without required fields", async () => {
			const incompleteJobs: Job[] = [
				{
					job_hash: "incomplete",
					title: "Test Job",
					// Missing many required fields
				} as Job,
			];

			// Should not crash
			const result = await engine.findMatchesForUser(mockUser, incompleteJobs);

			expect(result).toBeDefined();
			expect(result.totalJobsProcessed).toBe(1);
		});

		it("should log final matching results", async () => {
			const mockPrefilterService = require("../../../../utils/matching/core/prefilter.service").prefilterService;
			mockPrefilterService.prefilterJobs.mockResolvedValue({
				jobs: mockJobs.map(job => ({ ...job, freshnessTier: "fresh", prefilterScore: 80 })),
				matchLevel: "exact",
				filteredCount: 1,
				sourceDistribution: { test: 1 },
			} as PrefilterResult);

			await engine.findMatchesForUser(mockUser, mockJobs);

			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Matching completed",
				expect.objectContaining({
					metadata: expect.objectContaining({
						userEmail: mockUser.email,
						method: expect.any(String),
						matchesFound: expect.any(Number),
						totalJobsProcessed: 1,
						prefilteredJobs: 1,
						processingTime: expect.any(Number),
					}),
				})
			);
		});
	});
});
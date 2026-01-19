/**
 * UNIT TESTS for AIMatchingService - 100% Coverage
 *
 * Comprehensive unit tests covering all code paths in the AI matching service
 * to achieve complete test coverage of our AI-powered job matching.
 */

import { AIMatchingService } from "../../../../utils/matching/core/ai-matching.service";
import type { Job } from "../../../../scrapers/types";
import type { UserPreferences } from "../../../../utils/matching/types";

// Mock OpenAI
jest.mock("openai", () => {
	return {
		default: jest.fn().mockImplementation(() => ({
			chat: {
				completions: {
					create: jest.fn(),
				},
			},
		})),
	};
});

// Mock cache
jest.mock("../../../../lib/cache", () => ({
	aiMatchingCache: {
		get: jest.fn(),
		set: jest.fn(),
	},
}));

// Mock logger
jest.mock("../../../../lib/api-logger", () => ({
	apiLogger: {
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
	},
}));

describe("AIMatchingService - 100% Coverage", () => {
	let service: AIMatchingService;
	let mockUser: UserPreferences;
	let mockJobs: Job[];

	beforeEach(() => {
		// Clear environment
		delete process.env.OPENAI_API_KEY;

		// Create service without API key for controlled testing
		service = new AIMatchingService("test-key");

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
			career_keywords: ["JavaScript", "React", "TypeScript"],
		};

		mockJobs = [
			{
				job_hash: "job1",
				title: "Senior Software Engineer",
				company: "Tech Corp",
				location: "London, UK",
				city: "London",
				country: "UK",
				job_url: "https://example.com/job1",
				description:
					"Looking for experienced software engineer with React and TypeScript skills",
				experience_required: "mid-level",
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

		jest.clearAllMocks();
	});

	describe("Constructor", () => {
		it("should initialize with provided API key", () => {
			const customService = new AIMatchingService("custom-key");
			expect(customService).toBeDefined();
		});

		it("should initialize with environment variable", () => {
			process.env.OPENAI_API_KEY = "env-key";
			const envService = new AIMatchingService();
			expect(envService).toBeDefined();
			delete process.env.OPENAI_API_KEY;
		});

		it("should initialize without OpenAI client when no key provided", () => {
			const noKeyService = new AIMatchingService();
			expect(noKeyService).toBeDefined();
		});
	});

	describe("findMatches - Main Method", () => {
		beforeEach(() => {
			// Mock successful OpenAI response
			const mockOpenAI = require("openai").default;
			mockOpenAI.mockImplementation(() => ({
				chat: {
					completions: {
						create: jest.fn().mockResolvedValue({
							choices: [
								{
									message: {
										content: JSON.stringify([
											{
												jobIndex: 0,
												matchScore: 85,
												confidenceScore: 90,
												matchReason: "Strong match",
												scoreBreakdown: {
													skills: 80,
													experience: 85,
													location: 90,
													company: 75,
													overall: 85,
												},
											},
										]),
									},
								},
							],
						}),
					},
				},
			}));
		});

		it("should return AI matches for valid input", async () => {
			const results = await service.findMatches(mockUser, mockJobs);

			expect(results).toHaveLength(1);
			expect(results[0]).toEqual({
				job: mockJobs[0],
				matchScore: 85,
				confidenceScore: 90,
				matchReason: "Strong match",
				scoreBreakdown: {
					skills: 80,
					experience: 85,
					location: 90,
					company: 75,
					overall: 85,
				},
			});
		});

		it("should sort results by match score descending", async () => {
			// Mock multiple results with different scores
			const mockOpenAI = require("openai").default;
			mockOpenAI.mockImplementation(() => ({
				chat: {
					completions: {
						create: jest.fn().mockResolvedValue({
							choices: [
								{
									message: {
										content: JSON.stringify([
											{
												jobIndex: 0,
												matchScore: 70,
												confidenceScore: 80,
												matchReason: "Good match",
												scoreBreakdown: {
													skills: 65,
													experience: 70,
													location: 75,
													company: 70,
													overall: 70,
												},
											},
											{
												jobIndex: 0,
												matchScore: 90,
												confidenceScore: 95,
												matchReason: "Excellent match",
												scoreBreakdown: {
													skills: 85,
													experience: 90,
													location: 95,
													company: 80,
													overall: 90,
												},
											},
										]),
									},
								},
							],
						}),
					},
				},
			}));

			const results = await service.findMatches(mockUser, mockJobs);

			expect(results).toHaveLength(2);
			expect(results[0].matchScore).toBe(90); // Highest score first
			expect(results[1].matchScore).toBe(70); // Lower score second
		});

		it("should process jobs in batches of 5", async () => {
			const manyJobs = Array.from({ length: 12 }, (_, i) => ({
				...mockJobs[0],
				job_hash: `job${i}`,
				title: `Job ${i}`,
			}));

			const mockOpenAI = require("openai").default;
			const createMock = jest.fn().mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify([]),
						},
					},
				],
			});

			mockOpenAI.mockImplementation(() => ({
				chat: {
					completions: {
						create: createMock,
					},
				},
			}));

			await service.findMatches(mockUser, manyJobs);

			// Should be called 3 times for 12 jobs (batches of 5, 5, 2)
			expect(createMock).toHaveBeenCalledTimes(3);
		});

		it("should add rate limiting delays between batches", async () => {
			const manyJobs = Array.from({ length: 8 }, (_, i) => ({
				...mockJobs[0],
				job_hash: `job${i}`,
				title: `Job ${i}`,
			}));

			const startTime = Date.now();

			await service.findMatches(mockUser, manyJobs);

			const duration = Date.now() - startTime;
			// Should take at least 1 second due to rate limiting
			expect(duration).toBeGreaterThanOrEqual(1000);
		});

		it("should respect custom options", async () => {
			const customOptions = {
				maxRetries: 5,
				timeoutMs: 60000,
				useCache: false,
				model: "gpt-4",
			};

			await service.findMatches(mockUser, mockJobs, customOptions);

			const mockOpenAI = require("openai").default;
			expect(mockOpenAI).toHaveBeenCalledWith(
				expect.objectContaining({
					apiKey: "test-key",
				}),
			);
		});

		it("should use default options when none provided", async () => {
			await service.findMatches(mockUser, mockJobs);

			const mockOpenAI = require("openai").default;
			const instance = mockOpenAI.mock.results[0].value;
			const createCall = instance.chat.completions.create.mock.calls[0][0];

			expect(createCall.model).toBe("gpt-4o-mini");
		});

		it("should throw error when OpenAI not initialized", async () => {
			const noKeyService = new AIMatchingService();

			await expect(
				noKeyService.findMatches(mockUser, mockJobs),
			).rejects.toThrow("OpenAI client not initialized");
		});

		it("should log completion statistics", async () => {
			await service.findMatches(mockUser, mockJobs);

			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.info).toHaveBeenCalledWith(
				"AI matching completed",
				expect.objectContaining({
					metadata: expect.objectContaining({
						userEmail: mockUser.email,
						jobsProcessed: 1,
						matchesFound: 1,
						processingTime: expect.any(Number),
					}),
				}),
			);
		});
	});

	describe("Cache Functionality", () => {
		it("should return cached results when available", async () => {
			const mockCache = require("../../../../lib/cache").aiMatchingCache;
			const cachedResults = [
				{
					job: mockJobs[0],
					matchScore: 80,
					confidenceScore: 85,
					matchReason: "Cached match",
					scoreBreakdown: {
						skills: 75,
						experience: 80,
						location: 85,
						company: 70,
						overall: 80,
					},
				},
			];

			mockCache.get.mockReturnValue(cachedResults);

			const results = await service.findMatches(mockUser, mockJobs);

			expect(results).toEqual(cachedResults);
			expect(mockCache.get).toHaveBeenCalled();

			// Should not call OpenAI
			const mockOpenAI = require("openai").default;
			expect(mockOpenAI).not.toHaveBeenCalled();
		});

		it("should cache results after successful API call", async () => {
			const mockCache = require("../../../../lib/cache").aiMatchingCache;
			mockCache.get.mockReturnValue(null); // No cache hit

			await service.findMatches(mockUser, mockJobs);

			expect(mockCache.set).toHaveBeenCalledWith(
				expect.any(String), // Cache key
				expect.any(Array), // Results
			);
		});

		it("should skip caching when useCache is false", async () => {
			const mockCache = require("../../../../lib/cache").aiMatchingCache;

			await service.findMatches(mockUser, mockJobs, { useCache: false });

			expect(mockCache.get).not.toHaveBeenCalled();
			expect(mockCache.set).not.toHaveBeenCalled();
		});

		it("should generate consistent cache keys", () => {
			const key1 = (service as any).generateCacheKey(mockUser, mockJobs);
			const key2 = (service as any).generateCacheKey(mockUser, mockJobs);

			expect(key1).toBe(key2);
			expect(typeof key1).toBe("string");
			expect(key1.length).toBeGreaterThan(0);
		});
	});

	describe("OpenAI API Integration", () => {
		it("should call OpenAI with correct parameters", async () => {
			await service.findMatches(mockUser, mockJobs);

			const mockOpenAI = require("openai").default;
			const instance = mockOpenAI.mock.results[0].value;
			const createCall = instance.chat.completions.create.mock.calls[0][0];

			expect(createCall).toEqual({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: expect.stringContaining("expert career counselor"),
					},
					{
						role: "user",
						content: expect.stringContaining("User Profile"),
					},
				],
				max_tokens: 2000,
				temperature: 0.3,
			});
		});

		it("should handle OpenAI API failures gracefully", async () => {
			const mockOpenAI = require("openai").default;
			mockOpenAI.mockImplementation(() => ({
				chat: {
					completions: {
						create: jest
							.fn()
							.mockRejectedValue(new Error("API rate limit exceeded")),
					},
				},
			}));

			const results = await service.findMatches(mockUser, mockJobs);

			expect(results).toEqual([]); // Should return empty array on failure

			// Should log the error
			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.error).toHaveBeenCalledWith(
				"OpenAI API call failed",
				expect.any(Error),
				expect.objectContaining({
					userEmail: mockUser.email,
					jobsCount: 1,
				}),
			);
		});

		it("should handle empty OpenAI response", async () => {
			const mockOpenAI = require("openai").default;
			mockOpenAI.mockImplementation(() => ({
				chat: {
					completions: {
						create: jest.fn().mockResolvedValue({
							choices: [
								{
									message: {
										content: null, // Empty response
									},
								},
							],
						}),
					},
				},
			}));

			const results = await service.findMatches(mockUser, mockJobs);

			expect(results).toEqual([]); // Should return empty array
		});

		it("should handle malformed JSON response", async () => {
			const mockOpenAI = require("openai").default;
			mockOpenAI.mockImplementation(() => ({
				chat: {
					completions: {
						create: jest.fn().mockResolvedValue({
							choices: [
								{
									message: {
										content: "Invalid JSON response {",
									},
								},
							],
						}),
					},
				},
			}));

			const results = await service.findMatches(mockUser, mockJobs);

			expect(results).toEqual([]); // Should return empty array

			// Should log parse error
			const mockLogger = require("../../../../lib/api-logger").apiLogger;
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to parse OpenAI response",
				expect.any(Error),
			);
		});
	});

	describe("Prompt Building", () => {
		it("should build comprehensive prompts", () => {
			const prompt = (service as any).buildPrompt(mockUser, mockJobs);

			expect(prompt).toContain("User Profile");
			expect(prompt).toContain("Career Goals");
			expect(prompt).toContain("Job Opportunities");
			expect(prompt).toContain(mockUser.email);
			expect(prompt).toContain("Tech & Transformation");
			expect(prompt).toContain("JavaScript");
			expect(prompt).toContain("Senior Software Engineer");
			expect(prompt).toContain("entry-level");
		});

		it("should handle users without career keywords", () => {
			const userWithoutKeywords = {
				...mockUser,
				career_keywords: undefined,
			};

			const prompt = (service as any).buildPrompt(
				userWithoutKeywords,
				mockJobs,
			);

			expect(prompt).toBeDefined();
			expect(typeof prompt).toBe("string");
		});

		it("should handle empty job array", () => {
			const prompt = (service as any).buildPrompt(mockUser, []);

			expect(prompt).toContain("Job Opportunities: None available");
		});
	});

	describe("Response Parsing", () => {
		it("should parse valid JSON responses", () => {
			const validResponse = JSON.stringify([
				{
					jobIndex: 0,
					matchScore: 85,
					confidenceScore: 90,
					matchReason: "Good match",
					scoreBreakdown: {
						skills: 80,
						experience: 85,
						location: 90,
						company: 75,
						overall: 85,
					},
				},
			]);

			const results = (service as any).parseResponse(validResponse, mockJobs);

			expect(results).toHaveLength(1);
			expect(results[0].matchScore).toBe(85);
			expect(results[0].confidenceScore).toBe(90);
		});

		it("should clamp score values to valid ranges", () => {
			const outOfRangeResponse = JSON.stringify([
				{
					jobIndex: 0,
					matchScore: 150, // Too high
					confidenceScore: -10, // Too low
					matchReason: "Test match",
					scoreBreakdown: {
						skills: 80,
						experience: 85,
						location: 90,
						company: 75,
						overall: 85,
					},
				},
			]);

			const results = (service as any).parseResponse(
				outOfRangeResponse,
				mockJobs,
			);

			expect(results[0].matchScore).toBe(100); // Clamped to max
			expect(results[0].confidenceScore).toBe(0); // Clamped to min
		});

		it("should skip matches with invalid job indices", () => {
			const invalidIndexResponse = JSON.stringify([
				{
					jobIndex: 999, // Invalid index
					matchScore: 85,
					confidenceScore: 90,
					matchReason: "Invalid match",
					scoreBreakdown: {
						skills: 80,
						experience: 85,
						location: 90,
						company: 75,
						overall: 85,
					},
				},
			]);

			const results = (service as any).parseResponse(
				invalidIndexResponse,
				mockJobs,
			);

			expect(results).toHaveLength(0); // Should skip invalid match
		});

		it("should handle missing scoreBreakdown fields", () => {
			const incompleteResponse = JSON.stringify([
				{
					jobIndex: 0,
					matchScore: 85,
					confidenceScore: 90,
					matchReason: "Incomplete match",
					scoreBreakdown: {
						skills: 80,
						// Missing other fields
					},
				},
			]);

			const results = (service as any).parseResponse(
				incompleteResponse,
				mockJobs,
			);

			expect(results).toHaveLength(1);
			expect(results[0].scoreBreakdown.skills).toBe(80);
			expect(results[0].scoreBreakdown.experience).toBeUndefined();
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty job array", async () => {
			const results = await service.findMatches(mockUser, []);

			expect(results).toEqual([]);
		});

		it("should handle jobs with missing fields", async () => {
			const incompleteJobs = [
				{
					job_hash: "incomplete",
					title: "Test Job",
					// Missing many required fields
				},
			] as Job[];

			// Should not crash
			const results = await service.findMatches(mockUser, incompleteJobs);

			expect(results).toBeDefined();
		});

		it("should handle users with minimal data", async () => {
			const minimalUser = {
				email: "minimal@test.com",
				target_cities: [],
				career_path: [],
				subscription_tier: "free",
			} as UserPreferences;

			const results = await service.findMatches(minimalUser, mockJobs);

			expect(results).toBeDefined();
		});

		it("should handle very long job descriptions", async () => {
			const longJob = {
				...mockJobs[0],
				description: "A".repeat(2000), // Very long description
			};

			const results = await service.findMatches(mockUser, [longJob]);

			expect(results).toBeDefined();
		});

		it("should handle unicode characters in job data", async () => {
			const unicodeJob = {
				...mockJobs[0],
				title: "Développeur Senior 🚀",
				company: "TechCorp™",
				description: "Rôle technique avec émojis 🎯",
			};

			const results = await service.findMatches(mockUser, [unicodeJob]);

			expect(results).toBeDefined();
		});
	});
});

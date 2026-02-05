// File: /utils/strategies/FreeMatchingStrategy.ts
// Purpose: Simple matching strategy for free tier users (1-step form)
// Free users provide: email, name, cities, career only
// Result: 5 matches

import * as Sentry from "@sentry/nextjs";
import { apiLogger } from "../../lib/api-logger";
import type { JobWithMetadata } from "../../lib/types/job";
import { getDatabaseClient } from "../core/database-pool";
import { LOG_MARKERS } from "../../lib/log-markers";
import { aiMatchingService } from "../matching/core/ai-matching.service";

/**
 * Diversity Sampling Function - Ensures city and source distribution
 * 
 * Strategy:
 * - Distribute jobs across all selected cities
 * - Limit jobs per source to prevent clustering
 * - Maintain randomness within constraints
 */
function diversifySample(jobs: JobWithMetadata[], targetCities: string[], maxJobs: number = 20): JobWithMetadata[] {
	if (jobs.length === 0 || targetCities.length === 0) {
		return jobs.slice(0, maxJobs);
	}

	// Group jobs by city (case-insensitive)
	const cityGroups = new Map<string, JobWithMetadata[]>();
	const sourceGroups = new Map<string, JobWithMetadata[]>();
	
	jobs.forEach(job => {
		const cityKey = job.city?.toLowerCase() || 'unknown';
		const sourceKey = job.source || 'unknown';
		
		if (!cityGroups.has(cityKey)) {
			cityGroups.set(cityKey, []);
		}
		if (!sourceGroups.has(sourceKey)) {
			sourceGroups.set(sourceKey, []);
		}
		
		cityGroups.get(cityKey)!.push(job);
		sourceGroups.get(sourceKey)!.push(job);
	});

	// Calculate jobs per city (distribute evenly)
	const jobsPerCity = Math.ceil(maxJobs / targetCities.length);
	// Align with existing infrastructure: prefilter.service.ts uses 3 jobs per source
	const maxJobsPerSource = 3;
	
	const sampled: JobWithMetadata[] = [];
	const usedSourceCounts = new Map<string, number>();
	
	// Sample from each target city
	for (const targetCity of targetCities) {
		const cityKey = targetCity.toLowerCase();
		const cityJobs = cityGroups.get(cityKey) || [];
		
		if (cityJobs.length === 0) {
			console.log(`${LOG_MARKERS.MATCHING_FREE} No jobs found for city: ${targetCity}`);
			continue;
		}
		
		// Shuffle jobs within this city for randomness
		const shuffledCityJobs = [...cityJobs].sort(() => Math.random() - 0.5);
		
		let cityJobsAdded = 0;
		for (const job of shuffledCityJobs) {
			if (cityJobsAdded >= jobsPerCity) break;
			if (sampled.length >= maxJobs) break;
			
			// Check source diversity constraint
			const sourceKey = job.source || 'unknown';
			const currentSourceCount = usedSourceCounts.get(sourceKey) || 0;
			
			if (currentSourceCount >= maxJobsPerSource) {
				continue; // Skip this job to maintain source diversity
			}
			
			sampled.push(job);
			usedSourceCounts.set(sourceKey, currentSourceCount + 1);
			cityJobsAdded++;
		}
		
		console.log(`${LOG_MARKERS.MATCHING_FREE} Sampled ${cityJobsAdded} jobs from ${targetCity} (${cityJobs.length} available)`);
	}
	
	// If we haven't reached maxJobs, fill with remaining jobs (maintaining source limits)
	if (sampled.length < maxJobs) {
		const remainingJobs = jobs.filter(job => !sampled.includes(job));
		const shuffledRemaining = remainingJobs.sort(() => Math.random() - 0.5);
		
		for (const job of shuffledRemaining) {
			if (sampled.length >= maxJobs) break;
			
			const sourceKey = job.source || 'unknown';
			const currentSourceCount = usedSourceCounts.get(sourceKey) || 0;
			
			if (currentSourceCount < maxJobsPerSource) {
				sampled.push(job);
				usedSourceCounts.set(sourceKey, currentSourceCount + 1);
			}
		}
	}
	
	// Log diversity results
	const cityDistribution = new Map<string, number>();
	const sourceDistribution = new Map<string, number>();
	
	sampled.forEach(job => {
		const city = job.city || 'unknown';
		const source = job.source || 'unknown';
		cityDistribution.set(city, (cityDistribution.get(city) || 0) + 1);
		sourceDistribution.set(source, (sourceDistribution.get(source) || 0) + 1);
	});
	
	console.log(`${LOG_MARKERS.MATCHING_FREE} Final diversity sample: ${sampled.length} jobs`);
	console.log(`${LOG_MARKERS.MATCHING_FREE} City distribution:`, Object.fromEntries(cityDistribution));
	console.log(`${LOG_MARKERS.MATCHING_FREE} Source distribution:`, Object.fromEntries(sourceDistribution));
	
	return sampled;
}

/**
 * FREE Tier User Preferences - ONLY fields collected from form
 * Form collects: email, fullName, cities (1-3), careerPath (exactly 1)
 * NO visa, NO entry_level, NO skills, NO industries (premium-only features)
 */
export interface FreeUserPreferences {
	email: string;
	target_cities: string[];
	career_path: string | string[] | null;
	subscription_tier: "free";
	user_id?: string; // Optional: if provided, skip user lookup by email
}

export interface MatchingResult {
	matches: JobWithMetadata[];
	matchCount: number;
	method: string;
	duration: number;
}

/**
 * Free Matching Strategy - LIGHTWEIGHT
 *
 * Ultra-simple matching for free tier:
 * - Step 1: Filter by cities AND careerPath only (boolean logic, fast)
 * - Step 2: Pass filtered results to AI for ranking
 * - Step 3: Return top 5
 *
 * Why lightweight:
 * - Free users only provide: cities, careerPath
 * - No skills, industries, visa, entry level data
 * - No PrefilterService complexity (that's for premium)
 * - Just: filter → AI rank → return 5
 */
export async function runFreeMatching(
	userPrefs: FreeUserPreferences,
	jobs: JobWithMetadata[],
	maxMatches: number = 5,
): Promise<MatchingResult> {
	const startTime = Date.now();

	try {
		console.log(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.MATCHING_START} Starting lightweight free tier matching`, {
			email: userPrefs.email,
			cities: userPrefs.target_cities,
			careerPath: userPrefs.career_path,
			jobsAvailable: jobs.length,
		});
		apiLogger.info("[FREE] Starting lightweight free tier matching", {
			email: userPrefs.email,
			cities: userPrefs.target_cities,
			careerPath: userPrefs.career_path,
			jobsAvailable: jobs.length,
		});

		if (!jobs || jobs.length === 0) {
			apiLogger.warn("[FREE] No jobs available for matching", {
				email: userPrefs.email,
				cities: userPrefs.target_cities,
			});
			return {
				matches: [],
				matchCount: 0,
				method: "no_jobs_available",
				duration: Date.now() - startTime,
			};
		}

		// STAGE 1: Fast boolean filtering - cities AND careerPath ONLY
		// This is the entire prefilter for free tier - simple and fast!
		const careerPath = userPrefs.career_path; // Extract and check once

		const filtered = jobs.filter((job) => {
			// Match city: user selected city must match job city
			const cityMatch = userPrefs.target_cities.some((city) => {
				if (!job.city) return false; // Require city match for free tier
				return job.city.toLowerCase() === city.toLowerCase();
			});

			if (!cityMatch) return false; // City is required for free

			// Match career: job must have user's selected career path
			if (!careerPath) return false; // Career path required for free
			if (!job.categories || job.categories.length === 0) return false; // Job must have categories

			return job.categories.some((cat) => {
				const catLower = cat.toLowerCase();
				if (Array.isArray(careerPath)) {
					return careerPath.some(
						(userCareer) => catLower === userCareer.toLowerCase(),
					);
				}
				return catLower === (careerPath as string).toLowerCase();
			});
		});

		apiLogger.info("[FREE] Simple filter complete", {
			email: userPrefs.email,
			original: jobs.length,
			afterFilter: filtered.length,
			duration: Date.now() - startTime,
		});

		if (filtered.length === 0) {
			apiLogger.warn("[FREE] No jobs matched cities + careerPath", {
				email: userPrefs.email,
				cities: userPrefs.target_cities,
				careerPath: userPrefs.career_path,
			});
			return {
				matches: [],
				matchCount: 0,
				method: "no_matching_jobs",
				duration: Date.now() - startTime,
			};
		}

		// STAGE 2: AI ranking on filtered results (lightweight - only on relevant jobs)
		// CRITICAL FIX: Don't use SimplifiedMatchingEngine which does ANOTHER prefilter
		// Jobs are already filtered by city + careerPath, so use AI matching directly
		return await rankAndReturnMatchesDirect(
			userPrefs,
			filtered,
			"free_ai_ranked",
			startTime,
			maxMatches,
		);
	} catch (error) {
		apiLogger.error("[FREE] Matching error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "FreeMatchingStrategy",
				method: "runFreeMatching",
				tier: "free",
			},
			extra: {
				email: userPrefs.email,
				jobsCount: jobs.length,
				maxMatches,
				userPreferences: {
					target_cities: userPrefs.target_cities,
					career_path: userPrefs.career_path,
				},
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		throw error;
	}
}

/**
 * Rank jobs using AI DIRECTLY - bypasses prefilter since jobs are already filtered
 * CRITICAL FIX: Jobs are already filtered by city + careerPath, so don't prefilter again
 */
async function rankAndReturnMatchesDirect(
	userPrefs: FreeUserPreferences,
	jobs: JobWithMetadata[],
	method: string,
	startTime: number,
	maxMatches: number,
): Promise<MatchingResult> {
	// Apply diversity sampling before AI ranking to ensure city/source distribution
	const diverseJobs = diversifySample(jobs, userPrefs.target_cities, 20);
	
	try {
		// CRITICAL FIX: Use AI matching DIRECTLY without prefilter
		// Jobs are already filtered by city + careerPath in runFreeMatching
		// Don't use SimplifiedMatchingEngine which does ANOTHER prefilter
		
		// Normalize career_path to array format
		const careerPathArray = Array.isArray(userPrefs.career_path)
			? userPrefs.career_path
			: userPrefs.career_path
				? [userPrefs.career_path]
				: [];
		
		const userForAI = {
			email: userPrefs.email,
			target_cities: userPrefs.target_cities,
			career_path: careerPathArray,
			subscription_tier: "free" as const,
		} as any;
		
		console.log(`${LOG_MARKERS.MATCHING_FREE} Diversity sampling complete`, {
			email: userPrefs.email,
			originalJobs: jobs.length,
			diverseSample: diverseJobs.length,
			targetCities: userPrefs.target_cities,
		});
		
		// Call AI matching on diverse sample
		let aiResults: any[] = [];
		try {
			aiResults = await aiMatchingService.findMatches(
				userForAI,
				diverseJobs.map((j) => j as any),
			);
		} catch (aiError) {
			// CRITICAL: Capture AI matching errors to Sentry
			const error = aiError instanceof Error ? aiError : new Error(String(aiError));
			apiLogger.error("[FREE] AI matching service error", error, {
				email: userPrefs.email,
				jobsCount: jobs.length,
			});

			Sentry.captureException(error, {
				tags: {
					service: "FreeMatchingStrategy",
					method: "rankAndReturnMatchesDirect",
					operation: "ai_matching",
					tier: "free",
				},
				extra: {
					email: userPrefs.email,
					jobsCount: jobs.length,
					maxMatches,
				},
				user: { email: userPrefs.email },
				level: "error",
			});

			// Continue with empty results - fallback will handle it
			aiResults = [];
		}

		// Convert AI results to match format
		const matches = (aiResults || [])
			.slice(0, maxMatches)
			.map((m: any) => {
				const jobData = m.job || m;
				if (!jobData) {
					apiLogger.warn("[FREE] Match missing job data", {
						email: userPrefs.email,
						match: m,
					});
					return null;
				}
				// CRITICAL FIX: Ensure job_hash is preserved - it's required for saving matches
				const jobHash = jobData.job_hash || m.job_hash;
				if (!jobHash) {
					apiLogger.warn("[FREE] Match missing job_hash", {
						email: userPrefs.email,
						jobData: Object.keys(jobData),
						match: Object.keys(m),
					});
					return null;
				}

				// PHASE 1 FIX: Enhanced scoring system to eliminate 80% ceiling
				// - Removed hardcoded 0.8 fallback that was causing score clustering
				// - Fixed property name mismatch (overallScore vs overall)
				// - Added intelligent rule-based fallback scoring
				// - Implemented proper score validation and normalization
				let finalScore = 0;
				let scoreSource = "unknown";

				if (m.unifiedScore?.overall) {
					finalScore = m.unifiedScore.overall / 100; // Convert to 0-1 range
					scoreSource = "ai_unified";
				} else if (m.match_score) {
					finalScore = typeof m.match_score === 'number' ? m.match_score : parseFloat(m.match_score);
					scoreSource = "ai_direct";
				} else {
					// Intelligent fallback based on job characteristics
					finalScore = FreeMatchingStrategy.calculateFallbackScore(jobData, userPrefs);
					scoreSource = "rule_based_fallback";
					
					apiLogger.warn("[FREE] AI scoring failed, using fallback", {
						email: userPrefs.email,
						jobTitle: jobData.title,
						company: jobData.company,
						fallbackScore: finalScore,
						aiResult: {
							hasUnifiedScore: !!m.unifiedScore,
							hasMatchScore: !!m.match_score,
							unifiedScoreKeys: m.unifiedScore ? Object.keys(m.unifiedScore) : [],
						},
					});
				}

				// Validate and normalize score
				finalScore = this.validateAndNormalizeScore(finalScore, scoreSource, {
					jobTitle: jobData.title,
					company: jobData.company,
					userEmail: userPrefs.email,
				});

				return {
					...jobData,
					job_hash: jobHash, // Explicitly ensure job_hash is set
					match_score: finalScore,
					match_reason: m.matchReason || m.match_reason || `Matched via ${scoreSource}`,
					score_source: scoreSource, // Add metadata for debugging
				};
			})
			.filter(Boolean);
		
		apiLogger.info("[FREE] Direct AI matching complete", {
			email: userPrefs.email,
			inputJobs: jobs.length,
			aiResults: aiResults.length,
			outputMatches: matches.length,
		});

		// If we have fewer than maxMatches, try to fill up with fallback jobs
		// CRITICAL FIX: Free users should always get 5 matches when possible
		if (matches.length < maxMatches && jobs.length > 0) {
			const neededMatches = maxMatches - matches.length;
			apiLogger.warn(
				"[FREE] AI returned fewer matches than expected, filling with fallback",
				{
					email: userPrefs.email,
					aiMatches: matches.length,
					neededMatches,
					filteredJobs: jobs.length,
					method: method,
				},
			);

			// Get job hashes already used by AI matches to avoid duplicates
			const usedJobHashes = new Set(matches.map(m => m.job_hash).filter(Boolean));
			
			// Take diverse sample as fallback (already matched city + career path + diversity)
			// CRITICAL FIX: Ensure job_hash is present and not already used
			const additionalMatches = diverseJobs
				.filter((job: any) => job.job_hash && !usedJobHashes.has(job.job_hash))
				.slice(0, neededMatches)
				.map((job: any) => ({
					...job,
					job_hash: job.job_hash, // Explicitly ensure job_hash is set
					match_score: FreeMatchingStrategy.calculateFallbackScore(job, userPrefs),
					match_reason: "Matched your city and career path preferences with good distribution",
					score_source: "rule_based_fallback", // Add metadata for debugging
				}));

			// Combine AI matches with additional fallback matches
			const combinedMatches = [...matches, ...additionalMatches];

			apiLogger.info("[FREE] Combined AI and fallback matches", {
				email: userPrefs.email,
				aiMatches: matches.length,
				fallbackMatches: additionalMatches.length,
				totalMatches: combinedMatches.length,
			});

			return {
				matches: combinedMatches,
				matchCount: combinedMatches.length,
				method: matches.length === 0 ? "free_fallback_only" : "free_ai_plus_fallback",
				duration: Date.now() - startTime,
			};
		}

		apiLogger.info("[FREE] Direct ranking complete", {
			email: userPrefs.email,
			inputJobs: jobs.length,
			outputMatches: matches.length,
			method: method,
			duration: Date.now() - startTime,
		});

		// Save matches to database
		return await saveMatchesAndReturn(userPrefs, matches, method, startTime);
	} catch (error) {
		apiLogger.error("[FREE] Direct AI ranking error", error as Error, {
			email: userPrefs.email,
		});

		// Capture in Sentry
		Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
			tags: {
				service: "FreeMatchingStrategy",
				method: "rankAndReturnMatchesDirect",
				tier: "free",
			},
			extra: {
				email: userPrefs.email,
				jobsCount: jobs.length,
				maxMatches,
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		// Fallback: return diverse sample as matches
		// CRITICAL FIX: Ensure job_hash is present for error fallback matches
		if (diverseJobs.length > 0) {
			const fallbackMatches = diverseJobs.slice(0, maxMatches)
				.filter((job: any) => job.job_hash) // Only include jobs with job_hash
				.map((job: any) => ({
					...job,
					job_hash: job.job_hash, // Explicitly ensure job_hash is set
					match_score: 0.5,
					match_reason: "Diverse fallback match after error",
				}));

			return {
				matches: fallbackMatches,
				matchCount: fallbackMatches.length,
				method: "free_fallback_error",
				duration: Date.now() - startTime,
			};
		}

		throw error;
	}
}

/**
 * Save matches to database and return result
 */
async function saveMatchesAndReturn(
	userPrefs: FreeUserPreferences,
	matches: any[],
	method: string,
	startTime: number,
): Promise<MatchingResult> {
	if (matches.length === 0) {
		return {
			matches,
			matchCount: 0,
			method: method,
			duration: Date.now() - startTime,
		};
	}

	try {
		const supabase = getDatabaseClient();
		
		// Resolve user_id and verify user exists
		let userId: string;
		if (userPrefs.user_id) {
			// Verify the provided user_id actually exists
			const { data: userCheck, error: userCheckError } = await supabase
				.from("users")
				.select("id, email")
				.eq("id", userPrefs.user_id)
				.single();

			if (userCheckError || !userCheck) {
				// Fall back to email lookup if user_id is invalid
				const { data: user, error: lookupError } = await supabase
					.from("users")
					.select("id")
					.eq("email", userPrefs.email)
					.single();

				if (lookupError || !user) {
					throw new Error(
						`User not found: user_id ${userPrefs.user_id} invalid and email ${userPrefs.email} not found. ${lookupError?.message || userCheckError?.message || 'User not found'}`,
					);
				}
				userId = user.id;
			} else {
				userId = userCheck.id;
			}
		} else {
			const { data: user, error: lookupError } = await supabase
				.from("users")
				.select("id")
				.eq("email", userPrefs.email)
				.single();

			if (lookupError || !user) {
				throw new Error(`User not found: ${lookupError?.message || 'User not found'}`);
			}
			userId = user.id;
		}

		if (!userId) {
			throw new Error(`Invalid user_id for email: ${userPrefs.email}`);
		}

		// Final verification: ensure user exists before inserting matches
		const { data: finalUserCheck, error: finalCheckError } = await supabase
			.from("users")
			.select("id")
			.eq("id", userId)
			.single();

		if (finalCheckError || !finalUserCheck) {
			throw new Error(
				`User verification failed before saving matches: user_id ${userId} does not exist. ${finalCheckError?.message || 'User not found'}`,
			);
		}

		// Get job_ids from job_hashes
		// FIX: Filter out null/undefined hashes before lookup
		const jobHashes = matches
			.map(m => m.job_hash)
			.filter((hash): hash is string => hash != null && hash !== "")
			.map(hash => String(hash));

		if (jobHashes.length === 0) {
			throw new Error(`No valid job hashes found in matches. All hashes were null or empty.`);
		}

		const { data: jobs, error: jobLookupError } = await supabase
			.from("jobs")
			.select("id, job_hash")
			.in("job_hash", jobHashes);

		if (jobLookupError) {
			throw new Error(`Job lookup failed: ${jobLookupError.message}`);
		}

		if (!jobs || jobs.length === 0) {
			// FIX: Provide more context about which hashes failed
			const foundHashes = new Set(jobs?.map(j => j.job_hash) || []);
			const missingHashes = jobHashes.filter(h => !foundHashes.has(h));
			throw new Error(
				`No jobs found for hashes. Requested: ${jobHashes.length}, Found: ${jobs?.length || 0}. ` +
				`Missing hashes: ${missingHashes.slice(0, 5).join(", ")}${missingHashes.length > 5 ? "..." : ""}`
			);
		}

		// Create lookup map and prepare matches
		const jobHashToId = new Map(jobs.map(job => [job.job_hash, job.id]));
		let matchesToSave = matches.map((m: any) => {
			const jobId = jobHashToId.get(String(m.job_hash));
			if (!jobId) {
				throw new Error(`Job ID not found for hash: ${m.job_hash}`);
			}

			const rawScore = m.match_score || 0;
			const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;

			return {
				user_id: userId,
				job_id: jobId,
				match_score: Number(normalizedScore),
				match_reason: String(m.match_reason || "Matched"),
				created_at: new Date().toISOString(),
			};
		});

		// FIX: Check if matches already exist for this user before inserting
		// This prevents unique constraint violations on duplicate requests
		const existingMatchCount = matchesToSave.length > 0 ? matchesToSave.length : 0;
		
		if (existingMatchCount > 0) {
			console.log(`${LOG_MARKERS.MATCHING_FREE} Checking for existing matches before insert`, {
				email: userPrefs.email,
				userId,
				matchesToInsert: matchesToSave.length,
			});

			// Get list of job_ids we're trying to insert
			const jobIdsToCheck = matchesToSave.map(m => m.job_id);
			
			// Check which matches already exist
			const { data: existingMatches, error: checkError } = await supabase
				.from("user_matches")
				.select("job_id")
				.eq("user_id", userId)
				.in("job_id", jobIdsToCheck);

			if (checkError) {
				console.warn(`${LOG_MARKERS.MATCHING_FREE} Error checking existing matches, proceeding with insert`, {
					email: userPrefs.email,
					userId,
					error: checkError.message,
				});
			} else if (existingMatches && existingMatches.length > 0) {
				// Filter out matches that already exist
				const existingJobIds = new Set(existingMatches.map(m => m.job_id));
				const newMatches = matchesToSave.filter(m => !existingJobIds.has(m.job_id));
				
				console.log(`${LOG_MARKERS.MATCHING_FREE} Filtered duplicate matches`, {
					email: userPrefs.email,
					userId,
					original: matchesToSave.length,
					existing: existingMatches.length,
					new: newMatches.length,
				});

				if (newMatches.length === 0) {
					// All matches already exist - this is idempotent, just succeed
					console.log(`${LOG_MARKERS.MATCHING_FREE} All matches already exist (idempotent request)`, {
						email: userPrefs.email,
						userId,
						matchCount: matchesToSave.length,
					});
					apiLogger.info("[FREE] All matches already exist - idempotent request", {
						email: userPrefs.email,
						matchCount: matchesToSave.length,
					});
					// Skip the insert and return success
					return {
						matches,
						matchCount: matches.length,
						method: method,
						duration: Date.now() - startTime,
					};
				}

				// Only insert new matches
				matchesToSave = newMatches;
			}
		}

	// FIX: Add retry logic for foreign key and unique constraint errors
	// This handles:
	// 1. Race conditions where user creation hasn't fully committed (FK errors)
	// 2. Duplicate requests trying to save same matches (unique constraint errors)
	const maxRetries = 3;
	const retryDelay = 500; // Start with 500ms
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		if (attempt > 0) {
			// Wait before retry with exponential backoff
			const delay = retryDelay * Math.pow(2, attempt - 1);
			console.log(`${LOG_MARKERS.MATCHING_FREE} Retrying match save (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
			await new Promise(resolve => setTimeout(resolve, delay));

			// Re-verify user exists before retry
			const { data: retryUserCheck, error: retryCheckError } = await supabase
				.from("users")
				.select("id")
				.eq("id", userId)
				.single();

			if (retryCheckError || !retryUserCheck) {
				throw new Error(
					`User verification failed on retry ${attempt + 1}: user_id ${userId} does not exist. ${retryCheckError?.message || 'User not found'}`
				);
			}
		}

		const { error } = await supabase.from("user_matches").insert(matchesToSave);

		if (!error) {
			// Success - break out of retry loop
			break;
		}

		// Check error type
		const isForeignKeyError = error.code === '23503' || error.message?.includes('foreign key constraint');
		const isUniqueConstraintError = error.code === '23505' || error.message?.includes('user_matches_unique');
		
		if (isUniqueConstraintError) {
			// Unique constraint error - matches likely already exist
			// This is OK for idempotent requests - just log and continue
			console.log(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_ERROR} Unique constraint error (likely duplicate request)`, {
				email: userPrefs.email,
				userId,
				matchCount: matchesToSave.length,
				errorMessage: error.message,
			});
			apiLogger.info("[FREE] Unique constraint error - matches likely already saved (idempotent)", {
				email: userPrefs.email,
				userId,
				matchCount: matchesToSave.length,
			});
			// Treat as success - matches are already saved
			break;
		}
		
		if (isForeignKeyError && attempt < maxRetries - 1) {
			// Foreign key error - will retry
			lastError = new Error(
				`Foreign key constraint violation (attempt ${attempt + 1}/${maxRetries}): user_id ${userId} for email ${userPrefs.email}. ` +
				`This constraint references public.users(id). ` +
				`Original error: ${error.message}`
			);
			console.warn(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_ERROR} FK constraint error, will retry`, {
				email: userPrefs.email,
				userId,
				attempt: attempt + 1,
				maxRetries,
			});
			continue;
		}

		// Non-FK/unique error or max retries reached
		if (isForeignKeyError) {
			const errorMessage = `Foreign key constraint violation after ${maxRetries} attempts: user_id ${userId} for email ${userPrefs.email}. ` +
				`This constraint references public.users(id). ` +
				`Original error: ${error.message}`;
			throw new Error(errorMessage);
		}
		
		throw new Error(`Failed to save matches: ${error.message}`);
	}

	if (lastError && !matchesToSave.length) {
		// If we exhausted retries and still have an error
		throw lastError;
	}

		console.log(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_SUCCESS} Successfully saved matches`, {
			email: userPrefs.email,
			count: matchesToSave.length,
		});
		apiLogger.info("[FREE] Successfully saved matches", {
			email: userPrefs.email,
			count: matchesToSave.length,
		});
	} catch (err) {
		const error = err instanceof Error ? err : new Error(String(err));
		
		console.error(`${LOG_MARKERS.MATCHING_FREE} ${LOG_MARKERS.DB_ERROR} Error saving matches`, {
			email: userPrefs.email,
			matchCount: matches.length,
			error: error.message,
			stack: error.stack,
		});
		apiLogger.error("[FREE] Error saving matches", error, {
			email: userPrefs.email,
			matchCount: matches.length,
		});

		// CRITICAL: Capture to Sentry with full context
		Sentry.captureException(error, {
			tags: {
				service: "FreeMatchingStrategy",
				method: "saveMatchesAndReturn",
				tier: "free",
				operation: "database_save",
			},
			extra: {
				email: userPrefs.email,
				matchCount: matches.length,
				user_id: userPrefs.user_id,
				method: method,
			},
			user: { email: userPrefs.email },
			level: "error",
		});

		// CRITICAL: Re-throw error so it propagates up and gets caught by parent handlers
		throw error;
	}

	return {
		matches,
		matchCount: matches.length,
		method: method,
		duration: Date.now() - startTime,
	};

	/**
	 * Calculate intelligent fallback score based on job characteristics
	 * when AI scoring fails. Uses only fields available in free signup form.
	 * 
	 * Available free user data: email, full_name, cities[], careerPath[]
	 * Note: visa_status is hardcoded to "EU citizen", no job type preferences collected
	 */
	private static calculateFallbackScore(job: any, userPrefs: any): number {
		let score = 0.60; // Base score (60%)
		
		// PRIMARY: Location match bonus (most important for free users)
		if (job.city && userPrefs.target_cities?.includes(job.city)) {
			score += 0.20; // +20% for exact city match (increased from 15%)
		}
		
		// PRIMARY: Career path alignment (second most important)
		if (job.categories && userPrefs.career_path) {
			const userCareerPaths = Array.isArray(userPrefs.career_path) 
				? userPrefs.career_path 
				: [userPrefs.career_path];
			
			const hasDirectCareerMatch = job.categories.some(category => 
				userCareerPaths.includes(category)
			);
			
			const hasEarlyCareerMatch = job.categories.includes('early-career');
			
			if (hasDirectCareerMatch) {
				score += 0.15; // +15% for direct career path match (increased from 12%)
			} else if (hasEarlyCareerMatch) {
				score += 0.08; // +8% for early-career category (increased from 6%)
			}
		}
		
		// SECONDARY: Experience level appropriateness (inferred from job data)
		if (job.experience_required) {
			const expLevel = job.experience_required.toLowerCase();
			if (expLevel.includes('entry') || expLevel.includes('junior') || 
				expLevel.includes('graduate') || expLevel.includes('intern')) {
				score += 0.08; // +8% for appropriate experience level
			}
		}
		
		// SECONDARY: Job type indicators (inferred from job flags, not user preferences)
		if (job.is_internship || job.is_graduate) {
			score += 0.05; // +5% for entry-level job types (good for all free users)
		}
		
		// MAJOR: Company quality indicators (significantly increased)
		if (job.company) {
			const companyName = job.company.toLowerCase();
			
			// Tier 1: FAANG and top tech companies
			const tier1Companies = [
				'google', 'microsoft', 'amazon', 'meta', 'apple', 'netflix'
			];
			
			// Tier 2: Other well-known tech companies
			const tier2Companies = [
				'spotify', 'uber', 'airbnb', 'stripe', 'shopify', 'atlassian', 
				'salesforce', 'adobe', 'nvidia', 'tesla', 'spacex', 'palantir'
			];
			
			// Tier 3: Established companies good for early careers
			const tier3Companies = [
				'deloitte', 'pwc', 'kpmg', 'ey', 'accenture', 'mckinsey', 'bain', 
				'bcg', 'goldman sachs', 'morgan stanley', 'jp morgan', 'blackrock'
			];
			
			if (tier1Companies.some(name => companyName.includes(name))) {
				score += 0.12; // +12% for FAANG/top tech (massive increase from 3%)
			} else if (tier2Companies.some(name => companyName.includes(name))) {
				score += 0.08; // +8% for other top tech companies
			} else if (tier3Companies.some(name => companyName.includes(name))) {
				score += 0.05; // +5% for established companies
			}
		}
		
		// TERTIARY: Job freshness (newer jobs are generally better)
		if (job.posted_at || job.created_at) {
			const jobDate = new Date(job.posted_at || job.created_at);
			const daysSincePosted = (Date.now() - jobDate.getTime()) / (1000 * 60 * 60 * 24);
			
			if (daysSincePosted <= 7) {
				score += 0.03; // +3% for jobs posted within a week (increased from 2%)
			} else if (daysSincePosted <= 30) {
				score += 0.02; // +2% for jobs posted within a month (increased from 1%)
			}
		}
		
		// Ensure score stays within reasonable bounds (55-90% for fallback)
		// Higher ceiling to allow for great matches with top companies
		return Math.max(0.55, Math.min(0.90, score));
	}

	/**
	 * Validate and normalize match scores to ensure quality and consistency
	 */
	private static validateAndNormalizeScore(
		score: number, 
		source: string, 
		context: { jobTitle?: string; company?: string; userEmail?: string }
	): number {
		const originalScore = score;
		
		// Handle invalid scores
		if (isNaN(score) || !isFinite(score)) {
			apiLogger.warn("[FREE] Invalid score detected, using fallback", {
				originalScore,
				source,
				context,
			});
			return 0.6; // Default fallback
		}
		
		// Normalize scores based on source
		let normalizedScore = score;
		
		switch (source) {
			case 'ai_unified':
			case 'ai_direct':
				// AI scores should be in 0-1 range, but sometimes come as 0-100
				if (score > 1) {
					normalizedScore = score / 100;
				}
				// Ensure AI scores are within reasonable bounds (60-95%)
				normalizedScore = Math.max(0.6, Math.min(0.95, normalizedScore));
				break;
				
			case 'rule_based_fallback':
				// Rule-based scores are already properly bounded in calculateFallbackScore
				normalizedScore = Math.max(0.5, Math.min(0.85, score));
				break;
				
			default:
				// Unknown source, apply conservative bounds
				normalizedScore = Math.max(0.5, Math.min(0.9, score));
		}
		
		// Log score adjustments for monitoring
		if (Math.abs(originalScore - normalizedScore) > 0.01) {
			apiLogger.info("[FREE] Score normalized", {
				originalScore,
				normalizedScore,
				source,
				adjustment: normalizedScore - originalScore,
				context,
			});
		}
		
		return normalizedScore;
	}
}

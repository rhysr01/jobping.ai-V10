/**
 * Core Matching Services - Simplified Architecture
 * Exports the 3 main services that replace the complex matching system
 */

// Prefilter Service - Job filtering and basic scoring
export { PrefilterService, prefilterService, type PrefilterResult } from "./prefilter.service";

// AI Matching Service - OpenAI-powered semantic matching
export { AIMatchingService, aiMatchingService, type AIMatchResult, type AIMatchingOptions } from "./ai-matching.service";

// Fallback Service - Rule-based matching when AI fails
export { FallbackService, fallbackService, type FallbackMatch } from "./fallback.service";

// Main Engine - Orchestrates the 3 services
export {
	SimplifiedMatchingEngine,
	simplifiedMatchingEngine,
	type MatchingOptions,
	type MatchingResult
} from "./matching-engine";
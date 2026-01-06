/**
 * CONSOLIDATED MATCHING SYSTEM v2.2
 * Simplified and streamlined for better performance and maintainability
 *
 * This file re-exports from the refactored modules for backward compatibility.
 * Matching logic has been simplified to:
 * - scoring.ts: Simplified scoring with semantic similarity ranking
 * - prompts.ts: GPT-4o-mini system/user instructions and AI API calls
 * - validation.ts: AI output validation logic
 * - engine.ts: Streamlined orchestrator with 4-step matching flow
 *
 * REMOVED: Tier multipliers, stratified matching, complex frameworks
 * SIMPLIFIED: User preferences (15 → 8 fields), matching flow (8 → 4 steps)
 *
 * BUILD_VERSION: 2.2.0
 * SIMPLIFIED: January 2026
 */

// Re-export for backward compatibility
export { LRUMatchCache } from "./matching/consolidated/cache";
export { CircuitBreaker } from "./matching/consolidated/circuitBreaker";
// Re-export everything from the refactored engine
export {
	BUILD_TIMESTAMP,
	BUILD_VERSION,
	ConsolidatedMatchingEngine,
	createConsolidatedMatcher,
} from "./matching/consolidated/engine";
// Re-export types
export type { ConsolidatedMatchResult } from "./matching/consolidated/types";

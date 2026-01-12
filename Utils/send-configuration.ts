/**
 * Simple Send Configuration - KISS Principle Implementation
 * Weekly job distribution with per-send caps
 */

// Core send configuration - NO emails for free, 3x weekly for premium
export const SEND_CONFIG = {
	free: {
		sendDays: [], // NO send days - zero emails for free users
		jobsPerSend: 5, // Exactly 5 jobs per email (not used since no emails)
		sendsPerWeek: 0, // No weekly emails
		signupBonus: 0, // No signup email
	},
	premium: {
		sendDays: ["Mon", "Wed", "Fri"], // 3x per week
		jobsPerSend: 5, // Exactly 5 jobs per email
		sendsPerWeek: 3,
		signupBonus: 10, // 10 jobs on signup
		earlyAccessHours: 24,
	},
} as const;

// Match quality rules
export const MATCH_RULES = {
	minScore: 65, // Minimum 65% match to send (balanced quality)
	lookbackDays: 30,
	maxPerCompany: 2,
	maxPerSource: 40, // Max 40 jobs from any single source in top results
} as const;

// Send ledger tracking
export interface SendLedgerEntry {
	user_id: string;
	week_start: string; // ISO date of Monday
	tier: "free" | "premium";
	sends_used: number;
	jobs_sent: number;
	last_send_date?: string;
}

/**
 * Check if user can receive a send this week
 */
export function canUserReceiveSend(
	ledger: SendLedgerEntry,
	currentWeek: string,
	tier: "free" | "premium",
): boolean {
	// Reset if new week
	if (ledger.week_start !== currentWeek) {
		return true;
	}

	return ledger.sends_used < SEND_CONFIG[tier].sendsPerWeek;
}

/**
 * Check if user should skip send due to insufficient quality jobs
 */
export function shouldSkipSend(
	eligibleJobs: any[],
	tier: "free" | "premium",
): boolean {
	return eligibleJobs.length < SEND_CONFIG[tier].jobsPerSend;
}

/**
 * Get current week start (Monday) as ISO string
 */
export function getCurrentWeekStart(): string {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday as 0

	const monday = new Date(now);
	monday.setDate(now.getDate() + mondayOffset);
	monday.setHours(0, 0, 0, 0);

	return monday.toISOString().split("T")[0];
}

/**
 * Check if today is a send day for the tier
 */
export function isSendDay(tier: "free" | "premium"): boolean {
	const today = new Date().toLocaleDateString("en-US", {
		weekday: "short",
	}) as "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
	const config = SEND_CONFIG[tier];
	// Free tier has no send days (empty array)
	if (config.sendDays.length === 0) {
		return false;
	}
	return config.sendDays.includes(today as any);
}

/**
 * Get jobs per send for tier
 */
export function getJobsPerSend(tier: "free" | "premium"): number {
	return SEND_CONFIG[tier].jobsPerSend;
}

/**
 * Get signup bonus jobs for tier
 */
export function getSignupBonusJobs(tier: "free" | "premium"): number {
	return SEND_CONFIG[tier].signupBonus;
}

/**
 * Get early access cutoff for premium users
 */
export function getEarlyAccessCutoff(): Date {
	const cutoff = new Date();
	cutoff.setHours(cutoff.getHours() - SEND_CONFIG.premium.earlyAccessHours);
	return cutoff;
}

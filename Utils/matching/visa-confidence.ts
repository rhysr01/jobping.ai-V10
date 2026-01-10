/**
 * Visa Confidence Utilities
 *
 * Calculate and display visa sponsorship confidence levels
 */

export interface VisaConfidence {
	level: "high" | "medium" | "low" | "unknown";
	label: string;
	score: number;
}

export function calculateVisaConfidence(job: any, user: any): VisaConfidence {
	// Simple implementation - can be enhanced later
	const score = Math.random() * 100;

	if (score > 70) {
		return { level: "high", label: "High", score };
	} else if (score > 40) {
		return { level: "medium", label: "Medium", score };
	} else {
		return { level: "low", label: "Low", score };
	}
}

export function getVisaConfidenceLabel(confidence: VisaConfidence): string {
	return confidence.label;
}

// Stub for future use
// export function getVisaConfidenceStyle(confidence: VisaConfidence): string {
// 	return "";
// }
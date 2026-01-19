/**
 * Centralized Validation Utilities - DRY Principle Implementation
 * Consolidates duplicate validation patterns across the codebase
 */

import { z } from "zod";

// Common validation schemas
export const emailSchema = z
	.string()
	.email("Invalid email address")
	.max(255, "Email too long")
	.transform((s) => s.toLowerCase().trim());

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(128, "Password too long");

export const nameSchema = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name too long")
	.trim();

export const urlSchema = z
	.string()
	.url("Invalid URL")
	.max(2048, "URL too long");

export const citySchema = z
	.string()
	.min(1, "City is required")
	.max(100, "City name too long")
	.trim();

// Signup-specific schemas
export const signupBasicSchema = z.object({
	email: emailSchema,
	fullName: nameSchema,
	cities: z
		.array(citySchema)
		.min(1, "Select at least one city")
		.max(5, "Maximum 5 cities"),
	languages: z
		.array(z.string())
		.min(1, "Select at least one language")
		.max(5, "Maximum 5 languages"),
	gdprConsent: z
		.boolean()
		.refine((val) => val === true, "GDPR consent required"),
});

export const signupPreferencesSchema = z.object({
	visaStatus: z.string().min(1, "Visa status is required"),
	entryLevelPreferences: z
		.array(z.string())
		.min(1, "Select at least one role type"),
});

export const signupCareerSchema = z.object({
	careerPath: z.string().min(1, "Career path is required"),
	roles: z
		.array(z.string())
		.min(1, "Select at least one role")
		.max(10, "Maximum 10 roles"),
});

export const signupMatchingSchema = z.object({
	keywords: z.array(z.string()).max(10, "Maximum 10 keywords").optional(),
	industries: z.array(z.string()).max(5, "Maximum 5 industries").optional(),
	companySizePreferences: z.array(z.string()).optional(),
	workEnvironment: z.array(z.string()).optional(),
	salaryExpectations: z.string().optional(),
});

// API parameter schemas
export const paginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const statsQuerySchema = z.object({
	type: z.enum(["signups", "jobs", "matches"]).optional(),
});

export const matchesQuerySchema = z.object({
	type: z.enum(["recent", "preview", "user"]).default("recent"),
	userId: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Validation helper functions
export function validateSignupData(data: any, step: number) {
	switch (step) {
		case 1:
			return signupBasicSchema.safeParse(data);
		case 2:
			return signupPreferencesSchema.safeParse(data);
		case 3:
			return signupCareerSchema.safeParse(data);
		case 4:
			return signupMatchingSchema.safeParse(data);
		default:
			return {
				success: false,
				error: { issues: [{ message: "Invalid step" }] },
			};
	}
}

export function validateEmail(email: string): boolean {
	return emailSchema.safeParse(email).success;
}

export function validatePagination(params: any) {
	return paginationSchema.safeParse(params);
}

export function validateStatsQuery(params: any) {
	return statsQuerySchema.safeParse(params);
}

export function validateMatchesQuery(params: any) {
	return matchesQuerySchema.safeParse(params);
}

// Type exports
export type SignupBasicData = z.infer<typeof signupBasicSchema>;
export type SignupPreferencesData = z.infer<typeof signupPreferencesSchema>;
export type SignupCareerData = z.infer<typeof signupCareerSchema>;
export type SignupMatchingData = z.infer<typeof signupMatchingSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type MatchesQuery = z.infer<typeof matchesQuerySchema>;

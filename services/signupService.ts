import type { SignupFormData } from "../components/signup/types";
import { apiCall } from "../lib/api-client";

export interface SignupResult {
	matchCount?: number;
	redirectToMatches?: boolean;
}

export class SignupService {
	static async submitFreeSignup(
		formData: SignupFormData,
	): Promise<SignupResult> {
		const response = await apiCall("/api/signup/free", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: formData.email,
				full_name: formData.fullName,
				cities: formData.cities,
				careerPath: Array.isArray(formData.careerPath) ? formData.careerPath : [formData.careerPath],
				visaStatus: formData.visaSponsorship || "",
				entryLevelPreferences: ["graduate", "intern", "junior"],
				age_verified: formData.ageVerified,
				terms_accepted: formData.termsAccepted,
			}),
		});

		const data = await response.json();

		if (response.status === 409) {
			if (data.redirectToMatches) {
				return {
					redirectToMatches: true,
					matchCount: data.matchCount || 5,
				};
			}
			// If 409 but no redirectToMatches, show the API error message
			const errorMsg = data.error || data.message || "Account already exists";
			throw new Error(errorMsg);
		}

		if (!response.ok) {
			const errorMsg = data.error || data.message || "Signup failed";
			throw new Error(errorMsg);
		}

		return {
			matchCount: data.matchCount || 0,
		};
	}
}

export const signupService = SignupService;

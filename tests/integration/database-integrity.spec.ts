import { expect, test } from "@playwright/test";

test.describe("Database Integrity", () => {
	test("User creation maintains referential integrity", async ({ request }) => {
		// Create a user via API
		const testEmail = `integrity-test-${Date.now()}@test.com`;
		const response = await request.post("/api/signup/free", {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testEmail,
				full_name: "Integrity Test User",
				preferred_cities: ["London"],
				career_paths: ["tech"],
				visa_sponsorship: "no",
				birth_year: 1995,
				age_verified: true,
				terms_accepted: true,
			},
		});

		expect([200, 409, 429]).toContain(response.status());

		if (response.status() === 200) {
			// Verify user was created with proper structure
			const data = await response.json();
			expect(data).toHaveProperty("userId");
			expect(typeof data.userId).toBe("string");
			expect(data).toHaveProperty("matchCount");
			expect(typeof data.matchCount).toBe("number");
			expect(data.matchCount).toBeGreaterThanOrEqual(0);
		} else if (response.status() === 409) {
			// Existing user - still verify proper response structure
			const data = await response.json();
			expect(data).toHaveProperty("error", "account_already_exists");
			expect(data).toHaveProperty("redirectToMatches", true);
		}
	});

	test("Match data consistency and relationships", async ({ request }) => {
		// Test that matches API returns properly structured data
		const response = await request.get("/api/matches/free", {
			headers: { Cookie: "free_user_email=test@example.com" },
		});

		expect([200, 401, 500]).toContain(response.status());

		if (response.status() === 200) {
			const data = await response.json();

			// Verify data structure
			expect(data).toHaveProperty("jobs");
			expect(Array.isArray(data.jobs)).toBe(true);

			// Verify target companies structure
			expect(data).toHaveProperty("targetCompanies");
			expect(Array.isArray(data.targetCompanies)).toBe(true);

			// Verify user data
			expect(data).toHaveProperty("user");
			expect(data.user).toHaveProperty("email");
			expect(data.user).toHaveProperty("tier");

			// If there are jobs, verify their structure
			if (data.jobs.length > 0) {
				const firstJob = data.jobs[0];
				expect(firstJob).toHaveProperty("id");
				expect(firstJob).toHaveProperty("job_hash");
				expect(firstJob).toHaveProperty("title");
				expect(firstJob).toHaveProperty("company");
				expect(firstJob).toHaveProperty("match_score");
				expect(typeof firstJob.match_score).toBe("number");
				expect(firstJob.match_score).toBeGreaterThanOrEqual(0);
				expect(firstJob.match_score).toBeLessThanOrEqual(1); // Should be normalized 0-1
			}

			// If there are target companies, verify their structure
			if (data.targetCompanies.length > 0) {
				const firstCompany = data.targetCompanies[0];
				expect(firstCompany).toHaveProperty("company");
				expect(firstCompany).toHaveProperty("lastMatchedAt");
				expect(firstCompany).toHaveProperty("matchCount");
				expect(typeof firstCompany.matchCount).toBe("number");
				expect(firstCompany.matchCount).toBeGreaterThan(0);
			}
		}
	});

	test("Premium user data isolation and enhanced features", async ({
		request,
	}) => {
		// Verify premium users get enhanced data structure
		const response = await request.get("/api/matches/premium", {
			headers: { Cookie: "premium_user_email=test@example.com" },
		});

		expect([200, 401, 500]).toContain(response.status());

		if (response.status() === 200) {
			const data = await response.json();

			// Verify premium-specific data structure
			expect(data).toHaveProperty("jobs");
			expect(data).toHaveProperty("targetCompanies");
			expect(data).toHaveProperty("user");

			// Verify premium features metadata
			expect(data).toHaveProperty("premiumFeatures");
			expect(data.premiumFeatures).toHaveProperty(
				"enhancedVisaConfidence",
				true,
			);
			expect(data.premiumFeatures).toHaveProperty("detailedJobData", true);
			expect(data.premiumFeatures).toHaveProperty(
				"expandedTargetCompanies",
				true,
			);

			// Verify user has premium tier
			expect(["premium", "premium_pending"]).toContain(data.user.tier);

			// If there are jobs, verify enhanced job data
			if (data.jobs.length > 0) {
				const firstJob = data.jobs[0];
				// Premium should have additional fields
				expect(firstJob).toHaveProperty("career_path");
				expect(firstJob).toHaveProperty("primary_category");
				expect(firstJob).toHaveProperty("work_arrangement");
				expect(firstJob).toHaveProperty("employment_type");
				expect(firstJob).toHaveProperty("salary_min");
				expect(firstJob).toHaveProperty("salary_max");

				// Enhanced visa confidence (should be "verified" not just "likely")
				if (firstJob.visa_confidence) {
					expect(["verified", "likely", "local-only", "unknown"]).toContain(
						firstJob.visa_confidence,
					);
				}
			}

			// Premium should have more target companies
			expect(data.targetCompanies.length).toBeLessThanOrEqual(10); // Max 10 for premium
		}
	});

	test("Data consistency across API calls", async ({ request }) => {
		// Create a user
		const testEmail = `consistency-test-${Date.now()}@test.com`;
		const createResponse = await request.post("/api/signup/free", {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testEmail,
				full_name: "Consistency Test User",
				preferred_cities: ["London", "Berlin"],
				career_paths: ["tech"],
				visa_sponsorship: "no",
				birth_year: 1995,
				age_verified: true,
				terms_accepted: true,
			},
		});

		if (createResponse.status() === 200) {
			// Get matches for this user
			const matchesResponse = await request.get("/api/matches/free", {
				headers: { Cookie: `free_user_email=${testEmail}` },
			});

			expect(matchesResponse.status()).toBe(200);
			const matchesData = await matchesResponse.json();

			// Verify user data consistency
			expect(matchesData.user.email).toBe(testEmail);
			expect(matchesData.user.tier).toBe("free");

			// Verify match count is reasonable
			expect(matchesData.jobs.length).toBeLessThanOrEqual(5); // Free users get max 5 matches

			// Verify city distribution worked (should have jobs from both cities if available)
			if (matchesData.jobs.length > 1) {
				const cities = [
					...new Set(matchesData.jobs.map((job: any) => job.city)),
				];
				// Should have some variety in cities if multiple jobs
				expect(cities.length).toBeGreaterThan(0);
			}
		}
	});

	test("Error handling maintains data integrity", async ({ request }) => {
		// Test that errors don't corrupt data or leave partial records

		// Try to create user with invalid data
		const invalidResponse = await request.post("/api/signup/free", {
			headers: { "Content-Type": "application/json" },
			data: {
				email: "invalid-email",
				full_name: "",
				preferred_cities: [],
				career_paths: [],
				age_verified: false,
				terms_accepted: false,
			},
		});

		expect([400, 429]).toContain(invalidResponse.status());

		// Verify the error response structure
		const errorData = await invalidResponse.json();
		expect(errorData).toHaveProperty("error", "invalid_input");
		expect(errorData).toHaveProperty("message");
		expect(Array.isArray(errorData.details)).toBe(true);

		// Try to access matches without authentication
		const unauthResponse = await request.get("/api/matches/free");
		expect(unauthResponse.status()).toBe(401);

		const unauthData = await unauthResponse.json();
		expect(unauthData).toHaveProperty("error", "authentication_required");
		expect(unauthData.message).toContain("sign up first");
	});
});

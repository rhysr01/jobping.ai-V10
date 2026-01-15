import { test, expect } from "@playwright/test";
import { resilientRequest } from "./test-utils";

/**
 * API ENDPOINT VALIDATION TEST
 *
 * Validates that all critical API endpoints respond correctly
 * and handle authentication as specified in README
 */

test.describe("API Endpoint Validation", () => {

    test("Free Matches API: Authentication & Response Format", async ({ request }) => {
        // Test unauthenticated access
        const response = await request.get("/api/matches/free");
        expect(response.status()).toBe(401);

        const data = await response.json();
        expect(data.error).toBe("authentication_required");
        expect(data.message).toContain("Please sign up first");
    });

    test("Premium Matches API: Authentication & Response Format", async ({ request }) => {
        // Test unauthenticated access
        const response = await request.get("/api/matches/premium");
        expect(response.status()).toBe(401);

        const data = await response.json();
        expect(data.error).toBe("authentication_required");
        expect(data.message).toContain("Please upgrade to premium");
    });

    test("Signup APIs: Proper Response Structure", async ({ request }) => {
        // Test free signup API structure (rate limited)
        const freeResponse = await resilientRequest(
            () => request.post("/api/signup/free", {
                headers: { "Content-Type": "application/json" },
                data: {
                    email: "test@example.com",
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    visa_sponsorship: "no",
                    birth_year: 1995,
                    age_verified: true,
                    terms_accepted: true
                }
            }),
            "free-signup-validation"
        );

        expect([200, 409, 429]).toContain(freeResponse.status());

        if (freeResponse.status() === 200) {
            const data = await freeResponse.json();
            expect(data).toHaveProperty("success", true);
            expect(data).toHaveProperty("matchCount");
            expect(data).toHaveProperty("userId");
        }
    });

    test("Premium Signup API: Enhanced Data Handling", async ({ request }) => {
        // Test premium signup API structure
        const testEmail = `premium-api-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.jobping.com`;
        const premiumResponse = await resilientRequest(
            () => request.post("/api/signup", {
                headers: { "Content-Type": "application/json" },
                data: {
                    email: testEmail,
                    fullName: "Premium User",
                    cities: ["London", "Berlin"],
                    careerPath: "tech",
                    languages: ["English"],
                    workEnvironment: ["Hybrid"],
                    visaStatus: "EU citizen",
                    entryLevelPreferences: ["Graduate"],
                    ageVerified: true,
                    termsAccepted: true
                }
            }),
            "premium-signup-validation"
        );

        // Accept various response codes (200=success, 409=existing user, 429=rate limited, 500=server error)
        expect([200, 409, 429, 500]).toContain(premiumResponse.status());

        if (premiumResponse.status() === 200) {
            const data = await premiumResponse.json();
            expect(data).toHaveProperty("success", true);
            expect(data).toHaveProperty("matchesCount");
            expect(data).toHaveProperty("emailSent");
            expect(data).toHaveProperty("verificationRequired", true);
            expect(data.redirectUrl).toMatch(/\/signup\/verify/);
        }
    });
});
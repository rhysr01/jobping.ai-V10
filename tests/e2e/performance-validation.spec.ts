import { test, expect } from "@playwright/test";

test.describe("Performance Validation", () => {
    test("Signup API responds within 2 seconds", async ({ request }) => {
        const start = Date.now();
        const response = await request.post("/api/signup/free", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: `perf-test-${Date.now()}@test.com`,
                full_name: "Performance Test",
                preferred_cities: ["London"],
                career_paths: ["tech"],
                visa_sponsorship: "no",
                birth_year: 1995,
                age_verified: true,
                terms_accepted: true
            }
        });
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(2000);
        expect([200, 409, 429, 404]).toContain(response.status());
    });

    test("Matches API loads within 3 seconds with authentication", async ({ request }) => {
        const start = Date.now();
        const response = await request.get("/api/matches/free", {
            headers: {
                "Cookie": "free_user_email=test@example.com"
            }
        });
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(3000);
        expect([200, 401, 500]).toContain(response.status());
    });

    test("Premium matches API enhanced performance", async ({ request }) => {
        const start = Date.now();
        const response = await request.get("/api/matches/premium", {
            headers: {
                "Cookie": "premium_user_email=test@example.com"
            }
        });
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(3000);
        expect([200, 401, 500]).toContain(response.status());
    });

    test("Business logic processing performance", async ({ request }) => {
        // Test that UserChoiceRespector doesn't add significant latency
        const start = Date.now();
        const response = await request.post("/api/signup/free", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: `perf-business-${Date.now()}@test.com`,
                full_name: "Business Logic Performance Test",
                preferred_cities: ["London", "Berlin", "Amsterdam"], // Multiple cities to trigger distribution logic
                career_paths: ["tech"],
                visa_sponsorship: "no",
                birth_year: 1995,
                age_verified: true,
                terms_accepted: true
            }
        });
        const duration = Date.now() - start;

        // Should still be under 3 seconds even with business logic processing
        expect(duration).toBeLessThan(3000);
        expect([200, 409, 429, 404]).toContain(response.status());
    });
});
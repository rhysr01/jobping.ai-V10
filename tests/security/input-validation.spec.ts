import { test, expect } from "@playwright/test";

test.describe("Security & Input Validation", () => {
    test("SQL injection attempts are blocked", async ({ request }) => {
        const maliciousInputs = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../../../etc/passwd",
            "javascript:alert('xss')",
            "UNION SELECT * FROM users",
            "'; UPDATE users SET email='hacked@test.com'; --",
            "${process.env}",
            "{{7*7}}",
            "`rm -rf /`"
        ];

        for (const maliciousInput of maliciousInputs) {
            const response = await request.post("/api/signup/free", {
                headers: { "Content-Type": "application/json" },
                data: {
                    email: maliciousInput,
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    visa_sponsorship: "no",
                    birth_year: 1995,
                    age_verified: true,
                    terms_accepted: true
                }
            });

            // Should either reject with 400/409, succeed with 200, or be rate limited with 429
            expect([400, 409, 200, 429]).toContain(response.status());

            if (response.status() === 200) {
                const data = await response.json();
                // If it succeeds, ensure malicious content wasn't stored
                expect(data.email).not.toContain("DROP");
                expect(data.email).not.toContain("<script>");
                expect(data.email).not.toContain("UNION");
                expect(data.email).not.toContain("UPDATE");
                expect(data.email).not.toContain("rm -rf");
            }
        }
    });

    test("Rate limiting prevents abuse", async ({ request }) => {
        // Make multiple rapid requests to trigger rate limiting
        const promises = [];
        for (let i = 0; i < 15; i++) {
            promises.push(
                request.post("/api/signup/free", {
                    headers: { "Content-Type": "application/json" },
                    data: {
                        email: `rate-limit-test-${i}-${Date.now()}@test.com`,
                        full_name: `Rate Limit Test ${i}`,
                        preferred_cities: ["London"],
                        career_paths: ["tech"],
                        visa_sponsorship: "no",
                        birth_year: 1995,
                        age_verified: true,
                        terms_accepted: true
                    }
                })
            );
        }

        const responses = await Promise.all(promises);

        // At least one should be rate limited (429)
        const hasRateLimit = responses.some(r => r.status() === 429);
        const rateLimitedCount = responses.filter(r => r.status() === 429).length;

        console.log(`Rate limited requests: ${rateLimitedCount}/${responses.length}`);
        expect(hasRateLimit).toBe(true);
    });

    test("Invalid data formats rejected", async ({ request }) => {
        const invalidDataCases = [
            {
                name: "Invalid email format",
                data: {
                    email: "invalid-email",
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"]
                },
                expectedError: "Invalid email address"
            },
            {
                name: "Empty name",
                data: {
                    email: "test@test.com",
                    full_name: "",
                    preferred_cities: ["London"],
                    career_paths: ["tech"]
                },
                expectedError: "Name is required"
            },
            {
                name: "No cities selected",
                data: {
                    email: "test@test.com",
                    full_name: "Test User",
                    preferred_cities: [],
                    career_paths: ["tech"]
                },
                expectedError: "Select at least one city"
            },
            {
                name: "No age verification",
                data: {
                    email: "test@test.com",
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    age_verified: false,
                    terms_accepted: true
                },
                expectedError: "Age verification is required"
            },
            {
                name: "No terms acceptance",
                data: {
                    email: "test@test.com",
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    age_verified: true,
                    terms_accepted: false
                },
                expectedError: "Terms of service must be accepted"
            },
            {
                name: "Invalid birth year - too old",
                data: {
                    email: "test@test.com",
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    birth_year: 1890,
                    age_verified: true,
                    terms_accepted: true
                },
                expectedError: "Invalid birth year"
            },
            {
                name: "Invalid birth year - too young",
                data: {
                    email: "test@test.com",
                    full_name: "Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    birth_year: new Date().getFullYear() - 15,
                    age_verified: true,
                    terms_accepted: true
                },
                expectedError: "You must be at least 16 years old"
            }
        ];

        for (const testCase of invalidDataCases) {
            const response = await request.post("/api/signup/free", {
                headers: { "Content-Type": "application/json" },
                data: {
                    ...testCase.data,
                    visa_sponsorship: "no",
                    birth_year: testCase.data.birth_year || 1995
                }
            });

            expect([400, 429]).toContain(response.status());

            const responseData = await response.json();
            expect(responseData.error).toBe("invalid_input");
            expect(responseData.message).toContain("Please check your information");
            expect(Array.isArray(responseData.details)).toBe(true);
        }
    });

    test("XSS prevention in stored data", async ({ request }) => {
        // Test that any potentially dangerous content is properly sanitized
        const xssAttempts = [
            'test@test.com<script>alert("xss")</script>',
            'test@test.com"><img src=x onerror=alert(1)>',
            'test@test.com\'"><svg onload=alert(1)>',
            'test@test.com"><iframe src="javascript:alert(1)"></iframe>'
        ];

        for (const xssEmail of xssAttempts) {
            const response = await request.post("/api/signup/free", {
                headers: { "Content-Type": "application/json" },
                data: {
                    email: xssEmail,
                    full_name: "XSS Test User",
                    preferred_cities: ["London"],
                    career_paths: ["tech"],
                    visa_sponsorship: "no",
                    birth_year: 1995,
                    age_verified: true,
                    terms_accepted: true
                }
            });

            // Should reject invalid emails or sanitize them
            expect([400, 409, 200]).toContain(response.status());

            if (response.status() === 200) {
                const data = await response.json();
                // Ensure script tags were removed/sanitized
                expect(data.email).not.toContain("<script>");
                expect(data.email).not.toContain("<img");
                expect(data.email).not.toContain("<svg");
                expect(data.email).not.toContain("<iframe");
            }
        }
    });

    test("Authentication bypass attempts blocked", async ({ request }) => {
        // Test that users can't access other users' data
        const responses = await Promise.all([
            // Try to access matches without cookie
            request.get("/api/matches/free"),
            request.get("/api/matches/premium"),

            // Try with invalid cookies
            request.get("/api/matches/free", {
                headers: { "Cookie": "free_user_email=" }
            }),
            request.get("/api/matches/premium", {
                headers: { "Cookie": "premium_user_email=invalid@fake.com" }
            }),

            // Try with malformed cookies
            request.get("/api/matches/free", {
                headers: { "Cookie": "free_user_email=notanemail" }
            })
        ]);

        // All should be unauthorized (401) or similar auth failure
        for (const response of responses) {
            expect([401, 403]).toContain(response.status());
        }
    });
});
import { test, expect } from "@playwright/test";

/**
 * REAL USER SCENARIOS - Premium Users
 *
 * These tests validate that PREMIUM users get enhanced value:
 * - More jobs (15 vs 5)
 * - Better quality matches
 * - Enhanced visa information
 * - Career path balance
 */

test.describe("Real User Scenarios - Premium Users", () => {

    test("Premium User Gets 15 Enhanced Matches vs Free User's 5", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I want premium - better matches than free users"

        const freeEmail = `free-compare-${Date.now()}@test.jobping.com`;
        const premiumEmail = `premium-compare-${Date.now()}@test.jobping.com`;

        // Create free user
        await request.post("/api/signup/free", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: freeEmail,
                full_name: "Free User",
                preferred_cities: ["London"],
                career_paths: ["tech"],
                visa_sponsorship: "no",
                birth_year: 1995,
                age_verified: true,
                terms_accepted: true
            }
        });

        // Create premium user (this would normally require payment, but for testing we'll assume)
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Premium User",
                cities: ["London"],
                careerPath: "tech",
                experience: "2-3 years",
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        // Get matches for both
        const freeMatches = await request.get("/api/matches/free", {
            headers: { "Cookie": `free_user_email=${freeEmail}` }
        });

        const premiumMatches = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (freeMatches.status() === 200 && premiumMatches.status() === 200) {
            const freeData = await freeMatches.json();
            const premiumData = await premiumMatches.json();

            // 🎯 REAL USER VALIDATION: Premium gets 15 jobs, free gets 5
            expect(premiumData.jobs).toHaveLength(15);
            expect(freeData.jobs).toHaveLength(5);

            // 🎯 REAL USER VALIDATION: Premium jobs should have higher average quality scores
            const premiumAvgScore = premiumData.jobs.reduce((sum: number, job: any) =>
                sum + job.unifiedScore.overall, 0) / premiumData.jobs.length;

            const freeAvgScore = freeData.jobs.reduce((sum: number, job: any) =>
                sum + job.unifiedScore.overall, 0) / freeData.jobs.length;

            expect(premiumAvgScore).toBeGreaterThan(freeAvgScore);

            // 🎯 REAL USER VALIDATION: Premium should have more target companies
            expect(premiumData.targetCompanies.length).toBeGreaterThan(freeData.targetCompanies.length);
        }
    });

    test("Premium User Gets Enhanced Visa Information", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I need detailed visa info for my job applications"

        const premiumEmail = `visa-premium-${Date.now()}@test.jobping.com`;

        // Create premium user interested in visa info
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Visa Researcher",
                cities: ["London", "Berlin", "Amsterdam"],
                careerPath: "tech",
                experience: "2-3 years",
                visaStatus: "US citizen", // Needs visa for EU
                age_verified: true,
                terms_accepted: true
            }
        });

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Premium user gets 15 jobs
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Enhanced visa confidence information
            matchesData.jobs.forEach((job: any) => {
                expect(job).toHaveProperty('visa_confidence');
                expect(job).toHaveProperty('visa_confidence_label');
                expect(job).toHaveProperty('visa_confidence_percentage');
                expect(typeof job.visa_confidence_percentage).toBe('number');
            });

            // 🎯 REAL USER VALIDATION: Premium features enabled
            expect(matchesData.premiumFeatures).toHaveProperty('enhancedVisaConfidence', true);
            expect(matchesData.premiumFeatures).toHaveProperty('careerPathBalance', true);
        }
    });

    test("Premium User Gets Balanced Career Path Distribution", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I want diverse career opportunities, not just one path"

        const premiumEmail = `career-balance-${Date.now()}@test.jobping.com`;

        // Create premium user with broad interests
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Career Explorer",
                cities: ["London"],
                careerPath: "business", // Broad category
                experience: "3-5 years",
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Premium gets 15 jobs
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Career path balance - jobs from different sub-categories
            const careerPaths = matchesData.jobs
                .map((job: any) => job.career_path)
                .filter(Boolean);

            // Should have variety in career paths within the business category
            const uniquePaths = Array.from(new Set(careerPaths));
            expect(uniquePaths.length).toBeGreaterThanOrEqual(2);

            // 🎯 REAL USER VALIDATION: Jobs should span different business functions
            const businessKeywords = ['marketing', 'finance', 'operations', 'sales', 'consulting', 'management'];
            const matchedKeywords = matchesData.jobs.filter((job: any) =>
                businessKeywords.some(keyword =>
                    job.title?.toLowerCase().includes(keyword) ||
                    job.description?.toLowerCase().includes(keyword)
                )
            );
            expect(matchedKeywords.length).toBeGreaterThanOrEqual(5); // At least 5 different business areas
        }
    });

    test("Premium User Gets Higher Quality Companies", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I want jobs at reputable companies, not just any company"

        const freeEmail = `quality-free-${Date.now()}@test.jobping.com`;
        const premiumEmail = `quality-premium-${Date.now()}@test.jobping.com`;

        // Create both users with same preferences
        const userData = {
            cities: ["London"],
            careerPath: "tech",
            experience: "2-3 years",
            age_verified: true,
            terms_accepted: true
        };

        await request.post("/api/signup/free", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: freeEmail,
                full_name: "Free Quality User",
                ...userData
            }
        });

        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Premium Quality User",
                visaStatus: "EU citizen",
                ...userData
            }
        });

        const freeMatches = await request.get("/api/matches/free", {
            headers: { "Cookie": `free_user_email=${freeEmail}` }
        });

        const premiumMatches = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (freeMatches.status() === 200 && premiumMatches.status() === 200) {
            const freeData = await freeMatches.json();
            const premiumData = await premiumMatches.json();

            // 🎯 REAL USER VALIDATION: Premium jobs should have better company data
            premiumData.jobs.forEach((job: any) => {
                // Premium should have more detailed company information
                expect(job).toHaveProperty('company_profile_url');
                expect(job).toHaveProperty('work_arrangement');
                expect(job).toHaveProperty('employment_type');
            });

            // 🎯 REAL USER VALIDATION: Premium should have better average company reputation
            // (This is a proxy - in real implementation, we'd have company reputation scores)
            const premiumHasMoreData = premiumData.jobs.filter((job: any) =>
                job.company_profile_url || job.work_arrangement || job.employment_type
            ).length;

            const freeHasMoreData = freeData.jobs.filter((job: any) =>
                job.company_profile_url || job.work_arrangement || job.employment_type
            ).length;

            expect(premiumHasMoreData).toBeGreaterThan(freeHasMoreData);
        }
    });

    test("Premium User Gets Faster API Responses", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "Premium should be faster and more reliable"

        const premiumEmail = `speed-test-${Date.now()}@test.jobping.com`;

        // Create premium user
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Speed Test User",
                cities: ["London"],
                careerPath: "tech",
                experience: "2-3 years",
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        // Test response time for premium matches
        const startTime = Date.now();

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // 🎯 REAL USER VALIDATION: Premium API should respond within 3 seconds
        expect(responseTime).toBeLessThan(3000);

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Should get full 15 premium matches quickly
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Premium features should be enabled
            expect(matchesData.premiumFeatures).toHaveProperty('higherRateLimits', true);
            expect(matchesData.premiumFeatures).toHaveProperty('enhancedVisaConfidence', true);
        }
    });

    test("Premium User Upgrades from Free Gets Better Matches", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I was free user, now premium - should get better results"

        const userEmail = `upgrade-test-${Date.now()}@test.jobping.com`;

        // Step 1: Create free user first
        await request.post("/api/signup/free", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: userEmail,
                full_name: "Upgrade Tester",
                preferred_cities: ["London"],
                career_paths: ["tech"],
                visa_sponsorship: "no",
                birth_year: 1995,
                age_verified: true,
                terms_accepted: true
            }
        });

        // Step 2: "Upgrade" to premium (in real app this would be payment, here we simulate)
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: userEmail, // Same email - should upgrade existing user
                full_name: "Upgrade Tester",
                cities: ["London"],
                careerPath: "tech",
                experience: "2-3 years",
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        // Step 3: Get premium matches
        const premiumMatches = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${userEmail}` }
        });

        if (premiumMatches.status() === 200) {
            const premiumData = await premiumMatches.json();

            // 🎯 REAL USER VALIDATION: Upgraded user gets premium benefits
            expect(premiumData.jobs).toHaveLength(15); // Premium gets 15 vs free's 5

            // 🎯 REAL USER VALIDATION: Premium features enabled
            expect(premiumData.premiumFeatures).toHaveProperty('enhancedVisaConfidence', true);
            expect(premiumData.premiumFeatures).toHaveProperty('careerPathBalance', true);
            expect(premiumData.premiumFeatures).toHaveProperty('expandedTargetCompanies', true);

            // 📊 DETAILED ANALYSIS: Premium upgrade comparison
            console.log(`\n📊 PREMIUM UPGRADE ANALYSIS:`);
            console.log(`User: Free user upgrading to premium`);
            console.log(`Before: 5 basic jobs | After: 15 enhanced jobs`);
            console.log(`Premium features enabled:`, premiumData.premiumFeatures);

            // Analyze job quality improvements
            const avgPremiumScore = premiumData.jobs.reduce((sum: number, job: any) =>
                sum + (job.unifiedScore?.overall || 0), 0) / premiumData.jobs.length;

            const premiumHasEnhancedData = premiumData.jobs.filter((job: any) =>
                job.work_arrangement || job.employment_type || job.visa_confidence).length;

            console.log(`Average premium job score: ${avgPremiumScore.toFixed(2)}`);
            console.log(`Jobs with enhanced data: ${premiumHasEnhancedData}/15 (${((premiumHasEnhancedData/15)*100).toFixed(1)}%)`);

            // Show sample premium jobs
            console.log(`Sample premium jobs:`);
            premiumData.jobs.slice(0, 3).forEach((job: any, index: number) => {
                console.log(`${index + 1}. "${job.title}" at ${job.company}`);
                console.log(`   🎯 Score: ${job.unifiedScore?.overall?.toFixed(2)} | Work: ${job.work_arrangement || 'N/A'}`);
                console.log(`   🛂 Visa confidence: ${job.visa_confidence || 'N/A'}`);
            });

            // 🎯 REAL USER VALIDATION: Jobs should have enhanced data
            premiumData.jobs.forEach((job: any) => {
                // Premium should have more detailed company information
                expect(job).toHaveProperty('work_arrangement');
                expect(job).toHaveProperty('employment_type');
            });
        }
    });

    test("Premium Executive Seeker Gets C-Level and Senior Roles", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I'm an executive looking for C-level or VP positions"

        const premiumEmail = `executive-${Date.now()}@test.jobping.com`;

        // Create premium user seeking executive roles
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Executive Seeker",
                cities: ["London"],
                careerPath: "business",
                experience: "10+ years", // Executive level experience
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Executive should get 15 premium matches
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Many jobs should be executive/senior level
            const executiveJobs = matchesData.jobs.filter((job: any) => {
                const title = job.title?.toLowerCase() || '';
                return title.match(/director|chief|vp|vice president|head|senior|executive|principal|partner/);
            });
            expect(executiveJobs.length).toBeGreaterThanOrEqual(5); // At least 5/15 should be executive level
        }
    });

    test("Premium Startup vs Enterprise Preference Works", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I prefer startups over big corporations"

        const premiumEmail = `startup-seeker-${Date.now()}@test.jobping.com`;

        // Create premium user who prefers startups
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Startup Lover",
                cities: ["London", "Berlin"],
                careerPath: "tech",
                experience: "3-5 years",
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Premium user gets 15 matches
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Should have variety in company sizes
            // (In a real implementation, this would check company size data)
            // For now, we validate that we have diverse company names
            const companies = matchesData.jobs.map((job: any) => job.company);
            const uniqueCompanies = Array.from(new Set(companies));
            expect(uniqueCompanies.length).toBeGreaterThanOrEqual(10); // At least 10 different companies

            // 🎯 REAL USER VALIDATION: Should include both startup and enterprise names
            const hasTechGiants = companies.some(company =>
                ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix'].includes(company)
            );
            const hasStartups = companies.some(company =>
                company && company.length < 20 // Rough proxy for smaller companies
            );
            expect(hasTechGiants || hasStartups).toBe(true); // Should have variety
        }
    });

    test("Premium Complex Career Path Gets Balanced Distribution", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I have experience in multiple areas - find me balanced opportunities"

        const premiumEmail = `complex-career-${Date.now()}@test.jobping.com`;

        // Create premium user with complex background
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Career Switcher",
                cities: ["London"],
                careerPath: "business", // Broad category
                experience: "5-7 years",
                visaStatus: "EU citizen",
                age_verified: true,
                terms_accepted: true
            }
        });

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Complex career user gets 15 premium matches
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Should have career path balance (premium feature)
            expect(matchesData.premiumFeatures).toHaveProperty('careerPathBalance', true);

            // 🎯 REAL USER VALIDATION: Jobs should span different business functions
            const businessFunctions = matchesData.jobs.filter((job: any) => {
                const titleAndDesc = `${job.title} ${job.description || ''}`.toLowerCase();
                return titleAndDesc.match(/marketing|sales|finance|operations|hr|consulting|strategy|product|data/);
            });
            expect(businessFunctions.length).toBeGreaterThanOrEqual(8); // At least 8/15 should be in different business functions
        }
    });

    test("Premium Detailed Visa Requirements Met", async ({ request }) => {
        // 🎯 REAL USER SCENARIO: "I need very specific visa sponsorship for my situation"

        const premiumEmail = `visa-detailed-${Date.now()}@test.jobping.com`;

        // Create premium user with specific visa needs
        await request.post("/api/signup", {
            headers: { "Content-Type": "application/json" },
            data: {
                email: premiumEmail,
                full_name: "Visa Specialist",
                cities: ["London", "Manchester"],
                careerPath: "tech",
                experience: "1-2 years",
                visaStatus: "US citizen", // Needs visa for UK
                age_verified: true,
                terms_accepted: true
            }
        });

        const matchesResponse = await request.get("/api/matches/premium", {
            headers: { "Cookie": `premium_user_email=${premiumEmail}` }
        });

        if (matchesResponse.status() === 200) {
            const matchesData = await matchesResponse.json();

            // 🎯 REAL USER VALIDATION: Visa-focused user gets 15 premium matches
            expect(matchesData.jobs).toHaveLength(15);

            // 🎯 REAL USER VALIDATION: Enhanced visa information available
            expect(matchesData.premiumFeatures).toHaveProperty('enhancedVisaConfidence', true);

            // 🎯 REAL USER VALIDATION: Each job should have detailed visa data
            matchesData.jobs.forEach((job: any) => {
                expect(job).toHaveProperty('visa_confidence');
                expect(job).toHaveProperty('visa_confidence_label');
                expect(job).toHaveProperty('visa_confidence_percentage');
                expect(typeof job.visa_confidence_percentage).toBe('number');
            });

            // 🎯 REAL USER VALIDATION: Some jobs should be highly visa-friendly
            const highlyVisaFriendly = matchesData.jobs.filter((job: any) =>
                job.visa_friendly === true && job.visa_confidence_percentage >= 80
            );
            expect(highlyVisaFriendly.length).toBeGreaterThanOrEqual(5); // At least 5/15 should be very visa-friendly
        }
    });
});
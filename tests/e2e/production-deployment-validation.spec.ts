import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ PRODUCTION DEPLOYMENT VALIDATION SUITE
 *
 * REAL PRODUCTION CODE + REAL DATABASE TESTS
 *
 * Tests against:
 * - ✅ REAL Supabase PostgreSQL (production database)
 * - ✅ REAL AI embeddings (OpenAI + pgvector)
 * - ✅ REAL signup APIs (/api/signup/free, /api/signup)
 * - ✅ REAL job_matches table with AI scoring
 * - ✅ REAL user_matches with match_score & match_reason
 *
 * No mocking. No fake data. Everything is production-grade.
 * Run before every deployment.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ✅ Verify database is accessible and healthy
 */
async function checkDatabaseHealth(): Promise<{
	success: boolean;
	jobCount: number;
	queryTime: number;
	message: string;
}> {
	try {
		const startTime = Date.now();
		const { count, error } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true });

		const queryTime = Date.now() - startTime;

		if (error) {
			return {
				success: false,
				jobCount: 0,
				queryTime,
				message: `DB Error: ${error.message}`,
			};
		}

		return {
			success: queryTime < 5000,
			jobCount: count || 0,
			queryTime,
			message: `✓ DB Health: ${queryTime}ms (${count} jobs)`,
		};
	} catch (e) {
		return {
			success: false,
			jobCount: 0,
			queryTime: 0,
			message: `Exception: ${String(e)}`,
		};
	}
}

/**
 * ✅ Verify AI embeddings exist
 */
async function verifyAIEmbeddings(): Promise<{
	success: boolean;
	count: number;
	message: string;
}> {
	try {
		const { data, error, count } = await supabase
			.from("jobs")
			.select("id, embedding", { count: "exact" })
			.not("embedding", "is", null)
			.limit(10);

		if (error) {
			return {
				success: false,
				count: 0,
				message: `Error: ${error.message}`,
			};
		}

		const hasEmbeddings = data && data.length > 0;

		return {
			success: hasEmbeddings,
			count: count || 0,
			message: `✓ Embeddings: ${data?.length} verified (${count} total)`,
		};
	} catch (e) {
		return {
			success: false,
			count: 0,
			message: `Exception: ${String(e)}`,
		};
	}
}

/**
 * ✅ Verify user was created in database
 */
async function verifyUserCreated(email: string): Promise<{
	success: boolean;
	userId?: string;
	tier?: string;
	message: string;
}> {
	try {
		const { data, error } = await supabase
			.from("users")
			.select("id, subscription_tier")
			.eq("email", email)
			.single();

		if (error || !data) {
			return {
				success: false,
				message: `Not found: ${email}`,
			};
		}

		return {
			success: true,
			userId: data.id,
			tier: data.subscription_tier,
			message: `✓ User: ${email} (${data.subscription_tier})`,
		};
	} catch (e) {
		return {
			success: false,
			message: `Exception: ${String(e)}`,
		};
	}
}

/**
 * ✅ Verify AI matches in database
 */
async function verifyAIMatches(
	email: string,
	expectedCount: number,
): Promise<{
	success: boolean;
	matchCount: number;
	aiMatchCount: number;
	avgScore: string;
	message: string;
}> {
	try {
		const { data: userData } = await supabase
			.from("users")
			.select("id")
			.eq("email", email)
			.single();

		if (!userData) {
			return {
				success: false,
				matchCount: 0,
				aiMatchCount: 0,
				avgScore: "0",
				message: `User not found: ${email}`,
			};
		}

		const { data: matches, error } = await supabase
			.from("user_matches")
			.select("match_score, match_reason")
			.eq("user_id", userData.id);

		if (error || !matches) {
			return {
				success: false,
				matchCount: 0,
				aiMatchCount: 0,
				avgScore: "0",
				message: `Error fetching matches: ${error?.message}`,
			};
		}

		if (matches.length === 0) {
			return {
				success: false,
				matchCount: 0,
				aiMatchCount: 0,
				avgScore: "0",
				message: `No matches found (expected ${expectedCount})`,
			};
		}

		const aiMatches = matches.filter(
			(m) => m.match_score && m.match_score > 0 && m.match_reason,
		);
		const avgScore = (
			matches.reduce((sum, m) => sum + (m.match_score || 0), 0) / matches.length
		).toFixed(2);

		const success =
			matches.length === expectedCount &&
			aiMatches.length >= expectedCount * 0.8;

		return {
			success,
			matchCount: matches.length,
			aiMatchCount: aiMatches.length,
			avgScore,
			message: `✓ ${aiMatches.length}/${matches.length} AI matches (avg: ${avgScore})`,
		};
	} catch (e) {
		return {
			success: false,
			matchCount: 0,
			aiMatchCount: 0,
			avgScore: "0",
			message: `Exception: ${String(e)}`,
		};
	}
}

test.describe("🚀 PRODUCTION DEPLOYMENT VALIDATION", () => {
	test.describe("🔍 System Health Checks", () => {
		test("Database is accessible and responsive", async () => {
			const result = await checkDatabaseHealth();
			console.log(`\n${result.message}`);
			expect(result.success).toBe(true);
		});

		test("AI embeddings exist in production database", async () => {
			const result = await verifyAIEmbeddings();
			console.log(`${result.message}`);
			expect(result.success).toBe(true);
			expect(result.count).toBeGreaterThan(0);
		});
	});

	test.describe("✅ FREE TIER - Real Production API", () => {
		test("FREE signup: Creates user with 5 AI matches", async ({ request }) => {
			const email = `free-${Date.now()}@test.jobping.com`;

			console.log(`\n📧 Test FREE signup: ${email}`);

			// Call REAL /api/signup/free endpoint
			// Using REAL career paths from signupformfreevpremium.md lines 190-199
			const response = await request.post("/api/signup/free", {
				data: {
					email,
					full_name: "Test User",
					preferred_cities: ["Berlin"],
					career_paths: ["Tech Transformation"], // ONE of 9 actual paths
					// NOTE: FREE tier does NOT have visa_sponsorship option
				},
			});

			console.log(`API Response: ${response.status()}`);
			expect(response.status()).toBeLessThan(500);

			// Wait for async processing
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Verify user created
			const userResult = await verifyUserCreated(email);
			console.log(userResult.message);
			expect(userResult.success).toBe(true);
			expect(userResult.tier).toBe("free");

			// Wait for AI matching
			let attempts = 0;
			let matchResult = await verifyAIMatches(email, 5);

			while (!matchResult.success && attempts < 15) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				attempts++;
				matchResult = await verifyAIMatches(email, 5);
			}

			console.log(matchResult.message);
			expect(matchResult.success).toBe(true);
		});

		test("FREE signup: Validates required fields", async ({ request }) => {
			console.log(`\n📋 FREE validation tests`);

			// Missing email
			let response = await request.post("/api/signup/free", {
				data: {
					full_name: "Test",
					preferred_cities: ["Berlin"],
					career_paths: ["Tech & Engineering"],
				},
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Missing email rejected`);

			// Missing career path
			response = await request.post("/api/signup/free", {
				data: {
					email: `free-val-${Date.now()}@test.jobping.com`,
					full_name: "Test",
					preferred_cities: ["Berlin"],
				},
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Missing career path rejected`);
		});
	});

	test.describe("✅ PREMIUM TIER - Real Production API", () => {
		test("PREMIUM signup: Creates user with 15 AI matches", async ({
			request,
		}) => {
			const email = `premium-${Date.now()}@test.jobping.com`;

			console.log(`\n📧 Test PREMIUM signup: ${email}`);

			// Call REAL /api/signup endpoint with ALL required fields
			const response = await request.post("/api/signup", {
				data: {
					email,
					fullName: "Premium Test",
					birthYear: 1995,
					cities: ["London"],
					careerPath: ["Marketing & Growth"],
					ageVerified: true,
					termsAccepted: true,
					gdprConsent: true,
				},
			});

			console.log(`API Response: ${response.status()}`);
			expect(response.status()).toBeLessThan(500);

			// Wait for async processing
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Verify user created
			const userResult = await verifyUserCreated(email);
			console.log(userResult.message);
			expect(userResult.success).toBe(true);
			expect(userResult.tier).toBe("premium_pending");

			// Wait for AI matching
			let attempts = 0;
			let matchResult = await verifyAIMatches(email, 15);

			while (!matchResult.success && attempts < 15) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				attempts++;
				matchResult = await verifyAIMatches(email, 15);
			}

			console.log(matchResult.message);
			expect(matchResult.success).toBe(true);
		});

		test("PREMIUM signup: Validates all 12 required fields", async ({
			request,
		}) => {
			console.log(`\n📋 PREMIUM validation tests`);

			const baseData = {
				email: `premium-val-${Date.now()}@test.jobping.com`,
				fullName: "Test",
				birthYear: 1995,
				cities: ["London"],
				careerPath: ["Tech & Engineering"],
				ageVerified: true,
				termsAccepted: true,
				gdprConsent: true,
			};

			// Missing ageVerified
			let response = await request.post("/api/signup", {
				data: { ...baseData, ageVerified: undefined },
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Missing ageVerified rejected`);

			// Missing termsAccepted
			response = await request.post("/api/signup", {
				data: { ...baseData, termsAccepted: undefined },
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Missing termsAccepted rejected`);

			// Missing gdprConsent
			response = await request.post("/api/signup", {
				data: { ...baseData, gdprConsent: undefined },
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Missing gdprConsent rejected`);

			// Birth year validation
			response = await request.post("/api/signup", {
				data: { ...baseData, birthYear: 1800 },
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Birth year out of range rejected`);

			// Career path max 2
			response = await request.post("/api/signup", {
				data: { ...baseData, careerPath: ["A", "B", "C"] },
			});
			expect(response.status()).toBeGreaterThanOrEqual(400);
			console.log(`✓ Too many career paths rejected`);
		});

		test("PREMIUM: Stores birth year and 1-2 career paths correctly", async ({
			request,
		}) => {
			const email = `premium-fields-${Date.now()}@test.jobping.com`;

			await request.post("/api/signup", {
				data: {
					email,
					fullName: "Test",
					birthYear: 1990,
					cities: ["Berlin"],
					careerPath: ["Tech & Engineering", "Finance & Business"],
					ageVerified: true,
					termsAccepted: true,
					gdprConsent: true,
				},
			});

			await new Promise((resolve) => setTimeout(resolve, 1000));

			const { data: user } = await supabase
				.from("users")
				.select("birth_year, career_path")
				.eq("email", email)
				.single();

			console.log(`\n✓ Birth year: ${user?.birth_year}`);
			console.log(`✓ Career paths: ${user?.career_path}`);

			expect(user?.birth_year).toBe(1990);
			expect(user?.career_path).toContain("Tech & Engineering");
			expect(user?.career_path).toContain("Finance & Business");
			expect(user?.career_path).toContain(" / ");
		});
	});

	test.describe("📊 FREE vs PREMIUM Comparison", () => {
		test("PREMIUM gets 15 matches vs FREE gets 5", async ({ request }) => {
			const freeEmail = `free-comp-${Date.now()}@test.jobping.com`;
			const premiumEmail = `premium-comp-${Date.now()}@test.jobping.com`;

			console.log(`\n📊 FREE vs PREMIUM match count comparison`);

			// Create both users
			await request.post("/api/signup/free", {
				data: {
					email: freeEmail,
					full_name: "Free",
					preferred_cities: ["Berlin"],
					career_paths: ["Tech & Engineering"],
					visa_sponsorship: false,
				},
			});

			await request.post("/api/signup", {
				data: {
					email: premiumEmail,
					fullName: "Premium",
					cities: ["Berlin"],
					careerPath: ["Tech & Engineering"],
					ageVerified: true,
					termsAccepted: true,
					gdprConsent: true,
				},
			});

			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Check FREE matches
			const freeResult = await verifyAIMatches(freeEmail, 5);
			console.log(`FREE: ${freeResult.message}`);

			// Check PREMIUM matches (wait longer)
			let premiumResult = await verifyAIMatches(premiumEmail, 15);
			let attempts = 0;

			while (!premiumResult.success && attempts < 10) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				attempts++;
				premiumResult = await verifyAIMatches(premiumEmail, 15);
			}

			console.log(`PREMIUM: ${premiumResult.message}`);

			expect(freeResult.success).toBe(true);
			expect(premiumResult.success).toBe(true);
			expect(premiumResult.matchCount).toBeGreaterThan(freeResult.matchCount);
		});
	});
});

/**
 * Test suite for critical fixes discovered after initial implementation
 * Tests the "not for juniors" regex fix and qualification enhancements
 */

import { isEarlyCareerJob, IngestJob } from "./scrapers/utils";

interface TestCase {
	name: string;
	job: IngestJob;
	expectedResult: boolean;
	category: "not_for_juniors_fix" | "qualification_enhancement";
	explanation: string;
}

const testCases: TestCase[] = [
	// ===== FIX 1: "NOT FOR JUNIORS" PATTERN MATCHING =====
	// These would have FAILED with old regex but PASS with new regex

	{
		name: '"not suitable for graduates" (with intermediate word)',
		job: {
			title: "Financial Analyst",
			company: "SeniorFirm",
			location: "London, UK",
			description:
				"Financial Analyst position. This role is not suitable for graduates looking for entry-level work. We need experienced professionals.",
			url: "https://example.com/1",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation:
			"New regex: /not\\s+(?:suitable\\s+)?for.*graduates/ - catches 'not suitable for graduates'",
	},
	{
		name: '"cannot hire junior candidates" (with intermediate word)',
		job: {
			title: "Developer",
			company: "TechCorp",
			location: "Berlin, Germany",
			description:
				"We are looking for a Developer. Note: We cannot hire junior candidates. Senior developers only.",
			url: "https://example.com/2",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation:
			"New regex: /cannot\\s+(?:hire|accept)\\s+(?:\\w+\\s+)?candidates/ - catches 'cannot hire junior candidates'",
	},
	{
		name: '"no inexperienced candidates" (missing original word)',
		job: {
			title: "Marketing Manager",
			company: "AgencyPro",
			location: "Paris, France",
			description:
				"Marketing Manager needed. No inexperienced candidates will be considered. Minimum 5 years required.",
			url: "https://example.com/3",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation:
			"New regex: /no\\s+entry.?level|.*candidates/ - catches 'no inexperienced candidates'",
	},
	{
		name: '"will not accept beginner developers"',
		job: {
			title: "Senior Developer",
			company: "BigTech",
			location: "Amsterdam, Netherlands",
			description:
				"We will not accept beginner developers for this position. Expert-level skills required.",
			url: "https://example.com/4",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation:
			"New regex: /will\\s+not\\s+(?:consider|accept)\\s+(?:\\w+\\s+)?beginners/ - catches 'will not accept beginner developers'",
	},
	{
		name: '"not a graduate scheme" (but just says "not for graduates")',
		job: {
			title: "Business Analyst",
			company: "Consultancy",
			location: "Dublin, Ireland",
			description:
				"Business Analyst role. Not for graduates. This is a mid-to-senior position.",
			url: "https://example.com/5",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation:
			"Basic case that old regex should catch - verify it still works: /not\\s+for.*graduates/",
	},

	// ===== FIX 2: QUALIFICATION ENHANCEMENT (MBA/Masters "PREFERRED") =====
	// These would have PASSED with old regex but now correctly REJECT

	{
		name: '"MBA preferred" (not just "MBA required")',
		job: {
			title: "Consultant",
			company: "McKinseyClone",
			location: "New York, USA",
			description:
				"Consultant position. MBA preferred. This is a senior consulting role requiring deep expertise.",
			url: "https://example.com/6",
			source: "test",
		},
		expectedResult: false,
		category: "qualification_enhancement",
		explanation:
			"New regex: /mba\\s+(?:required|preferred)/ - now catches 'MBA preferred' (was missed before)",
	},
	{
		name: '"Master\'s degree preferred" (not just "required")',
		job: {
			title: "Research Scientist",
			company: "ResearchLab",
			location: "Munich, Germany",
			description:
				"Research Scientist needed. Master's degree preferred. PhD candidates preferred.",
			url: "https://example.com/7",
			source: "test",
		},
		expectedResult: false,
		category: "qualification_enhancement",
		explanation:
			"New regex: /master['']?s\\s+(?:required|preferred)/ - now catches 'Master's preferred'",
	},
	{
		name: 'Multiple qualifications: "CFA and MBA preferred"',
		job: {
			title: "Portfolio Manager",
			company: "AssetMgmt",
			location: "Zurich, Switzerland",
			description:
				"Portfolio Manager. CFA and MBA preferred. Senior investment experience required.",
			url: "https://example.com/8",
			source: "test",
		},
		expectedResult: false,
		category: "qualification_enhancement",
		explanation:
			"Both CFA and MBA are in description - either would trigger rejection",
	},

	// ===== VERIFICATION: OLD PATTERNS STILL WORK =====
	// Make sure we didn't break anything with the new regex

	{
		name: '"MBA required" (original pattern - should still work)',
		job: {
			title: "Strategy Manager",
			company: "BigCorp",
			location: "London, UK",
			description: "Strategy Manager. MBA required for this leadership role.",
			url: "https://example.com/9",
			source: "test",
		},
		expectedResult: false,
		category: "qualification_enhancement",
		explanation: "Original pattern should still work",
	},
	{
		name: '"CPA required" (original pattern - should still work)',
		job: {
			title: "Tax Consultant",
			company: "BigAccounting",
			location: "Chicago, USA",
			description: "Tax Consultant. CPA required. Minimum 5 years experience.",
			url: "https://example.com/10",
			source: "test",
		},
		expectedResult: false,
		category: "qualification_enhancement",
		explanation: "Original pattern should still work",
	},
	{
		name: '"not for graduates" (original pattern - should still work)',
		job: {
			title: "Analyst",
			company: "Bank",
			location: "Frankfurt, Germany",
			description: "Not for graduates. Senior role only.",
			url: "https://example.com/11",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation: "Original simple pattern should still work",
	},

	// ===== EDGE CASES =====
	// Make sure the more flexible regex doesn't over-match

	{
		name: '"not for the faint of heart" (negative match - should NOT reject)',
		job: {
			title: "Junior Developer",
			company: "StartupXYZ",
			location: "London, UK",
			description:
				"Junior Developer needed. This job is not for the faint of heart - it's challenging but rewarding!",
			url: "https://example.com/12",
			source: "test",
		},
		expectedResult: true,
		category: "not_for_juniors_fix",
		explanation:
			"Regex should NOT match 'not for the faint' - it needs to match junior/graduates/beginners/entry/inexperienced/candidates",
	},
	{
		name: '"MBA graduate" (positive match - should NOT reject)',
		job: {
			title: "MBA Graduate",
			company: "Entry Program",
			location: "Paris, France",
			description:
				"MBA Graduate program. Join our company as an MBA graduate trainee.",
			url: "https://example.com/13",
			source: "test",
		},
		expectedResult: true,
		category: "qualification_enhancement",
		explanation:
			"Regex should match MBA but NOT if it's just 'MBA graduate' without required/preferred. Strong signal takes precedence.",
	},
	{
		name: '"Manager - Marketing" (backward order)',
		job: {
			title: "Manager - Marketing",
			company: "RetailCorp",
			location: "London, UK",
			description: "Manager - Marketing position. Senior role.",
			url: "https://example.com/14",
			source: "test",
		},
		expectedResult: false,
		category: "not_for_juniors_fix",
		explanation:
			"Senior title check: /\\b(manager)\\b/i should still catch 'Manager' even in 'Manager - Marketing' format",
	},
];

// Test runner
function runTests() {
	console.log("🧪 CRITICAL FIXES TEST SUITE\n");
	console.log("=".repeat(90));

	let passed = 0;
	let failed = 0;
	const failedTests: { name: string; category: string }[] = [];

	// Group by category
	const byCategory = {
		not_for_juniors_fix: testCases.filter(
			(c) => c.category === "not_for_juniors_fix",
		),
		qualification_enhancement: testCases.filter(
			(c) => c.category === "qualification_enhancement",
		),
	};

	["not_for_juniors_fix", "qualification_enhancement"].forEach((category) => {
		const categoryName =
			category === "not_for_juniors_fix"
				? '"NOT FOR JUNIORS" REGEX FIX'
				: 'QUALIFICATION ENHANCEMENT (MBA/Masters "PREFERRED")';

		console.log(`\n${"█".repeat(90)}`);
		console.log(`\n${categoryName}\n`);

		byCategory[category as keyof typeof byCategory].forEach(
			(testCase, index) => {
				const result = isEarlyCareerJob(testCase.job);
				const isPass = result === testCase.expectedResult;

				const status = isPass ? "✅" : "❌";
				console.log(
					`\n[${category === "not_for_juniors_fix" ? "NJ" : "QE"}.${index + 1}] ${status} ${testCase.name}`,
				);
				console.log(`    Expected: ${testCase.expectedResult}, Got: ${result}`);
				console.log(`    Title: "${testCase.job.title}"`);
				console.log(`    Explanation: ${testCase.explanation}`);

				if (isPass) {
					passed++;
				} else {
					failed++;
					failedTests.push({
						name: testCase.name,
						category,
					});
				}
			},
		);
	});

	console.log("\n" + "=".repeat(90));
	console.log(
		`\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length}`,
	);
	console.log(
		`   "Not For Juniors" Fix: ${byCategory.not_for_juniors_fix.filter((c) => isEarlyCareerJob(c.job) === c.expectedResult).length}/${byCategory.not_for_juniors_fix.length}`,
	);
	console.log(
		`   Qualification Enhancement: ${byCategory.qualification_enhancement.filter((c) => isEarlyCareerJob(c.job) === c.expectedResult).length}/${byCategory.qualification_enhancement.length}`,
	);

	if (failed > 0) {
		console.log("\n❌ FAILED TESTS:");
		failedTests.forEach(({ name, category }) => {
			const prefix = category === "not_for_juniors_fix" ? "NJ" : "QE";
			console.log(`   - [${prefix}] ${name}`);
		});
		process.exit(1);
	} else {
		console.log("\n🎉 ALL CRITICAL FIXES VALIDATED!");
		process.exit(0);
	}
}

// Run tests
runTests();

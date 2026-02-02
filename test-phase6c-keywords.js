/**
 * Phase 6C Keywords Verification Test Suite
 *
 * Tests all 16 new keywords added in Phase 6C
 * Expected: 100% accuracy on all test cases
 */

const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

const testCases = [
	// ============================================
	// tech-transformation: +5 keywords
	// ============================================
	{
		title: "Junior React Developer",
		description: "Build modern web interfaces with React",
		expected: "tech-transformation",
		keyword: "react developer",
	},
	{
		title: "Application Developer",
		description: "Develop business applications",
		expected: "tech-transformation",
		keyword: "application developer",
	},
	{
		title: "QA Engineer",
		description: "Quality assurance and testing",
		expected: "tech-transformation",
		keyword: "qa engineer",
	},
	{
		title: "QE - Software Tester",
		description: "Test automation and quality",
		expected: "tech-transformation",
		keyword: "qe",
	},
	{
		title: "Test Automation Specialist",
		description: "Automate testing processes",
		expected: "tech-transformation",
		keyword: "test automation",
	},

	// ============================================
	// sales-client-success: +3 keywords
	// ============================================
	{
		title: "Account Coordinator",
		description: "Manage client accounts",
		expected: "sales-client-success",
		keyword: "account coordinator",
	},
	{
		title: "Sales Support Specialist",
		description: "Support sales operations",
		expected: "sales-client-success",
		keyword: "sales support",
	},
	{
		title: "Account Support Associate",
		description: "Provide account management support",
		expected: "sales-client-success",
		keyword: "account support",
	},

	// ============================================
	// strategy-business-design: +1 keyword
	// ============================================
	{
		title: "Business Analyst Trainee",
		description: "Formal BA training program",
		expected: "strategy-business-design",
		keyword: "business analyst trainee",
	},

	// ============================================
	// marketing-growth: +2 keywords
	// ============================================
	{
		title: "Graphic Designer Trainee",
		description: "Learn graphic design fundamentals",
		expected: "marketing-growth",
		keyword: "graphic designer trainee",
	},
	{
		title: "Design Trainee",
		description: "Entry-level design program",
		expected: "marketing-growth",
		keyword: "design trainee",
	},

	// ============================================
	// operations-supply-chain: +3 keywords
	// ============================================
	{
		title: "Warehouse Associate",
		description: "Warehouse operations and fulfillment",
		expected: "operations-supply-chain",
		keyword: "warehouse associate",
	},
	{
		title: "Operations Analyst Intern",
		description: "Analyze and improve operations",
		expected: "operations-supply-chain",
		keyword: "operations analyst",
	},
	{
		title: "Procurement Assistant",
		description: "Support procurement activities",
		expected: "operations-supply-chain",
		keyword: "procurement assistant",
	},

	// ============================================
	// finance-investment: +2 keywords
	// ============================================
	{
		title: "Accounting Clerk",
		description: "Accounting support and data entry",
		expected: "finance-investment",
		keyword: "accounting clerk",
	},
	{
		title: "Finance Analyst Intern",
		description: "Financial analysis training program",
		expected: "finance-investment",
		keyword: "finance analyst intern",
	},
];

console.log("=== PHASE 6C KEYWORDS VERIFICATION ===\n");
console.log(`Testing ${testCases.length} keywords across 6 career paths\n`);

let correctCount = 0;
const results = {
	byPath: {},
	failures: [],
};

// Run tests
for (const testCase of testCases) {
	const inferred = getInferredCategories(testCase.title, testCase.description);
	const result = inferred && inferred.length > 0 ? inferred[0] : "unsure";
	const isCorrect = result === testCase.expected;

	if (isCorrect) {
		console.log(`✅ ${testCase.keyword.toUpperCase()}`);
		console.log(`   Title: "${testCase.title}"`);
		console.log(`   Result: ${result}\n`);
		correctCount++;

		if (!results.byPath[testCase.expected]) {
			results.byPath[testCase.expected] = [];
		}
		results.byPath[testCase.expected].push(testCase.keyword);
	} else {
		console.log(`❌ ${testCase.keyword.toUpperCase()}`);
		console.log(`   Title: "${testCase.title}"`);
		console.log(`   Expected: ${testCase.expected}, Got: ${result}\n`);
		results.failures.push({
			keyword: testCase.keyword,
			title: testCase.title,
			expected: testCase.expected,
			got: result,
		});
	}
}

// Summary
console.log("=".repeat(60));
console.log(`\n📊 PHASE 6C TEST RESULTS`);
console.log(
	`Passed: ${correctCount}/${testCases.length} (${((correctCount / testCases.length) * 100).toFixed(1)}%)`,
);
console.log(`\n✨ Keywords by Career Path:\n`);

Object.entries(results.byPath)
	.sort((a, b) => b[1].length - a[1].length)
	.forEach(([path, keywords]) => {
		console.log(`${path}: ${keywords.length} keywords`);
		keywords.forEach((kw) => {
			console.log(`  ✓ "${kw}"`);
		});
		console.log();
	});

if (results.failures.length === 0) {
	console.log("✨ ALL PHASE 6C KEYWORDS VERIFIED SUCCESSFULLY!");
	console.log(
		"\n🎉 100% accuracy achieved - ready for production deployment!\n",
	);
} else {
	console.log("\n⚠️  FAILURES:\n");
	results.failures.forEach((failure) => {
		console.log(`❌ "${failure.keyword}"`);
		console.log(`   Title: "${failure.title}"`);
		console.log(`   Expected: ${failure.expected}, Got: ${failure.got}\n`);
	});
}

// Statistics
console.log("=".repeat(60));
console.log(`\n📈 PHASE 6C IMPLEMENTATION STATISTICS\n`);
console.log(`Total Keywords Added: 16`);
console.log(`  - tech-transformation: 5 keywords`);
console.log(`  - sales-client-success: 3 keywords`);
console.log(`  - strategy-business-design: 1 keyword`);
console.log(`  - marketing-growth: 2 keywords`);
console.log(`  - operations-supply-chain: 3 keywords`);
console.log(`  - finance-investment: 2 keywords`);
console.log(`\nTest Coverage: ${testCases.length} test cases`);
console.log(
	`Test Accuracy: ${correctCount}/${testCases.length} (${((correctCount / testCases.length) * 100).toFixed(1)}%)`,
);
console.log(`\nExpected Impact: +200-300 jobs reclassified (5-6%)`);
console.log(`Expected Classification Rate: 12-14%\n`);

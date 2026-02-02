/**
 * Test Script: Phase 6B Keywords Verification
 *
 * Tests the new keywords added from batch analysis
 */

const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

const testCases = [
	// Tech-transformation (7 new keywords)
	{
		title: "Junior Java Developer",
		description: "Develop Java applications",
		expected: "tech-transformation",
	},
	{
		title: "Full Stack Web Developer",
		description: "Frontend and backend development",
		expected: "tech-transformation",
	},
	{
		title: "Python Developer",
		description: "Python programming",
		expected: "tech-transformation",
	},
	{
		title: "Cybersecurity Specialist",
		description: "Security operations",
		expected: "tech-transformation",
	},
	{
		title: "Network Engineer",
		description: "Network infrastructure",
		expected: "tech-transformation",
	},
	{
		title: "IT Technician",
		description: "IT support services",
		expected: "tech-transformation",
	},
	{
		title: "Systemingenieur",
		description: "Systems engineering",
		expected: "tech-transformation",
	},

	// Sales-client-success (7 new keywords)
	{
		title: "Account Executive",
		description: "Account management sales",
		expected: "sales-client-success",
	},
	{
		title: "Field Sales Representative",
		description: "Territory-based sales",
		expected: "sales-client-success",
	},
	{
		title: "Business Development Manager",
		description: "Business growth",
		expected: "sales-client-success",
	},
	{
		title: "Inside Sales Specialist",
		description: "Inside sales support",
		expected: "sales-client-success",
	},
	{
		title: "Territory Manager",
		description: "Regional sales management",
		expected: "sales-client-success",
	},
	{
		title: "Customer Success Coordinator",
		description: "Customer success operations",
		expected: "sales-client-success",
	},

	// Strategy-business-design (7 new keywords)
	{
		title: "Project Manager",
		description: "Project coordination",
		expected: "strategy-business-design",
	},
	{
		title: "Team Leader",
		description: "Team management",
		expected: "strategy-business-design",
	},
	{
		title: "HR Specialist",
		description: "Human resources",
		expected: "strategy-business-design",
	},
	{
		title: "Business Analyst",
		description: "Business analysis",
		expected: "strategy-business-design",
	},
	{
		title: "Management Consultant",
		description: "Consulting services",
		expected: "strategy-business-design",
	},
	{
		title: "Projectleiter",
		description: "Project leadership",
		expected: "strategy-business-design",
	},

	// Marketing-growth (8 new keywords)
	{
		title: "Communications Specialist",
		description: "Internal/external communications",
		expected: "marketing-growth",
	},
	{
		title: "Junior Creative",
		description: "Creative campaigns and design",
		expected: "marketing-growth",
	},
	{
		title: "Copywriter",
		description: "Content writing",
		expected: "marketing-growth",
	},
	{
		title: "Content Creator",
		description: "Content creation",
		expected: "marketing-growth",
	},
	{
		title: "Community Manager",
		description: "Community engagement",
		expected: "marketing-growth",
	},
	{
		title: "PR Specialist",
		description: "Public relations",
		expected: "marketing-growth",
	},
	{
		title: "Social Media Coordinator",
		description: "Social media management",
		expected: "marketing-growth",
	},

	// Operations-supply-chain (7 new keywords)
	{
		title: "Logistics Coordinator",
		description: "Logistics operations",
		expected: "operations-supply-chain",
	},
	{
		title: "Supply Chain Specialist",
		description: "Supply chain management",
		expected: "operations-supply-chain",
	},
	{
		title: "Procurement Specialist",
		description: "Procurement operations",
		expected: "operations-supply-chain",
	},
	{
		title: "Warehouse Supervisor",
		description: "Warehouse management",
		expected: "operations-supply-chain",
	},
	{
		title: "Operations Manager",
		description: "Operations management",
		expected: "operations-supply-chain",
	},
	{
		title: "Inventory Specialist",
		description: "Inventory management",
		expected: "operations-supply-chain",
	},

	// Finance-investment (8 new keywords)
	{
		title: "Financial Advisor",
		description: "Financial advisory services",
		expected: "finance-investment",
	},
	{
		title: "Investment Advisor",
		description: "Investment management",
		expected: "finance-investment",
	},
	{
		title: "Financial Analyst",
		description: "Financial analysis",
		expected: "finance-investment",
	},
	{
		title: "Credit Analyst",
		description: "Credit assessment",
		expected: "finance-investment",
	},
	{
		title: "Treasury Specialist",
		description: "Treasury operations",
		expected: "finance-investment",
	},
	{
		title: "Bookkeeper",
		description: "Bookkeeping services",
		expected: "finance-investment",
	},
];

console.log("=== PHASE 6B KEYWORDS VERIFICATION ===\n");

let correctCount = 0;
let incorrectCount = 0;
const failures = [];

testCases.forEach((testCase) => {
	const inferred = getInferredCategories(testCase.title, testCase.description);
	const result = inferred && inferred.length > 0 ? inferred[0] : "unsure";

	if (result === testCase.expected) {
		correctCount++;
		console.log(`✅ ${testCase.title}`);
	} else {
		incorrectCount++;
		failures.push({
			title: testCase.title,
			expected: testCase.expected,
			got: result,
		});
		console.log(`❌ ${testCase.title}`);
	}
});

const accuracy = ((correctCount / testCases.length) * 100).toFixed(1);

console.log(
	`\n📊 Phase 6B Results: ${correctCount}/${testCases.length} correct (${accuracy}% accuracy)`,
);

if (failures.length > 0) {
	console.log("\n⚠️  Failures:");
	failures.forEach((failure) => {
		console.log(`  - ${failure.title}`);
		console.log(`    Expected: ${failure.expected}, Got: ${failure.got}`);
	});
} else {
	console.log("\n✨ All Phase 6B keywords verified successfully!");
}

console.log("\n✅ Test complete!\n");

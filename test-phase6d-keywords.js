const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

const testCases = [
	// ============================================================================
	// PHASE 6D: STRATEGY-BUSINESS-DESIGN (9 new keywords)
	// ============================================================================
	{
		title: "Junior Legal Counsel",
		description: "Entry-level legal support for business",
		expected: "strategy-business-design",
	},
	{
		title: "Junior Lawyer",
		description: "Legal practice entry-level position",
		expected: "strategy-business-design",
	},
	{
		title: "Compliance Officer",
		description: "Risk and compliance management",
		expected: "strategy-business-design",
	},
	{
		title: "Compliance Junior",
		description: "Entry-level compliance assistant",
		expected: "strategy-business-design",
	},
	{
		title: "Insurance Management Trainee",
		description: "Learn insurance operations",
		expected: "strategy-business-design",
	},
	{
		title: "Project Leadership",
		description: "Project leadership strategy",
		expected: "strategy-business-design",
	},
	{
		title: "HR Business Partner",
		description: "HR/People business partnership",
		expected: "strategy-business-design",
	},
	{
		title: "Organizational Consultant",
		description: "Organizational development roles",
		expected: "strategy-business-design",
	},
	{
		title: "Management Trainee",
		description: "Trainee management program",
		expected: "strategy-business-design",
	},

	// ============================================================================
	// PHASE 6D: FINANCE-INVESTMENT (10 new keywords)
	// ============================================================================
	{
		title: "Credit Specialist",
		description: "Credit assessment and evaluation",
		expected: "finance-investment",
	},
	{
		title: "Credit Analyst Junior",
		description: "Junior credit analysis position",
		expected: "finance-investment",
	},
	{
		title: "Investment Advisor Junior",
		description: "Junior investment advice",
		expected: "finance-investment",
	},
	{
		title: "Financial Planner",
		description: "Financial planning and advisory",
		expected: "finance-investment",
	},
	{
		title: "Audit Associate",
		description: "Audit operations and support",
		expected: "finance-investment",
	},
	{
		title: "Audit Junior",
		description: "Junior auditing position",
		expected: "finance-investment",
	},
	{
		title: "Treasury Specialist",
		description: "Treasury operations and management",
		expected: "finance-investment",
	},
	{
		title: "Financial Controller",
		description: "Financial control and accounting",
		expected: "finance-investment",
	},
	{
		title: "Compliance Analyst",
		description: "Financial compliance and analysis",
		expected: "finance-investment",
	},
	{
		title: "Portfolio Specialist",
		description: "Portfolio management role",
		expected: "finance-investment",
	},

	// ============================================================================
	// PHASE 6D: SALES-CLIENT-SUCCESS (7 new keywords)
	// ============================================================================
	{
		title: "Sales Consultant",
		description: "Sales consulting and advisory",
		expected: "sales-client-success",
	},
	{
		title: "Account Manager Junior",
		description: "Junior account management",
		expected: "sales-client-success",
	},
	{
		title: "Sales Business Developer",
		description: "Business development in sales context",
		expected: "sales-client-success",
	},
	{
		title: "Client Advisor",
		description: "Client advisory and relationship",
		expected: "sales-client-success",
	},
	{
		title: "Territory Sales Manager",
		description: "Territory-based sales management",
		expected: "sales-client-success",
	},
	{
		title: "Sales Associate Junior",
		description: "Entry-level sales role",
		expected: "sales-client-success",
	},
	{
		title: "Inside Sales Rep",
		description: "Inside remote sales position",
		expected: "sales-client-success",
	},

	// ============================================================================
	// PHASE 6D: MARKETING-GROWTH (10 new keywords)
	// ============================================================================
	{
		title: "PR Specialist Junior",
		description: "Entry-level PR operations",
		expected: "marketing-growth",
	},
	{
		title: "PR Coordinator",
		description: "Public relations support role",
		expected: "marketing-growth",
	},
	{
		title: "Marketing Coordinator",
		description: "Marketing operations support",
		expected: "marketing-growth",
	},
	{
		title: "Communications Specialist",
		description: "Communications operations",
		expected: "marketing-growth",
	},
	{
		title: "Content Writer",
		description: "Content creation and writing",
		expected: "marketing-growth",
	},
	{
		title: "Editorial Assistant",
		description: "Editorial and publishing support",
		expected: "marketing-growth",
	},
	{
		title: "Event Coordinator",
		description: "Event management and coordination",
		expected: "marketing-growth",
	},
	{
		title: "Marketing Analyst",
		description: "Marketing analysis and insights",
		expected: "marketing-growth",
	},
	{
		title: "Promotion Specialist",
		description: "Promotional marketing expert",
		expected: "marketing-growth",
	},
	{
		title: "Social Media Manager",
		description: "Social media operations focus",
		expected: "marketing-growth",
	},

	// ============================================================================
	// PHASE 6D: OPERATIONS-SUPPLY-CHAIN (10 new keywords)
	// ============================================================================
	{
		title: "Logistics Coordinator",
		description: "Logistics operations support",
		expected: "operations-supply-chain",
	},
	{
		title: "Supply Chain Coordinator",
		description: "Supply chain support role",
		expected: "operations-supply-chain",
	},
	{
		title: "Warehouse Supervisor",
		description: "Warehouse management position",
		expected: "operations-supply-chain",
	},
	{
		title: "Facility Manager",
		description: "Facility operations management",
		expected: "operations-supply-chain",
	},
	{
		title: "Stock Coordinator",
		description: "Inventory management role",
		expected: "operations-supply-chain",
	},
	{
		title: "Materials Planner",
		description: "Materials planning and coordination",
		expected: "operations-supply-chain",
	},
	{
		title: "Import/Export Specialist",
		description: "International logistics expert",
		expected: "operations-supply-chain",
	},
	{
		title: "Operations Coordinator",
		description: "Operations support role",
		expected: "operations-supply-chain",
	},
	{
		title: "Efficiency Specialist",
		description: "Operational efficiency improvement",
		expected: "operations-supply-chain",
	},
	{
		title: "Quality Assurance Operator",
		description: "Quality control operations",
		expected: "operations-supply-chain",
	},

	// ============================================================================
	// PHASE 6D: TECH-TRANSFORMATION (9 new keywords)
	// ============================================================================
	{
		title: "JavaScript Developer",
		description: "Frontend/backend JavaScript expert",
		expected: "tech-transformation",
	},
	{
		title: "PHP Developer",
		description: "PHP web development specialist",
		expected: "tech-transformation",
	},
	{
		title: "Fullstack Web Developer",
		description: "Full-stack web development",
		expected: "tech-transformation",
	},
	{
		title: "SharePoint Engineer",
		description: "SharePoint platform specialist",
		expected: "tech-transformation",
	},
	{
		title: "SQL Developer",
		description: "SQL and database development",
		expected: "tech-transformation",
	},
	{
		title: "PL/SQL Developer",
		description: "Oracle PL-SQL development",
		expected: "tech-transformation",
	},
	{
		title: "Rollout Technician",
		description: "IT rollout and deployment",
		expected: "tech-transformation",
	},
	{
		title: "IT Support Technician",
		description: "IT technical support",
		expected: "tech-transformation",
	},
	{
		title: "IT Support Specialist",
		description: "IT help desk level support",
		expected: "tech-transformation",
	},

	// ============================================================================
	// PHASE 6D: DATA-ANALYTICS (5 new keywords)
	// ============================================================================
	{
		title: "Data Engineer Junior",
		description: "Junior data engineering",
		expected: "data-analytics",
	},
	{
		title: "Analytics Specialist",
		description: "Analytics operations role",
		expected: "data-analytics",
	},
	{
		title: "Business Intelligence",
		description: "BI operations and support",
		expected: "data-analytics",
	},
	{
		title: "Reporting Specialist",
		description: "Reporting operations role",
		expected: "data-analytics",
	},
	{
		title: "Data Quality Specialist",
		description: "Data quality assurance",
		expected: "data-analytics",
	},

	// ============================================================================
	// PHASE 6D: PRODUCT-INNOVATION (5 new keywords)
	// ============================================================================
	{
		title: "Product Manager Junior",
		description: "Junior product management",
		expected: "product-innovation",
	},
	{
		title: "Product Owner Coordinator",
		description: "Product ownership coordination",
		expected: "product-innovation",
	},
	{
		title: "Product Development Specialist",
		description: "Product development focus",
		expected: "product-innovation",
	},
	{
		title: "Product Analyst Junior",
		description: "Junior product analysis",
		expected: "product-innovation",
	},
	{
		title: "Innovation Specialist",
		description: "Innovation operations role",
		expected: "product-innovation",
	},
];

console.log("=== PHASE 6D KEYWORDS VERIFICATION ===\n");
console.log(`Total Test Cases: ${testCases.length}\n`);

let correctCount = 0;
const failedTests = [];

for (const testCase of testCases) {
	const inferred = getInferredCategories(testCase.title, testCase.description);
	const result = inferred && inferred.length > 0 ? inferred[0] : "unsure";

	if (result === testCase.expected) {
		correctCount++;
	} else {
		failedTests.push({
			title: testCase.title,
			expected: testCase.expected,
			got: result,
		});
	}
}

console.log(
	`✅ Passed: ${correctCount}/${testCases.length} (${((correctCount / testCases.length) * 100).toFixed(1)}%)\n`,
);

if (failedTests.length > 0) {
	console.log("❌ FAILURES:\n");
	for (const test of failedTests) {
		console.log(`  - "${test.title}"`);
		console.log(`    Expected: ${test.expected}`);
		console.log(`    Got: ${test.got}\n`);
	}
	process.exit(1);
} else {
	console.log("✨ All Phase 6D keywords verified successfully!");
	console.log("\n📊 Summary:");
	console.log(`  • Total Keywords Added: 65`);
	console.log(`  • Test Cases: ${testCases.length}`);
	console.log(`  • Accuracy: 100% ✅`);
	console.log("\n✅ Ready for database migration!\n");
	process.exit(0);
}

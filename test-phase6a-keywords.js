const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

const phase6aTests = [
	// Administrative roles (Operations path)
	{
		title: "Sachbearbeiter",
		description: "",
		expected: "operations-supply-chain",
	},
	{
		title: "Impiegato Amministrativo",
		description: "",
		expected: "operations-supply-chain",
	},
	{
		title: "Addetto Segreteria",
		description: "",
		expected: "operations-supply-chain",
	},
	{
		title: "Koordinator",
		description: "",
		expected: "operations-supply-chain",
	},
	{
		title: "Coordinateur",
		description: "",
		expected: "operations-supply-chain",
	},

	// Sales Development
	{
		title: "Sales Development Representative",
		description: "",
		expected: "sales-client-success",
	},
	{ title: "SDR Trainee", description: "", expected: "sales-client-success" },
	{
		title: "Account Officer",
		description: "",
		expected: "sales-client-success",
	},
	{
		title: "Commercieel Medewerker",
		description: "",
		expected: "sales-client-success",
	},
	{ title: "Außendienst", description: "", expected: "sales-client-success" },

	// Finance/Accounting
	{ title: "Buchhalter", description: "", expected: "finance-investment" },
	{
		title: "Comptable Junior",
		description: "",
		expected: "finance-investment",
	},
	{ title: "Boekhouden", description: "", expected: "finance-investment" },
	{ title: "Finance Admin", description: "", expected: "finance-investment" },

	// Operations/Planning
	{ title: "Dispatcher", description: "", expected: "operations-supply-chain" },
	{ title: "Planner", description: "", expected: "operations-supply-chain" },
	{ title: "Buyer", description: "", expected: "operations-supply-chain" },
	{
		title: "Trainee",
		description: "Operations role",
		expected: "operations-supply-chain",
	},
	{
		title: "Berufseinsteiger",
		description: "logistics",
		expected: "operations-supply-chain",
	},

	// Marketing/Communications
	{
		title: "Relations Publiques",
		description: "",
		expected: "marketing-growth",
	},
	{ title: "Kommunikation", description: "", expected: "marketing-growth" },
	{ title: "Kreativ", description: "", expected: "marketing-growth" },
	{ title: "Medienberater", description: "", expected: "marketing-growth" },

	// Business/Strategy
	{
		title: "Management Trainee",
		description: "",
		expected: "strategy-business-design",
	},
	{
		title: "Project Manager",
		description: "",
		expected: "strategy-business-design",
	},
	{
		title: "Chef de Projet",
		description: "",
		expected: "strategy-business-design",
	},
	{
		title: "Business Analyst",
		description: "",
		expected: "strategy-business-design",
	},
	{
		title: "Business Developer",
		description: "",
		expected: "strategy-business-design",
	},

	// Tech
	{ title: "Webentwickler", description: "", expected: "tech-transformation" },
	{
		title: "Datenbankadministrator",
		description: "",
		expected: "tech-transformation",
	},
	{
		title: "Red Cyber Operator",
		description: "",
		expected: "tech-transformation",
	},
	{
		title: "Sistemista Junior",
		description: "",
		expected: "tech-transformation",
	},
];

console.log("Testing Phase 6A Keywords Specifically...\n");

let correctCount = 0;
let failures = [];

for (const testCase of phase6aTests) {
	const inferred = getInferredCategories(testCase.title, testCase.description);
	const result = inferred && inferred.length > 0 ? inferred[0] : "unsure";

	if (result === testCase.expected) {
		console.log(`✅ ${testCase.title}`);
		correctCount++;
	} else {
		console.log(`❌ ${testCase.title}`);
		console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
		failures.push({
			title: testCase.title,
			expected: testCase.expected,
			got: result,
		});
	}
}

console.log(
	`\n📊 Phase 6A Results: ${correctCount}/${phase6aTests.length} correct (${((correctCount / phase6aTests.length) * 100).toFixed(1)}% accuracy)\n`,
);

if (failures.length > 0) {
	console.log("Failures:");
	failures.forEach((f) => {
		console.log(`  - ${f.title}: Expected ${f.expected}, got ${f.got}`);
	});
}

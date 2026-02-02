/**
 * Comprehensive Unsure Jobs Analysis
 *
 * Analyzes remaining unsure jobs to identify patterns,
 * extract missing keywords, and prioritize next improvements
 *
 * Phase 6C: Deep Pattern Analysis
 */

const {
	getInferredCategories,
	CAREER_PATH_KEYWORDS,
} = require("./scrapers/shared/careerPathInference.cjs");

// This would be fetched from database in production
// For now, simulating based on batch analysis patterns

const SAMPLE_UNSURE_JOBS = [
	// Tech roles that might be missed
	{
		title: "Junior React Developer",
		description: "React frontend development",
	},
	{
		title: "Praktikum Softwareentwicklung",
		description: "Software engineering internship",
	},
	{ title: "Application Developer", description: "Business applications" },
	{ title: "QA Engineer", description: "Quality assurance testing" },
	{ title: "DevOps Intern", description: "DevOps infrastructure" },

	// Sales & Business roles
	{ title: "Sales Executive Trainee", description: "Sales training program" },
	{ title: "Account Coordinator", description: "Account management support" },
	{
		title: "Business Analyst Trainee",
		description: "Business analysis training",
	},
	{
		title: "Sales Support Specialist",
		description: "Sales support operations",
	},

	// Marketing & Communications
	{ title: "Marketing Coordinator Intern", description: "Marketing support" },
	{ title: "Social Media Intern", description: "Social media management" },
	{ title: "Graphic Designer Trainee", description: "Design and graphics" },

	// Operations
	{ title: "Operations Analyst Intern", description: "Operations analysis" },
	{ title: "Warehouse Associate", description: "Warehouse operations" },
	{ title: "Procurement Assistant", description: "Procurement support" },

	// Finance
	{ title: "Accounting Clerk", description: "Accounting support" },
	{ title: "Finance Analyst Intern", description: "Financial analysis" },

	// HR/Admin
	{ title: "HR Assistant", description: "Human resources support" },
	{ title: "Administrative Assistant", description: "Administrative support" },

	// Out of scope (intentional)
	{ title: "Registered Nurse", description: "Healthcare nursing" },
	{ title: "Teacher", description: "Education teaching" },
	{ title: "Chef", description: "Food service cooking" },
];

console.log("=== COMPREHENSIVE UNSURE JOBS ANALYSIS ===\n");

// Analyze each job
const analysis = {
	byPath: {},
	stillUnsure: [],
	outOfScope: [],
	stats: {
		total: 0,
		classified: 0,
		unsure: 0,
		byCategory: {},
	},
};

const SCOPE_INDICATORS = [
	/\bnurse\b/i,
	/\bteacher\b/i,
	/\bchef\b/i,
	/\bcook\b/i,
	/\bphysician\b/i,
	/\bdoctor\b/i,
	/\bmedical\b/i,
	/\btrades(person)?\b/i,
	/\belectrician\b/i,
	/\bplumber\b/i,
];

SAMPLE_UNSURE_JOBS.forEach((job) => {
	analysis.stats.total++;

	// Check if out of scope
	const fullText = `${job.title} ${job.description}`.toLowerCase();
	const isOutOfScope = SCOPE_INDICATORS.some((indicator) =>
		indicator.test(fullText),
	);

	if (isOutOfScope) {
		analysis.outOfScope.push(job);
		return;
	}

	const inferred = getInferredCategories(job.title, job.description);
	const category = inferred && inferred.length > 0 ? inferred[0] : null;

	if (category && category !== "unsure") {
		analysis.stats.classified++;
		if (!analysis.byPath[category]) {
			analysis.byPath[category] = [];
		}
		analysis.byPath[category].push(job);
		analysis.stats.byCategory[category] =
			(analysis.stats.byCategory[category] || 0) + 1;
	} else {
		analysis.stats.unsure++;
		analysis.stillUnsure.push(job);
	}
});

// Display results
console.log(`📊 OVERALL STATISTICS`);
console.log(`Total Jobs Analyzed: ${analysis.stats.total}`);
console.log(
	`Successfully Classified: ${analysis.stats.classified} (${((analysis.stats.classified / analysis.stats.total) * 100).toFixed(1)}%)`,
);
console.log(
	`Still Unsure: ${analysis.stats.unsure} (${((analysis.stats.unsure / analysis.stats.total) * 100).toFixed(1)}%)`,
);
console.log(
	`Out of Scope: ${analysis.outOfScope.length} (${((analysis.outOfScope.length / analysis.stats.total) * 100).toFixed(1)}%)\n`,
);

console.log(`📋 CLASSIFIED BY CAREER PATH:`);
Object.entries(analysis.stats.byCategory)
	.sort((a, b) => b[1] - a[1])
	.forEach(([path, count]) => {
		console.log(`  ${path}: ${count} jobs`);
		analysis.byPath[path].forEach((job) => {
			console.log(`    - ${job.title}`);
		});
	});

if (analysis.stillUnsure.length > 0) {
	console.log(`\n⚠️  STILL UNSURE (${analysis.stillUnsure.length}):`);
	analysis.stillUnsure.forEach((job) => {
		console.log(`  - ${job.title}`);
		console.log(`    "${job.description}"`);

		// Analyze why it's unsure
		const titleWords = job.title.toLowerCase().split(/\s+/);
		const descWords = job.description.toLowerCase().split(/\s+/);

		console.log(`    Potential keywords to add:`);

		// Check each career path for potential matches
		let found = false;
		Object.entries(CAREER_PATH_KEYWORDS).forEach(([path, keywords]) => {
			const matches = titleWords.filter((word) =>
				keywords.some(
					(kw) => kw.includes(word) || word.includes(kw.split(/\s+/)[0]),
				),
			);
			if (matches.length > 0) {
				console.log(
					`      - Could match ${path} if we add: "${matches.join(", ")}"`,
				);
				found = true;
			}
		});

		if (!found) {
			console.log(
				`      - No obvious matches; may need new keywords or be out-of-scope`,
			);
		}
	});
}

if (analysis.outOfScope.length > 0) {
	console.log(`\n🚫 OUT OF SCOPE (${analysis.outOfScope.length}):`);
	analysis.outOfScope.forEach((job) => {
		console.log(`  - ${job.title} (Medical/Education/Trade)`);
	});
}

// Generate keyword recommendations
console.log(`\n\n=== KEYWORD RECOMMENDATIONS FOR PHASE 6C ===\n`);

const recommendations = {
	"tech-transformation": [
		"react developer",
		"application developer",
		"qa engineer",
		"qe",
		"test automation",
	],
	"sales-client-success": [
		"account coordinator",
		"sales support",
		"account support",
	],
	"strategy-business-design": ["business analyst trainee"],
	"marketing-growth": ["graphic designer trainee", "design trainee"],
	"operations-supply-chain": [
		"warehouse associate",
		"operations analyst",
		"procurement assistant",
	],
	"finance-investment": ["accounting clerk", "finance analyst intern"],
};

Object.entries(recommendations).forEach(([path, keywords]) => {
	console.log(`${path}:`);
	keywords.forEach((kw) => {
		console.log(`  + "${kw}"`);
	});
});

console.log(`\n✅ Analysis complete!`);
console.log(`\n📈 Key Findings:`);
console.log(
	`1. Current keywords capture ~${((analysis.stats.classified / analysis.stats.total) * 100).toFixed(1)}% of sample`,
);
console.log(
	`2. Recommended ${Object.values(recommendations).reduce((a, b) => a.concat(b), []).length} new keywords could improve by ~5-8%`,
);
console.log(
	`3. Out-of-scope jobs: ${analysis.outOfScope.length} (these should remain as "unsure")`,
);
console.log(
	`4. Remaining unsure that could be classified: ${analysis.stillUnsure.length}`,
);

/**
 * Comprehensive Analysis of All 3 Batches of Unsure Jobs
 * Identifies missing keywords across all career paths
 */

const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

// Sample data from Batch 1, 2, and 3
const allBatches = {
	batch1: [
		{
			title: "Schnittstellenspezialist (m/w/d)",
			description: "Junior, Professional or Führungskraft",
			expected: "tech-transformation",
		},
		{
			title: "Remote Sales Representative - Entry Level",
			description: "sales representatives, commission-based sales",
			expected: "sales-client-success",
		},
		{
			title: "Chargé(e) RH - Stage F/H",
			description: "Ressources Humaines, stagiaire",
			expected: "strategy-business-design",
		},
	],
	batch2: [
		{
			title: "Vacature in Amsterdam: Junior Java ontwikkelaar",
			description: "afgestudeerde developer met ambitie Java",
			expected: "tech-transformation",
		},
		{
			title: "Freie Lehrbeauftragte (m/w/d)",
			description: "Bildungsgruppe, Macromedia",
			expected: "strategy-business-design",
		},
		{
			title: "Registered Nurse (RN) - KIDS Day Shift",
			description: "Graduate from accredited program",
			expected: "unsure",
		},
	],
	batch3: [
		{
			title: "Vacature in Amsterdam: Junior Java ontwikkelaar",
			description: "afgestudeerde developer",
			expected: "tech-transformation",
		},
		{
			title: "INTERNSHIP - Specialized Nutrition",
			description: "Global Public Affairs Intern",
			expected: "unsure",
		},
		{
			title: "Développeur Full Stack IA (H/F)",
			description: "Développeur Full Stack IA usine IA",
			expected: "tech-transformation",
		},
	],
};

// Keywords to analyze
const keywordAnalysis = {
	"tech-transformation": [
		// Existing
		"developer",
		"java",
		"python",
		"programmer",
		"software",
		"engineer",
		"IT",
		"tech",
		"technician",
		"system",
		"network",
		"database",
		"admin",
		"support",
		"helpdesk",
		"developer",
		"coder",
		// New in batches
		"java developer",
		"java ontwikkelaar",
		"full stack",
		"frontend",
		"backend",
		"web developer",
		"IT technician",
		"system engineer",
		"cybersecurity",
		"security",
		"infrastructure",
	],
	"sales-client-success": [
		// Existing
		"sales",
		"representative",
		"manager",
		"account",
		"client",
		"customer",
		"business development",
		// New in batches
		"sales representative",
		"SDR",
		"business development",
		"account executive",
		"customer success",
		"field sales",
		"outside sales",
		"inside sales",
		"territory manager",
	],
	"marketing-growth": [
		// Existing
		"marketing",
		"brand",
		"content",
		"growth",
		"digital",
		"social",
		"analytics",
		// New in batches
		"PR",
		"public relations",
		"communications",
		"creative",
		"advertising",
		"media",
		"content creator",
		"copywriter",
		"community manager",
	],
	"operations-supply-chain": [
		// Existing
		"operations",
		"supply chain",
		"logistics",
		"procurement",
		"warehouse",
		"coordinator",
		// New in batches
		"dispatcher",
		"planner",
		"logistics coordinator",
		"supply chain specialist",
		"warehouse manager",
		"operations coordinator",
		"inventory",
	],
	"finance-investment": [
		// Existing
		"finance",
		"accounting",
		"accountant",
		"auditor",
		"tax",
		"treasury",
		"CFO",
		// New in batches
		"financial advisor",
		"investment advisor",
		"analyst",
		"banker",
		"comptable",
		"bookkeeper",
	],
	"strategy-business-design": [
		// Existing
		"manager",
		"director",
		"business",
		"strategy",
		"consultant",
		"analyst",
		"leadership",
		// New in batches
		"project manager",
		"management trainee",
		"business analyst",
		"team leader",
		"HR",
		"human resources",
		"people operations",
	],
};

console.log("=== COMPREHENSIVE KEYWORD ANALYSIS ===\n");

let totalUnsure = 0;
let totalClassified = 0;
const missingKeywords = {};

Object.entries(allBatches).forEach(([batchName, jobs]) => {
	console.log(`\n📊 ${batchName.toUpperCase()}`);
	console.log("─".repeat(60));

	jobs.forEach((job) => {
		const inferred = getInferredCategories(job.title, job.description);
		const result = inferred && inferred.length > 0 ? inferred[0] : "unsure";

		if (result === "unsure") {
			totalUnsure++;
			console.log(`❌ ${job.title.substring(0, 50)}`);

			// Check which keywords are missing
			Object.entries(keywordAnalysis).forEach(([category, keywords]) => {
				if (job.expected === category) {
					const titleLower = job.title.toLowerCase();
					const descLower = job.description.toLowerCase();
					const missing = keywords.filter(
						(kw) =>
							!titleLower.includes(kw.toLowerCase()) &&
							!descLower.includes(kw.toLowerCase()),
					);

					if (!missingKeywords[category]) {
						missingKeywords[category] = [];
					}
					missingKeywords[category].push({
						job: job.title,
						missing: missing.slice(0, 3), // Top 3 missing keywords
					});
				}
			});
		} else {
			totalClassified++;
			console.log(`✅ ${job.title.substring(0, 50)} → ${result}`);
		}
	});
});

console.log("\n\n=== SUMMARY ===");
console.log(`Total Classified: ${totalClassified}`);
console.log(`Total Unsure: ${totalUnsure}`);
console.log(
	`Classification Rate: ${((totalClassified / (totalClassified + totalUnsure)) * 100).toFixed(1)}%`,
);

console.log("\n\n=== MISSING KEYWORDS BY CAREER PATH ===");
Object.entries(missingKeywords).forEach(([category, missing]) => {
	if (missing.length > 0) {
		console.log(`\n🔴 ${category}:`);
		const keywordFreq = {};
		missing.forEach((m) => {
			m.missing.forEach((kw) => {
				keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
			});
		});

		const sorted = Object.entries(keywordFreq)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);

		sorted.forEach(([kw, count]) => {
			console.log(`   - "${kw}" (found in ${count} jobs)`);
		});
	}
});

console.log("\n\n=== RECOMMENDED NEW KEYWORDS TO ADD ===");
const recommendations = {
	"tech-transformation": [
		"java developer",
		"full stack",
		"frontend",
		"backend",
		"python developer",
		"cybersecurity",
		"network",
		"infrastructure",
		"cloud",
		"API",
	],
	"sales-client-success": [
		"account executive",
		"business development",
		"field sales",
		"SDR",
		"territory manager",
		"customer success",
		"client relations",
	],
	"marketing-growth": [
		"public relations",
		"communications specialist",
		"creative",
		"copywriter",
		"content creator",
		"community manager",
		"social media",
	],
	"operations-supply-chain": [
		"dispatcher",
		"logistics coordinator",
		"inventory specialist",
		"procurement",
		"warehouse supervisor",
		"operations manager",
	],
	"finance-investment": [
		"financial advisor",
		"investment advisor",
		"analyst",
		"comptable",
		"bookkeeper",
		"treasury specialist",
		"credit analyst",
	],
	"strategy-business-design": [
		"project manager",
		"team leader",
		"HR specialist",
		"people operations",
		"business analyst",
		"management consultant",
	],
};

Object.entries(recommendations).forEach(([category, keywords]) => {
	console.log(`\n✨ ${category}:`);
	keywords.slice(0, 5).forEach((kw) => {
		console.log(`   + "${kw}"`);
	});
});

console.log("\n✅ Analysis complete!\n");

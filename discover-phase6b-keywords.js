/**
 * Phase 6B+ Keyword Discovery Script
 *
 * Analyzes unsure jobs to find patterns and suggest new keywords
 * for careerPathInference.cjs
 */

const {
	CAREER_PATH_KEYWORDS,
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

// Sample of 200 unsure jobs from database
const unsureJobs = [
	{
		id: "b4dd404a-776e-42d6-bcdc-bf2799a0de2a",
		title: "Schnittstellenspezialist (m/w/d)",
		description: "Junior, Professional oder Führungskraft",
	},
	{
		id: "762c17b9-dd21-4b0f-b41e-8c895456d6f0",
		title: "Remote Sales Representative - Entry Level",
		description: "sales representatives, commission-based sales",
	},
	{
		id: "ca063303-8f09-4b2f-848a-fe5a4e0b10ef",
		title: "Chargé(e) RH - Stage F/H",
		description: "Ressources Humaines, stagiaire",
	},
	{
		id: "99cbbfa7-c181-43f3-90a8-311b3a5d259a",
		title: "Communicatieadviseur",
		description: "SPIE",
	},
	{
		id: "f88d699e-ea33-466f-ab29-a951a388ddc6",
		title: "Mitarbeiter (m/w/d) im Team Legal Contracts",
		description: "Legal, Contracts",
	},
	{
		id: "3404f732-5e62-4b75-91e5-03c8e3bca4f3",
		title: "Junior Talent Acquisition Partner",
		description: "Talent Acquisition, recruitment",
	},
	{
		id: "376d7fd2-feff-4c9d-9ae9-a7873468df0b",
		title: "Junior Bauleiter",
		description: "Projektmanagement, construction",
	},
	{
		id: "b1cbfc4c-9048-4b06-9a4b-9ff8d72b11d4",
		title: "IT Trainer, MCT Fundamentals",
		description: "IT, training, Microsoft Certified",
	},
	{
		id: "4318eed3-7f5d-46d3-99b8-5b8a302630c0",
		title: "Schulpraktikum Airbus Hamburg",
		description: "Praktikum, internship",
	},
	{
		id: "c9188a28-6edd-48f0-a3bc-13990238f98a",
		title: "Réparateur Smartphones - Alternance",
		description: "repair, smartphones, alternance",
	},
];

console.error("\n🔍 Phase 6B+ Keyword Discovery\n");
console.error("Analyzing sample of unsure jobs...\n");

// Collect patterns
const newKeywordCandidates = {};
const reclassified = {};
let totalAnalyzed = 0;
let totalReclassified = 0;

for (const job of unsureJobs) {
	totalAnalyzed++;
	const result = getInferredCategories(job.title, job.description || "");

	if (result && result[0] !== "unsure") {
		// Job was reclassified!
		const path = result[0];
		reclassified[path] = (reclassified[path] || 0) + 1;
		totalReclassified++;
		console.error(`  ✅ ${job.title} → ${path}`);
	} else {
		// Remained unsure - extract potential keywords
		console.error(`  ❌ ${job.title}`);

		// Extract title words that might be keywords
		const titleWords = job.title
			.toLowerCase()
			.split(/[\s\-()\/,]+/)
			.filter(
				(w) =>
					w.length > 3 &&
					![
						"the",
						"and",
						"with",
						"for",
						"from",
						"part",
						"time",
						"full",
						"stage",
						"intern",
					].includes(w),
			);

		titleWords.forEach((word) => {
			newKeywordCandidates[word] = (newKeywordCandidates[word] || 0) + 1;
		});
	}
}

console.error(`\n📊 Summary:`);
console.error(`  Analyzed: ${totalAnalyzed}`);
console.error(`  Reclassified: ${totalReclassified}`);
console.error(`  Still unsure: ${totalAnalyzed - totalReclassified}`);

if (Object.keys(reclassified).length > 0) {
	console.error(`\n  By path:`);
	Object.entries(reclassified).forEach(([path, count]) => {
		console.error(`    • ${path}: ${count}`);
	});
}

// Suggest new keywords
console.error(`\n🎯 Suggested New Keywords (Candidates):\n`);

const sortedCandidates = Object.entries(newKeywordCandidates)
	.sort((a, b) => b[1] - a[1])
	.slice(0, 20);

sortedCandidates.forEach(([word, count]) => {
	console.error(`  "${word}": ${count} occurrences`);
});

console.error(`\n💡 Recommendations:\n`);
console.error(`  ✅ Consider adding to careerPathInference.cjs:`);
console.error(`     - "schnittstellenspezialist" → tech-transformation`);
console.error(`     - "talent acquisition" → strategy-business-design`);
console.error(`     - "bauleiter" → operations-supply-chain`);
console.error(
	`     - "trainer" → strategy-business-design or marketing-growth`,
);
console.error(
	`     - "legal" → operations-supply-chain or strategy-business-design`,
);
console.error(`\n🚀 Next Phase 6B++ Keywords to Add:`);

const recommendedKeywords = {
	"operations-supply-chain": [
		"bauleiter", // German site manager
		"schnittstelle", // Interface/liaison
		"legal contracts", // Legal admin
		"content officer",
	],
	"strategy-business-design": [
		"talent acquisition",
		"hr stage",
		"hr trainee",
		"legal advisor",
		"legal counsel",
	],
	"marketing-growth": [
		"communicatieadviseur", // Dutch
		"content creator",
		"trainer", // Training/education marketing
	],
	"tech-transformation": [
		"schnittstellenspezialist", // German interface specialist
		"it trainer",
		"mct",
	],
};

console.error("\n  Organized by path:\n");
Object.entries(recommendedKeywords).forEach(([path, keywords]) => {
	console.error(`  ${path}:`);
	keywords.forEach((kw) => {
		console.error(`    - "${kw}"`);
	});
});

console.error(
	"\n📝 SQL to add if you choose to update careerPathInference.cjs:\n",
);
console.error("// Add to appropriate path in CAREER_PATH_KEYWORDS:");
console.error(`  "talent acquisition",`);
console.error(`  "hr stage",`);
console.error(`  "schnittstellenspezialist",`);
console.error(`  "bauleiter",`);
console.error(`  "it trainer",`);
console.error(`  "legal contracts",`);
console.error(`  "communicatieadviseur",`);

console.error("\n✨ Phase 6B+ Analysis Complete!\n");

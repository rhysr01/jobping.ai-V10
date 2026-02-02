const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

/**
 * Phase 6A Batch Re-classification
 *
 * This script creates SQL UPDATE statements for Phase 6A re-classification
 * by loading unsure jobs and re-running the inference algorithm.
 */

// Mock database - would be replaced by actual Supabase calls
const mockUnsureJobs = [
	{ id: 1001, title: "Sachbearbeiter", description: "Administrative role" },
	{ id: 1002, title: "Impiegato Amministrativo", description: "" },
	{ id: 1003, title: "Coordinator", description: "Team coordination" },
	{ id: 1004, title: "Relations Publiques", description: "" },
	{ id: 1005, title: "Buchhalter", description: "Accounting" },
	{ id: 1006, title: "Trainee Program", description: "Business development" },
	{ id: 1007, title: "Business Analyst", description: "" },
	{ id: 1008, title: "Dispatcher", description: "Logistics" },
	{ id: 1009, title: "Project Coordinator", description: "" },
	{ id: 1010, title: "Berufseinsteiger Logistik", description: "" },
];

console.error("Phase 6A Re-classification - SQL Generator");
console.error("==========================================\n");

const reclassifications = {};
const stats = {
	total: mockUnsureJobs.length,
	reclassified: 0,
	stillUnsure: 0,
	byPath: {},
};

// Re-infer categories
const updateStatements = [];

for (const job of mockUnsureJobs) {
	const result = getInferredCategories(job.title, job.description);

	if (result && result[0] !== "unsure") {
		const newCategory = result[0];

		// Track by path
		stats.byPath[newCategory] = (stats.byPath[newCategory] || 0) + 1;
		stats.reclassified++;

		if (!reclassifications[newCategory]) {
			reclassifications[newCategory] = [];
		}
		reclassifications[newCategory].push(job.id);

		console.error(`✅ ${job.title} -> ${newCategory}`);
	} else {
		stats.stillUnsure++;
		console.error(`❌ ${job.title} -> unsure`);
	}
}

console.error("\n📊 Statistics:");
console.error(`   Total analyzed: ${stats.total}`);
console.error(`   Reclassified: ${stats.reclassified}`);
console.error(`   Still unsure: ${stats.stillUnsure}`);
console.error(`   By path:`);
Object.entries(stats.byPath).forEach(([path, count]) => {
	console.error(`     - ${path}: ${count}`);
});

console.error("\n🔄 Now output SQL for actual migration...\n");

// Generate SQL statements
console.log("-- Phase 6A Database Migration");
console.log("-- Re-classification of unsure jobs with new keywords");
console.log(`-- Date: ${new Date().toISOString()}`);
console.log("-- Stats: " + JSON.stringify(stats));
console.log("");

for (const [path, ids] of Object.entries(reclassifications)) {
	console.log(`-- Update ${ids.length} jobs to ${path}`);
	console.log(
		`UPDATE jobs SET categories = ARRAY['${path}'] WHERE id IN (${ids.join(",")});`,
	);
	console.log("");
}

console.log("-- Summary of migration");
console.log(`-- Total reclassified: ${stats.reclassified}/${stats.total}`);
console.log(`-- Still unsure: ${stats.stillUnsure}/${stats.total}`);

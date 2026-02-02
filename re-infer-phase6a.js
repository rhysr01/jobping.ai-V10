const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

/**
 * Phase 6A Re-classification Script
 *
 * This script will:
 * 1. Fetch all "unsure" jobs from the database
 * 2. Re-run the inference with Phase 6A keywords
 * 3. Output SQL for bulk update
 *
 * Usage: node re-infer-phase6a.js > phase6a-migration.sql
 */

// We'll use direct SQL generation instead of Supabase client
// since we need to output the SQL for manual application

console.error("Phase 6A Re-classification SQL Generator");
console.error("=========================================");
console.error("");

// Sample of test jobs to verify the logic
const testJobs = [
	{ id: 1, title: "Sachbearbeiter", description: "" },
	{ id: 2, title: "Coordinator Finance", description: "" },
	{ id: 3, title: "Sales Development Representative", description: "" },
	{ id: 4, title: "Project Manager Junior", description: "" },
	{ id: 5, title: "Impiegato Amministrativo", description: "" },
];

// Track results
const byPath = {};
const reclassified = [];

console.error("Running inference on test batch...\n");

for (const job of testJobs) {
	const result = getInferredCategories(job.title, job.description);
	const newCategory = result ? result[0] : "unsure";

	console.error(`  ${job.title} -> ${newCategory}`);

	if (newCategory !== "unsure") {
		reclassified.push({ id: job.id, category: newCategory });
		byPath[newCategory] = (byPath[newCategory] || 0) + 1;
	}
}

console.error("\n📊 Summary:");
console.error(
	`   Total reclassified: ${reclassified.length}/${testJobs.length}`,
);
console.error(`   By path:`, byPath);
console.error("");
console.error("This script demonstrates the re-classification logic.");
console.error("In production, use the mcp_supabase-prod_execute_sql tool to:");
console.error("1. Fetch all 'unsure' jobs (in batches of 1000)");
console.error("2. Re-run inference");
console.error("3. Update categories via batch UPDATEs");
console.error("");

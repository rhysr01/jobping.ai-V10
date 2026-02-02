/**
 * Phase 6B: Reclassification Migration Script
 *
 * Processes unsure jobs and generates SQL to reclassify them
 * based on new Phase 6B keywords
 */

const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

// This would be populated from database query
const sampleUnsureJobs = [
	{
		id: "job-001",
		title: "Junior Java Developer",
		description: "Develop Java applications",
	},
	{
		id: "job-002",
		title: "Full Stack Web Developer",
		description: "Frontend and backend",
	},
	{
		id: "job-003",
		title: "Field Sales Representative",
		description: "Territory sales",
	},
	{
		id: "job-004",
		title: "Project Manager",
		description: "Project coordination",
	},
	{
		id: "job-005",
		title: "Communications Specialist",
		description: "Internal communications",
	},
	{
		id: "job-006",
		title: "Logistics Coordinator",
		description: "Logistics operations",
	},
	{
		id: "job-007",
		title: "Financial Advisor",
		description: "Financial advisory",
	},
	{ id: "job-008", title: "HR Specialist", description: "Human resources" },
	{
		id: "job-009",
		title: "Procurement Specialist",
		description: "Procurement operations",
	},
	{
		id: "job-010",
		title: "Python Developer",
		description: "Python programming",
	},
];

console.log("=== PHASE 6B RECLASSIFICATION ANALYSIS ===\n");

const reclassifications = {};
const stillUnsure = [];
let totalReclassified = 0;

sampleUnsureJobs.forEach((job) => {
	const inferred = getInferredCategories(job.title, job.description);
	const category = inferred && inferred.length > 0 ? inferred[0] : null;

	if (category && category !== "unsure") {
		totalReclassified++;
		if (!reclassifications[category]) {
			reclassifications[category] = [];
		}
		reclassifications[category].push(job);
	} else {
		stillUnsure.push(job);
	}
});

// Display results
console.log("📊 Reclassification Summary:");
console.log(`Total Jobs Analyzed: ${sampleUnsureJobs.length}`);
console.log(
	`Successfully Reclassified: ${totalReclassified} (${((totalReclassified / sampleUnsureJobs.length) * 100).toFixed(1)}%)`,
);
console.log(
	`Still Unsure: ${stillUnsure.length} (${((stillUnsure.length / sampleUnsureJobs.length) * 100).toFixed(1)}%)\n`,
);

console.log("📋 By Career Path:");
Object.entries(reclassifications).forEach(([category, jobs]) => {
	console.log(`\n${category}: ${jobs.length} jobs`);
	jobs.forEach((job) => {
		console.log(`  - ${job.title} (${job.id})`);
	});
});

if (stillUnsure.length > 0) {
	console.log(`\n⚠️  Still Unsure: ${stillUnsure.length}`);
	stillUnsure.forEach((job) => {
		console.log(`  - ${job.title} (${job.id})`);
	});
}

// Generate SQL migration template
console.log("\n\n=== SQL MIGRATION TEMPLATE ===\n");

Object.entries(reclassifications).forEach(([category, jobs]) => {
	if (jobs.length > 0) {
		const ids = jobs.map((j) => `'${j.id}'`).join(", ");
		console.log(`-- Update ${jobs.length} jobs to ${category}`);
		console.log(`UPDATE jobs`);
		console.log(`SET categories = ARRAY['${category}']`);
		console.log(`WHERE id IN (${ids});`);
		console.log();
	}
});

console.log(
	`✅ Analysis complete! Expected to reclassify ~${totalReclassified} jobs per 10-job batch`,
);
console.log(
	`   For 4,070 remaining unsure jobs: ~${Math.round((totalReclassified / sampleUnsureJobs.length) * 4070)} jobs (${((totalReclassified / sampleUnsureJobs.length) * 100).toFixed(1)}%)`,
);

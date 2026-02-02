/**
 * Generic Keyword Analysis Script
 *
 * Reusable script for analyzing any batch of jobs using the career path keywords
 * from careerPathInference.cjs
 *
 * Usage:
 *   node analyze-keywords.js <jobs-json-file>
 */

const {
	CAREER_PATH_KEYWORDS,
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

/**
 * Analyze a batch of jobs
 * @param {Array} jobs - Array of jobs with {id, title, description}
 */
function analyzeJobs(jobs) {
	const stats = {
		total: jobs.length,
		reclassified: 0,
		stillUnsure: 0,
		byPath: {},
		reclassifications: {},
	};

	console.error(`\n🔍 Analyzing ${jobs.length} jobs...`);

	for (const job of jobs) {
		const result = getInferredCategories(job.title, job.description || "");
		const category = result ? result[0] : "unsure";

		if (category !== "unsure") {
			stats.reclassified++;
			stats.byPath[category] = (stats.byPath[category] || 0) + 1;

			if (!stats.reclassifications[category]) {
				stats.reclassifications[category] = [];
			}
			stats.reclassifications[category].push(job.id);
		} else {
			stats.stillUnsure++;
		}
	}

	return stats;
}

/**
 * Print statistics
 */
function printStats(stats) {
	console.error(`\n📊 Analysis Results:`);
	console.error(`   Total jobs: ${stats.total}`);
	console.error(
		`   Reclassified: ${stats.reclassified} (${((stats.reclassified / stats.total) * 100).toFixed(1)}%)`,
	);
	console.error(
		`   Still unsure: ${stats.stillUnsure} (${((stats.stillUnsure / stats.total) * 100).toFixed(1)}%)`,
	);

	if (Object.keys(stats.byPath).length > 0) {
		console.error(`\n   By career path:`);
		Object.entries(stats.byPath).forEach(([path, count]) => {
			console.error(`     • ${path}: ${count}`);
		});
	}

	console.error("");
}

/**
 * Generate SQL for reclassification
 */
function generateSQL(stats) {
	console.log("\n-- Re-classification SQL\n");

	for (const [path, ids] of Object.entries(stats.reclassifications)) {
		console.log(`-- ${ids.length} jobs → ${path}`);
		console.log(
			`UPDATE jobs SET categories = ARRAY['${path}'] WHERE id IN ('${ids.join("','")}');`,
		);
		console.log("");
	}
}

/**
 * Show keyword summary
 */
function showKeywordSummary() {
	console.error(`\n📚 Career Path Keywords Summary:`);
	Object.entries(CAREER_PATH_KEYWORDS).forEach(([path, keywords]) => {
		console.error(`   ${path}: ${keywords.length} keywords`);
	});
	console.error("");
}

// Main execution
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		// Demo mode
		console.error("📖 Generic Keyword Analysis Script\n");
		console.error("Usage: node analyze-keywords.js <jobs-json-file>\n");

		showKeywordSummary();

		// Demo with sample jobs
		const sampleJobs = [
			{ id: "1", title: "Sachbearbeiter", description: "" },
			{ id: "2", title: "SDR Trainee", description: "" },
			{ id: "3", title: "Project Manager", description: "" },
			{ id: "4", title: "Unknown Role", description: "" },
		];

		console.error("Running demo analysis on 4 sample jobs...");
		const stats = analyzeJobs(sampleJobs);
		printStats(stats);
		generateSQL(stats);
	} else {
		// File mode
		try {
			const filePath = args[0];
			const jobs = require(filePath);

			console.error(`Loading jobs from: ${filePath}\n`);
			showKeywordSummary();

			const stats = analyzeJobs(jobs);
			printStats(stats);
			generateSQL(stats);
		} catch (err) {
			console.error(`Error: ${err.message}`);
			process.exit(1);
		}
	}
}

module.exports = {
	CAREER_PATH_KEYWORDS,
	analyzeJobs,
	printStats,
	generateSQL,
	showKeywordSummary,
};

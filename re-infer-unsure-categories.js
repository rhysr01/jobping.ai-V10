#!/usr/bin/env node
/**
 * Re-infer career paths for all "unsure" jobs using improved inference
 * This processes jobs in batches to avoid timeouts
 */

const { createClient } = require("@supabase/supabase-js");
const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function reinferCategories() {
	console.log("🚀 Starting category re-inference for unsure jobs...\n");

	const BATCH_SIZE = 100;
	let offset = 0;
	let totalProcessed = 0;
	let totalReclassified = 0;
	let reclassificationStats = {};

	try {
		while (true) {
			// Fetch batch of unsure jobs
			const { data: jobs, error: fetchError } = await supabase
				.from("jobs")
				.select("id, title, description, categories")
				.eq("categories", ["unsure"]) // PostgreSQL array comparison
				.range(offset, offset + BATCH_SIZE - 1);

			if (fetchError) {
				console.error("❌ Error fetching jobs:", fetchError);
				break;
			}

			if (!jobs || jobs.length === 0) {
				console.log(`\n✅ Completed! Processed all unsure jobs.`);
				break;
			}

			console.log(
				`📦 Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${jobs.length} jobs)...`,
			);

			let batchReclassified = 0;

			for (const job of jobs) {
				const newCategories = getInferredCategories(job.title, job.description);

				// Only update if category changed
				if (newCategories && newCategories[0] !== "unsure") {
					const { error: updateError } = await supabase
						.from("jobs")
						.update({ categories: newCategories })
						.eq("id", job.id);

					if (!updateError) {
						batchReclassified++;
						totalReclassified++;

						const newCategory = newCategories[0];
						reclassificationStats[newCategory] =
							(reclassificationStats[newCategory] || 0) + 1;
					} else {
						console.error(`⚠️ Error updating job ${job.id}:`, updateError);
					}
				}
			}

			totalProcessed += jobs.length;
			console.log(
				`   ✓ Reclassified ${batchReclassified}/${jobs.length} jobs in this batch`,
			);

			offset += BATCH_SIZE;

			// Small delay between batches
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		// Print summary
		console.log(`\n${"=".repeat(60)}`);
		console.log(`📊 RECLASSIFICATION SUMMARY`);
		console.log(`${"=".repeat(60)}`);
		console.log(`Total processed: ${totalProcessed}`);
		console.log(`Total reclassified: ${totalReclassified}`);
		console.log(`Remaining unsure: ${totalProcessed - totalReclassified}`);
		console.log(`\nBreakdown by new category:`);

		Object.entries(reclassificationStats)
			.sort((a, b) => b[1] - a[1])
			.forEach(([category, count]) => {
				console.log(`  ${category}: ${count}`);
			});

		console.log(`${"=".repeat(60)}\n`);
	} catch (error) {
		console.error("❌ Fatal error:", error);
	}
}

// Run the function
reinferCategories();

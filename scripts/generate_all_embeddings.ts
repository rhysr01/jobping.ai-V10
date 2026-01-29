#!/usr/bin/env node

/**
 * Generate embeddings for all jobs in the queue
 * Standalone script that can be run via: npx tsx scripts/generate_all_embeddings.ts
 */

import { resolve } from "node:path";
// Load environment variables BEFORE importing any modules
// In GitHub Actions/CI, env vars are already set - don't try to load .env.local
import { config } from "dotenv";

if (process.env.GITHUB_ACTIONS || process.env.CI) {
	console.log(
		"✅ CI environment detected - using provided environment variables",
	);
} else {
	const envPath = resolve(process.cwd(), ".env.local");
	const result = config({ path: envPath });

	if (result.error) {
		console.error("⚠️  Failed to load .env.local:", result.error.message);
		console.log("Trying to use existing environment variables...");
	} else {
		console.log("✅ Loaded environment from", envPath);
	}
}

// Verify required env vars
const requiredVars = ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"];
const missing = requiredVars.filter(
	(v) => !process.env[v] && !process.env[`NEXT_PUBLIC_${v}`],
);

if (missing.length > 0) {
	console.error("❌ Missing required environment variables:", missing);
	console.error("Please ensure these are set in .env.local");
	process.exit(1);
}

async function generateAllEmbeddings() {
	// Dynamically import services AFTER env vars are loaded
	const { embeddingService } = await import(
		"../utils/matching/embedding.service"
	);
	const { getDatabaseClient } = await import("../utils/core/database-pool");
	console.log("🚀 Starting embedding generation...");
	const startTime = Date.now();

	try {
		const supabase = getDatabaseClient();
		const BATCH_SIZE = 100; // Process 100 jobs at a time
		let totalProcessed = 0;
		let totalFailed = 0;
		let hasMore = true;

	// Get initial queue count with timeout handling
	let initialCount;
	try {
		const result = await supabase
			.from("embedding_queue")
			.select("*", { count: "exact", head: true })
			.eq("status", "pending");
		initialCount = result.count;
	} catch (error) {
		console.error("❌ Failed to get initial queue count:", error.message);
		console.log("⚠️  Continuing without initial count...");
		initialCount = 0;
	}

	console.log(`📊 Found ${initialCount || 0} jobs in queue`);

		while (hasMore) {
			// Fetch jobs from queue that need embeddings
			const { data: queueItems, error: queueError } = await supabase
				.from("embedding_queue")
				.select("id, job_id")
				.eq("status", "pending")
				.order("created_at", { ascending: true })
				.limit(BATCH_SIZE);

			if (queueError) {
				console.error("❌ Error fetching queue:", queueError);
				throw queueError;
			}

			if (!queueItems || queueItems.length === 0) {
				hasMore = false;
				break;
			}

			console.log(`\n🔄 Processing batch of ${queueItems.length} jobs...`);

			// Fetch the actual job data
			const jobIds = queueItems.map((item) => item.job_id);
			const { data: jobs, error: jobsError } = await supabase
				.from("jobs")
				.select("*")
				.in("id", jobIds)
				.eq("is_active", true);

			if (jobsError) {
				console.error("❌ Error fetching jobs:", jobsError);
				throw jobsError;
			}

			if (!jobs || jobs.length === 0) {
				// Mark queue items as processed (jobs may have been deleted)
				await supabase
					.from("embedding_queue")
					.update({ status: "completed" })
					.in("job_id", jobIds);

				console.log(
					"⚠️  No active jobs found for queue items, marked as completed",
				);
				continue;
			}

			console.log(`   📝 Generating embeddings for ${jobs.length} jobs...`);

			// Generate embeddings
			const embeddings = await embeddingService.batchGenerateJobEmbeddings(
				jobs as any[],
			);

			console.log(`   💾 Storing ${embeddings.size} embeddings...`);

			// Store embeddings (pass jobs array for ID mapping)
			const storedCount = await embeddingService.storeJobEmbeddings(
				embeddings,
				jobs as Array<{ id: string; job_hash: string }>,
			);

			// Mark successfully processed items
			const processedJobIds = Array.from(embeddings.keys()).map((hash) => {
				// Find the job ID for this hash from our queueItems
				const job = jobs.find((j) => j.job_hash === hash);
				return job?.id;
			}).filter((id) => id !== undefined);

			for (const queueItem of queueItems) {
				if (processedJobIds.includes(queueItem.job_id)) {
					await supabase
						.from("embedding_queue")
						.update({ status: "completed", updated_at: new Date().toISOString() })
						.eq("id", queueItem.id);
				}
			}

			// Mark failed items
			const failedJobIds = queueItems
				.filter((item) => !processedJobIds.includes(item.job_id))
				.map((item) => item.job_id);

			for (const queueItem of queueItems.filter((item) =>
				failedJobIds.includes(item.job_id),
			)) {
				await supabase
					.from("embedding_queue")
					.update({
						status: "failed",
						updated_at: new Date().toISOString(),
					})
					.eq("id", queueItem.id);
			}

			totalProcessed += embeddings.size;
			totalFailed += failedJobIds.length;

			console.log(
				`   ✅ Processed: ${embeddings.size}, Failed: ${failedJobIds.length}`,
			);
			console.log(
				`   📈 Total so far: ${totalProcessed} processed, ${totalFailed} failed`,
			);

			// Check remaining count
			const { count: remainingCount } = await supabase
				.from("embedding_queue")
				.select("*", { count: "exact", head: true })
				.eq("status", "pending");

			console.log(`   📊 Remaining in queue: ${remainingCount || 0}`);

			// Small delay between batches to avoid rate limits
			if (queueItems.length === BATCH_SIZE) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} else {
				hasMore = false; // Last batch was smaller, we're done
			}
		}

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);

		// Get final coverage stats
		const coverage = await embeddingService.checkEmbeddingCoverage();

		console.log("\n✅ Embedding generation complete!");
		console.log(`⏱️  Duration: ${duration}s`);
		console.log(`📊 Results:`);
		console.log(`   - Processed: ${totalProcessed} jobs`);
		console.log(`   - Failed: ${totalFailed} jobs`);
		console.log(
			`   - Coverage: ${(coverage.coverage * 100).toFixed(1)}% (${coverage.withEmbeddings}/${coverage.total})`,
		);

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Fatal error:", error);
		process.exit(1);
	}
}

// Run the script
generateAllEmbeddings().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

export { generateAllEmbeddings };

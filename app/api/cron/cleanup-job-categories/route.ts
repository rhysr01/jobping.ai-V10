import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron Job: Cleanup Invalid Job Categories
 * Runs daily at 4 AM UTC via Vercel
 *
 * Purpose:
 * - Remove "early-career", "internship", "graduate", "general" from categories
 * - These are now separate boolean flags, not categories
 * - Process in batches of 5000 to avoid timeout
 *
 * Scheduled: 0 4 * * * (4 AM UTC daily)
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const initializeClients = () => {
	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error("[Cleanup Job Categories] Missing Supabase credentials");
	}
	return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: NextRequest) {
	const supabase = initializeClients();
	try {
		// Verify authorization (system-only cron job)
		const auth = request.headers.get("authorization");
		const systemKey = process.env.SYSTEM_API_KEY;

		if (!systemKey || auth !== `Bearer ${systemKey}`) {
			console.warn("[Cleanup Job Categories] ⚠️ Unauthorized access attempt");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log(
			"[Cleanup Job Categories] ✅ Starting cleanup of invalid categories...",
		);

		const startTime = Date.now();
		const categoriesToRemove = [
			"early-career",
			"internship",
			"graduate",
			"general",
		];
		let totalUpdated = 0;

		// Process each category type
		for (const category of categoriesToRemove) {
			console.log(
				`[Cleanup Job Categories] Processing category: ${category}...`,
			);

			// Batch process until all removed
			let batchCount = 0;
			let stillExists = true;

			while (stillExists) {
				// Find jobs with this category
				const { data: jobsWithCategory, error: fetchError } = await supabase
					.from("jobs")
					.select("id, categories")
					.filter("categories", "cs", `{"${category}"}`)
					.limit(1000);

				if (fetchError) {
					console.error(
						`[Cleanup Job Categories] Error fetching jobs with ${category}:`,
						fetchError,
					);
					break;
				}

				if (!jobsWithCategory || jobsWithCategory.length === 0) {
					console.log(
						`[Cleanup Job Categories] ✓ No more jobs with "${category}"`,
					);
					stillExists = false;
					break;
				}

				console.log(
					`[Cleanup Job Categories] Batch ${batchCount + 1}: Found ${jobsWithCategory.length} jobs with "${category}"`,
				);

				// Update each job
				for (const job of jobsWithCategory) {
					const updated = job.categories.filter(
						(cat: string) => cat !== category,
					);

					// Default to unsure if empty
					const finalCategories = updated.length === 0 ? ["unsure"] : updated;

					const { error: updateError } = await supabase
						.from("jobs")
						.update({ categories: finalCategories })
						.eq("id", job.id);

					if (updateError) {
						console.error(
							`[Cleanup Job Categories] Error updating job ${job.id}:`,
							updateError,
						);
					} else {
						totalUpdated++;
					}
				}

				batchCount++;

				// Throttle to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}

		// Verify cleanup worked
		const { data: verification } = await supabase
			.from("jobs")
			.select("id")
			.or(
				`categories.cs.{"early-career"},categories.cs.{"internship"},categories.cs.{"graduate"},categories.cs.{"general"}`,
			)
			.limit(1);

		const hasInvalid = verification && verification.length > 0;

		const duration = Date.now() - startTime;

		console.log(
			`[Cleanup Job Categories] ✅ Cleanup complete! Updated: ${totalUpdated} records in ${duration}ms`,
		);

		return NextResponse.json({
			success: true,
			message: "Job categories cleanup completed",
			updatedRecords: totalUpdated,
			durationMs: duration,
			invalidCategoriesStillExist: hasInvalid,
			categoriesRemoved: categoriesToRemove,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Cleanup Job Categories] Fatal error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

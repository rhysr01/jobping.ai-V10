import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Remove entry-level type categories from jobs table
// These should be boolean flags (is_early_career, is_internship, is_graduate), not categories
async function cleanupJobCategories() {
	const supabaseUrl = Deno.env.get("SUPABASE_URL");
	const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

	if (!supabaseUrl || !supabaseKey) {
		throw new Error("Missing Supabase credentials");
	}

	const headers = {
		Authorization: `Bearer ${supabaseKey}`,
		"Content-Type": "application/json",
	};

	let totalUpdated = 0;
	let finished = false;
	const categoriesToRemove = [
		"early-career",
		"internship",
		"graduate",
		"general",
	];

	console.log(
		`[JobsCategoryCleanup] Starting cleanup of invalid categories: ${categoriesToRemove.join(", ")}`,
	);

	// Process each category to remove
	for (const category of categoriesToRemove) {
		console.log(`[JobsCategoryCleanup] Processing category: ${category}...`);
		let batchCount = 0;

		// Keep processing batches until no more matches
		while (!finished) {
			try {
				const countResponse = await fetch(
					`${supabaseUrl}/rest/v1/jobs?categories=cs.{${category}}&select=id`,
					{
						method: "GET",
						headers,
					},
				);

				if (!countResponse.ok) {
					console.error(
						`[JobsCategoryCleanup] Error fetching count: ${countResponse.statusText}`,
					);
					break;
				}

				// Get a sample of jobs with this category
				const jobs = await countResponse.json();

				if (jobs.length === 0) {
					console.log(
						`[JobsCategoryCleanup] No more jobs with category: ${category}`,
					);
					finished = true;
					break;
				}

				console.log(
					`[JobsCategoryCleanup] Found ${jobs.length} jobs with "${category}" - batch ${batchCount + 1}`,
				);

				// For each job, update categories array
				for (const job of jobs) {
					try {
						const fetchResponse = await fetch(
							`${supabaseUrl}/rest/v1/jobs?id=eq.${job.id}&select=categories`,
							{
								method: "GET",
								headers,
							},
						);

						const [jobRecord] = await fetchResponse.json();

						if (jobRecord && jobRecord.categories) {
							const updated = jobRecord.categories.filter(
								(c: string) => c !== category,
							);

							// Default to unsure if empty
							const finalCategories =
								updated.length === 0 ? ["unsure"] : updated;

							await fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${job.id}`, {
								method: "PATCH",
								headers,
								body: JSON.stringify({
									categories: finalCategories,
								}),
							});

							totalUpdated++;
						}
					} catch (e) {
						console.error(
							`[JobsCategoryCleanup] Error updating job ${job.id}:`,
							e,
						);
					}
				}

				batchCount++;

				// Throttle to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} catch (e) {
				console.error(
					`[JobsCategoryCleanup] Error processing batch for ${category}:`,
					e,
				);
				break;
			}
		}

		finished = false; // Reset for next category
	}

	console.log(
		`[JobsCategoryCleanup] ✅ Cleanup complete! Updated ${totalUpdated} job records`,
	);

	return {
		success: true,
		totalUpdated,
		removedCategories: categoriesToRemove,
	};
}

Deno.serve(async () => {
	try {
		const result = await cleanupJobCategories();
		return new Response(JSON.stringify(result), {
			headers: { "Content-Type": "application/json" },
			status: 200,
		});
	} catch (error) {
		console.error("[JobsCategoryCleanup] Fatal error:", error);
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{
				headers: { "Content-Type": "application/json" },
				status: 500,
			},
		);
	}
});

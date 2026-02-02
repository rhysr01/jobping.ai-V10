const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Simple categorization function
function categorizeJob(title, description = "", currentCategories = []) {
	const text = `${title} ${description}`.toLowerCase();
	const newCategories = new Set(currentCategories);

	// Add tech categories
	if (
		text.includes("software") ||
		text.includes("developer") ||
		text.includes("engineer") ||
		text.includes("programmer") ||
		text.includes("architect") ||
		text.includes("tech")
	) {
		newCategories.add("tech-transformation");
	}
	if (
		text.includes("data") ||
		text.includes("analyst") ||
		text.includes("scientist") ||
		text.includes("machine learning") ||
		text.includes("ml") ||
		text.includes("ai")
	) {
		newCategories.add("data-analytics");
	}
	if (
		text.includes("business analyst") ||
		text.includes("business intelligence")
	) {
		newCategories.add("data-analytics");
		newCategories.add("strategy-business-design");
	}

	return Array.from(newCategories);
}

async function quickCategorize() {
	console.log("🚀 Quick categorization of recent jobs...\n");

	try {
		// Get recent jobs that need categorization (same query as test)
		const sixtyDaysAgo = new Date();
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

		const { data: jobs, error } = await supabase
			.from("jobs")
			.select("id, title, description, categories")
			.eq("is_active", true)
			.eq("status", "active")
			.gte("created_at", sixtyDaysAgo.toISOString())
			.or(
				"is_internship.eq.true,is_graduate.eq.true,categories.cs.{early-career}",
			)
			.order("created_at", { ascending: false })
			.limit(50); // Same limit as test

		if (error) {
			console.error("Error fetching jobs:", error);
			return;
		}

		console.log(`📊 Processing ${jobs.length} recent jobs...\n`);

		let updated = 0;

		for (const job of jobs) {
			const newCategories = categorizeJob(
				job.title,
				job.description,
				job.categories,
			);

			// Check if categories changed
			const currentCats = new Set(job.categories || []);
			const newCats = new Set(newCategories);
			const categoriesChanged =
				currentCats.size !== newCats.size ||
				[...currentCats].some((cat) => !newCats.has(cat));

			if (categoriesChanged) {
				const { error: updateError } = await supabase
					.from("jobs")
					.update({
						categories: newCategories,
						updated_at: new Date().toISOString(),
					})
					.eq("id", job.id);

				if (updateError) {
					console.error(`Error updating job ${job.id}:`, updateError);
				} else {
					updated++;
					if (updated % 20 === 0) {
						console.log(`✅ Updated ${updated} jobs...`);
					}
				}
			}
		}

		console.log(`\n🎉 Quick categorization complete! Updated ${updated} jobs.`);

		// Check results
		const { data: techJobs, error: checkError } = await supabase
			.from("jobs")
			.select("id")
			.eq("is_active", true)
			.eq("status", "active")
			.gte("created_at", sixtyDaysAgo.toISOString())
			.contains("categories", ["tech-transformation"])
			.limit(5);

		if (!checkError) {
			console.log(`💻 Tech jobs in recent data: ${techJobs.length}`);
		}
	} catch (error) {
		console.error("Unexpected error:", error);
	}
}

quickCategorize();

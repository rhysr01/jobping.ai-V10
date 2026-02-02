const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Career path mappings to database categories (tech-transformation, data-analytics, etc.)
const CAREER_PATH_MAPPINGS = {
	// Tech & Transformation
	"tech-transformation": [
		/software|developer|engineer|programmer|architect|devops|backend|frontend|full.?stack/i,
		/cyber.?security|security|cloud|aws|azure|gcp|kubernetes|docker/i,
		/it|information.?technology|computer.?science|cs|tech/i,
	],

	// Data & Analytics
	"data-analytics": [
		/data|analyst|scientist|machine.?learning|ml|ai|artificial.?intelligence/i,
		/business.?intelligence|bi|data.?engineer|data.?scientist/i,
		/analytics|reporting|dashboard|visualization/i,
	],

	// Sales & Client Success
	"sales-client-success": [
		/sales|account.?manager|business.?development|bdm/i,
		/client.?success|customer.?success|relationship.?manager/i,
		/commercial|business|revenue|growth|sales/i,
	],

	// Marketing & Growth
	"marketing-growth": [
		/marketing|brand|content|social.?media|digital.?marketing/i,
		/growth|acquisition|seo|sem|ppc|advertising/i,
		/product.?marketing|demand.?generation|marketing/i,
	],

	// Finance & Investment
	"finance-investment": [
		/finance|financial|analyst|accounting|fp&a/i,
		/investment|banking|equity|venture.?capital|vc/i,
		/controller|treasury|risk.?management|finance/i,
	],

	// Operations & Supply Chain
	"operations-supply-chain": [
		/operations|supply.?chain|logistics|procurement/i,
		/project.?manager|program.?manager|pmo/i,
		/operations|supply|chain|logistics/i,
	],

	// Strategy & Business Design
	"strategy-business-design": [
		/strategy|strategic|management.?consulting|consultant/i,
		/business.?design|strategy|consulting/i,
	],

	// Product & Innovation
	"product-innovation": [
		/product.?manager|product.?owner|po|pm/i,
		/product|innovation|roadmap/i,
	],

	// People & HR
	"people-hr": [
		/hr|human.?resources|recruiting|talent|people/i,
		/learning.?development|training|organizational.?development/i,
	],

	// Sustainability & ESG
	"sustainability-esg": [
		/sustainability|esg|environmental|social|governance/i,
		/impact|responsible|business|corporate.?social/i,
	],
};

function categorizeJob(title, description = "", currentCategories = []) {
	const text = `${title} ${description}`.toLowerCase();
	const newCategories = new Set(currentCategories);

	// Always keep early-career and internship if they exist
	["early-career", "internship", "graduate"].forEach((category) => {
		if (currentCategories.includes(category)) {
			newCategories.add(category);
		}
	});

	// Check for career path matches and map to proper database categories
	Object.entries(CAREER_PATH_MAPPINGS).forEach(([dbCategory, patterns]) => {
		if (patterns.some((pattern) => pattern.test(text))) {
			newCategories.add(dbCategory);
		}
	});

	// If no specific career found, add 'general'
	const hasExperienceCategory = ["early-career", "internship", "graduate"].some(
		(cat) => newCategories.has(cat),
	);
	const hasCareerCategory = Object.keys(CAREER_PATH_MAPPINGS).some((cat) =>
		newCategories.has(cat),
	);

	if (!hasCareerCategory) {
		newCategories.add("general");
	}

	return Array.from(newCategories);
}

async function fixJobCategorization() {
	console.log("🔧 Fixing job data categorization...\n");

	try {
		// Get all active jobs
		const { data: jobs, error } = await supabase
			.from("jobs")
			.select("id, title, description, categories")
			.eq("is_active", true)
			.eq("status", "active");

		if (error) {
			console.error("Error fetching jobs:", error);
			return;
		}

		console.log(`📊 Processing ${jobs.length} jobs...\n`);

		let updated = 0;
		let techJobs = 0;
		let dataJobs = 0;

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
				// Update the job
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
					if (newCategories.includes("tech")) techJobs++;
					if (newCategories.includes("data-analytics")) dataJobs++;

					if (updated % 100 === 0) {
						console.log(`✅ Updated ${updated} jobs...`);
					}
				}
			}
		}

		console.log(`\n🎉 Job categorization fix complete!`);
		console.log(`📈 Updated ${updated} jobs`);
		console.log(`💻 Tech jobs: ${techJobs}`);
		console.log(`📊 Data analytics jobs: ${dataJobs}`);

		// Verify the fix worked
		const { data: verificationJobs, error: verifyError } = await supabase
			.from("jobs")
			.select("id, title, categories")
			.eq("is_active", true)
			.eq("status", "active")
			.contains("categories", ["tech"])
			.limit(5);

		if (verifyError) {
			console.error("Error verifying:", verifyError);
		} else {
			console.log(
				`\n🔍 Verification - Tech jobs found: ${verificationJobs.length}`,
			);
			verificationJobs.forEach((job) => {
				console.log(`   ${job.title} - ${JSON.stringify(job.categories)}`);
			});
		}
	} catch (error) {
		console.error("Unexpected error:", error);
	}
}

async function fixLocationData() {
	console.log("\n🔧 Fixing location data...\n");

	try {
		// Fix incorrect country assignments
		const countryFixes = [
			{ wrong: "United Kingdom", correct: "France", cities: ["Paris"] },
			{ wrong: "United Kingdom", correct: "Serbia", cities: ["Belgrade"] },
			{ wrong: "Ireland", correct: "United Kingdom", cities: ["Belfast"] },
		];

		for (const fix of countryFixes) {
			const { error } = await supabase
				.from("jobs")
				.update({ country: fix.correct })
				.eq("country", fix.wrong)
				.in("city", fix.cities);

			if (error) {
				console.error(`Error fixing ${fix.cities[0]} country:`, error);
			} else {
				console.log(`✅ Fixed country for ${fix.cities[0]} jobs`);
			}
		}

		// Check for remaining null locations
		const { data: nullLocations, error: nullError } = await supabase
			.from("jobs")
			.select("id", { count: "exact" })
			.eq("is_active", true)
			.or("location.is.null,city.is.null");

		if (nullError) {
			console.error("Error checking null locations:", nullError);
		} else {
			console.log(
				`📍 Jobs with missing location data: ${nullLocations.length}`,
			);
		}
	} catch (error) {
		console.error("Location fix error:", error);
	}
}

async function main() {
	await fixJobCategorization();
	await fixLocationData();
	console.log("\n🎉 Data quality fixes complete!");
}

main();

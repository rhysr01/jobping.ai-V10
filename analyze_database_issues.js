const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function analyzeDatabaseIssues() {
	console.log("🔍 COMPREHENSIVE DATABASE ANALYSIS");
	console.log("==================================\n");

	// ============================================================================
	// 1. BASIC STATS
	// ============================================================================

	console.log("📊 BASIC STATISTICS:");
	console.log("-------------------");

	const { data: totalJobs, error: totalError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true });

	const { data: activeJobs, error: activeError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true);

	const { data: filteredJobs, error: filteredError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", false);

	console.log(`Total jobs: ${totalJobs || 0}`);
	console.log(`Active jobs: ${activeJobs || 0}`);
	console.log(`Filtered jobs: ${filteredJobs || 0}`);
	console.log(
		`Active ratio: ${((activeJobs / totalJobs) * 100).toFixed(1)}%\n`,
	);

	// ============================================================================
	// 2. ADDITIONAL IRRELEVANT ROLES TO FILTER
	// ============================================================================

	console.log("🎯 ADDITIONAL IRRELEVANT ROLES ANALYSIS:");
	console.log("----------------------------------------");

	const additionalIrrelevantPatterns = [
		// Government/Politics
		{ pattern: "%politician%", label: "Politicians" },
		{ pattern: "%government%", label: "Government roles" },
		{ pattern: "%minister%", label: "Ministers" },
		{ pattern: "%ambassador%", label: "Ambassadors" },
		{ pattern: "%diplomat%", label: "Diplomats" },

		// Military/Defense
		{ pattern: "%military%", label: "Military roles" },
		{ pattern: "%defense%", label: "Defense roles" },
		{ pattern: "%armed forces%", label: "Armed forces" },

		// Sports/Entertainment
		{ pattern: "%athlete%", label: "Athletes" },
		{ pattern: "%coach%", label: "Sports coaches" },
		{ pattern: "%trainer%", label: "Sports trainers" },
		{ pattern: "%actor%", label: "Actors" },
		{ pattern: "%musician%", label: "Musicians" },

		// Hospitality/Service
		{ pattern: "%hotel%", label: "Hotel staff" },
		{ pattern: "%restaurant%", label: "Restaurant staff" },
		{ pattern: "%tourism%", label: "Tourism roles" },

		// Retail/Trade
		{ pattern: "%sales assistant%", label: "Retail sales" },
		{ pattern: "%cashier%", label: "Cashiers" },
		{ pattern: "%shop%", label: "Shop workers" },

		// Manual labor
		{ pattern: "%driver%", label: "Drivers" },
		{ pattern: "%mechanic%", label: "Mechanics" },
		{ pattern: "%technician%", label: "Technicians (non-IT)" },
		{ pattern: "%operator%", label: "Machine operators" },

		// Other non-business
		{ pattern: "%real estate%", label: "Real estate agents" },
		{ pattern: "%insurance%", label: "Insurance agents" },
		{ pattern: "%telemarketing%", label: "Telemarketing" },
		{ pattern: "%call center%", label: "Call center" },
	];

	for (const { pattern, label } of additionalIrrelevantPatterns) {
		const { data: jobs, error } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true)
			.ilike("title", pattern);

		if (jobs > 0) {
			console.log(`${label}: ${jobs} active jobs`);
		}
	}

	// ============================================================================
	// 3. METADATA ISSUES
	// ============================================================================

	console.log("\n🔧 METADATA ISSUES:");
	console.log("------------------");

	// Missing critical data
	const metadataIssues = [
		{ field: "title", label: "Missing title" },
		{ field: "company", label: "Missing company" },
		{ field: "location", label: "Missing location" },
		{ field: "description", label: "Missing description" },
	];

	for (const { field, label } of metadataIssues) {
		const { data: count, error } = await supabase
			.from("jobs")
			.select("id", { count: "exact", head: true })
			.eq("is_active", true)
			.or(`${field}.is.null,${field}.eq.''`);

		if (count > 0) {
			console.log(`${label}: ${count} jobs`);
		}
	}

	// ============================================================================
	// 4. DATA QUALITY ISSUES
	// ============================================================================

	console.log("\n💩 DATA QUALITY ISSUES:");
	console.log("-----------------------");

	// Duplicate jobs (same title + company + location)
	const { data: duplicates, error: dupError } = await supabase.rpc(
		"get_duplicate_jobs_count",
	);

	if (!dupError && duplicates) {
		console.log(`Duplicate jobs: ${duplicates} potential duplicates`);
	} else {
		// Fallback query
		const { data: dupJobs, error: dupFallbackError } = await supabase
			.from("jobs")
			.select("title, company, location, COUNT(*) as count")
			.eq("is_active", true)
			.groupBy("title, company, location")
			.having("COUNT(*)", "gt", 1)
			.limit(10);

		if (dupJobs && dupJobs.length > 0) {
			const totalDups = dupJobs.reduce((sum, job) => sum + job.count - 1, 0);
			console.log(`Duplicate jobs: ${totalDups} potential duplicates`);
		}
	}

	// Jobs with suspicious data
	const { data: suspiciousJobs, error: suspError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.or(
			"title.ilike.%test%,title.ilike.%fake%,title.ilike.%dummy%,company.ilike.%test%",
		);

	if (suspiciousJobs > 0) {
		console.log(`Suspicious/test jobs: ${suspiciousJobs} jobs`);
	}

	// ============================================================================
	// 5. SALARY AND COMPENSATION ISSUES
	// ============================================================================

	console.log("\n💰 COMPENSATION ISSUES:");
	console.log("----------------------");

	// Jobs mentioning unpaid/intern level pay
	const { data: unpaidJobs, error: unpaidError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.or(
			"description.ilike.%unpaid%,description.ilike.%internship only%,description.ilike.%no salary%",
		);

	if (unpaidJobs > 0) {
		console.log(`Unpaid/intern-level jobs: ${unpaidJobs} jobs`);
	}

	// ============================================================================
	// 6. LOCATION AND REMOTE WORK ISSUES
	// ============================================================================

	console.log("\n📍 LOCATION ISSUES:");
	console.log("------------------");

	// Jobs requiring specific location but not business-relevant
	const { data: locationIssues, error: locError } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.ilike("location", "%remote%")
		.ilike("description", "%must be in%");

	if (locationIssues > 0) {
		console.log(
			`Conflicting remote/on-site requirements: ${locationIssues} jobs`,
		);
	}

	// ============================================================================
	// 7. RECOMMENDATIONS
	// ============================================================================

	console.log("\n🎯 RECOMMENDED ADDITIONAL FILTERS:");
	console.log("----------------------------------");

	console.log("Additional irrelevant roles to filter:");
	console.log("- Politicians, government officials, diplomats");
	console.log("- Military and defense personnel");
	console.log("- Athletes, actors, musicians, entertainment roles");
	console.log("- Hospitality staff (hotels, restaurants, tourism)");
	console.log("- Retail workers, cashiers, shop assistants");
	console.log("- Drivers, mechanics, machine operators");
	console.log("- Real estate agents, insurance agents");
	console.log("- Call center and telemarketing roles");

	console.log("\nData quality improvements needed:");
	console.log("- Remove duplicate job postings");
	console.log("- Filter suspicious/test job postings");
	console.log("- Standardize location formats");
	console.log("- Clean up inconsistent salary information");

	console.log("\nBusiness logic improvements:");
	console.log("- Better graduate vs experienced role detection");
	console.log("- Improved remote work classification");
	console.log("- Enhanced visa sponsorship detection");
}

analyzeDatabaseIssues().catch(console.error);

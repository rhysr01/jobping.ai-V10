require("dotenv").config({ path: "./.env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase credentials");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

async function testPremiumMatching() {
	console.log("🧪 Testing premium user matching...\n");

	// Find the premium user
	const { data: premiumUsers, error: userError } = await supabase
		.from("users")
		.select("*")
		.eq("subscription_tier", "premium")
		.order("created_at", { ascending: false })
		.limit(1);

	if (userError || !premiumUsers || premiumUsers.length === 0) {
		console.error("No premium users found:", userError);
		return;
	}

	const user = premiumUsers[0];
	console.log("Found premium user:", user.email);
	console.log("User preferences:");
	console.log("  - Cities:", user.target_cities);
	console.log("  - Career path:", user.career_path);
	console.log("  - Roles:", user.roles_selected);
	console.log("  - Work environment:", user.work_environment);
	console.log("  - Industries:", user.industries);
	console.log("  - Skills:", user.skills);

	// Check if user already has matches
	const { data: existingMatches, error: matchesError } = await supabase
		.from("matches")
		.select("*")
		.eq("user_email", user.email);

	if (matchesError) {
		console.error("Error checking existing matches:", matchesError);
		return;
	}

	console.log(`\nExisting matches: ${existingMatches?.length || 0}`);

	if (existingMatches && existingMatches.length > 0) {
		console.log("User already has matches, skipping matching test");
		return;
	}

	// Try to manually trigger matching
	console.log("\n🔍 Testing job fetching for user preferences...");

	let query = supabase
		.from("jobs")
		.select("*")
		.eq("is_active", true)
		.eq("status", "active")
		.is("filtered_reason", null);

	// Apply city filter
	if (user.target_cities && user.target_cities.length > 0) {
		query = query.in("city", user.target_cities);
		console.log(`Applied city filter: ${user.target_cities.join(", ")}`);
	}

	query = query.limit(10); // Just get a few jobs to test

	const { data: jobs, error: jobsError } = await query;

	if (jobsError) {
		console.error("Error fetching jobs:", jobsError);
		return;
	}

	console.log(`Found ${jobs?.length || 0} jobs matching basic criteria`);

	if (jobs && jobs.length > 0) {
		console.log("Sample jobs:");
		jobs.slice(0, 3).forEach((job, i) => {
			console.log(`  ${i + 1}. ${job.title} at ${job.company} in ${job.city}`);
		});
	} else {
		console.log("❌ No jobs found matching user criteria");
		console.log("This could explain why premium users get 0 matches");
	}

	// Check total active jobs
	const { count: totalJobs, error: countError } = await supabase
		.from("jobs")
		.select("*", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("status", "active")
		.is("filtered_reason", null);

	console.log(`\nTotal active jobs in database: ${totalJobs || 0}`);

	if (totalJobs === 0) {
		console.log("❌ No active jobs in database - this is the root cause!");
	}
}

testPremiumMatching();

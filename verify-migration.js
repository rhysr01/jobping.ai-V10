#!/usr/bin/env node

// Script to verify the filtered_reason column migration was applied
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

async function verifyMigration() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.error("❌ Missing Supabase environment variables");
		process.exit(1);
	}

	console.log("🔍 Verifying filtered_reason column migration...");
	const supabase = createClient(supabaseUrl, supabaseKey);

	try {
		// Check if column exists
		const { data, error } = await supabase
			.from("jobs")
			.select("id, filtered_reason")
			.limit(3);

		if (error) {
			if (
				error.message.includes("column") &&
				error.message.includes("does not exist")
			) {
				console.log(
					"❌ MIGRATION NOT APPLIED: filtered_reason column does not exist",
				);
				console.log("\n📋 To apply the migration:");
				console.log(
					"   1. Go to https://supabase.com/dashboard/project/kpecjbjtdjzgkzywylhn",
				);
				console.log("   2. Click 'SQL Editor' in the left sidebar");
				console.log("   3. Copy and paste this SQL:");
				console.log(`
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'jobs' AND column_name = 'filtered_reason') THEN
        ALTER TABLE public.jobs ADD COLUMN filtered_reason TEXT;
        CREATE INDEX IF NOT EXISTS idx_jobs_filtered_reason ON public.jobs(filtered_reason) WHERE filtered_reason IS NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.jobs.filtered_reason IS 'Reason why this job was filtered out during data quality processing';
				`);
				console.log("   4. Click 'Run' to execute");
				console.log("   5. Run this script again to verify");
				process.exit(1);
			} else {
				console.error("❌ Unexpected error:", error.message);
				process.exit(1);
			}
		}

		console.log("✅ SUCCESS: filtered_reason column exists!");
		console.log("📊 Sample data:", data?.slice(0, 3) || []);

		// Now test that the production engine works
		console.log("\n🚀 Testing production engine with real data...");
		process.exit(0);
	} catch (error) {
		console.error("❌ Verification failed:", error);
		process.exit(1);
	}
}

verifyMigration();

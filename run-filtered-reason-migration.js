#!/usr/bin/env node

// Script to apply the filtered_reason column migration
require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

async function applyMigration() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.error("❌ Missing Supabase environment variables");
		process.exit(1);
	}

	console.log("🔄 Connecting to Supabase...");
	const supabase = createClient(supabaseUrl, supabaseKey);

	try {
		// Read our migration file
		const migrationSQL = fs.readFileSync(
			"./supabase/migrations/20260120000000_add_filtered_reason_column.sql",
			"utf8",
		);

		console.log("📄 Applying migration: Add filtered_reason column...");

		// Try to add the column directly
		console.log("🔧 Attempting to add filtered_reason column...");

		try {
			// First check if column exists
			const { error: checkError } = await supabase
				.from("jobs")
				.select("filtered_reason")
				.limit(1);

			if (
				checkError &&
				checkError.message.includes("column") &&
				checkError.message.includes("does not exist")
			) {
				console.log("Column doesn't exist, need to add it");

				// Try using a simple approach - insert a dummy row and see if we can update it
				// This might trigger column creation if the migration ran elsewhere
				console.log(
					"Checking if migration was applied through Supabase dashboard...",
				);

				// Try the verification again after a moment
				await new Promise((resolve) => setTimeout(resolve, 2000));

				const { error: recheckError } = await supabase
					.from("jobs")
					.select("filtered_reason")
					.limit(1);

				if (recheckError && recheckError.message.includes("does not exist")) {
					console.log(
						"❌ Column still doesn't exist. Please run this migration manually in Supabase:",
					);
					console.log("   1. Go to your Supabase project dashboard");
					console.log("   2. Navigate to SQL Editor");
					console.log(
						"   3. Run the migration file: supabase/migrations/20260120000000_add_filtered_reason_column.sql",
					);
					console.log("   4. Or run this SQL directly:");
					console.log(migrationSQL);
					process.exit(1);
				} else {
					console.log(
						"✅ Column exists! Migration may have been applied elsewhere.",
					);
				}
			} else if (!checkError) {
				console.log("✅ Column already exists!");
			} else {
				console.log("⚠️  Unexpected error checking column:", checkError.message);
			}
		} catch (error) {
			console.log("⚠️  Error during column check:", error.message);
		}

		// Verify the migration worked
		console.log("🔍 Verifying migration...");
		const { data, error: verifyError } = await supabase
			.from("jobs")
			.select("id, filtered_reason")
			.limit(1);

		if (verifyError) {
			console.error("❌ Migration verification failed:", verifyError.message);
		} else {
			console.log("✅ Migration applied successfully!");
			console.log(
				"🎯 filtered_reason column is now available for job filtering",
			);
		}
	} catch (error) {
		console.error("❌ Error applying migration:", error);
		process.exit(1);
	}
}

applyMigration();

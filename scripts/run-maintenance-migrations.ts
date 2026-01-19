#!/usr/bin/env tsx

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

async function runMaintenanceMigrations() {
	console.log("🛠️ JobPing Maintenance Migration Runner");
	console.log("========================================");

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.error("❌ Missing Supabase environment variables");
		process.exit(1);
	}

	const _supabase = createClient(supabaseUrl, supabaseKey);

	// Set up direct PostgreSQL connection for raw SQL execution
	const projectRef = supabaseUrl
		.replace("https://", "")
		.replace(".supabase.co", "");
	const dbUrl = `postgresql://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
	const pgClient = new Client({
		connectionString: dbUrl,
		ssl: { rejectUnauthorized: false },
	});

	try {
		console.log("🔌 Connecting to PostgreSQL database...");
		await pgClient.connect();
		console.log("✅ Database connection established");
	} catch (error: any) {
		console.error(`❌ Failed to connect to database: ${error.message}`);
		process.exit(1);
	}

	const migrations = [
		{
			name: "Company Names Sync",
			file: "20260108205100_fix_company_names_batch.sql",
		},
		{
			name: "Country Extraction",
			file: "20260108205101_fix_location_country_extraction.sql",
		},
		{
			name: "City Extraction",
			file: "20260108205102_fix_location_city_extraction.sql",
		},
		{
			name: "Job Board Filtering",
			file: "20260108205103_filter_job_boards.sql",
		},
		{
			name: "CEO & Executive Filtering",
			file: "20260108205105_filter_ceo_executive_roles.sql",
		},
		{
			name: "Construction Filtering",
			file: "20260108205106_filter_construction_roles.sql",
		},
		{
			name: "Medical & Healthcare Filtering",
			file: "20260108205107_filter_medical_healthcare_roles.sql",
		},
		{
			name: "Legal Filtering",
			file: "20260108205108_filter_legal_roles.sql",
		},
		{
			name: "Teaching & Education Filtering",
			file: "20260108205109_filter_teaching_education_roles.sql",
		},
		{
			name: "RLS Security Setup",
			file: "20260108205104_enable_rls_security.sql",
		},
	];

	console.log("📋 Available Migrations:");
	migrations.forEach((migration, index) => {
		console.log(`${index + 1}. ${migration.name}`);
	});
	console.log("");

	for (const migration of migrations) {
		console.log(`▶️  Running: ${migration.name}`);
		console.log(`   Migration: ${migration.file}`);

		try {
			const sqlPath = resolve(
				process.cwd(),
				"supabase",
				"migrations",
				migration.file,
			);
			const sql = readFileSync(sqlPath, "utf-8");

			console.log(`   Executing SQL...`);

			// Execute raw SQL directly using PostgreSQL client
			await pgClient.query(sql);

			console.log(`✅ SUCCESS: ${migration.name}`);
			console.log("");
		} catch (error: any) {
			console.error(`❌ FAILED: ${migration.name}`);
			console.error(`   Error: ${error.message}`);
			console.log("   Continuing with next migration...");
			console.log("");
		}
	}

	console.log("🎉 Maintenance migration run completed!");
	console.log("📊 Check the logs above for any failures.");

	// Close database connection
	await pgClient.end();
	console.log("🔌 Database connection closed.");
}

runMaintenanceMigrations().catch((error) => {
	console.error("❌ Fatal error running maintenance:", error);
	process.exit(1);
});

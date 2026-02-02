#!/usr/bin/env tsx
/**
 * Batch Update Language Requirements for Existing Jobs
 *
 * Processes jobs in small batches (1000 at a time) to extract all 40+ languages
 * from job descriptions. Runs incrementally to avoid timeouts.
 */

// Load environment variables first
import { resolve } from "node:path";
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

import { getDatabaseClient } from "../utils/core/database-pool";

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "1000", 10); // Default 1000 for production
const MAX_BATCHES = parseInt(process.env.MAX_BATCHES || "50", 10); // Process up to 50,000 jobs per run

async function updateLanguageBatch(batchNumber: number): Promise<number> {
	const supabase = getDatabaseClient();

	console.log(`\n📦 Processing batch ${batchNumber} (${BATCH_SIZE} jobs)...`);

	// Get batch of jobs that need language extraction
	// Only get jobs with valid titles and descriptions
	const { data: jobsNull, error: errorNull } = await supabase
		.from("jobs")
		.select("id, description")
		.eq("is_active", true)
		.eq("status", "active")
		.not("title", "is", null)
		.neq("title", "")
		.not("description", "is", null)
		.neq("description", "")
		.is("language_requirements", null)
		.order("id", { ascending: true })
		.limit(BATCH_SIZE);

	// Then get jobs with empty arrays (if we need more)
	let jobs = jobsNull || [];
	if (jobs.length < BATCH_SIZE) {
		const { data: jobsEmpty, error: errorEmpty } = await supabase
			.from("jobs")
			.select("id, description")
			.eq("is_active", true)
			.eq("status", "active")
			.not("title", "is", null)
			.neq("title", "")
			.not("description", "is", null)
			.neq("description", "")
			.eq("language_requirements", "{}")
			.order("id", { ascending: true })
			.limit(BATCH_SIZE - jobs.length);

		if (errorEmpty) {
			console.error(`❌ Error fetching jobs with empty arrays:`, errorEmpty);
		} else if (jobsEmpty) {
			jobs = [...jobs, ...jobsEmpty];
		}
	}

	const fetchError = errorNull;

	if (fetchError) {
		console.error(`❌ Error fetching jobs:`, fetchError);
		return 0;
	}

	if (!jobs || jobs.length === 0) {
		console.log("✅ No more jobs to process!");
		return 0;
	}

	console.log(`   Found ${jobs.length} jobs to process`);

	// Extract languages for each job
	const updates = jobs.map((job) => {
		const descLower = (job.description || "").toLowerCase();
		const languages: string[] = [];

		// Core EU Languages (7)
		if (
			descLower.match(
				/\b(english|fluent\s+english|english\s+required|english\s+language|english\s+proficiency|english\s+speaking|english\s+written|native\s+english|english\s+native|business\s+english|must\s+speak\s+english|english\s+is\s+a\s+must|proficiency\s+in\s+english)\b/,
			)
		) {
			languages.push("English");
		}
		if (
			descLower.match(
				/\b(french|français|francais|fluent\s+french|french\s+required|french\s+language|french\s+proficiency|french\s+speaking|french\s+written|native\s+french|french\s+native|business\s+french|francophone|must\s+speak\s+french|french\s+is\s+a\s+must|proficiency\s+in\s+french|français\s+requis)\b/,
			)
		) {
			languages.push("French");
		}
		if (
			descLower.match(
				/\b(german|deutsch|fluent\s+german|german\s+required|german\s+language|german\s+proficiency|german\s+speaking|german\s+written|native\s+german|german\s+native|business\s+german|deutschkenntnisse|deutschsprachig|must\s+speak\s+german|german\s+is\s+a\s+must|proficiency\s+in\s+german|deutsch\s+erforderlich)\b/,
			)
		) {
			languages.push("German");
		}
		if (
			descLower.match(
				/\b(spanish|español|espanol|fluent\s+spanish|spanish\s+required|spanish\s+language|spanish\s+proficiency|spanish\s+speaking|spanish\s+written|native\s+spanish|spanish\s+native|business\s+spanish|hispanohablante|must\s+speak\s+spanish|spanish\s+is\s+a\s+must|proficiency\s+in\s+spanish|español\s+requerido)\b/,
			)
		) {
			languages.push("Spanish");
		}
		if (
			descLower.match(
				/\b(italian|italiano|fluent\s+italian|italian\s+required|italian\s+language|italian\s+proficiency|italian\s+speaking|italian\s+written|native\s+italian|italian\s+native|business\s+italian|must\s+speak\s+italian|italian\s+is\s+a\s+must|proficiency\s+in\s+italian|italiano\s+richiesto)\b/,
			)
		) {
			languages.push("Italian");
		}
		if (
			descLower.match(
				/\b(dutch|nederlands|fluent\s+dutch|dutch\s+required|dutch\s+language|dutch\s+proficiency|dutch\s+speaking|dutch\s+written|native\s+dutch|dutch\s+native|business\s+dutch|nederlandstalig|must\s+speak\s+dutch|dutch\s+is\s+a\s+must|proficiency\s+in\s+dutch|nederlands\s+vereist)\b/,
			)
		) {
			languages.push("Dutch");
		}
		if (
			descLower.match(
				/\b(portuguese|português|portugues|fluent\s+portuguese|portuguese\s+required|portuguese\s+language|portuguese\s+proficiency|portuguese\s+speaking|portuguese\s+written|native\s+portuguese|portuguese\s+native|business\s+portuguese)\b/,
			)
		) {
			languages.push("Portuguese");
		}

		// Additional EU Languages (17)
		if (
			descLower.match(
				/\b(polish|polski|fluent\s+polish|polish\s+required|polish\s+language|polish\s+proficiency|polish\s+speaking|polish\s+written|native\s+polish|polish\s+native)\b/,
			)
		) {
			languages.push("Polish");
		}
		if (
			descLower.match(
				/\b(swedish|svenska|fluent\s+swedish|swedish\s+required|swedish\s+language|swedish\s+proficiency|swedish\s+speaking|swedish\s+written|native\s+swedish|swedish\s+native)\b/,
			)
		) {
			languages.push("Swedish");
		}
		if (
			descLower.match(
				/\b(danish|dansk|fluent\s+danish|danish\s+required|danish\s+language|danish\s+proficiency|danish\s+speaking|danish\s+written|native\s+danish|danish\s+native)\b/,
			)
		) {
			languages.push("Danish");
		}
		if (
			descLower.match(
				/\b(finnish|suomi|fluent\s+finnish|finnish\s+required|finnish\s+language|finnish\s+proficiency|finnish\s+speaking|finnish\s+written|native\s+finnish|finnish\s+native)\b/,
			)
		) {
			languages.push("Finnish");
		}
		if (
			descLower.match(
				/\b(czech|čeština|cestina|fluent\s+czech|czech\s+required|czech\s+language|czech\s+proficiency|czech\s+speaking|czech\s+written|native\s+czech|czech\s+native)\b/,
			)
		) {
			languages.push("Czech");
		}
		if (
			descLower.match(
				/\b(romanian|română|romana|fluent\s+romanian|romanian\s+required|romanian\s+language|romanian\s+proficiency|romanian\s+speaking|romanian\s+written|native\s+romanian|romanian\s+native)\b/,
			)
		) {
			languages.push("Romanian");
		}
		if (
			descLower.match(
				/\b(hungarian|magyar|fluent\s+hungarian|hungarian\s+required|hungarian\s+language|hungarian\s+proficiency|hungarian\s+speaking|hungarian\s+written|native\s+hungarian|hungarian\s+native)\b/,
			)
		) {
			languages.push("Hungarian");
		}
		if (
			descLower.match(
				/\b(greek|ελληνικά|ellinika|fluent\s+greek|greek\s+required|greek\s+language|greek\s+proficiency|greek\s+speaking|greek\s+written|native\s+greek|greek\s+native)\b/,
			)
		) {
			languages.push("Greek");
		}
		if (
			descLower.match(
				/\b(bulgarian|български|bulgarski|fluent\s+bulgarian|bulgarian\s+required|bulgarian\s+language|bulgarian\s+proficiency|bulgarian\s+speaking|bulgarian\s+written|native\s+bulgarian|bulgarian\s+native)\b/,
			)
		) {
			languages.push("Bulgarian");
		}
		if (
			descLower.match(
				/\b(croatian|hrvatski|fluent\s+croatian|croatian\s+required|croatian\s+language|croatian\s+proficiency|croatian\s+speaking|croatian\s+written|native\s+croatian|croatian\s+native)\b/,
			)
		) {
			languages.push("Croatian");
		}
		if (
			descLower.match(
				/\b(serbian|srpski|fluent\s+serbian|serbian\s+required|serbian\s+language|serbian\s+proficiency|serbian\s+speaking|serbian\s+written|native\s+serbian|serbian\s+native)\b/,
			)
		) {
			languages.push("Serbian");
		}
		if (
			descLower.match(
				/\b(slovak|slovenčina|slovencina|fluent\s+slovak|slovak\s+required|slovak\s+language|slovak\s+proficiency|slovak\s+speaking|slovak\s+written|native\s+slovak|slovak\s+native)\b/,
			)
		) {
			languages.push("Slovak");
		}
		if (
			descLower.match(
				/\b(slovenian|slovenski|fluent\s+slovenian|slovenian\s+required|slovenian\s+language|slovenian\s+proficiency|slovenian\s+speaking|slovenian\s+written|native\s+slovenian|slovenian\s+native)\b/,
			)
		) {
			languages.push("Slovenian");
		}
		if (
			descLower.match(
				/\b(estonian|eesti|fluent\s+estonian|estonian\s+required|estonian\s+language|estonian\s+proficiency|estonian\s+speaking|estonian\s+written|native\s+estonian|estonian\s+native)\b/,
			)
		) {
			languages.push("Estonian");
		}
		if (
			descLower.match(
				/\b(latvian|latviešu|latviesu|fluent\s+latvian|latvian\s+required|latvian\s+language|latvian\s+proficiency|latvian\s+speaking|latvian\s+written|native\s+latvian|latvian\s+native)\b/,
			)
		) {
			languages.push("Latvian");
		}
		if (
			descLower.match(
				/\b(lithuanian|lietuvių|lietuviau|fluent\s+lithuanian|lithuanian\s+required|lithuanian\s+language|lithuanian\s+proficiency|lithuanian\s+speaking|lithuanian\s+written|native\s+lithuanian|lithuanian\s+native)\b/,
			)
		) {
			languages.push("Lithuanian");
		}
		if (
			descLower.match(
				/\b(ukrainian|українська|ukrainska|fluent\s+ukrainian|ukrainian\s+required|ukrainian\s+language|ukrainian\s+proficiency|ukrainian\s+speaking|ukrainian\s+written|native\s+ukrainian|ukrainian\s+native)\b/,
			)
		) {
			languages.push("Ukrainian");
		}

		// Middle Eastern & Central Asian (6)
		if (
			descLower.match(
				/\b(arabic|العربية|fluent\s+arabic|arabic\s+required|arabic\s+language|arabic\s+proficiency|arabic\s+speaking|arabic\s+written|native\s+arabic|arabic\s+native)\b/,
			)
		) {
			languages.push("Arabic");
		}
		if (
			descLower.match(
				/\b(turkish|türkçe|turkce|fluent\s+turkish|turkish\s+required|turkish\s+language|turkish\s+proficiency|turkish\s+speaking|turkish\s+written|native\s+turkish|turkish\s+native)\b/,
			)
		) {
			languages.push("Turkish");
		}
		if (
			descLower.match(
				/\b(hebrew|עברית|fluent\s+hebrew|hebrew\s+required|hebrew\s+language|hebrew\s+proficiency|hebrew\s+speaking|hebrew\s+written|native\s+hebrew|hebrew\s+native)\b/,
			)
		) {
			languages.push("Hebrew");
		}
		if (
			descLower.match(
				/\b(persian|فارسی|farsi|fluent\s+persian|persian\s+required|persian\s+language|persian\s+proficiency|persian\s+speaking|persian\s+written|native\s+persian|persian\s+native)\b/,
			)
		) {
			languages.push("Persian");
		}
		if (
			descLower.match(
				/\b(farsi|فارسی|fluent\s+farsi|farsi\s+required|farsi\s+language|farsi\s+proficiency|farsi\s+speaking|farsi\s+written|native\s+farsi|farsi\s+native)\b/,
			)
		) {
			languages.push("Farsi");
		}
		if (
			descLower.match(
				/\b(urdu|اردو|fluent\s+urdu|urdu\s+required|urdu\s+language|urdu\s+proficiency|urdu\s+speaking|urdu\s+written|native\s+urdu|urdu\s+native)\b/,
			)
		) {
			languages.push("Urdu");
		}

		// Asian Languages (14)
		if (
			descLower.match(
				/\b(japanese|日本語|nihongo|fluent\s+japanese|japanese\s+required|japanese\s+language|japanese\s+proficiency|japanese\s+speaking|japanese\s+written|native\s+japanese|japanese\s+native)\b/,
			)
		) {
			languages.push("Japanese");
		}
		if (
			descLower.match(
				/\b(chinese|中文|zhongwen|fluent\s+chinese|chinese\s+required|chinese\s+language|chinese\s+proficiency|chinese\s+speaking|chinese\s+written|native\s+chinese|chinese\s+native)\b/,
			)
		) {
			languages.push("Chinese");
		}
		if (
			descLower.match(
				/\b(mandarin|普通话|putonghua|fluent\s+mandarin|mandarin\s+required|mandarin\s+language|mandarin\s+proficiency|mandarin\s+speaking|mandarin\s+written|native\s+mandarin|mandarin\s+native)\b/,
			)
		) {
			languages.push("Mandarin");
		}
		if (
			descLower.match(
				/\b(cantonese|廣東話|guangdonghua|fluent\s+cantonese|cantonese\s+required|cantonese\s+language|cantonese\s+proficiency|cantonese\s+speaking|cantonese\s+written|native\s+cantonese|cantonese\s+native)\b/,
			)
		) {
			languages.push("Cantonese");
		}
		if (
			descLower.match(
				/\b(korean|한국어|hangugeo|fluent\s+korean|korean\s+required|korean\s+language|korean\s+proficiency|korean\s+speaking|korean\s+written|native\s+korean|korean\s+native)\b/,
			)
		) {
			languages.push("Korean");
		}
		if (
			descLower.match(
				/\b(hindi|हिन्दी|fluent\s+hindi|hindi\s+required|hindi\s+language|hindi\s+proficiency|hindi\s+speaking|hindi\s+written|native\s+hindi|hindi\s+native)\b/,
			)
		) {
			languages.push("Hindi");
		}
		if (
			descLower.match(
				/\b(thai|ไทย|fluent\s+thai|thai\s+required|thai\s+language|thai\s+proficiency|thai\s+speaking|thai\s+written|native\s+thai|thai\s+native)\b/,
			)
		) {
			languages.push("Thai");
		}
		if (
			descLower.match(
				/\b(vietnamese|tiếng\s+việt|tieng\s+viet|fluent\s+vietnamese|vietnamese\s+required|vietnamese\s+language|vietnamese\s+proficiency|vietnamese\s+speaking|vietnamese\s+written|native\s+vietnamese|vietnamese\s+native)\b/,
			)
		) {
			languages.push("Vietnamese");
		}
		if (
			descLower.match(
				/\b(indonesian|bahasa\s+indonesia|fluent\s+indonesian|indonesian\s+required|indonesian\s+language|indonesian\s+proficiency|indonesian\s+speaking|indonesian\s+written|native\s+indonesian|indonesian\s+native)\b/,
			)
		) {
			languages.push("Indonesian");
		}
		if (
			descLower.match(
				/\b(tagalog|filipino|fluent\s+tagalog|tagalog\s+required|tagalog\s+language|tagalog\s+proficiency|tagalog\s+speaking|tagalog\s+written|native\s+tagalog|tagalog\s+native)\b/,
			)
		) {
			languages.push("Tagalog");
		}
		if (
			descLower.match(
				/\b(malay|bahasa\s+melayu|fluent\s+malay|malay\s+required|malay\s+language|malay\s+proficiency|malay\s+speaking|malay\s+written|native\s+malay|malay\s+native)\b/,
			)
		) {
			languages.push("Malay");
		}
		if (
			descLower.match(
				/\b(bengali|বাংলা|bangla|fluent\s+bengali|bengali\s+required|bengali\s+language|bengali\s+proficiency|bengali\s+speaking|bengali\s+written|native\s+bengali|bengali\s+native)\b/,
			)
		) {
			languages.push("Bengali");
		}
		if (
			descLower.match(
				/\b(tamil|தமிழ்|fluent\s+tamil|tamil\s+required|tamil\s+language|tamil\s+proficiency|tamil\s+speaking|tamil\s+written|native\s+tamil|tamil\s+native)\b/,
			)
		) {
			languages.push("Tamil");
		}
		if (
			descLower.match(
				/\b(telugu|తెలుగు|fluent\s+telugu|telugu\s+required|telugu\s+language|telugu\s+proficiency|telugu\s+speaking|telugu\s+written|native\s+telugu|telugu\s+native)\b/,
			)
		) {
			languages.push("Telugu");
		}

		// Other Common Languages (2)
		if (
			descLower.match(
				/\b(russian|русский|russkiy|fluent\s+russian|russian\s+required|russian\s+language|russian\s+proficiency|russian\s+speaking|russian\s+written|native\s+russian|russian\s+native)\b/,
			)
		) {
			languages.push("Russian");
		}
		if (
			descLower.match(
				/\b(norwegian|norsk|fluent\s+norwegian|norwegian\s+required|norwegian\s+language|norwegian\s+proficiency|norwegian\s+speaking|norwegian\s+written|native\s+norwegian|norwegian\s+native)\b/,
			)
		) {
			languages.push("Norwegian");
		}

		// Remove duplicates
		const uniqueLanguages = Array.from(new Set(languages));

		return {
			id: job.id,
			language_requirements: uniqueLanguages.length > 0 ? uniqueLanguages : [],
		};
	});

	// Update jobs in batch - update each job individually to avoid constraint issues
	let updatedCount = 0;
	for (const update of updates) {
		const { error: updateError } = await supabase
			.from("jobs")
			.update({ language_requirements: update.language_requirements })
			.eq("id", update.id);

		if (updateError) {
			console.error(`❌ Error updating job ${update.id}:`, updateError.message);
		} else {
			updatedCount++;
		}
	}

	const jobsWithLanguages = updates.filter(
		(u) => u.language_requirements.length > 0,
	).length;
	console.log(
		`   ✅ Updated ${updatedCount} jobs (${jobsWithLanguages} with languages extracted)`,
	);

	return jobs.length;
}

async function main() {
	console.log("🚀 Starting batch language extraction...\n");

	let totalProcessed = 0;
	let batchNumber = 1;

	while (batchNumber <= MAX_BATCHES) {
		const processed = await updateLanguageBatch(batchNumber);

		if (processed === 0) {
			console.log("\n✅ All jobs processed!");
			break;
		}

		totalProcessed += processed;
		batchNumber++;

		// Small delay between batches to avoid overwhelming the database
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	console.log(`\n📊 Summary:`);
	console.log(`   Total batches processed: ${batchNumber - 1}`);
	console.log(`   Total jobs processed: ${totalProcessed}`);

	// Final status check
	const supabase = getDatabaseClient();
	const { data: stats } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("status", "active")
		.not("description", "is", null)
		.neq("description", "");

	const { data: withLanguages } = await supabase
		.from("jobs")
		.select("id", { count: "exact", head: true })
		.eq("is_active", true)
		.eq("status", "active")
		.not("description", "is", null)
		.neq("description", "")
		.not("language_requirements", "is", null);

	const total = stats?.count || 0;
	const withLangs = withLanguages?.count || 0;
	const coverage = total > 0 ? ((withLangs / total) * 100).toFixed(2) : "0.00";

	console.log(`\n📈 Final Status:`);
	console.log(`   Total active jobs: ${total}`);
	console.log(`   Jobs with languages: ${withLangs}`);
	console.log(`   Coverage: ${coverage}%`);
}

main().catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
